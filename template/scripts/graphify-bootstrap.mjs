#!/usr/bin/env node
/**
 * Graphify bootstrap.
 *
 * Counts source files anywhere in the repo (junk dirs skipped), not just under
 * guessed roots: a package named `animforge/` or `engine/` is source too.
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
 * Idempotent: skips when GRAPH_REPORT.md is < 7 days old AND the list of
 * source files is the same as at the last build (graphify-out/.source-files).
 * A file added, renamed or deleted therefore always triggers a rebuild, which
 * is the "rebuild after structural change" rule made automatic. The
 * post-commit-graphify hook calls this script after every commit.
 *
 * Exit 0 always (never blocks setup).
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const SKIP_DIRS = new Set([
  'node_modules', 'dist', 'build', 'out', 'target', 'graphify-out', '__pycache__',
  'venv', 'vendor', 'coverage', 'Pods',
]);
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
    if (SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.isFile()) {
      const dot = entry.name.lastIndexOf('.');
      if (dot > -1 && SOURCE_EXT.has(entry.name.slice(dot))) yield full;
    }
  }
}

const sourceFiles = [...walk(ROOT)].map((file) => relative(ROOT, file).replaceAll(sep, '/')).sort();
const sourceFileCount = sourceFiles.length;
const fingerprint = createHash('sha1').update(sourceFiles.join(String.fromCharCode(10))).digest('hex');
const fingerprintFile = join(ROOT, 'graphify-out', '.source-files');
const lastFingerprint = existsSync(fingerprintFile) ? readFileSync(fingerprintFile, 'utf8').trim() : '';

if (sourceFileCount < MIN_FILES) {
  console.log(`[graphify-bootstrap] ${sourceFileCount} source files (< ${MIN_FILES}). Skipping graph. Rerun when codebase grows.`);
  process.exit(0);
}

// The graph is rebuilt locally and churns on every rebuild; committed, it
// floods every diff. `git check-ignore` exits 0 when ignored, 1 when not, and
// 128 outside a repo, where there is nothing to warn about.
function warnIfGraphNotIgnored() {
  const check = spawnSync('git', ['check-ignore', '-q', 'graphify-out/GRAPH_REPORT.md'], { cwd: ROOT });
  if (check.status !== 1) return;
  console.log('[graphify-bootstrap] WARNING: graphify-out/ is not git-ignored, so the graph would be committed.');
  console.log('[graphify-bootstrap]   Fix: node scripts/ensure-gitignore.mjs');
}

const report = join(ROOT, 'graphify-out', 'GRAPH_REPORT.md');
const before = existsSync(report) ? statSync(report).mtimeMs : 0;
if (before) {
  const ageDays = (Date.now() - before) / 86400000;
  if (ageDays < STALE_DAYS && fingerprint === lastFingerprint) {
    console.log(`[graphify-bootstrap] Graph fresh (${ageDays.toFixed(1)}d old, same source files). Skipping.`);
    warnIfGraphNotIgnored();
    process.exit(0);
  }
  const why = fingerprint === lastFingerprint ? `stale (${ageDays.toFixed(1)}d)` : 'source files added, renamed or deleted';
  console.log(`[graphify-bootstrap] Graph ${why}. Regenerating.`);
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
  writeFileSync(fingerprintFile, fingerprint + String.fromCharCode(10));
  console.log('[graphify-bootstrap] Done. GRAPH_REPORT.md written.');
  warnIfGraphNotIgnored();
  if (existsSync(join(ROOT, 'graphify-out', 'obsidian'))) {
    console.log('[graphify-bootstrap]   Obsidian -> "Open folder as vault" -> graphify-out/obsidian');
  }
}
process.exit(0);
