#!/usr/bin/env node
/**
 * PostToolUse (Bash) hook.
 * After a successful `git commit`, re-run the graphify bootstrap so the graph
 * never lags a structural change (file added, renamed, deleted).
 *
 * The bootstrap is idempotent: when the source-file list is unchanged and the
 * graph is under 7 days old it exits in milliseconds. When it does rebuild, it
 * runs detached so the agent is never blocked.
 *
 * Non-blocking, exit 0 always. Toggle off: env AUTO_GRAPHIFY=0
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

if (process.env.AUTO_GRAPHIFY === '0') process.exit(0);

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
if (!/(?:^|[\s;&|]+)git\s+commit\b/.test(command) || exitCode !== 0) process.exit(0);

const bootstrap = join(process.cwd(), 'scripts', 'graphify-bootstrap.mjs');
if (!existsSync(bootstrap)) process.exit(0);

spawn(process.execPath, [bootstrap], { stdio: 'ignore', detached: true, windowsHide: true }).unref();
process.exit(0);
