import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { countOtherChats, isOwnerTranscript, isQuietHours, isStartedBySession, lastContextTokens, shouldBlock } from './usage-guard.mjs';

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

test('lets the override word and app messages through', () => {
  assert.equal(shouldBlock({ now: at(1, 0), env: desktopChat, prompt: 'Urgent: the site is down' }), false);
  assert.equal(shouldBlock({ now: at(1, 0), env: desktopChat, prompt: 'this is not urgent' }), true);
  assert.equal(shouldBlock({ now: at(1, 0), env: desktopChat, prompt: '<side-sessions-event>done' }), false);
});

test('counts only chats, not jobs or setup-only transcripts, as open', () => {
  assert.equal(isOwnerTranscript('{"entrypoint":"claude-desktop"}'), true);
  assert.equal(isOwnerTranscript('{"entrypoint":"cli"}'), true);
  assert.equal(isOwnerTranscript('{"entrypoint":"sdk-cli"}'), false);
  assert.equal(isOwnerTranscript('{"type":"setup"}'), false);
});

test('reads who started a session from its first turn only', () => {
  const started = (firstTurn, laterTurn) => `{"turnOrigin":"${firstTurn}"}\n{"turnOrigin":"${laterTurn}"}`;
  assert.equal(isStartedBySession(started('sdk', 'human')), true);
  assert.equal(isStartedBySession(started('human', 'sdk')), false);
  assert.equal(isStartedBySession('{"type":"setup"}'), false);
});

test('skips sessions started by another session, in all their transcripts', () => {
  const chats = [
    { id: 'me', title: 'Mine', isOpen: true, startedBySession: false },
    { id: 'owner', title: 'Owner chat', isOpen: true, startedBySession: false },
    { id: 'child-start', title: 'Logo', isOpen: false, startedBySession: true },
    { id: 'child-later', title: 'Logo', isOpen: true, startedBySession: false },
    { id: 'child-open', title: 'Icons', isOpen: true, startedBySession: true },
  ];
  assert.equal(countOtherChats(chats, 'me'), 1);
});

test('counts one session once, and a chat with no title yet', () => {
  const chats = [
    { id: 'me', title: 'Mine', isOpen: true, startedBySession: false },
    { id: 'my-earlier-file', title: 'Mine', isOpen: true, startedBySession: false },
    { id: 'first-file', title: 'Owner chat', isOpen: true, startedBySession: false },
    { id: 'second-file', title: 'Owner chat', isOpen: true, startedBySession: false },
    { id: 'new-chat', title: null, isOpen: true, startedBySession: false },
    { id: 'idle', title: 'Old', isOpen: false, startedBySession: false },
  ];
  assert.equal(countOtherChats(chats, 'me'), 2);
});

test('reads the latest context size and survives a broken or missing transcript', () => {
  const path = join(mkdtempSync(join(tmpdir(), 'guard-')), 'chat.jsonl');
  const reply = (tokens) => JSON.stringify({ type: 'assistant', message: { usage: { input_tokens: 1, cache_read_input_tokens: tokens } } });
  writeFileSync(path, `${reply(1000)}\n${reply(250000)}\n{"type":"assistant","usage" broken\n`);
  assert.equal(lastContextTokens(path), 250001);
  assert.equal(lastContextTokens('missing.jsonl'), 0);
  assert.equal(lastContextTokens(undefined), 0);
});
