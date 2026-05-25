#!/usr/bin/env node
/**
 * Single-source rule sync.
 *
 * AGENTS.md is the canonical rule source. This script regenerates the
 * tool-specific shim files from it so they never drift:
 *
 *   .cursorrules                      (Cursor — legacy, plain text)
 *   .cursor/rules/project.mdc         (Cursor — modern Project Rules, frontmatter)
 *   .windsurfrules                    (Windsurf)
 *   .github/copilot-instructions.md   (GitHub Copilot)
 *
 * Run after editing AGENTS.md:
 *   node scripts/sync-agent-rules.mjs
 *
 * Idempotent. Never hand-edit the generated files — your changes will be lost.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'AGENTS.md');

if (!existsSync(SRC)) {
  console.error('[sync-agent-rules] AGENTS.md not found at repo root. Aborting.');
  process.exit(1);
}

const body = readFileSync(SRC, 'utf8').trimEnd();

const GENERATED_NOTE =
  'GENERATED FROM AGENTS.md by scripts/sync-agent-rules.mjs — DO NOT EDIT. Edit AGENTS.md and re-run.';

const targets = [
  {
    path: join(ROOT, '.cursorrules'),
    content: `# ${GENERATED_NOTE}\n\n${body}\n`,
  },
  {
    path: join(ROOT, '.cursor', 'rules', 'project.mdc'),
    content:
      `---\n` +
      `description: Project-wide engineering rules (canonical source: AGENTS.md)\n` +
      `globs: ["**/*"]\n` +
      `alwaysApply: true\n` +
      `---\n\n` +
      `<!-- ${GENERATED_NOTE} -->\n\n${body}\n`,
  },
  {
    path: join(ROOT, '.windsurfrules'),
    content: `<!-- ${GENERATED_NOTE} -->\n\n${body}\n`,
  },
  {
    path: join(ROOT, '.github', 'copilot-instructions.md'),
    content: `<!-- ${GENERATED_NOTE} -->\n\n${body}\n`,
  },
];

for (const { path, content } of targets) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, { encoding: 'utf8' });
  console.log(`[sync-agent-rules] wrote ${path.replace(ROOT, '.')}`);
}

console.log('[sync-agent-rules] done. Shims regenerated from AGENTS.md.');
