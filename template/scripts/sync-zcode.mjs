#!/usr/bin/env node
/**
 * Mirrors the Claude Code project config into the ZCode layout.
 *
 * ZCode reads AGENTS.md directly, so rules need no mirroring — but it looks for
 * commands, subagents, skills and hooks in its own places and with its own
 * frontmatter dialect. This regenerates all four from `.claude/` so the two
 * agents can never drift apart:
 *
 *   .claude/commands/*.md        ->  .zcode/commands/*.md
 *   .claude/agents/*.md          ->  .zcode/agents/*.md      (model: inherit)
 *   .claude/skills/<n>/SKILL.md  ->  .zcode/skills/<n>/SKILL.md
 *   .claude/settings.json hooks  ->  .zcode/hooks/hooks.json (via the ZCode adapter)
 *
 * Run directly, or let `scripts/sync-agent-rules.mjs` call it:
 *   node scripts/sync-zcode.mjs
 *
 * Idempotent. Never hand-edit anything under `.zcode/` except `config.json`.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const GENERATED_NOTE =
  'GENERATED from .claude/ by scripts/sync-zcode.mjs — DO NOT EDIT. Edit the .claude/ source and re-run.';

/** ZCode's hook events. Claude events with no counterpart are dropped, not faked. */
const SUPPORTED_EVENTS = new Set([
  'SessionStart',
  'UserPromptSubmit',
  'PreToolUse',
  'PermissionRequest',
  'PostToolUse',
  'PostToolUseFailure',
  'Stop',
]);

/**
 * ZCode's shell tool name is not pinned in its docs the way `Write` and `Edit` are,
 * so a Bash matcher is widened to the plausible names. A ZCode matcher of bare
 * names joined by `|` is an exact name list, so the extra names cost nothing.
 */
const TOOL_ALIASES = { Bash: 'Bash|Shell|Terminal|RunCommand' };

export function syncZcode(root) {
  if (!existsSync(join(root, '.claude'))) {
    return { written: [], notes: ['no .claude/ directory — nothing to mirror'] };
  }

  const notes = [];
  const written = [...mirrorCommands(root), ...mirrorAgents(root), ...mirrorSkills(root)];

  const hooksFile = writeHooksConfig(root, notes);
  if (hooksFile) written.push(hooksFile);

  return { written, notes };
}

function mirrorCommands(root) {
  // Command bodies reference `.claude/rules/*` by path; those files ship with the
  // project and ZCode reads them fine, so only the generated header is added.
  return mirrorMarkdown(join(root, '.claude', 'commands'), join(root, '.zcode', 'commands'), render);
}

function mirrorAgents(root) {
  return mirrorMarkdown(join(root, '.claude', 'agents'), join(root, '.zcode', 'agents'), (frontmatter, body) => {
    // Claude model ids mean nothing to a GLM provider; follow the primary agent.
    const rebased = frontmatter.filter((line) => !/^model\s*:/i.test(line));
    rebased.push('model: inherit');
    return render(rebased, body);
  });
}

function mirrorSkills(root) {
  const src = join(root, '.claude', 'skills');
  const dest = join(root, '.zcode', 'skills');
  if (!existsSync(src)) return [];

  resetDir(dest);
  const written = [];
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const skillFile = join(src, entry.name, 'SKILL.md');
    if (!existsSync(skillFile)) continue;

    const { frontmatter, body } = splitFrontmatter(readFileSync(skillFile, 'utf8'));
    // ZCode needs only name + description; `auto` / `user-invocable` are Claude-only.
    const kept = frontmatter.filter((line) => /^(name|description)\s*:/i.test(line));
    const target = join(dest, entry.name, 'SKILL.md');
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, render(kept, body), 'utf8');
    written.push(target);
  }
  return written;
}

function mirrorMarkdown(src, dest, transform) {
  if (!existsSync(src)) return [];
  resetDir(dest);

  const written = [];
  for (const file of readdirSync(src)) {
    if (!file.endsWith('.md')) continue;
    const { frontmatter, body } = splitFrontmatter(readFileSync(join(src, file), 'utf8'));
    const target = join(dest, file);
    writeFileSync(target, transform(frontmatter, body), 'utf8');
    written.push(target);
  }
  return written;
}

/**
 * Rebuilds `.zcode/hooks/hooks.json` from `.claude/settings.json` so one hook list
 * drives both agents. Every entry runs through `hooks/zcode-hook.mjs`, which locates
 * the project from the payload and translates the two dialects.
 */
function writeHooksConfig(root, notes) {
  const settingsPath = join(root, '.claude', 'settings.json');
  if (!existsSync(settingsPath)) {
    notes.push('no .claude/settings.json — hooks.json not regenerated');
    return null;
  }

  let claudeHooks;
  try {
    claudeHooks = JSON.parse(readFileSync(settingsPath, 'utf8')).hooks || {};
  } catch (err) {
    notes.push(`.claude/settings.json is not valid JSON (${err.message}) — hooks.json not regenerated`);
    return null;
  }

  const events = {};
  for (const [event, groups] of Object.entries(claudeHooks)) {
    if (!SUPPORTED_EVENTS.has(event)) {
      notes.push(`skipped ${event} — ZCode has no such hook event`);
      continue;
    }
    const mapped = groups.map((group) => toZcodeGroup(group, notes)).filter(Boolean);
    if (mapped.length > 0) events[event] = mapped;
  }

  const target = join(root, '.zcode', 'hooks', 'hooks.json');
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify({ _generated: GENERATED_NOTE, events }, null, 2)}\n`, 'utf8');
  return target;
}

function toZcodeGroup(group, notes) {
  const scripts = [];
  for (const hook of group.hooks || []) {
    const script = nodeScriptPath(hook.command);
    if (script) scripts.push(script);
    else notes.push(`skipped hook command "${hook.command}" — the adapter only runs node scripts`);
  }
  if (scripts.length === 0) return null;

  const matcher = group.matcher && group.matcher !== '*' ? TOOL_ALIASES[group.matcher] || group.matcher : '';
  return {
    ...(matcher ? { matcher } : {}),
    hooks: [
      {
        type: 'process',
        command: 'node',
        args: ['${CLAUDE_PLUGIN_ROOT}/hooks/zcode-hook.mjs', ...scripts],
        enabled: true,
      },
    ],
  };
}

/** `node .claude/hooks/x.js` -> `.claude/hooks/x.js`; anything else -> null. */
function nodeScriptPath(command) {
  const match = /^node\s+["']?(.+?)["']?$/.exec((command || '').trim());
  return match ? match[1] : null;
}

function splitFrontmatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!match) return { frontmatter: [], body: text.trim() };
  return { frontmatter: match[1].split(/\r?\n/).filter(Boolean), body: text.slice(match[0].length).trim() };
}

function render(frontmatter, body) {
  const head = frontmatter.length > 0 ? `---\n${frontmatter.join('\n')}\n---\n\n` : '';
  return `${head}<!-- ${GENERATED_NOTE} -->\n\n${body}\n`;
}

/** Generated dirs are rebuilt, not merged — a deleted source must not linger here. */
function resetDir(dir) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const { written, notes } = syncZcode(root);
  for (const note of notes) console.warn(`[sync-zcode] ${note}`);
  for (const file of written) console.log(`[sync-zcode] wrote ${file.replace(root, '.')}`);
  console.log(`[sync-zcode] done. ${written.length} files regenerated from .claude/.`);
}
