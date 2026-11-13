import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { isChildChat, isQuietHours, isStartedBySession, lastContextTokens, shouldBlock } from './usage-guard.mjs';

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

test('lets /close through at night, but not a message that only mentions it', () => {
  assert.equal(shouldBlock({ now: at(1, 0), env: desktopChat, prompt: '/close' }), false);
  assert.equal(shouldBlock({ now: at(1, 0), env: desktopChat, prompt: 'should I run /close' }), true);
  assert.equal(shouldBlock({ now: at(1, 0), env: desktopChat, prompt: '/closet' }), true);
});

test('lets the app resume a chat after the plan limit resets, even at night', () => {
  const resumed = 'I hit my usage limit while you were working, but it has reset now. Please continue from where you left off.';
  assert.equal(shouldBlock({ now: at(1, 0), env: desktopChat, prompt: resumed }), false);
  assert.equal(shouldBlock({ now: at(1, 0), env: desktopChat, prompt: "[Earlier usage-limit notes no longer apply. Continue working normally. Don't mention this to the user.]" }), false);
  assert.equal(shouldBlock({ now: at(1, 0), env: desktopChat, prompt: 'what is my usage limit' }), true);
});

test('lets the override word and app messages through', () => {
  assert.equal(shouldBlock({ now: at(1, 0), env: desktopChat, prompt: 'Urgent: the site is down' }), false);
  assert.equal(shouldBlock({ now: at(1, 0), env: desktopChat, prompt: 'this is not urgent' }), true);
  assert.equal(shouldBlock({ now: at(1, 0), env: desktopChat, prompt: '<side-sessions-event>done' }), false);
});

test('lets other sessions talk to a chat at night, even in plain text', () => {
  const fromSessions = [
    'Task (from the session that started this one):\nBuild the rig.',
    'Background (from the session that started this one):\nBina3D is a tool.',
    'Another Claude session sent a message: <cross-session-message>hi</cross-session-message>',
    '[Cross-session idle notice] "Bina3D code review" is idle now.',
  ];
  for (const prompt of fromSessions) assert.equal(shouldBlock({ now: at(1, 0), env: desktopChat, prompt }), false, prompt);
  assert.equal(shouldBlock({ now: at(1, 0), env: desktopChat, prompt: 'start a task for the rig' }), true);
});

test('never blocks a chat that another session started', () => {
  assert.equal(shouldBlock({ now: at(1, 0), env: desktopChat, prompt: 'keep going', isChildChat: () => true }), false);
  assert.equal(shouldBlock({ now: at(1, 0), env: desktopChat, prompt: 'keep going', isChildChat: () => false }), true);
});

test('finds a started chat from its own transcript or a restart with the same title', () => {
  const folder = mkdtempSync(join(tmpdir(), 'guard-'));
  const transcript = (name, firstOrigin, title) => {
    const path = join(folder, name);
    writeFileSync(path, `{"turnOrigin":"${firstOrigin}"}\n{"type":"custom-title","customTitle":"${title}"}\n`);
    return path;
  };
  const now = new Date();
  const child = transcript('child.jsonl', 'host_synthetic', 'Rig review');
  const restart = transcript('restart.jsonl', 'human', 'Rig review');
  const owner = transcript('owner.jsonl', 'human', 'My chat');
  assert.equal(isChildChat(child, now), true);
  assert.equal(isChildChat(restart, now), true);
  assert.equal(isChildChat(owner, now), false);
  assert.equal(isChildChat(join(folder, 'missing.jsonl'), now), false);
});

test('reads who started a session from its first turn only', () => {
  const started = (firstTurn, laterTurn) => `{"turnOrigin":"${firstTurn}"}\n{"turnOrigin":"${laterTurn}"}`;
  assert.equal(isStartedBySession(started('sdk', 'human')), true);
  assert.equal(isStartedBySession(started('host_synthetic', 'human')), true);
  assert.equal(isStartedBySession(started('human', 'sdk')), false);
  assert.equal(isStartedBySession('{"type":"setup"}'), false);
});

test('reads the latest context size and survives a broken or missing transcript', () => {
  const path = join(mkdtempSync(join(tmpdir(), 'guard-')), 'chat.jsonl');
  const reply = (tokens) => JSON.stringify({ type: 'assistant', message: { usage: { input_tokens: 1, cache_read_input_tokens: tokens } } });
  writeFileSync(path, `${reply(1000)}\n${reply(250000)}\n{"type":"assistant","usage" broken\n`);
  assert.equal(lastContextTokens(path), 250001);
  assert.equal(lastContextTokens('missing.jsonl'), 0);
  assert.equal(lastContextTokens(undefined), 0);
});
