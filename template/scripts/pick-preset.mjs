#!/usr/bin/env node
/**
 * Interactive preset picker. Called by setup.sh / setup.ps1.
 *
 * Asks "what kind of app?", then:
 *  - copies template/presets/<choice>/CLAUDE.md          → project CLAUDE.md
 *  - copies template/presets/<choice>/file-budgets.json  → project file-budgets.json
 *  - copies template/presets/<choice>/commands.json      → project .claude/commands.json
 *  - copies template/.github/workflows/ci-<choice>.yml   → project .github/workflows/ci.yml
 *  - (web / fullstack only) copies template/e2e-scaffold/* → project root + e2e/
 *
 * Usage:
 *   node scripts/pick-preset.mjs            # interactive
 *   node scripts/pick-preset.mjs web        # non-interactive, pick "web"
 *
 * Presets: web | mobile | desktop | fullstack
 */

import { existsSync, mkdirSync, copyFileSync, readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_ROOT = resolve(SCRIPT_DIR, '..');
const PROJECT_ROOT = process.cwd();

const PRESETS = ['web', 'mobile', 'desktop', 'fullstack', 'generic'];
const PRESET_DESC = {
  web: 'React + Vite + TypeScript + Tailwind + Vitest + Playwright',
  mobile: 'Flutter (Dart) — iOS/Android cross-platform',
  desktop: 'Tauri (Rust + React) — Windows/macOS/Linux native',
  fullstack: 'Next.js + Prisma + PostgreSQL + Vitest',
  generic: 'No stack assumptions — docs, guides, hardware, research, automation, or anything else',
};

const CI_MAP = {
  web: 'ci-web.yml',
  mobile: 'ci-flutter.yml',
  desktop: 'ci-tauri.yml',
  fullstack: 'ci-fullstack.yml',
  // generic: no CI workflow — project defines its own if needed
};

// Presets that get the standard Playwright scaffold (chromium + `npm run dev`).
// mobile uses Flutter integration_test; desktop uses Playwright-via-tauri-driver
// (a different wiring) — both opt out of this scaffold.
const PLAYWRIGHT_PRESETS = new Set(['web', 'fullstack']);

async function pick(argv) {
  let choice = argv[0];
  if (!choice) {
    const rl = createInterface({ input: stdin, output: stdout });
    console.log('\nPick project type:');
    PRESETS.forEach((p, i) => console.log(`  ${i + 1}. ${p.padEnd(10)} ${PRESET_DESC[p]}`));
    const ans = (await rl.question('\nEnter number or name [1]: ')).trim() || '1';
    rl.close();
    const n = Number(ans);
    choice = Number.isInteger(n) && n >= 1 && n <= PRESETS.length ? PRESETS[n - 1] : ans;
  }
  if (!PRESETS.includes(choice)) {
    console.error(`[pick-preset] unknown preset "${choice}". Valid: ${PRESETS.join(', ')}`);
    process.exit(1);
  }
  return choice;
}

function copyIfExists(from, to) {
  if (!existsSync(from)) {
    console.warn(`[pick-preset] missing source: ${from}`);
    return false;
  }
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
  console.log(`[pick-preset] ${from} → ${to}`);
  return true;
}

const choice = await pick(process.argv.slice(2));
const presetDir = join(TEMPLATE_ROOT, 'presets', choice);

copyIfExists(join(presetDir, 'CLAUDE.md'), join(PROJECT_ROOT, 'CLAUDE.md'));
copyIfExists(join(presetDir, 'file-budgets.json'), join(PROJECT_ROOT, 'file-budgets.json'));
copyIfExists(join(presetDir, 'commands.json'), join(PROJECT_ROOT, '.claude', 'commands.json'));

const ciSrc = CI_MAP[choice] ? join(TEMPLATE_ROOT, '.github', 'workflows', CI_MAP[choice]) : null;
if (ciSrc) {
  copyIfExists(ciSrc, join(PROJECT_ROOT, '.github', 'workflows', 'ci.yml'));
}

// Playwright E2E scaffold (web / fullstack / desktop only). auth.setup.ts ships
// as a .template — the project fills in its login before the suite can run.
if (PLAYWRIGHT_PRESETS.has(choice)) {
  const scaffoldDir = join(TEMPLATE_ROOT, 'e2e-scaffold');
  copyIfExists(join(scaffoldDir, 'playwright.config.ts'), join(PROJECT_ROOT, 'playwright.config.ts'));
  copyIfExists(join(scaffoldDir, 'e2e', 'auth.setup.ts.template'), join(PROJECT_ROOT, 'e2e', 'auth.setup.ts.template'));
  copyIfExists(join(scaffoldDir, 'e2e', 'example.spec.ts'), join(PROJECT_ROOT, 'e2e', 'example.spec.ts'));
  copyIfExists(join(scaffoldDir, 'e2e', 'README.md'), join(PROJECT_ROOT, 'e2e', 'README.md'));
  console.log('[pick-preset] e2e scaffold copied — fill in e2e/auth.setup.ts (see e2e/README.md).');
}

console.log(`\n[pick-preset] preset "${choice}" applied. Edit CLAUDE.md to fill project-specific blanks.`);
