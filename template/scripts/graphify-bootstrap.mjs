#!/usr/bin/env node
/**
 * Graphify bootstrap.
 *
 * Counts source files under common roots (src, lib, app, worker, packages).
 * If >= 50 files and `graphify` Python package is available, runs:
 *   graphify generate . --output graphify-out
 *
 * Idempotent: skips if graphify-out/GRAPH_REPORT.md is < 7 days old.
 *
 * Exit 0 always (never blocks setup).
 */

import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const SOURCE_ROOTS = ['src', 'lib', 'app', 'worker', 'packages', 'apps'];
const STALE_DAYS = 7;
const MIN_FILES = 50;
const SOURCE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.dart', '.rs', '.py', '.go', '.java', '.kt', '.swift']);

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name.startsWith('.')) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.isFile()) {
      const dot = entry.name.lastIndexOf('.');
      if (dot > -1 && SOURCE_EXT.has(entry.name.slice(dot))) yield full;
    }
  }
}

let sourceFileCount = 0;
for (const root of SOURCE_ROOTS) {
  const abs = join(ROOT, root);
  if (!existsSync(abs)) continue;
  for (const _ of walk(abs)) sourceFileCount++;
}

if (sourceFileCount < MIN_FILES) {
  console.log(`[graphify-bootstrap] ${sourceFileCount} source files (< ${MIN_FILES}). Skipping graph. Rerun when codebase grows.`);
  process.exit(0);
}

const report = join(ROOT, 'graphify-out', 'GRAPH_REPORT.md');
if (existsSync(report)) {
  const ageMs = Date.now() - statSync(report).mtimeMs;
  const ageDays = ageMs / 86400000;
  if (ageDays < STALE_DAYS) {
    console.log(`[graphify-bootstrap] Graph fresh (${ageDays.toFixed(1)}d old). Skipping.`);
    process.exit(0);
  }
  console.log(`[graphify-bootstrap] Graph stale (${ageDays.toFixed(1)}d). Regenerating.`);
}

const check = spawnSync('graphify', ['--version'], { encoding: 'utf8' });
if (check.error || check.status !== 0) {
  console.log('[graphify-bootstrap] `graphify` not installed. Install via: pip install graphify');
  console.log('[graphify-bootstrap] Or use the Claude Code skill: /graphify');
  process.exit(0);
}

console.log(`[graphify-bootstrap] ${sourceFileCount} source files. Running graphify...`);
const run = spawnSync('graphify', ['generate', '.', '--output', 'graphify-out'], { stdio: 'inherit' });
if (run.status !== 0) {
  console.error('[graphify-bootstrap] graphify failed; continuing setup.');
}
process.exit(0);
