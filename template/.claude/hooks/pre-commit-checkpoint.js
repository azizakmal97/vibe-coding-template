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
// The **Active phase:** header wins over a 🟡 left on a paused phase's heading
// (same rule as session-start-resume.js). "none" comes first: a header like
// "none running; several phases are half done (🟡)" names no active phase.
function activePhaseId() {
  const header = body.match(/\*\*Active phase:\*\*\s*(.+)/);
  if (!header) return body.match(/### 🟡\s+([A-Za-z0-9-]+)/)?.[1] ?? null;
  if (/^\s*_?none\b/i.test(header[1]) || !/🟡|in[- ]progress/i.test(header[1])) return null;
  return header[1].match(/^\s*`?([A-Za-z0-9-]+)`?/)?.[1] ?? null;
}

const phaseId = activePhaseId();
if (!phaseId) {
  process.exit(0);
}

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
