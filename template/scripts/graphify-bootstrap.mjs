#!/usr/bin/env node
/**
 * Graphify bootstrap.
 *
 * Counts source files under common roots (src, lib, app, worker, packages).
 * If >= 50 files and the `graphifyy` Python package is importable, runs the
 * scoped rebuild:
 *
 *   python scripts/graphify-rebuild.py
 *
 * NOT `graphify generate` -- the CLI has no such command, and it exits 0 while
 * printing "unknown command", so the old bootstrap reported success over an
 * empty directory. Success is therefore verified by checking that
 * GRAPH_REPORT.md was actually (re)written, never by the exit code alone.
 *
 * Idempotent: skips if graphify-out/GRAPH_REPORT.md is < 7 days old.
 *
 * Exit 0 always (never blocks setup).
 */

import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
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
const before = existsSync(report) ? statSync(report).mtimeMs : 0;
if (before) {
  const ageDays = (Date.now() - before) / 86400000;
  if (ageDays < STALE_DAYS) {
    console.log(`[graphify-bootstrap] Graph fresh (${ageDays.toFixed(1)}d old). Skipping.`);
    process.exit(0);
  }
  console.log(`[graphify-bootstrap] Graph stale (${ageDays.toFixed(1)}d). Regenerating.`);
}

// Prefer the project's own copy; fall back to the one sitting next to this
// script, since setup.ps1 invokes the bootstrap by absolute path from the
// template directory while the cwd is the target project.
const HERE = dirname(fileURLToPath(import.meta.url));
const rebuild = [join(ROOT, 'scripts', 'graphify-rebuild.py'), join(HERE, 'graphify-rebuild.py')]
  .find((p) => existsSync(p));
if (!rebuild) {
  console.log('[graphify-bootstrap] scripts/graphify-rebuild.py not found. Skipping graph.');
  process.exit(0);
}

// Find an interpreter that can import the package. `python3` on most Unix
// installs, `python` on Windows; the package is named graphifyy, the import
// name is graphify.
const python = ['python', 'python3'].find((bin) => {
  const probe = spawnSync(bin, ['-c', 'import graphify'], { encoding: 'utf8' });
  return !probe.error && probe.status === 0;
});

if (!python) {
  console.log('[graphify-bootstrap] graphify not importable by python. Install: pip install graphifyy');
  console.log('[graphify-bootstrap] Or use the Claude Code skill: /graphify');
  process.exit(0);
}

console.log(`[graphify-bootstrap] ${sourceFileCount} source files. Running scoped rebuild...`);
const run = spawnSync(python, [rebuild], { stdio: 'inherit' });

const after = existsSync(report) ? statSync(report).mtimeMs : 0;
if (run.status !== 0 || after === before) {
  console.error('[graphify-bootstrap] rebuild did not produce a graph; continuing setup.');
} else {
  console.log('[graphify-bootstrap] Done. GRAPH_REPORT.md written.');
  if (existsSync(join(ROOT, 'graphify-out', 'obsidian'))) {
    console.log('[graphify-bootstrap]   Obsidian -> "Open folder as vault" -> graphify-out/obsidian');
  }
}
process.exit(0);
