#!/usr/bin/env node
/**
 * Initialize PROGRESS.md with first phase scaffold if it doesn't already exist
 * (the template ships a generic PROGRESS.md; this only patches the active-phase
 * header so a fresh project starts cleanly).
 *
 * Idempotent.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const PROGRESS = join(ROOT, 'PROGRESS.md');

if (!existsSync(PROGRESS)) {
  console.log('[init-progress] PROGRESS.md missing. Was the template copied? Skipping.');
  process.exit(0);
}

const today = new Date().toISOString().slice(0, 10);
let body = readFileSync(PROGRESS, 'utf8');

body = body
  .replace(/\*\*Active phase:\*\* .*/m, '**Active phase:** `INIT-P00` — Project bootstrap (🟡 in-progress)')
  .replace(/\*\*Last update:\*\* .*/m, `**Last update:** ${today} by setup script`)
  .replace(/\*\*Last commit:\*\* .*/m, '**Last commit:** _none yet_');

if (!body.includes('### 🟡 INIT-P00')) {
  body += `\n\n### 🟡 INIT-P00 — Project bootstrap\n\n**Status:** in-progress\n**Started:** ${today}\n**Completed:** _pending_\n**Commits:** _pending_\n\n**Plan for this phase:**\n- [ ] Fill all [BRACKETED] sections in CLAUDE.md\n- [ ] Install dependencies (\`npm install\` / \`flutter pub get\` / \`cargo build\` per preset)\n- [ ] Run dev server, verify it boots\n- [ ] First feature scaffold\n- [ ] First test\n- [ ] First commit with proper message format\n\n**Delivered:**\n- _pending_\n\n**Verified:**\n- _pending_\n\n**Rollback:**\n- \`git checkout -- .\` (no commits yet)\n`;
}

writeFileSync(PROGRESS, body);
console.log('[init-progress] PROGRESS.md initialised with INIT-P00.');
