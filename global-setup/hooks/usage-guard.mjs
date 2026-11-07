#!/usr/bin/env node
/**
 * UserPromptSubmit hook: protects the owner's sleep and plan limit.
 *
 * Stops new messages from 11:30pm to 6am, and tells the agent when a chat is too
 * long, too many chats are open, or the weekly pace needs a check. Only the
 * owner's own chats are touched: a night job must never be blocked, so anything
 * that cannot be identified as attended goes through.
 */

import { closeSync, existsSync, openSync, readFileSync, readdirSync, readSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const STOP_MINUTE = 23 * 60 + 30;
const START_MINUTE = 6 * 60;
// /close saves the day's work, so stopping it at night would defeat the point.
const ALLOWED_AT_NIGHT = /^\s*(urgent\b|\/close\b)/i;
const FRESH_CHAT_TOKENS = 200_000;
const MAX_OPEN_CHATS = 3;
const OPEN_CHAT_WINDOW_MS = 15 * 60 * 1000;
const PACE_CHECK_EVERY_MS = 4 * 60 * 60 * 1000;
const TRANSCRIPT_TAIL_BYTES = 512 * 1024;
// The first entrypoint field sits about 4.5 KB into a transcript, after the setup lines.
const TRANSCRIPT_HEAD_BYTES = 16 * 1024;

const claudeDir = join(homedir(), '.claude');
const projectsDir = join(claudeDir, 'projects');
const statePath = join(claudeDir, '.usage-guard.json');

export const BLOCK_MESSAGE = `It's past 11:30pm, so Claude has stopped new work until 6am. Time to sleep.
Night jobs still run, and /close still works. If this really can't wait, start your message with the word urgent.`;

export function isQuietHours(now) {
  const minute = now.getHours() * 60 + now.getMinutes();
  return minute >= STOP_MINUTE || minute < START_MINUTE;
}

// Scheduled jobs start from a clean environment and report sdk-cli. A desktop
// session that nobody is attending must pass too, so desktop needs the attended flag.
export function isOwnerChat(env) {
  if (env.CLAUDE_CODE_ENTRYPOINT === 'cli') return true;
  return env.CLAUDE_CODE_ENTRYPOINT === 'claude-desktop' && env.CLAUDE_CODE_SESSION_ATTENDED === '1';
}

export function shouldBlock({ now, env, prompt }) {
  if (!isOwnerChat(env) || !isQuietHours(now)) return false;
  // Messages from the app and from other sessions arrive wrapped in a tag.
  if (prompt.trimStart().startsWith('<')) return false;
  return !ALLOWED_AT_NIGHT.test(prompt);
}

function readBytes(path, start, length) {
  const buffer = Buffer.alloc(length);
  const handle = openSync(path, 'r');
  try {
    return buffer.toString('utf8', 0, readSync(handle, buffer, 0, length, start));
  } finally {
    closeSync(handle);
  }
}

export function lastContextTokens(transcriptPath) {
  if (!transcriptPath || !existsSync(transcriptPath)) return 0;
  const size = statSync(transcriptPath).size;
  const start = Math.max(0, size - TRANSCRIPT_TAIL_BYTES);
  const lines = readBytes(transcriptPath, start, size - start).split('\n').reverse();
  for (const line of lines) {
    if (!line.includes('"usage"') || !line.includes('"assistant"')) continue;
    try {
      const usage = JSON.parse(line).message?.usage;
      if (!usage) continue;
      const tokens = (usage.input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0) + (usage.cache_creation_input_tokens ?? 0);
      if (tokens > 0) return tokens;
    } catch {
      // The tail read can start in the middle of a line; the next one is whole.
    }
  }
  return 0;
}

export function isOwnerTranscript(transcriptHead) {
  return /"entrypoint":"(cli|claude-desktop)"/.test(transcriptHead);
}

function countOtherOpenChats(sessionId, now) {
  let openChats = 0;
  for (const folder of readdirSync(projectsDir, { withFileTypes: true })) {
    if (!folder.isDirectory()) continue;
    const folderPath = join(projectsDir, folder.name);
    for (const fileName of readdirSync(folderPath)) {
      if (!fileName.endsWith('.jsonl') || fileName === `${sessionId}.jsonl`) continue;
      const filePath = join(folderPath, fileName);
      if (now.getTime() - statSync(filePath).mtimeMs > OPEN_CHAT_WINDOW_MS) continue;
      if (isOwnerTranscript(readBytes(filePath, 0, TRANSCRIPT_HEAD_BYTES))) openChats += 1;
    }
  }
  return openChats;
}

function paceCheckIsDue(now) {
  const state = existsSync(statePath) ? JSON.parse(readFileSync(statePath, 'utf8')) : {};
  if (now.getTime() - (state.lastPaceCheck ?? 0) < PACE_CHECK_EVERY_MS) return false;
  writeFileSync(statePath, JSON.stringify({ ...state, lastPaceCheck: now.getTime() }));
  return true;
}

function collectNotices({ payload, env, now }) {
  const notices = [];
  const contextTokens = lastContextTokens(payload.transcript_path);
  if (contextTokens > FRESH_CHAT_TOKENS) {
    notices.push(`This chat is ${Math.round(contextTokens / 1000)}k long, past the 200k limit. Never stop mid-task for this. When the current task is finished and checked, end that reply with one line telling the owner this is a good moment to run /close and open a fresh chat. If work is still going, say how much is left before that moment.`);
  }
  const openChats = countOtherOpenChats(payload.session_id, now) + 1;
  if (openChats > MAX_OPEN_CHATS) {
    notices.push(`The owner has ${openChats} chats active in the last 15 minutes; the limit is ${MAX_OPEN_CHATS}. Tell them in one line to finish one first.`);
  }
  if (env.CLAUDE_CODE_ENTRYPOINT === 'claude-desktop' && paceCheckIsDue(now)) {
    notices.push(`Pace check: read the plan limits with mcp__ccd_session_mgmt__get_usage (load it with ToolSearch). A safe week is 14% a day. If "Weekly · all models" is ahead of that, tell the owner in one line how much per day is left until the reset.`);
  }
  return notices;
}

function main() {
  const payload = JSON.parse(readFileSync(0, 'utf8'));
  const now = new Date();
  const env = process.env;
  if (shouldBlock({ now, env, prompt: payload.prompt ?? '' })) {
    process.stderr.write(BLOCK_MESSAGE);
    process.exit(2);
  }
  if (!isOwnerChat(env)) return;
  const notices = collectNotices({ payload, env, now });
  if (notices.length) process.stdout.write(`${notices.join('\n')}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    // Exit 1 shows the error without blocking: a bug here must never lock the owner out.
    process.stderr.write(`[usage-guard] ${error.message}\n`);
    process.exit(1);
  }
}
