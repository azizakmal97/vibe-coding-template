#!/usr/bin/env node
/**
 * SessionStart hook. Four independent checks, all printed to the agent:
 *   1. This computer lacks the vibe-coding-template global setup → tell the
 *      agent to offer it, with the exact steps, so the owner never has to
 *      remember them on a new machine.
 *   2. .claude/ is gitignored → offer to share it, or other computers get
 *      none of the template.
 *   3. PROGRESS.md has a 🟡 in-progress phase → remind the agent to run
 *      /resume before any other action.
 *   4. PROGRESS.md has ⏸ phases parked for another model → list them.
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

// A project that gitignores .claude/ works on this computer and silently loses
// every rule, hook and command on the next one, because the folder never
// reaches the remote. Found in a real project that had ignored it for months.
function ignoredConfigNotice() {
  try {
    // Exit 0 means ignored; exit 1 (not ignored) and "not a git repo" both throw.
    execSync('git check-ignore -q .claude/rules', { cwd: ROOT, stdio: 'ignore' });
  } catch {
    return '';
  }
  return `
.claude/ IS GITIGNORED in this project, so its rules, hooks and commands never
reach GitHub and are missing on any other computer that clones it.

Tell the owner this in one plain sentence and offer to fix it. On yes:
  1. In .gitignore, replace the line that ignores .claude/ with:
       .claude/db-backups/
       .claude/worktrees/
       .claude/settings.local.json
  2. Scan the files that would be added for keys, tokens and private keys;
     stop and report any hit.
  3. Commit the .gitignore change together with .claude/.
`;
}

// "none" comes first: a header like "none running; several phases are half
// done (🟡)" carries the emoji without naming an active phase.
function activePhaseFromHeader(headerText) {
  if (/^\s*_?none\b/i.test(headerText)) return null;
  return /🟡|in[- ]progress/i.test(headerText) ? headerText.trim() : null;
}

function resumeBanner() {
  const progressName = ['PROGRESS.md', 'REFACTOR_PROGRESS.md'].find((name) => existsSync(join(ROOT, name)));
  if (!progressName) return '';

  const body = readFileSync(join(ROOT, progressName), 'utf8');
  // The header line is the one /next-phase, /autonomous and the progress hook
  // keep current. A 🟡 left on a paused phase's heading must not override it:
  // omfs-game's header said "none running" while the banner reported P04d.
  const header = body.match(/\*\*Active phase:\*\*\s*(.+)/);
  const phaseLine = header ? activePhaseFromHeader(header[1]) : body.match(/^### 🟡 (.+)$/m)?.[1];
  if (!phaseLine) return '';

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

// /autonomous parks a phase as ⏸ when its remaining work belongs to another
// model. The owner won't remember which model each phase waits for, so every
// session lists them and the agent compares against its own model.
function waitingForModelNotice() {
  const progressName = ['PROGRESS.md', 'REFACTOR_PROGRESS.md'].find((name) => existsSync(join(ROOT, name)));
  if (!progressName) return '';

  const body = readFileSync(join(ROOT, progressName), 'utf8');
  // ⏸ is also used for phases parked for other reasons (owner decisions), so
  // only a "waiting for <model>" status counts.
  const parked = [...body.matchAll(/^### ⏸️?\s+(.+)$/gm)].flatMap((match) => {
    const blockStart = match.index + match[0].length;
    const nextHeader = body.indexOf('\n### ', blockStart);
    const block = body.slice(blockStart, nextHeader === -1 ? undefined : nextHeader);
    const waitingFor = block.match(/\*\*Status:\*\*\s*waiting for\s+(.+)/i);
    return waitingFor ? [`  - ${match[1].trim()} — waiting for ${waitingFor[1].trim()}`] : [];
  });
  if (parked.length === 0) return '';

  return `
PHASES WAITING FOR A DIFFERENT MODEL (parked by /autonomous):
${parked.join('\n')}

Tell the owner in one plain sentence. If this session runs one of those models,
offer to run /autonomous, which picks them up first. If not, name the model to
switch to (Claude Code: /model <name>) and continue with what they asked.
`;
}

process.stdout.write(machineSetupNotice() + ignoredConfigNotice() + resumeBanner() + waitingForModelNotice());
process.exit(0);
