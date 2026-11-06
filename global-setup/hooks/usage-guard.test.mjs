import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { isQuietHours, lastContextTokens, shouldBlock } from './usage-guard.mjs';

const at = (hour, minute) => new Date(2026, 10, 7, hour, minute);
const desktopChat = { CLAUDE_CODE_ENTRYPOINT: 'claude-desktop', CLAUDE_CODE_SESSION_ATTENDED: '1' };

test('quiet hours run from 11:30pm up to 6am', () => {
  assert.equal(isQuietHours(at(23, 29)), false);
  assert.equal(isQuietHours(at(23, 30)), true);
  assert.equal(isQuietHours(at(1, 0)), true);
  assert.equal(isQuietHours(at(5, 59)), true);
  assert.equal(isQuietHours(at(6, 0)), false);
});

test('blocks the owner at night and not by day', () => {
  assert.equal(shouldBlock({ now: at(1, 0), env: desktopChat, prompt: 'fix this' }), true);
  assert.equal(shouldBlock({ now: at(1, 0), env: { CLAUDE_CODE_ENTRYPOINT: 'cli' }, prompt: 'fix this' }), true);
  assert.equal(shouldBlock({ now: at(14, 0), env: desktopChat, prompt: 'fix this' }), false);
});

test('never blocks a night job or anything it cannot identify', () => {
  const prompt = '/produce';
  assert.equal(shouldBlock({ now: at(2, 0), env: { CLAUDE_CODE_ENTRYPOINT: 'sdk-cli' }, prompt }), false);
  assert.equal(shouldBlock({ now: at(2, 0), env: {}, prompt }), false);
  assert.equal(shouldBlock({ now: at(2, 0), env: { CLAUDE_CODE_ENTRYPOINT: 'claude-desktop' }, prompt }), false);
});

test('lets the override word and app messages through', () => {
  assert.equal(shouldBlock({ now: at(1, 0), env: desktopChat, prompt: 'Urgent: the site is down' }), false);
  assert.equal(shouldBlock({ now: at(1, 0), env: desktopChat, prompt: 'this is not urgent' }), true);
  assert.equal(shouldBlock({ now: at(1, 0), env: desktopChat, prompt: '<side-sessions-event>done' }), false);
});

test('reads the latest context size and survives a broken or missing transcript', () => {
  const path = join(mkdtempSync(join(tmpdir(), 'guard-')), 'chat.jsonl');
  const reply = (tokens) => JSON.stringify({ type: 'assistant', message: { usage: { input_tokens: 1, cache_read_input_tokens: tokens } } });
  writeFileSync(path, `${reply(1000)}\n${reply(250000)}\n{"type":"assistant","usage" broken\n`);
  assert.equal(lastContextTokens(path), 250001);
  assert.equal(lastContextTokens('missing.jsonl'), 0);
  assert.equal(lastContextTokens(undefined), 0);
});
