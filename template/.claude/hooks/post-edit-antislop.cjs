#!/usr/bin/env node
/**
 * PostToolUse hook (Edit|Write) — antislop check on the file just changed.
 * Runs scripts/antislop-check.mjs --user-facing-only, so pages, components, styles,
 * copy dictionaries and CMS content are checked and everything else is skipped.
 * Findings exit 2: the edit is already done, but the agent sees them in the same turn.
 *
 * Hook input shape (stdin JSON): { tool_input: { file_path: "..." } }
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = process.cwd();
const CHECKER = path.join(ROOT, 'scripts', 'antislop-check.mjs');

let raw = '';
process.stdin.setEncoding('utf-8');
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  if (!fs.existsSync(CHECKER)) process.exit(0); // checker not installed; no enforcement

  let filePath = null;
  try {
    const data = JSON.parse(raw || '{}');
    filePath = (data.tool_input && data.tool_input.file_path) || data.file_path || null;
  } catch {
    process.exit(0);
  }
  if (!filePath) process.exit(0);

  const abs = path.isAbsolute(filePath) ? filePath : path.join(ROOT, filePath);
  if (!fs.existsSync(abs)) process.exit(0);

  const res = spawnSync('node', [CHECKER, '--user-facing-only', abs], { encoding: 'utf8' });
  if (res.status === 2) {
    process.stderr.write(res.stderr || '');
    process.exit(2);
  }
  process.exit(0);
});
