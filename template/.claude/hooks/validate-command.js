#!/usr/bin/env node
/**
 * PreToolUse hook — validates Bash commands before execution.
 * Receives tool input as JSON via stdin.
 * Exit 0 = allow. Exit 2 = block (message shown to Claude and user).
 *
 * DESIGN NOTES:
 * - Uses function-based rules (not just regex) for complex logic
 * - Tests full command string including heredoc content
 * - Cannot inspect file contents of -f/--file arguments
 * - Cannot intercept MCP tool-based SQL execution (different tool, different hook)
 */

let raw = '';
process.stdin.setEncoding('utf-8');
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  const command = extractCommand(raw);
  if (!command) process.exit(0);

  // ── Hard blocks (exit 2) ────────────────────────────────────────────────
  const BLOCK_RULES = [

    // Secrets — block reading/copying secret files via shell. The Read tool
    // already denies these, but cat/type/Get-Content/cp/openssl/interpreters
    // would bypass that deny. The dev server/runtime (wrangler, next, etc.)
    // loads secrets itself — an agent never needs to print them.
    // Residual risk: a bespoke interpreter one-liner can still read a file;
    // this stops the common/casual paths, not a determined actor.
    { test: (c) => {
        const reader = /\b(cat|tac|nl|more|less|head|tail|strings|xxd|od|hexdump|base64|gc|Get-Content|type|cp|copy|mv|move|scp|rsync|openssl|sed|awk|grep|rg|dd|node|deno|bun|python3?|ruby|perl|php|pwsh|powershell)\b/i;
        const secretFile = /(^|[\s'"=:/\\])(\.env(?!\.(example|sample|template|dist))(\.[\w-]+)?|[^\s'"]*\.dev\.vars(\.[\w-]+)?|[^\s'"]*\.(pem|key|p12|pfx)\b|secrets[\/\\])/i;
        const redirectRead = /<\s*[^\s|;&)]*\.(env|dev\.vars|pem|key|p12|pfx)\b/i;
        if (redirectRead.test(c)) return true;
        return reader.test(c) && secretFile.test(c);
      },
      reason: 'Reading a secret file (.env, .dev.vars, *.pem/*.key/*.p12, secrets/) via shell is blocked — it would leak credentials into the transcript. The runtime loads these itself; you never need to print them.' },

    // Filesystem
    { test: (c) => /rm\s+-rf\s+[\/~*]/.test(c),
      reason: 'Recursive delete from root/home/wildcard blocked' },

    // Git — no force push hard block here.
    // AI follows rules in CLAUDE.md: prefer git revert, only force push when user explicitly asks.
    // Force push triggers a permission prompt (not in allow list) so user sees and approves it.

    // Git — hard reset losing 2+ commits
    { test: (c) => /\bgit\s+reset\s+--hard\s+HEAD~[2-9]\d*\b/.test(c),
      reason: 'Hard reset of 2+ commits blocked — use git stash' },

    // SQL — database-level destruction
    { test: (c) => /\bDROP\s+DATABASE\b/i.test(c),
      reason: 'DROP DATABASE blocked — deletes everything. Use migrations.' },
    { test: (c) => /\bDROP\s+SCHEMA\b/i.test(c),
      reason: 'DROP SCHEMA blocked — deletes entire schema. Use migrations.' },
    { test: (c) => /\bDROP\s+TABLE\b/i.test(c),
      reason: 'DROP TABLE blocked — write a migration file instead' },
    { test: (c) => /\bTRUNCATE\b/i.test(c),
      reason: 'TRUNCATE blocked — wipes all rows. Never run against real data.' },

    // SQL — DELETE without WHERE (entire table wipe)
    // Uses function so we can check both conditions together
    { test: (c) => /\bDELETE\s+FROM\b/i.test(c) && !/\bWHERE\b/i.test(c),
      reason: 'DELETE FROM without WHERE clause — would wipe entire table. Add WHERE condition.' },

    // SQL — explicit full-table DELETE tricks (parens-wrapped or bare)
    { test: (c) => /\bDELETE\s+FROM\b.*\bWHERE\s+\(?(1\s*=\s*1|true)\)?/i.test(c),
      reason: 'DELETE FROM WHERE 1=1/true — full table wipe disguised as filtered query' },

    // SQL — column removal (destructive schema change)
    { test: (c) => /\bALTER\s+TABLE\b.*\bDROP\s+COLUMN\b/i.test(c),
      reason: 'DROP COLUMN blocked — write a phased migration (deprecate → remove next release)' },

    // Prisma — destructive commands
    { test: (c) => /\bprisma\s+migrate\s+reset\b/.test(c),
      reason: 'prisma migrate reset blocked — wipes entire DB. Run manually with explicit intent.' },
    { test: (c) => /\bprisma\s+db\s+push\b.*--force-reset/.test(c),
      reason: 'prisma db push --force-reset blocked — destroys all data' },
    { test: (c) => /\bprisma\s+db\s+push\b.*--accept-data-loss/.test(c),
      reason: 'prisma db push --accept-data-loss blocked — silently drops columns. Write a migration.' },

    // Prisma — execute with DROP (file-based can't be inspected, so extra caution)
    { test: (c) => /\bprisma\s+db\s+execute\b.*\bDROP\b/i.test(c),
      reason: 'prisma db execute with DROP blocked — use migration files' },

    // Supabase
    { test: (c) => /\bsupabase\s+db\s+reset\b/.test(c),
      reason: 'supabase db reset blocked — wipes entire database' },
    { test: (c) => /\bsupabase\s+db\s+push\b.*--linked/.test(c),
      reason: 'supabase db push --linked blocked — pushes to remote DB. Do this through dashboard.' },

    // CLI database nukes
    { test: (c) => /\bdropdb\b/.test(c),
      reason: 'dropdb blocked — deletes entire PostgreSQL database' },
    { test: (c) => /\bredis-cli\s+FLUSHALL\b/i.test(c),
      reason: 'FLUSHALL blocked — wipes all Redis data' },
    { test: (c) => /\bredis-cli\s+FLUSHDB\b/i.test(c),
      reason: 'FLUSHDB blocked — wipes current Redis database' },
    { test: (c) => /\bdb\.dropDatabase\(\)/.test(c),
      reason: 'MongoDB dropDatabase blocked' },

    // Package publishing — must be manual
    { test: (c) => /\bnpm\s+publish\b/.test(c),
      reason: 'npm publish blocked — must be done manually with explicit intent' },

    // npx auto-yes — any form of the flag
    { test: (c) => /\bnpx\s+.*--yes\b/.test(c),
      reason: 'npx --yes blocked — packages must be explicitly approved first' },
  ];

  for (const rule of BLOCK_RULES) {
    if (rule.test(command)) {
      process.stderr.write('\n🛑 BLOCKED: ' + rule.reason + '\n');
      process.stderr.write('Command: ' + command.substring(0, 160) + '\n\n');
      process.exit(2);
    }
  }

  // ── Non-blocking warnings ───────────────────────────────────────────────
  const WARN_RULES = [
    // Force push to feature branch and hard reset are NOT listed in allow list,
    // so Claude Code will prompt user for approval — no need to warn here too.
    { test: (c) => /\bprisma\s+migrate\s+dev\b/.test(c),
      msg: 'prisma migrate dev — confirm DATABASE_URL points to local dev, not staging/prod' },
    { test: (c) => /\bprisma\s+db\s+push\b(?!.*--force-reset)(?!.*--accept-data-loss)/.test(c),
      msg: 'prisma db push — can silently drop columns removed from schema. Run migrate diff first.' },
    { test: (c) => /\bdrizzle-kit\s+push\b/.test(c),
      msg: 'drizzle-kit push — can drop columns. Confirm schema diff is safe first.' },
    { test: (c) => /\bALTER\s+TABLE\b/i.test(c) && !/\bDROP\s+COLUMN\b/i.test(c),
      msg: 'ALTER TABLE — test on dev database before applying to staging or production' },
    { test: (c) => /\bUPDATE\b.*\bSET\b/i.test(c),
      msg: 'Mass UPDATE — verify WHERE clause targets only intended rows (run SELECT COUNT first)' },
    { test: (c) => /\bDELETE\s+FROM\b/i.test(c) && /\bWHERE\b/i.test(c),
      msg: 'DELETE with WHERE — verify the condition targets only intended rows (run SELECT COUNT first)' },
  ];

  for (const rule of WARN_RULES) {
    if (rule.test(command)) {
      process.stderr.write('\n⚠️  WARNING: ' + rule.msg + '\n\n');
    }
  }

  process.exit(0);
});

function extractCommand(raw) {
  try {
    const parsed = JSON.parse(raw);
    // Claude Code sends Bash input as { command: "..." } or nested under tool_input
    return (
      (typeof parsed.command === 'string' && parsed.command) ||
      (parsed.tool_input && typeof parsed.tool_input.command === 'string' && parsed.tool_input.command) ||
      ''
    );
  } catch {
    // Fallback: treat raw string as command (still useful for pattern matching)
    return typeof raw === 'string' ? raw.trim() : '';
  }
}
