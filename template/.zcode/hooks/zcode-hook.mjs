#!/usr/bin/env node
/**
 * ZCode -> Claude Code hook adapter.
 *
 * ZCode and Claude Code share a hook contract (one JSON line on stdin, exit 2 to
 * block, stderr as the block reason) but differ in three ways that matter:
 *
 *   1. ZCode ignores `hooks` in a workspace config, so every project hook has to be
 *      registered once from `~/.zcode/cli/config.json` (or a plugin) and then find
 *      the right project itself. This adapter does that using the payload's `cwd`.
 *   2. ZCode reads stdout only when it is JSON; Claude Code accepts plain text and
 *      injects it as context. This adapter wraps plain text into ZCode's
 *      `hookSpecificOutput.additionalContext` shape.
 *   3. Tool-input keys are not guaranteed to match. This adapter normalises the
 *      command / file-path fields so the unmodified `.claude/hooks/*` scripts read
 *      them the same way they do under Claude Code.
 *
 * Usage (from a hooks config):
 *   node zcode-hook.mjs .claude/hooks/validate-command.js .claude/hooks/pre-db-migrate.cjs
 *
 * Scripts run in the listed order against the project root. A script the project
 * does not have is skipped — the same adapter serves projects built from any
 * version of the template.
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';

const BLOCK = 2;

const scripts = process.argv.slice(2);
if (scripts.length === 0) {
  process.stderr.write('[zcode-hook] no hook scripts given; nothing to run.\n');
  process.exit(0);
}

const raw = await readStdin();
const payload = parseJson(raw) ?? {};
const projectRoot = resolveProjectRoot(payload);
const eventName = payload.hook_event_name || payload.hookEventName || '';
const forwarded = JSON.stringify(normalise(payload));

const contextChunks = [];

for (const script of scripts) {
  const scriptPath = isAbsolute(script) ? script : resolve(projectRoot, script);
  if (!existsSync(scriptPath)) continue;

  const result = spawnSync(process.execPath, [scriptPath], {
    input: forwarded,
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'inherit'], // stderr straight through: it is the block reason
  });

  // Exit 2 is the shared "deny" signal. Stop at the first block so the reason the
  // user sees is the rule that actually fired. Stderr carries that reason; anything
  // the script put on stdout joins it there rather than being dropped.
  if (result.status === BLOCK) {
    const report = (result.stdout || '').trim();
    if (report) process.stderr.write(`${report}\n`);
    process.exit(BLOCK);
  }

  if (result.status !== 0) {
    process.stderr.write(`[zcode-hook] ${script} exited ${result.status}; continuing.\n`);
    continue;
  }

  const text = (result.stdout || '').trim();
  if (text) contextChunks.push(text);
}

// No explicit exit(0): let stdout drain before the process ends.
emit(contextChunks);

// ── helpers ─────────────────────────────────────────────────────────────────

function readStdin() {
  return new Promise((done) => {
    let buf = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => (buf += chunk));
    process.stdin.on('end', () => done(buf));
    process.stdin.on('error', () => done(''));
  });
}

function parseJson(text) {
  try {
    return JSON.parse(text || '{}');
  } catch {
    return null;
  }
}

/**
 * ZCode reports the workspace as `cwd` in the payload. Fall back to the plugin /
 * Claude project env vars, then to the adapter's own working directory.
 */
function resolveProjectRoot(payload) {
  const candidates = [
    payload.cwd,
    payload.workspace,
    process.env.ZCODE_PROJECT_DIR,
    process.env.CLAUDE_PROJECT_DIR,
    process.cwd(),
  ];
  return candidates.find((dir) => typeof dir === 'string' && dir.length > 0 && existsSync(dir)) || process.cwd();
}

/**
 * The `.claude/hooks/*` scripts read `tool_input.command` and `tool_input.file_path`.
 * Copy whichever alias ZCode sent into those keys so the hooks stay agent-agnostic.
 */
function normalise(payload) {
  const out = { ...payload };
  const input = { ...(out.tool_input || out.toolInput || {}) };

  const command = firstString(input.command, input.cmd, input.script, input.shell_command, out.command);
  if (command) input.command = command;

  const filePath = firstString(input.file_path, input.filePath, input.path, input.file);
  if (filePath) input.file_path = filePath;

  out.tool_input = input;
  out.tool_name = out.tool_name || out.toolName || '';
  out.tool_response = out.tool_response || out.toolResponse || {};
  return out;
}

function firstString(...values) {
  return values.find((value) => typeof value === 'string' && value.length > 0) || '';
}

/**
 * Claude Code hooks print plain text; ZCode only reads stdout that is JSON. Wrap it
 * unless a script already emitted JSON, in which case it knows what it is doing —
 * only one object can go on stdout, so anything else is reported rather than dropped.
 */
function emit(chunks) {
  if (chunks.length === 0) return;

  const passthrough = chunks.find((chunk) => chunk.startsWith('{'));
  if (passthrough) {
    const dropped = chunks.filter((chunk) => chunk !== passthrough);
    if (dropped.length > 0) {
      process.stderr.write(`[zcode-hook] a hook returned JSON; other output follows:\n${dropped.join('\n\n')}\n`);
    }
    process.stdout.write(passthrough);
    return;
  }
  // Without the event name there is no valid wrapper to put the text in, so send it
  // where it will still be seen rather than discarding it.
  if (!eventName) {
    process.stderr.write(`${chunks.join('\n\n')}\n`);
    return;
  }

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: eventName,
        additionalContext: chunks.join('\n\n'),
      },
    }),
  );
}
