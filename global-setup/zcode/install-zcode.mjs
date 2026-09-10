#!/usr/bin/env node
/**
 * Global ZCode setup — the ZCode twin of `setup.ps1`'s Claude Code install.
 *
 * Installs, into ~/.zcode/:
 *   AGENTS.md              the global brain ZCode loads in every workspace —
 *                          global-setup/CLAUDE.md plus the ZCode addendum, so the
 *                          two agents share one source and cannot drift
 *   hooks/zcode-hook.mjs   the adapter that runs a project's .claude/hooks/* scripts
 *   cli/config.json        hook registrations pointing at that adapter (merged in)
 *
 * Registering the hooks globally is not a preference — ZCode ignores any `hooks`
 * block in a workspace config, so per-project hooks have to come from here or from
 * a plugin. The adapter finds the project itself from the hook payload and skips
 * scripts a project does not have, so one registration covers every repo.
 *
 * Run from the template repo root:
 *   node global-setup/zcode/install-zcode.mjs
 *
 * Safe to re-run. Existing files are backed up as `.bak`; unrelated keys in
 * config.json are preserved.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE_DIR = dirname(fileURLToPath(import.meta.url));
const ZCODE_DIR = join(homedir(), '.zcode');
const HOOKS_DIR = join(ZCODE_DIR, 'hooks');
const CONFIG_PATH = join(ZCODE_DIR, 'cli', 'config.json');
const ADAPTER_PATH = join(HOOKS_DIR, 'zcode-hook.mjs');

/**
 * Project-relative script paths, resolved per session against the workspace the
 * hook payload reports. Mirrors `.claude/settings.json` in the template.
 */
const HOOK_EVENTS = {
  SessionStart: [
    { scripts: ['.claude/hooks/session-start-resume.js', 'scripts/graphify-bootstrap.mjs'] },
  ],
  PreToolUse: [
    { matcher: 'Edit|Write|MultiEdit', scripts: ['.claude/hooks/config-protection.cjs'] },
    {
      matcher: 'Bash|Shell|Terminal|RunCommand',
      scripts: [
        '.claude/hooks/validate-command.js',
        '.claude/hooks/pre-db-migrate.cjs',
        '.claude/hooks/pre-commit-checkpoint.js',
      ],
    },
  ],
  PostToolUse: [
    {
      matcher: 'Edit|Write',
      scripts: ['.claude/hooks/post-edit-check.cjs', '.claude/hooks/check-file-size.js'],
    },
    {
      matcher: 'Bash|Shell|Terminal|RunCommand',
      scripts: ['.claude/hooks/post-commit-push.js', '.claude/hooks/post-commit-update-progress.js'],
    },
  ],
};

main();

function main() {
  console.log('\nVibe Coding Template — Global ZCode Setup');
  console.log(`Installing to: ${ZCODE_DIR}\n`);

  mkdirSync(HOOKS_DIR, { recursive: true });
  mkdirSync(dirname(CONFIG_PATH), { recursive: true });

  // Parse before writing anything, so a config we cannot read aborts the whole
  // install rather than leaving half of it applied.
  const config = readConfig();

  writeGlobalBrain();
  install(join(SOURCE_DIR, 'hooks', 'zcode-hook.mjs'), ADAPTER_PATH, '~/.zcode/hooks/zcode-hook.mjs');
  mergeHookConfig(config);

  console.log('\nDone. Restart ZCode, then:');
  console.log('  1. Settings -> Model Providers      # connect your GLM Coding Plan');
  console.log('  2. Open a project and ask the agent to run: psql -c "DROP TABLE users"');
  console.log('     A working install answers with 🛑 BLOCKED, not with the command.');
  console.log('  3. If nothing blocks, see template/.zcode/README.md -> Known caveats.\n');
}

/**
 * ZCode's global rules file is the Claude Code global brain plus a ZCode addendum.
 * Composing at install time means the cross-project rules live in exactly one file.
 */
function writeGlobalBrain() {
  const brainPath = resolve(SOURCE_DIR, '..', 'CLAUDE.md');
  const addendumPath = join(SOURCE_DIR, 'AGENTS.addendum.md');
  const dest = join(ZCODE_DIR, 'AGENTS.md');

  if (!existsSync(brainPath) || !existsSync(addendumPath)) {
    console.log('  [SKIP] ~/.zcode/AGENTS.md — global-setup/CLAUDE.md or the addendum is missing');
    return;
  }

  const composed = [
    '<!-- COMPOSED by global-setup/zcode/install-zcode.mjs from global-setup/CLAUDE.md',
    '     + global-setup/zcode/AGENTS.addendum.md. Edit those, then re-run the installer. -->',
    '',
    readFileSync(brainPath, 'utf8').trimEnd(),
    '',
    readFileSync(addendumPath, 'utf8').trimEnd(),
    '',
  ].join('\n');

  if (existsSync(dest)) {
    copyFileSync(dest, `${dest}.bak`);
    console.log('  backed up existing ~/.zcode/AGENTS.md -> AGENTS.md.bak');
  }
  writeFileSync(dest, composed, 'utf8');
  console.log('  [OK] ~/.zcode/AGENTS.md (global brain + ZCode addendum)');
}

function install(src, dest, label) {
  if (!existsSync(src)) {
    console.log(`  [SKIP] ${label} — source missing at ${src}`);
    return;
  }
  if (existsSync(dest)) {
    copyFileSync(dest, `${dest}.bak`);
    console.log(`  backed up existing ${label} -> ${label}.bak`);
  }
  copyFileSync(src, dest);
  console.log(`  [OK] ${label}`);
}

/**
 * Rewrites only the events this template owns, leaving every other key in the file
 * untouched. Ownership is decided by the adapter path, so a hand-added hook of the
 * user's own survives a re-run.
 */
function mergeHookConfig(config) {
  const hooks = (config.hooks ??= {});
  hooks.enabled ??= true;
  const events = (hooks.events ??= {});

  for (const [event, groups] of Object.entries(HOOK_EVENTS)) {
    const foreign = (events[event] || []).filter((group) => !isOurs(group));
    events[event] = [...foreign, ...groups.map(toGroup)];
  }

  if (existsSync(CONFIG_PATH)) copyFileSync(CONFIG_PATH, `${CONFIG_PATH}.bak`);
  writeFileSync(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  console.log(`  [OK] ~/.zcode/cli/config.json (${Object.keys(HOOK_EVENTS).length} events wired)`);
}

function readConfig() {
  if (!existsSync(CONFIG_PATH)) return {};
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf8') || '{}');
  } catch (err) {
    // Overwriting a config we cannot parse would silently drop the user's settings.
    console.error(`\nERROR: ${CONFIG_PATH} is not valid JSON (${err.message}).`);
    console.error('Fix or move that file, then re-run. Nothing was changed.\n');
    process.exit(1);
  }
}

function toGroup({ matcher, scripts }) {
  return {
    ...(matcher ? { matcher } : {}),
    hooks: [
      {
        type: 'process',
        command: 'node',
        args: [ADAPTER_PATH, ...scripts],
        enabled: true,
      },
    ],
  };
}

function isOurs(group) {
  return (group?.hooks || []).some((hook) => (hook?.args || []).includes(ADAPTER_PATH));
}
