#!/usr/bin/env node
/**
 * audit-gate.mjs -- the dependency-audit gate.
 *
 * Runs `npm audit --json`, then fails ONLY on advisories that are not
 * explicitly accepted in `.audit-accepted.json` (or whose acceptance has
 * expired). Everything documented and in-date passes, so the gate stays green
 * on the known backlog and goes red the moment something new lands.
 *
 * Usage:
 *   node scripts/audit-gate.mjs              # full tree (prod + dev)
 *   node scripts/audit-gate.mjs --production # prod deps only
 *   node scripts/audit-gate.mjs --json       # machine-readable classification
 *
 * All parsing/classification lives in audit-gate-lib.mjs (pure + unit-tested);
 * this file is only I/O.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import {
  collectAdvisories,
  validateAcceptedList,
  classifyAdvisories,
  shouldFail,
  formatReport,
} from './audit-gate-lib.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ACCEPTED_PATH = path.join(REPO_ROOT, '.audit-accepted.json');

/**
 * Run `npm audit --json` and parse it.
 *
 * npm exits 1 when it finds anything, so a non-zero status is expected and the
 * stdout still holds the report — we only treat UNPARSEABLE output as fatal.
 * Failing closed here matters: a silently-empty audit would look like "clean".
 */
function runAudit({ productionOnly }) {
  const args = ['audit', '--json'];
  if (productionOnly) args.push('--omit=dev');

  let stdout;
  try {
    stdout = execFileSync('npm', args, {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      shell: process.platform === 'win32',
    });
  } catch (err) {
    stdout = err.stdout;
    if (!stdout) {
      throw new Error(`npm audit produced no output: ${err.message}`);
    }
  }

  try {
    return JSON.parse(stdout);
  } catch {
    throw new Error(`Could not parse npm audit output:\n${String(stdout).slice(0, 500)}`);
  }
}

function loadAccepted() {
  let raw;
  try {
    raw = readFileSync(ACCEPTED_PATH, 'utf8');
  } catch {
    // No file = nothing accepted. That is a valid (strictest) configuration.
    return { accepted: [] };
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`.audit-accepted.json is not valid JSON: ${err.message}`);
  }
}

function main() {
  const argv = process.argv.slice(2);
  const productionOnly = argv.includes('--production');
  const asJson = argv.includes('--json');

  const acceptedDoc = loadAccepted();
  const problems = validateAcceptedList(acceptedDoc);
  if (problems.length > 0) {
    console.error('.audit-accepted.json is invalid:');
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }

  const auditJson = runAudit({ productionOnly });
  const found = collectAdvisories(auditJson);
  const today = new Date().toISOString().slice(0, 10);
  const result = classifyAdvisories(found, acceptedDoc, today);

  if (asJson) {
    console.log(JSON.stringify({ today, productionOnly, ...result }, null, 2));
  } else {
    console.log(`Dependency audit gate — ${productionOnly ? 'production deps' : 'full tree'} (${today})`);
    console.log(`${found.length} distinct advisory(ies) in the tree.\n`);
    console.log(formatReport(result, { today }));
  }

  process.exit(shouldFail(result) ? 1 : 0);
}

main();
