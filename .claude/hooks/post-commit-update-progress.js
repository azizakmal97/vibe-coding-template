#!/usr/bin/env node
/**
 * PostToolUse (Bash) hook — runs after every successful `git commit`.
 *
 * Detects `done(<phase-id>):` commit messages and AUTO-UPDATES PROGRESS.md:
 *   1. Marks the matching phase ✅ done (was 🟡 in-progress).
 *   2. Sets Completed date to today.
 *   3. Appends the commit hash to the phase's Commits line.
 *
 * Also detects `wip(<phase-id>):` commit messages and ensures the phase
 * is marked 🟡 in-progress (idempotent — won't flip a ✅ back to 🟡).
 *
 * Hook input (stdin JSON): { tool_input: { command }, tool_response: { stdout, exit_code } }
 */

import { readFileSync, writeFileSync, execSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const PROGRESS_CANDIDATES = ['PROGRESS.md', 'REFACTOR_PROGRESS.md'];

// ── Parse stdin ──────────────────────────────────────────────────────────

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

// Only act on successful `git commit ...`.
if (!/^\s*git\s+commit\b/.test(command)) process.exit(0);
if (exitCode !== 0) process.exit(0);

// Confirm commit actually happened.
const looksCommitted = /\[\w+[\s-]*\(?[\w./-]*\)?\s+[a-f0-9]{7,}\]/.test(stdout)
  || /\d+\s+files?\s+changed/.test(stdout);
if (!looksCommitted) process.exit(0);

// Extract commit prefix: wip(<id>): or done(<id>):
const prefixMatch = command.match(/(?:^|\s)(wip|done)\(([A-Za-z0-9-]+)\):/);
if (!prefixMatch) process.exit(0);

const action = prefixMatch[1]; // "wip" or "done"
const phaseId = prefixMatch[2];

// ── Find PROGRESS.md ─────────────────────────────────────────────────────

let progressPath = null;
for (const name of PROGRESS_CANDIDATES) {
  const p = join(ROOT, name);
  try { readFileSync(p); progressPath = p; break; } catch {}
}
if (!progressPath) process.exit(0);

// ── Get current commit hash ──────────────────────────────────────────────

let hash = '';
try {
  hash = execSync('git rev-parse --short HEAD', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
} catch {
  process.exit(0);
}

// ── Read PROGRESS.md ─────────────────────────────────────────────────────

let body = readFileSync(progressPath, 'utf8');

// ── Find the phase block ─────────────────────────────────────────────────
// Phase headers look like: ### ⬜/🟡/✅ PHASE-ID — Title

const phaseHeaderPattern = new RegExp(
  `###\\s+[⬜🟡✅⛔⏭️]\\s+(${escapeRegex(phaseId)})\\s+—`,
  'i'
);
const phaseMatch = body.match(phaseHeaderPattern);

if (!phaseMatch) {
  // Phase not found in PROGRESS.md — warn but don't block.
  process.stderr.write(`[post-commit-update-progress] phase "${phaseId}" not found in ${progressPath}\n`);
  process.exit(0);
}

const phaseStartIdx = phaseMatch.index;

// Find the END of this phase block (next ### phase header, or end of file).
const nextPhaseIdx = body.indexOf('\n### ', phaseStartIdx + phaseMatch[0].length);
const phaseBlock = nextPhaseIdx === -1
  ? body.slice(phaseStartIdx)
  : body.slice(phaseStartIdx, nextPhaseIdx);

// ── Update the phase block ───────────────────────────────────────────────

let updatedBlock = phaseBlock;

if (action === 'done') {
  // Mark as done: 🟡 → ✅
  updatedBlock = updatedBlock.replace('🟡', '✅');

  // Set Completed date to today.
  const today = new Date().toISOString().slice(0, 10);
  updatedBlock = updatedBlock.replace(
    /(\*\*Completed:\*\*\s*).*/i,
    `$1${today}`
  );

  // Append commit hash to Commits line.
  if (updatedBlock.includes(hash)) {
    // Hash already present — skip.
  } else if (/\*\*Commits:\*\*\s*_hash/.test(updatedBlock)) {
    // First commit — replace placeholder.
    updatedBlock = updatedBlock.replace(
      /\*\*Commits:\*\*\s*_hash[^→]*/,
      `**Commits:** ${hash}`
    );
  } else if (/(\*\*Commits:\*\*\s*[^\n]*)/.test(updatedBlock)) {
    // Append to existing.
    updatedBlock = updatedBlock.replace(
      /(\*\*Commits:\*\*\s*[^\n]*)/,
      `$1 → ${hash}`
    );
  }

  // Update Last update line at top of file.
  body = body.replace(
    /\*\*Last update:\*\*\s*.*/i,
    `**Last update:** ${today} by Agent`
  );

  process.stderr.write(`[post-commit-update-progress] marked phase "${phaseId}" ✅ done\n`);
} else if (action === 'wip') {
  // Mark as in-progress — but only if currently ⬜ (don't flip ✅ back).
  if (updatedBlock.includes('⬜')) {
    updatedBlock = updatedBlock.replace('⬜', '🟡');
    // Set Started date if not already set.
    const today = new Date().toISOString().slice(0, 10);
    if (/\*\*Started:\*\*\s*_YYYY/.test(updatedBlock)) {
      updatedBlock = updatedBlock.replace(
        /\*\*Started:\*\*\s*_YYYY[^\n]*/,
        `**Started:** ${today}`
      );
    }
    process.stderr.write(`[post-commit-update-progress] marked phase "${phaseId}" 🟡 in-progress\n`);
  }

  // Always append hash to Commits on wip commits.
  if (!updatedBlock.includes(hash)) {
    if (/\*\*Commits:\*\*\s*_hash/.test(updatedBlock)) {
      updatedBlock = updatedBlock.replace(
        /\*\*Commits:\*\*\s*_hash[^→]*/,
        `**Commits:** ${hash}`
      );
    } else if (/(\*\*Commits:\*\*\s*[^\n]*)/.test(updatedBlock)) {
      updatedBlock = updatedBlock.replace(
        /(\*\*Commits:\*\*\s*[^\n]*)/,
        `$1 → ${hash}`
      );
    }
  }

  // Update Last update.
  const today = new Date().toISOString().slice(0, 10);
  body = body.replace(
    /\*\*Last update:\*\*\s*.*/i,
    `**Last update:** ${today} by Agent`
  );
}

// ── Reassemble and write ─────────────────────────────────────────────────

const before = body.slice(0, phaseStartIdx);
const after = nextPhaseIdx === -1 ? '' : body.slice(nextPhaseIdx);
body = before + updatedBlock + after;

// Update active phase line at top.
if (action === 'done') {
  // Check if any other phase is still 🟡.
  const stillActive = body.match(/### 🟡\s+([A-Za-z0-9-]+)/);
  if (stillActive) {
    body = body.replace(
      /\*\*Active phase:\*\*\s*.*/i,
      `**Active phase:** ${stillActive[1]} — in-progress`
    );
  } else {
    body = body.replace(
      /\*\*Active phase:\*\*\s*.*/i,
      '**Active phase:** _none_'
    );
  }
} else if (action === 'wip') {
  body = body.replace(
    /\*\*Active phase:\*\*\s*.*/i,
    `**Active phase:** ${phaseId} — in-progress`
  );
}

// Update Last commit.
body = body.replace(
  /\*\*Last commit:\*\*\s*.*/i,
  `**Last commit:** ${hash}`
);

writeFileSync(progressPath, body, 'utf8');

// ── Auto-commit the PROGRESS.md update ───────────────────────────────────

try {
  execSync(`git add "${progressPath}"`, { stdio: 'ignore', cwd: ROOT });
  const msg = action === 'done'
    ? `done(${phaseId}): mark phase complete in PROGRESS.md`
    : `wip(${phaseId}): update PROGRESS.md commit tracking`;
  execSync(`git commit -m "${msg}"`, { stdio: 'ignore', cwd: ROOT });
  process.stderr.write(`[post-commit-update-progress] auto-committed ${progressPath} update\n`);
} catch {
  // Non-blocking — PROGRESS.md is updated on disk, commit can happen next cycle.
  process.stderr.write('[post-commit-update-progress] PROGRESS.md updated but auto-commit failed (will retry)\n');
}

process.exit(0);

// ── Helpers ──────────────────────────────────────────────────────────────

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
