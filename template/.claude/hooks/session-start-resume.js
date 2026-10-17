#!/usr/bin/env node
/**
 * SessionStart hook. Two independent checks, both printed to the agent:
 *   1. This computer lacks the vibe-coding-template global setup → tell the
 *      agent to offer it, with the exact steps, so the owner never has to
 *      remember them on a new machine.
 *   2. PROGRESS.md has a 🟡 in-progress phase → remind the agent to run
 *      /resume before any other action.
 *
 * Exit 0 = continue silently. Stdout is shown to the agent.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const TEMPLATE_REPO = 'https://github.com/azizakmal97/vibe-coding-template';

// The global skill is the last thing the global setup installs that a project
// relies on, so its absence means this machine was never set up.
function machineSetupNotice() {
  const globalSkill = join(homedir(), '.claude', 'skills', 'update-template', 'SKILL.md');
  if (existsSync(globalSkill)) return '';
  return `
THIS COMPUTER IS NOT SET UP for vibe-coding-template.
Missing here: /update-template in every project, and the global rules
(model + effort choice, auto-push after every commit).

Tell the owner this in one plain sentence and offer to set it up now.
On yes (Windows, PowerShell):
  1. If ~/vibe-coding-template does not exist:
       git clone ${TEMPLATE_REPO} ~/vibe-coding-template
     Otherwise: git -C ~/vibe-coding-template pull --ff-only
  2. In ~/vibe-coding-template run: .\\setup.ps1 -Agent claude
     (add ZCode later with: .\\setup.ps1 -Agent zcode)
  3. Tell the owner to restart Claude Code.
The setup replaces ~/.claude/CLAUDE.md; the old copy is kept as CLAUDE.md.bak.
Say so before running it.
`;
}

function resumeBanner() {
  const progressName = ['PROGRESS.md', 'REFACTOR_PROGRESS.md'].find((name) => existsSync(join(ROOT, name)));
  if (!progressName) return '';

  const body = readFileSync(join(ROOT, progressName), 'utf8');
  const activeMatch = body.match(/\*\*Active phase:\*\*\s*(.+)/);
  const inProgressMatch = body.match(/^### 🟡 (.+)$/m);

  if (!inProgressMatch && !(activeMatch && /🟡|in[- ]progress/i.test(activeMatch[1]))) return '';

  const phaseLine = inProgressMatch ? inProgressMatch[1] : activeMatch[1];

  let gitStatus = '';
  let recentCommits = '';
  try {
    gitStatus = execSync('git status --short', { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    recentCommits = execSync('git log --oneline -5', { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {}

  return `
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
}

process.stdout.write(machineSetupNotice() + resumeBanner());
process.exit(0);
