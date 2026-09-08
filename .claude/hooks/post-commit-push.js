#!/usr/bin/env node
/**
 * PostToolUse (Bash) hook.
 * Detects successful `git commit` and auto-pushes to the remote.
 *
 * Why: per-edit commits only survive on local disk. Auto-push survives
 * machine crash, disk corruption, OS reinstall. Pair with /autonomous +
 * PROGRESS.md → work survives any failure mode.
 *
 * Hook input (stdin JSON): { tool_input: { command }, tool_response: { stdout, stderr, exit_code } }
 *
 * Non-blocking: push failure (offline, no remote, auth issue) is logged but
 * NEVER blocks the agent. Next commit retries the push.
 *
 * Toggle off: set env AUTO_PUSH=0
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
// Matches: standalone `git commit ...` AND chained forms like
// `git add . && git commit -m "..."`, `git status; git commit ...`.
if (!/(?:^|[\s;&|]+)git\s+commit\b/.test(command)) process.exit(0);
if (exitCode !== 0) process.exit(0);

// Skip commands that never produce a commit (previews).
// NOTE: do NOT gate on stdout markers — `git commit -q/--quiet` suppresses the
// `[branch hash]` / "N files changed" lines, which previously made this hook
// silently skip the push. Whether a commit actually landed is decided below via
// the ahead-of-upstream count, which is correct regardless of -q.
if (/--dry-run\b/.test(command)) process.exit(0);
void stdout;

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

// If upstream is set, only push when HEAD is actually ahead. This replaces the
// old stdout heuristic: it pushes correctly after `-q` commits AND skips no-op
// runs (commands that matched `git commit` but created nothing). When no upstream
// exists yet (first push), always proceed to establish it.
if (upstreamSet) {
  let ahead = 0;
  try {
    ahead = parseInt(
      execSync(`git rev-list --count ${branch}@{upstream}..HEAD`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(),
      10,
    ) || 0;
  } catch {
    ahead = 1; // can't determine → err toward pushing (safe; push no-ops if nothing to send)
  }
  if (ahead === 0) process.exit(0);
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
