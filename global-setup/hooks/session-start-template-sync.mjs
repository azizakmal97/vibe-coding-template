#!/usr/bin/env node
/**
 * GLOBAL SessionStart hook.
 * Keeps ~/.claude in step with the vibe-coding-template clone, so changes pushed by the monthly
 * model-refresh routine (or any template commit) reach this machine without running setup again.
 *
 * Each session start asks GitHub (one `git ls-remote`) whether the template's main branch has a
 * commit the clone named in ~/.claude/vibe-template.json lacks. Only then: `git pull --ff-only` and
 * copy each managed global file whose template version changed. A file you edited by hand is
 * never overwritten: it is copied only when it still matches what the last sync wrote; otherwise
 * the hook prints one line asking you to merge it (re-run setup, which keeps a .bak).
 *
 * Never blocks a session: every failure (offline, no clone, local changes in the clone) is skipped
 * quietly and retried next time. Toggle off with env TEMPLATE_SYNC=0.
 */

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

const GIT_TIMEOUT_MS = 15000;

const claudeDir = join(homedir(), '.claude');
const statePath = join(claudeDir, '.template-sync.json');

// Template path (inside the clone) → installed path (inside ~/.claude).
const MANAGED = [
  ['global-setup/CLAUDE.md', 'CLAUDE.md'],
  ['global-setup/hooks/post-commit-push.mjs', 'hooks/post-commit-push.mjs'],
  ['global-setup/hooks/session-start-template-sync.mjs', 'hooks/session-start-template-sync.mjs'],
  ['global-setup/skills/update-template/SKILL.md', 'skills/update-template/SKILL.md'],
  ['global-setup/skills/video-studio/SKILL.md', 'skills/video-studio/SKILL.md'],
  ['global-setup/skills/motion-design/SKILL.md', 'skills/motion-design/SKILL.md'],
  ['global-setup/skills/blender-3d/SKILL.md', 'skills/blender-3d/SKILL.md'],
  ['global-setup/skills/poster-design/SKILL.md', 'skills/poster-design/SKILL.md'],
  ['global-setup/skills/social-growth/SKILL.md', 'skills/social-growth/SKILL.md'],
];

function hashOf(path) {
  if (!existsSync(path)) return null;
  // Line endings differ between a Windows checkout and a copied file; compare content, not CRLF.
  const text = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
  return createHash('sha256').update(text).digest('hex');
}

function readJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return fallback;
  }
}

function git(templateDir, args) {
  const result = spawnSync('git', ['-C', templateDir, ...args], { timeout: GIT_TIMEOUT_MS, encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : null;
}

// True when GitHub's main has a commit the local clone has not pulled yet.
function remoteHasNewCommit(templateDir) {
  const remoteHead = (git(templateDir, ['ls-remote', 'origin', 'refs/heads/main']) || '').split(/\s+/)[0];
  const localHead = git(templateDir, ['rev-parse', 'HEAD']);
  return Boolean(remoteHead && localHead && remoteHead !== localHead);
}

function main() {
  if (process.env.TEMPLATE_SYNC === '0') return;

  const templateDir = readJson(join(claudeDir, 'vibe-template.json'), {}).templateDir;
  if (!templateDir || !existsSync(join(templateDir, 'global-setup'))) return;

  const state = readJson(statePath, { synced: {} });
  state.synced = state.synced || {};
  const firstRun = !existsSync(statePath);

  // Nothing new on GitHub: no pull, no copying (the first run still records what is installed).
  if (!remoteHasNewCommit(templateDir) && !firstRun) return;

  // ff-only refuses to merge or overwrite local work in the clone; a failure just means "use as is".
  git(templateDir, ['pull', '--ff-only', '--quiet']);

  const updated = [];
  const needsMerge = [];
  for (const [templatePath, installedPath] of MANAGED) {
    const src = join(templateDir, templatePath);
    const dest = join(claudeDir, installedPath);
    const srcHash = hashOf(src);
    if (!srcHash) continue;
    const destHash = hashOf(dest);

    if (destHash === srcHash) {
      state.synced[installedPath] = srcHash;
      continue;
    }
    const untouchedSinceLastSync = destHash === null || destHash === state.synced[installedPath];
    if (!untouchedSinceLastSync) {
      needsMerge.push(installedPath);
      continue;
    }
    mkdirSync(dirname(dest), { recursive: true });
    if (destHash !== null) copyFileSync(dest, `${dest}.bak`);
    copyFileSync(src, dest);
    state.synced[installedPath] = srcHash;
    updated.push(installedPath);
  }

  writeFileSync(statePath, JSON.stringify(state, null, 2));

  if (updated.length) {
    console.log(`[template-sync] Updated from vibe-coding-template: ~/.claude/${updated.join(', ~/.claude/')} (previous copy saved as .bak).`);
  }
  if (needsMerge.length) {
    console.log(`[template-sync] The template changed ~/.claude/${needsMerge.join(', ~/.claude/')}, but the installed copy has hand edits, so it was left alone. Tell the user to merge (re-run setup.ps1 in the template clone; it keeps a .bak).`);
  }
}

try {
  main();
} catch {
  // Never block a session start.
}
