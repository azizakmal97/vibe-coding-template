#!/usr/bin/env node
/**
 * Make sure the project's .gitignore has every line the template requires.
 *
 * The single list of required ignore lines. setup.sh, setup.ps1 and
 * /update-template all run this script, so a line added here reaches new AND
 * existing projects. The old setup only appended its block when .gitignore had
 * no ".env" line, so anything added later never reached a project that already
 * had one (found in omfs-game: graphify-out/ was never ignored).
 *
 * Appends only the missing lines, under their group comment. Never removes,
 * reorders or edits the project's own lines. Idempotent.
 *
 * Prints each added line, so the caller can show the user what changed.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const GITIGNORE = join(process.cwd(), '.gitignore');

const REQUIRED_GROUPS = [
  { comment: '# Secrets — never commit these', lines: ['.env', '.env.*', '!.env.example'] },
  { comment: '# Claude Code local settings', lines: ['.claude/settings.local.json', '.claude/db-backups/'] },
  { comment: '# E2E (Playwright) artifacts', lines: ['e2e/.auth/', 'playwright-report/', 'test-results/'] },
  { comment: '# Build outputs', lines: ['dist/', 'build/', '.next/', '.vite/'] },
  { comment: '# Graphify knowledge graph (rebuilt locally by scripts/graphify-rebuild.py)', lines: ['graphify-out/', '.graphify_*'] },
  { comment: '# OS', lines: ['.DS_Store', 'Thumbs.db'] },
];

// `/dist`, `dist` and `dist/` ignore the same folder for our purposes.
function normalize(line) {
  return line.trim().replace(/^\//, '').replace(/\/$/, '');
}

// Lines this group must append. A negation (`!.env.example`) only works below
// the pattern it carves out of, so when an earlier line in its group gets
// appended, the negation is appended again after it even if it already exists.
function missingLines(group, present) {
  const toAdd = [];
  for (const line of group.lines) {
    const isNegation = line.startsWith('!');
    if (!present.has(normalize(line)) || (isNegation && toAdd.length > 0)) toAdd.push(line);
  }
  return toAdd;
}

const existing = existsSync(GITIGNORE) ? readFileSync(GITIGNORE, 'utf8') : '';
const eol = existing.includes('\r\n') ? '\r\n' : '\n';
const present = new Set(existing.split(/\r?\n/).map(normalize).filter(Boolean));

const blocks = [];
const added = [];
for (const group of REQUIRED_GROUPS) {
  const toAdd = missingLines(group, present);
  if (toAdd.length === 0) continue;
  blocks.push([group.comment, ...toAdd].join(eol));
  added.push(...toAdd);
}

if (added.length === 0) {
  console.log('  ~ .gitignore already has every required line');
  process.exit(0);
}

const separator = existing === '' ? '' : existing.endsWith(eol) ? eol : eol + eol;
writeFileSync(GITIGNORE, existing + separator + blocks.join(eol + eol) + eol);

console.log(existing === '' ? '  + .gitignore created' : '  + .gitignore updated, added:');
if (existing !== '') for (const line of added) console.log(`      ${line}`);
