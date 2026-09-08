#!/usr/bin/env node
/**
 * PreToolUse hook — database migration safety gate.
 *
 * Fires before any migration-class command.
 * 1. Detects if DATABASE_URL points to production → BLOCK (exit 2)
 * 2. Detects ambiguous (non-local) URL → WARN
 * 3. Auto-backs up local PostgreSQL database before migration → recovery point
 *
 * KNOWN LIMITATIONS:
 * - Backup only works for local PostgreSQL with pg_dump installed
 * - Cloud databases (Supabase, Neon, Railway) are blocked outright
 * - Cannot detect prod if URL is behind an env var alias not named DATABASE_URL
 *
 * Exit 0 = allow. Exit 2 = block.
 */

const fs = require('fs');
const path = require('path');
const { URL } = require('url');

let raw = '';
process.stdin.setEncoding('utf-8');
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  const command = extractCommand(raw);
  if (!command) process.exit(0);

  const MIGRATION_PATTERNS = [
    /\bprisma\s+migrate\b/,
    /\bprisma\s+db\s+(push|execute)\b/,
    /\bsupabase\s+db\b/,
    /\bdrizzle-kit\s+(push|drop|generate)\b/,
    /\bknex\s+migrate\b/,
    /\bsequelize\s+db:migrate\b/,
    /\bdb-migrate\b/,
  ];

  if (!MIGRATION_PATTERNS.some(p => p.test(command))) process.exit(0);

  const dbUrl = readDatabaseUrl();

  if (!dbUrl) {
    process.stderr.write('\n⚠️  WARNING: No DATABASE_URL found in .env files.\n');
    process.stderr.write('   Confirm target database manually before proceeding.\n\n');
    process.exit(0);
  }

  const prodResult = classifyUrl(dbUrl);

  if (prodResult === 'production') {
    const maskedUrl = maskUrl(dbUrl);
    process.stderr.write('\n');
    process.stderr.write('🛑 BLOCKED: DATABASE_URL points to a PRODUCTION database.\n');
    process.stderr.write('   URL: ' + maskedUrl + '\n');
    process.stderr.write('\n');
    process.stderr.write('   Migrations against production must be run:\n');
    process.stderr.write('   - Through your deployment platform (Vercel, Railway, etc.)\n');
    process.stderr.write('   - Or manually after creating a database backup\n');
    process.stderr.write('   - NEVER through Claude Code\n');
    process.stderr.write('\n');
    process.exit(2);
  }

  if (prodResult === 'ambiguous') {
    process.stderr.write('\n');
    process.stderr.write('⚠️  WARNING: DATABASE_URL does not look like a local database.\n');
    process.stderr.write('   URL: ' + maskUrl(dbUrl) + '\n');
    process.stderr.write('   Confirm this is a dev/staging database before continuing.\n\n');
  }

  // Local PostgreSQL — attempt auto-backup before migration
  if (prodResult === 'local') {
    tryLocalBackup(dbUrl);
  }

  process.exit(0);
});

// ── Helpers ────────────────────────────────────────────────────────────────

function extractCommand(raw) {
  try {
    const p = JSON.parse(raw);
    return (typeof p.command === 'string' && p.command) ||
           (p.tool_input && typeof p.tool_input.command === 'string' && p.tool_input.command) || '';
  } catch {
    return typeof raw === 'string' ? raw.trim() : '';
  }
}

function readDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const envFiles = ['.env.local', '.env.development.local', '.env.development', '.env'];
  for (const file of envFiles) {
    const filePath = path.join(process.cwd(), file);
    if (!fs.existsSync(filePath)) continue;
    try {
      const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
      for (const line of lines) {
        // Only match uncommented lines
        const match = line.match(/^\s*DATABASE_URL\s*=\s*(.+)$/);
        if (match) {
          return match[1].trim().replace(/^["']|["']$/g, '');
        }
      }
    } catch {}
  }
  return '';
}

function classifyUrl(dbUrl) {
  let hostname = '';
  try { hostname = new URL(dbUrl).hostname.toLowerCase(); } catch { hostname = dbUrl.toLowerCase(); }

  // Known production cloud hostnames
  const PROD_HOST_PATTERNS = [
    /\.supabase\.co$/,
    /\.neon\.tech$/,
    /\.railway\.app$/,
    /\.render\.com$/,
    /\.planetscale\.com$/,
    /\.cockroachlabs\.cloud$/,
    /\.mongodb\.net$/,
    /\.rds\.amazonaws\.com$/,
    /\.cloud\.google\.com$/,
    /\.azure\.com$/,
    /\.azure\.database\.windows\.net$/,
  ];

  if (PROD_HOST_PATTERNS.some(p => p.test(hostname))) return 'production';

  // Keyword check — split on delimiters so `my_prod_server` → ['my','prod','server']
  // Avoids false positives like "deproduction" or "production_backup"
  const segments = hostname.split(/[-_.@:]/);
  const PROD_KEYWORDS = ['prod', 'production', 'live', 'main', 'release'];
  if (segments.some(s => PROD_KEYWORDS.includes(s))) return 'production';

  // Known safe local hostnames and common docker-compose service names
  const LOCAL_HOSTS = new Set([
    'localhost', '127.0.0.1', '0.0.0.0', 'host.docker.internal',
    'db', 'postgres', 'postgresql', 'mysql', 'mariadb', 'mongo', 'redis',
  ]);
  if (LOCAL_HOSTS.has(hostname)) return 'local';

  return 'ambiguous';
}

function maskUrl(dbUrl) {
  try {
    const u = new URL(dbUrl);
    if (u.password) u.password = '*****';
    if (u.username) u.username = u.username.substring(0, 3) + '***';
    return u.toString().substring(0, 80);
  } catch {
    return dbUrl.replace(/:\/\/[^@]+@/, '://*****@').substring(0, 80);
  }
}

function tryLocalBackup(dbUrl) {
  const { execFileSync } = require('child_process');

  if (!/(postgres(ql)?):\/\//.test(dbUrl)) return; // PostgreSQL only

  let parsed;
  try { parsed = new URL(dbUrl); } catch { return; }

  const dbName = parsed.pathname.replace(/^\//, '').split('?')[0];
  if (!dbName) return;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupDir = path.resolve(process.cwd(), '.claude', 'db-backups');
  const backupFile = path.join(backupDir, `${dbName}_${timestamp}.sql`);

  // Ensure backupFile is inside backupDir (prevent path traversal)
  if (!backupFile.startsWith(backupDir + path.sep)) return;

  try {
    fs.mkdirSync(backupDir, { recursive: true }); // recursive: true is safe if dir already exists

    // Check pg_dump is available
    try { execFileSync('pg_dump', ['--version'], { stdio: 'ignore' }); } catch { return; }

    const env = { ...process.env };
    const password = parsed.password ? decodeURIComponent(parsed.password) : '';
    if (password) env.PGPASSWORD = password;

    // Use execFileSync (array args — no shell injection)
    execFileSync('pg_dump', [
      `--host=${parsed.hostname || 'localhost'}`,
      `--port=${parsed.port || '5432'}`,
      `--username=${parsed.username || 'postgres'}`,
      `--dbname=${dbName}`,
      `--file=${backupFile}`,
      '--no-password',
    ], { env, timeout: 30_000, stdio: ['ignore', 'ignore', 'ignore'] });

    const relPath = path.relative(process.cwd(), backupFile);
    process.stderr.write('\n💾 Auto-backup created: ' + relPath + '\n');
    process.stderr.write('   Restore: psql -h ' + (parsed.hostname || 'localhost') +
                         ' -U ' + (parsed.username || 'postgres') +
                         ' -d ' + dbName + ' < "' + relPath + '"\n\n');

    pruneBackups(backupDir);
  } catch {
    process.stderr.write('\n⚠️  Auto-backup failed for "' + dbName + '" — consider backing up manually.\n\n');
  }
}

function pruneBackups(backupDir) {
  try {
    const resolvedDir = path.resolve(backupDir);
    const entries = [];

    for (const f of fs.readdirSync(resolvedDir)) {
      if (!f.endsWith('.sql') || f !== path.basename(f)) continue;
      const full = path.join(resolvedDir, f);
      if (!path.resolve(full).startsWith(resolvedDir + path.sep)) continue; // path traversal guard
      try {
        entries.push({ name: f, full, mtime: fs.statSync(full).mtime.getTime() });
      } catch {} // file disappeared between readdir and stat — skip safely
    }

    entries.sort((a, b) => b.mtime - a.mtime);
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const keepSet = new Set(entries.slice(0, 20).map(e => e.full));

    for (const entry of entries) {
      if (!keepSet.has(entry.full) || entry.mtime < sevenDaysAgo) {
        try { fs.unlinkSync(entry.full); } catch {} // file may be gone already — ok
      }
    }
  } catch {}
}
