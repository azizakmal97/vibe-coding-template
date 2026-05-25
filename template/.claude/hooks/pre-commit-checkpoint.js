#!/usr/bin/env node
/**
 * PreToolUse (Bash) hook.
 * If the command is `git commit ...` AND PROGRESS.md has a 🟡 in-progress phase,
 * ensure the commit message starts with `wip(<phase-id>):` or `done(<phase-id>):`.
 *
 * Warns but does NOT block (would frustrate users). Configure to block via env var
 * STRICT_CHECKPOINT=1 if desired.
 *
 * Hook input: { tool_input: { command: "..." } }
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const PROGRESS_CANDIDATES = ['PROGRESS.md', 'REFACTOR_PROGRESS.md'];
const STRICT = process.env.STRICT_CHECKPOINT === '1';

let payload = '';
try {
  payload = await new Promise((resolve) => {
    let buf = '';
    process.stdin.on('data', (chunk) => (buf += chunk));
    process.stdin.on('end', () => resolve(buf));
  });
} catch {
  process.exit(0);
}

let command = '';
try {
  const data = JSON.parse(payload || '{}');
  command = data.tool_input?.command || '';
} catch {}

if (!command || !/^\s*git\s+commit/.test(command)) {
  process.exit(0);
}

let progressPath = null;
for (const name of PROGRESS_CANDIDATES) {
  const p = join(ROOT, name);
  if (existsSync(p)) { progressPath = p; break; }
}
if (!progressPath) process.exit(0);

const body = readFileSync(progressPath, 'utf8');
// Accept both ### 🟡 and "in-progress" markers
const phaseMatch = body.match(/### 🟡\s+([A-Z0-9-]+)/) || body.match(/Active phase:\*\*\s*([A-Z0-9-]+)\s+—.*in[- ]progress/i);
if (!phaseMatch) {
  process.exit(0);
}
const phaseId = phaseMatch[1];

// Extract -m "message" or --message="message" (rough but enough)
const msgMatch = command.match(/-m\s+["']([^"']+)["']|--message[= ]["']([^"']+)["']/);
const message = msgMatch ? (msgMatch[1] || msgMatch[2]) : '';

const wantPrefix = new RegExp(`^(wip|done)\\(${phaseId}\\):`);
if (message && wantPrefix.test(message)) {
  process.exit(0);
}

const warn = `\n⚠️  pre-commit-checkpoint: PROGRESS.md has active phase ${phaseId}.\n` +
             `   Commit message should start with "wip(${phaseId}):" or "done(${phaseId}):".\n` +
             `   Got: ${message || '(no -m message detected)'}\n`;

process.stderr.write(warn);
process.exit(STRICT ? 2 : 0);
