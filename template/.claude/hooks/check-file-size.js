#!/usr/bin/env node
/**
 * PostToolUse (Edit|Write) hook.
 * Runs check-file-sizes.mjs against the edited file only.
 *
 * Soft breach (exit 1) = warn but allow.
 * Hard breach (exit 2) = block + tell agent to extract first.
 *
 * Hook input shape (stdin JSON): { tool_input: { file_path: "..." } }
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, isAbsolute } from 'node:path';

const ROOT = process.cwd();
const CHECKER = join(ROOT, 'scripts', 'check-file-sizes.mjs');

if (!existsSync(CHECKER)) {
  process.exit(0); // checker not installed; no enforcement
}

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

let filePath = null;
try {
  const data = JSON.parse(payload || '{}');
  filePath = data.tool_input?.file_path || data.file_path || null;
} catch {}

if (!filePath) {
  process.exit(0);
}

const abs = isAbsolute(filePath) ? filePath : join(ROOT, filePath);
if (!existsSync(abs)) {
  process.exit(0);
}

const res = spawnSync('node', [CHECKER, abs], { encoding: 'utf8' });
if (res.stderr) process.stderr.write(res.stderr);
if (res.stdout) process.stdout.write(res.stdout);

// soft (1) = warn but allow; hard (2) = surface as agent-visible error
if (res.status === 2) {
  process.stderr.write('\n🛑 File over hard budget. Extract before edit. See CLAUDE.md §12 + rules/refactor.md.\n');
  process.exit(2);
}
process.exit(0);
