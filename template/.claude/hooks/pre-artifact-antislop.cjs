#!/usr/bin/env node
/**
 * PreToolUse hook (Artifact) — blocks publishing an HTML page until
 * scripts/antislop-check.mjs --gate passes: the mechanical antislop rules plus a
 * fresh, FAIL-free Delivery Gate report at anti-slop/gates/<file name>.md.
 *
 * Hook input shape (stdin JSON): { tool_input: { action?, file_path?, files?, root?, asset? } }
 * `files` is either a map { "published/path": "source" | { from } | { artifact } | null }
 * or a list of strings / { path }.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = process.cwd();
const CHECKER = path.join(ROOT, 'scripts', 'antislop-check.mjs');

function sourcesOf(files) {
  if (!files) return [];
  if (Array.isArray(files)) return files.map((f) => (typeof f === 'string' ? f : f && f.path)).filter(Boolean);
  return Object.values(files).map((v) => (typeof v === 'string' ? v : v && v.from)).filter(Boolean);
}

let raw = '';
process.stdin.setEncoding('utf-8');
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  if (!fs.existsSync(CHECKER)) process.exit(0); // checker not installed; no enforcement

  let input = {};
  try {
    input = JSON.parse(raw || '{}').tool_input || {};
  } catch {
    process.exit(0);
  }
  // Reads, lists, opens and asset uploads are not page publishes.
  if ((input.action || 'publish') !== 'publish' || input.asset === true) process.exit(0);

  const base = input.root ? (path.isAbsolute(input.root) ? input.root : path.join(ROOT, input.root)) : ROOT;
  const pages = [input.file_path, ...sourcesOf(input.files)]
    .filter(Boolean)
    .map((p) => (path.isAbsolute(p) ? p : path.join(base, p)))
    .filter((p) => /\.html?$/i.test(p) && fs.existsSync(p));
  if (pages.length === 0) process.exit(0);

  const res = spawnSync('node', [CHECKER, '--gate', ...pages], { encoding: 'utf8' });
  if (res.status === 2) {
    process.stderr.write(res.stderr || '');
    process.stderr.write('\n🛑 Publish blocked by antislop. Fix the findings, run the full Delivery Gate, and record it in anti-slop/gates/<file>.md. See AGENTS.md § antislop.\n');
    process.exit(2);
  }
  process.exit(0);
});
