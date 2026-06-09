#!/usr/bin/env node
/**
 * GLOBAL PostToolUse (Bash) hook.
 * Detects a successful `git commit` and auto-pushes to the remote.
 *
 * Why: per-edit commits only survive on local disk. Auto-push survives
 * machine crash, disk corruption, OS reinstall, machine swap.
 *
 * Non-blocking: push failure (offline, no remote, auth issue) is logged but
 * NEVER blocks the agent. Next commit retries the push.
 *
 * Toggle off for a session: set env AUTO_PUSH=0
 * Skips automatically when the repo has no remote configured.
 */

import { execSync, spawnSync } from 'node:child_process';

if (process.env.AUTO_PUSH === '0') process.exit(0);

let payload = '';
try {
  payload = await new Promise((resolve) => {
    let buf = '';
    process.stdin.on('data', (chunk) => (buf += chunk));
    process.stdin.on('end', () => resolve(buf));
  });
} catch {
  process.exit(0);
}

let data;
try {
  data = JSON.parse(payload || '{}');
} catch {
  process.exit(0);
}

const command = data.tool_input?.command || '';
const exitCode = data.tool_response?.exit_code ?? data.tool_response?.exitCode ?? 0;
const stdout = data.tool_response?.stdout || '';

// Only act on `git commit ...` that succeeded.
if (!/^\s*git\s+commit\b/.test(command)) process.exit(0);
if (exitCode !== 0) process.exit(0);

// Confirm commit actually happened (avoids no-op runs like --dry-run).
const looksCommitted = /\[\w+[\s-]*\(?[\w./-]*\)?\s+[a-f0-9]{7,}\]/.test(stdout)
  || /\d+\s+files?\s+changed/.test(stdout);
if (!looksCommitted) process.exit(0);

// Check remote configured.
let hasRemote = false;
try {
  const remotes = execSync('git remote', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  hasRemote = remotes.length > 0;
} catch {}
if (!hasRemote) {
  process.stderr.write('[auto-push] no git remote configured; commit stays local only.\n');
  process.exit(0);
}

// Get current branch.
let branch = '';
try {
  branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
} catch {
  process.exit(0);
}
if (!branch || branch === 'HEAD') process.exit(0);

// Determine if upstream is set; if not, set on first push.
let upstreamSet = true;
try {
  execSync(`git rev-parse --abbrev-ref ${branch}@{upstream}`, { stdio: 'ignore' });
} catch {
  upstreamSet = false;
}

const args = upstreamSet ? ['push'] : ['push', '-u', 'origin', branch];
const res = spawnSync('git', args, { encoding: 'utf8', timeout: 30_000 });

if (res.status === 0) {
  process.stderr.write(`[auto-push] pushed to origin/${branch}\n`);
} else {
  const err = (res.stderr || '').split('\n')[0] || 'unknown error';
  process.stderr.write(`[auto-push] push failed (non-blocking): ${err}\n`);
  process.stderr.write('[auto-push] commit stays local. Next commit will retry push.\n');
}

process.exit(0); // never block
