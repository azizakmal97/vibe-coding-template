#!/usr/bin/env node
/**
 * Adds the template's global hooks to ~/.claude/settings.json without touching anything else.
 * Run by setup.ps1; safe to run again (a hook already registered is left as it is).
 *
 *     node global-setup/register-hooks.mjs
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const claudeDir = join(homedir(), '.claude');
const settingsPath = join(claudeDir, 'settings.json');
const hooksDir = join(claudeDir, 'hooks').replace(/\\/g, '/');

const WANTED = [
  { event: 'PostToolUse', matcher: 'Bash', file: 'post-commit-push.mjs' },
  { event: 'SessionStart', matcher: '', file: 'session-start-template-sync.mjs' },
];

const settings = existsSync(settingsPath) ? JSON.parse(readFileSync(settingsPath, 'utf8')) : {};
settings.hooks = settings.hooks || {};

const added = [];
for (const { event, matcher, file } of WANTED) {
  const command = `node "${hooksDir}/${file}"`;
  const entries = (settings.hooks[event] = settings.hooks[event] || []);
  const alreadyThere = entries.some((entry) => (entry.hooks || []).some((hook) => (hook.command || '').includes(file)));
  if (alreadyThere) continue;
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
