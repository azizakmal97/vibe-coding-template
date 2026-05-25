#!/usr/bin/env node
/**
 * SessionStart hook.
 * If PROGRESS.md has a 🟡 in-progress phase, inject a context block reminding
 * the agent to run /resume before any other action.
 *
 * Exit 0 = continue silently. Stdout is shown to the agent.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const PROGRESS_CANDIDATES = ['PROGRESS.md', 'REFACTOR_PROGRESS.md'];
let progressPath = null;
for (const name of PROGRESS_CANDIDATES) {
  const p = join(ROOT, name);
  if (existsSync(p)) { progressPath = p; break; }
}
if (!progressPath) process.exit(0);

const body = readFileSync(progressPath, 'utf8');
const activeMatch = body.match(/\*\*Active phase:\*\*\s*(.+)/);
const inProgressMatch = body.match(/^### 🟡 (.+)$/m);

if (!inProgressMatch && !(activeMatch && /🟡|in[- ]progress/i.test(activeMatch[1]))) {
  process.exit(0);
}

const phaseLine = inProgressMatch ? inProgressMatch[1] : activeMatch[1];

let gitStatus = '';
let recentCommits = '';
try {
  gitStatus = execSync('git status --short', { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  recentCommits = execSync('git log --oneline -5', { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
} catch {}

const progressName = progressPath.split(/[\\/]/).pop();
const banner = `
╔══════════════════════════════════════════════════════════════════════╗
║  SESSION RESUME — ${progressName.padEnd(20)} has an active phase   ║
╠══════════════════════════════════════════════════════════════════════╣
║ Phase: ${phaseLine.slice(0, 60).padEnd(60)} ║
╚══════════════════════════════════════════════════════════════════════╝

A previous session left work in progress. BEFORE any other action:
  1. Run the /resume slash command (or follow CLAUDE.md §13 steps).
  2. Reconcile uncommitted changes against the phase plan.
  3. Run typecheck + build + test.
  4. Continue from the next plan bullet.

Recent commits:
${recentCommits || '(none)'}

Uncommitted files:
${gitStatus || '(none)'}
`;

process.stdout.write(banner);
process.exit(0);
