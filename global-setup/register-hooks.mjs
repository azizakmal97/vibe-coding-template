#!/usr/bin/env node
/**
 * Adds the template's global hooks to ~/.claude/settings.json without touching anything else.
 * Run by setup.ps1; safe to run again (a hook already registered only gets its matcher updated).
 *
 *     node global-setup/register-hooks.mjs
 *     node global-setup/register-hooks.mjs --usage-guard    (also the optional usage guard)
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const claudeDir = join(homedir(), '.claude');
const settingsPath = join(claudeDir, 'settings.json');
const hooksDir = join(claudeDir, 'hooks').replace(/\\/g, '/');

const WANTED = [
  { event: 'PostToolUse', matcher: 'Bash|PowerShell', file: 'post-commit-push.mjs' },
  { event: 'SessionStart', matcher: '', file: 'session-start-template-sync.mjs' },
];

// Opt-in: it blocks messages at night, which is a personal choice, not a template default.
if (process.argv.includes('--usage-guard')) {
  WANTED.push({ event: 'UserPromptSubmit', matcher: '', file: 'usage-guard.mjs' });
}

const settings = existsSync(settingsPath) ? JSON.parse(readFileSync(settingsPath, 'utf8')) : {};
settings.hooks = settings.hooks || {};

const added = [];
for (const { event, matcher, file } of WANTED) {
  const command = `node "${hooksDir}/${file}"`;
  const entries = (settings.hooks[event] = settings.hooks[event] || []);
  const registered = entries.find((entry) => (entry.hooks || []).some((hook) => (hook.command || '').includes(file)));
  if (registered) {
    // An older install keeps its entry, so a widened matcher has to be carried over.
    if ((registered.matcher || '') !== matcher) {
      registered.matcher = matcher;
      added.push(`${event}: ${file} now matches ${matcher}`);
    }
    continue;
  }
  let entry = entries.find((candidate) => (candidate.matcher || '') === matcher);
  if (!entry) {
    entry = { matcher, hooks: [] };
    entries.push(entry);
  }
  entry.hooks.push({ type: 'command', command });
  added.push(`${event}: ${command}`);
}

writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
console.log(added.length ? `  [OK] settings.json hooks added:\n    ${added.join('\n    ')}` : '  ~ settings.json already registers the global hooks');
