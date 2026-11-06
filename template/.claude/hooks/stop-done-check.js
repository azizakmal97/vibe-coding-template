#!/usr/bin/env node
/**
 * Stop hook. Holds the agent back when code changed after an agreed spec was
 * last checked. A real test showed an agent reading the /done-check reminder on
 * every message and still ending its turn without running it.
 *
 * /done-check commits its result into the spec, so a spec's last commit marks the
 * last check. A spec whose result is PASS is finished and never held again.
 *
 * Hook input: { stop_hook_active: boolean }. Exit 2 = keep working (stderr goes
 * to the agent). stop_hook_active means this hook already held the turn once.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const SPECS_DIR = join(ROOT, 'specs');

function git(...args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

function isWaitingForCheck(specName) {
  const spec = readFileSync(join(SPECS_DIR, specName), 'utf8');
  if (!/Status:\s*agreed/.test(spec) || /^Done-check:\s*PASS\b/m.test(spec)) return false;
  const lastSpecCommit = git('log', '-1', '--format=%H', '--', `specs/${specName}`);
  if (!lastSpecCommit) return false;
  return git('log', '--format=%h', `${lastSpecCommit}..HEAD`, '--', '.', ':!specs', ':!*.md') !== '';
}

function specsWaitingForCheck() {
  try {
    return readdirSync(SPECS_DIR).filter((name) => name.endsWith('.md')).filter(isWaitingForCheck);
  } catch (error) {
    // Not a git repo yet, or git missing: nothing here can be compared.
    process.stderr.write(`[stop-done-check] skipped: ${error.message}\n`);
    return [];
  }
}

let payload = '';
process.stdin.setEncoding('utf-8');
process.stdin.on('data', (chunk) => { payload += chunk; });
process.stdin.on('end', () => {
  let alreadyHeld = false;
  try {
    alreadyHeld = JSON.parse(payload || '{}').stop_hook_active === true;
  } catch {
    process.stderr.write('[stop-done-check] unreadable hook input, treating as first stop\n');
  }
  if (alreadyHeld || !existsSync(SPECS_DIR)) process.exit(0);

  const waiting = specsWaitingForCheck();
  if (waiting.length === 0) process.exit(0);

  process.stderr.write(
    `Code changed after these specs were last checked: ${waiting.join(', ')}. ` +
    'Run /done-check on each now (.claude/commands/done-check.md), then tell the owner the result in plain words.\n',
  );
  process.exit(2);
});
