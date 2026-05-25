#!/usr/bin/env node
/**
 * PostToolUse hook — runs after Edit or Write tool calls.
 * Scans written files for security and quality issues.
 * Non-blocking (always exit 0) — warnings only, never blocks.
 *
 * KNOWN LIMITATIONS:
 * - Cannot detect logical errors (wrong WHERE clause that's syntactically valid)
 * - Cannot detect secrets stored in variables then used later
 * - SQL file scanning warns on any DELETE, which may have false positives in rollbacks
 */

const fs = require('fs');
const path = require('path');

let raw = '';
process.stdin.setEncoding('utf-8');
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  const filePath = extractFilePath(raw);
  if (!filePath || !fs.existsSync(filePath)) process.exit(0);

  const ext = path.extname(filePath).toLowerCase();

  let content = '';
  try { content = fs.readFileSync(filePath, 'utf-8'); } catch { process.exit(0); }

  const warnings = [];
  const isTestFile = /\.(test|spec)\.(ts|tsx|js|jsx|mjs)$/.test(filePath);

  // ── Source code checks ──────────────────────────────────────────────────
  const SOURCE_EXTS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.vue', '.svelte'];
  if (SOURCE_EXTS.includes(ext)) {
    checkSecrets(content, filePath, warnings);
    checkXss(content, filePath, warnings);
    if (!isTestFile) {
      checkAnyTypes(content, filePath, warnings, ext);
      checkDebugLogs(content, filePath, warnings);
    }
  }

  // ── SQL file checks ─────────────────────────────────────────────────────
  if (ext === '.sql') {
    checkSqlFile(content, filePath, warnings);
  }

  // ── Shell script checks ─────────────────────────────────────────────────
  if (['.sh', '.bash', '.ps1', '.psm1'].includes(ext)) {
    checkShellFile(content, filePath, warnings);
  }

  if (warnings.length > 0) {
    process.stderr.write('\n' + warnings.join('\n') + '\n\n');
  }

  process.exit(0);
});

// ── Check functions ────────────────────────────────────────────────────────

function checkSecrets(content, filePath, warnings) {
  const SECRET_PATTERNS = [
    // Cloud provider keys
    { pattern: /sk_live_[a-zA-Z0-9]{20,}/, label: 'Stripe live secret key' },
    { pattern: /pk_live_[a-zA-Z0-9]{20,}/, label: 'Stripe live public key' },
    { pattern: /rk_live_[a-zA-Z0-9]{20,}/, label: 'Stripe restricted live key' },
    { pattern: /AKIA[0-9A-Z]{16}/, label: 'AWS access key ID' },
    { pattern: /ghp_[a-zA-Z0-9]{36}/, label: 'GitHub personal access token' },
    { pattern: /gho_[a-zA-Z0-9]{36}/, label: 'GitHub OAuth token' },
    { pattern: /xoxb-[0-9]+-[0-9]+-[a-zA-Z0-9]+/, label: 'Slack bot token' },
    { pattern: /xoxp-[0-9]+-[0-9]+-[a-zA-Z0-9]+/, label: 'Slack user token' },
    // AI provider keys
    { pattern: /sk-ant-[a-zA-Z0-9\-_]{40,}/, label: 'Anthropic API key' },
    { pattern: /sk-[a-zA-Z0-9]{48}/, label: 'OpenAI API key' },
    // Generic secret patterns (must be in assignment context)
    { pattern: /(?:password|passwd|pwd)\s*[:=]\s*["'][^"'${}]{6,}["']/i, label: 'Hardcoded password' },
    { pattern: /(?:secret|api_?key|access_?key|auth_?token)\s*[:=]\s*["'][^"'${}]{8,}["']/i, label: 'Hardcoded secret/key' },
    // Database URLs with credentials (postgres://user:pass@...)
    { pattern: /(?:postgres|mysql|mongodb|redis):\/\/[^:]+:[^@${}]+@/, label: 'Database URL with embedded credentials' },
  ];

  for (const { pattern, label } of SECRET_PATTERNS) {
    if (pattern.test(content)) {
      warnings.push(`🔑 SECURITY: Possible hardcoded ${label} in ${filePath}`);
      warnings.push(`   Move to .env.local and reference via process.env.YOUR_VAR_NAME`);
    }
  }
}

function checkXss(content, filePath, warnings) {
  // Flag dangerouslySetInnerHTML — always warn, user must verify sanitization
  if (/dangerouslySetInnerHTML/.test(content)) {
    const hasSanitize = /DOMPurify\.sanitize|sanitizeHtml|xss\(|escapeHtml/.test(content);
    if (hasSanitize) {
      warnings.push(`⚠️  XSS: dangerouslySetInnerHTML used in ${filePath} — verify sanitization wraps the correct variable`);
    } else {
      warnings.push(`🔴 XSS RISK: dangerouslySetInnerHTML used without any visible sanitization in ${filePath}`);
      warnings.push(`   Wrap the value with DOMPurify.sanitize() before passing it`);
    }
  }

  // innerHTML assignment with user content is always risky
  if (/\.innerHTML\s*=/.test(content)) {
    warnings.push(`⚠️  XSS: .innerHTML assignment in ${filePath} — ensure value is never user-controlled`);
  }
}

function checkAnyTypes(content, filePath, warnings, ext) {
  if (!['.ts', '.tsx'].includes(ext)) return;
  // Match `: any` and `as any` but not in comments or strings
  const lines = content.split('\n');
  const anyLines = lines
    .map((line, i) => ({ line, num: i + 1 }))
    .filter(({ line }) => {
      if (/^\s*\/\//.test(line)) return false; // comment line
      return /:\s*any\b/.test(line) || /\bas\s+any\b/.test(line);
    });

  if (anyLines.length > 0) {
    warnings.push(`⚠️  TYPES: ${anyLines.length} \`any\` type(s) in ${filePath}:`);
    anyLines.slice(0, 3).forEach(({ num }) => {
      warnings.push(`   Line ${num}: use specific type or unknown + type guard`);
    });
  }
}

function checkDebugLogs(content, filePath, warnings) {
  const consoleLogs = (content.match(/\bconsole\.(log|debug)\s*\(/g) || []).length;
  if (consoleLogs > 1) {
    warnings.push(`📝 DEBUG: ${consoleLogs} console.log/debug statements in ${filePath} — remove before committing`);
  }
}

function checkSqlFile(content, filePath, warnings) {
  // Strip single-line SQL comments before analysis
  const stripped = content.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');

  if (/\bDROP\s+DATABASE\b/i.test(stripped)) {
    warnings.push(`🛑 DANGER SQL: DROP DATABASE in ${filePath} — this deletes everything`);
  }
  if (/\bDROP\s+TABLE\b/i.test(stripped)) {
    warnings.push(`⚠️  SQL: DROP TABLE in ${filePath} — ensure this is an intentional rollback migration`);
  }
  if (/\bTRUNCATE\b/i.test(stripped)) {
    warnings.push(`⚠️  SQL: TRUNCATE in ${filePath} — wipes all rows`);
  }
  // DELETE without WHERE in SQL files (multiline-aware: check if WHERE appears after DELETE FROM)
  const deleteMatches = [...stripped.matchAll(/\bDELETE\s+FROM\s+\S+([^;]*);?/gi)];
  for (const match of deleteMatches) {
    if (!/\bWHERE\b/i.test(match[0])) {
      warnings.push(`🛑 DANGER SQL: DELETE FROM without WHERE in ${filePath} — would wipe entire table`);
    }
  }
}

function checkShellFile(content, filePath, warnings) {
  if (/rm\s+-rf\s+[\/~*]/.test(content)) {
    warnings.push(`🛑 SHELL: rm -rf from root/home/wildcard in ${filePath}`);
  }
  if (/\bDROP\s+DATABASE\b/i.test(content)) {
    warnings.push(`🛑 SHELL: DROP DATABASE in ${filePath}`);
  }
}

// ── Utilities ──────────────────────────────────────────────────────────────

function extractFilePath(raw) {
  try {
    const p = JSON.parse(raw);
    return (typeof p.file_path === 'string' && p.file_path) ||
           (p.tool_input && typeof p.tool_input.file_path === 'string' && p.tool_input.file_path) || '';
  } catch {
    return '';
  }
}
