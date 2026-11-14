---
paths:
  - "**/*"
---

# Token Budget Rules

Always loaded. Applies to all sessions. Critical during `/autonomous` loops where session-death = lost work.

## Context Capacity Tiers

The tier numbers and the reasons behind them live in one place: the global rule,
`~/.claude/CLAUDE.md` section 2 "Token Budget" (ZCode: `~/.zcode/AGENTS.md`, built
from the same file). When that rule is loaded, it wins over the fallback line below. Do not copy its table back here.

Fallback, only for a computer or tool without the global setup (it may lag behind the global rule): 1M window: yellow from 200k, orange from 250k, red from 300k; 200k window: yellow from 60k, orange from 100k, red from 140k.

What each state means: green, work normally; yellow, send big reads to subagents
and switch caveman to full; orange, finish the current phase and do NOT start the
next, caveman ultra for narration; red, bail at the next safe checkpoint (Bail
Pattern below).

The size of a phase is no reason to bail by itself. In green, start the next phase
even if it is large; the tiers stop it safely if it runs long.

You do not know exact usage. Estimate from: turns elapsed, files read so far, screenshots taken, total response length. About 90k of any session is fixed setup (system prompt, tools, memory), so count from there.

## Mandatory Token-Saving Habits

### 1. Graph First, Grep Last
If `graphify-out/GRAPH_REPORT.md` exists, read it FIRST. Cuts exploration by 60-80%.
For "where is X" / "what touches Y", spawn `graph-navigator` subagent — its output is caveman-compressed.

### 2. Subagent for Big Reads
File > 500 LOC OR multi-file investigation → spawn `general-purpose` or `Explore` subagent with a tight prompt + result-size cap (e.g. "report under 300 words").
The subagent's full reading stays in its context; main thread gets compressed summary only.

### 3. Never Re-Read Static Files
CLAUDE.md / AGENTS.md / rule files load once per session. Do NOT re-read mid-loop — they are already in context (or you remember them).
PROGRESS.md is the exception (changes every phase) — re-read at each `/next-phase`.

### 4. Caveman Default On
caveman-lite for all status updates by default (skill auto-loaded). Bump to full/ultra in orange/red tiers.
NEVER caveman for: security warnings, irreversible op confirmations, user-facing strings, code, commits.

### 5. One-Shot Tool Calls
Prefer one expensive tool call to many small ones:
- `gh run list --json status,conclusion --limit 5` not 5 separate `gh run view`.
- `Glob '**/*.{ts,tsx}'` once not 4 globs for each extension.
- `Grep -A 5 -B 2 <pattern>` not Grep + then Read.

### 6. Commit Often (Layer 2 Death Defense)
Per-edit commits cost ~50 tokens (git output) BUT save you the entire phase's work if session dies.
Always cheaper than re-doing work next session.
`wip(...)` / `pause(...)` subjects append ` [skip ci]` — the commit still auto-pushes
(death defense intact) but triggers NO Actions run, so per-edit commits cost zero
CI minutes. `done(...)` commits NEVER carry the marker (one CI run per phase).

### 7. Skip the Recap
After a successful tool call, do NOT restate what the tool returned. Move to next action.
Pattern: `[brief result] [next action]`, not `[long restate of result] [hedging] [eventually next action]`.

### 8. No Confirmations Loop
Do not ask user "should I proceed?" after every step. Either:
- You have enough info → proceed.
- You don't → ask ONCE, with specific options.

## Autonomous Loop Specific

When inside `/autonomous`:
- Check estimated budget BEFORE every plan bullet.
- Bail criteria are ALL safe checkpoints (post-commit, post-phase-complete).
- Never bail mid-edit. Always finish + commit the current edit, THEN bail.
- Bail message goes to PROGRESS.md + git commit so next session resumes cleanly.

## Refuse Conditions

You MUST refuse a tool call when:
- It would push estimated context past 80%.
- It would Read a file > 5000 LOC without a subagent.
- It would Grep across `**/*` without scoping.
- It would re-Read a file already read this session (unless modified since).

Instead: spawn a subagent, narrow the scope, or bail and tell the user.

## Bail Pattern

```
1. Finish current edit (do NOT half-commit).
2. /checkpoint                        # commits wip + auto-pushes
3. Edit PROGRESS.md → add resume note to active phase:
     "Resume note: continue from bullet N. Last touched: <file>:<line>."
4. git commit -m "pause(<phase-id>): token budget [skip ci]"
   # post-commit-push hook fires, pushes to remote. [skip ci] = no Actions run;
   # the work gets CI-verified by the eventual done(...) commit.
5. Verify push succeeded (check hook stderr line). If push failed, retry once:
   git push   # then continue with bail regardless of result
6. Report to user (one short paragraph).
7. EXIT. Do not start another tool call.
```

Next session's `/resume` will read the note (from remote if cloned fresh, or local), recover state, continue.

## Push-After-Every-Commit Rule (Critical)

Every commit (wip, done, pause, refactor — ALL of them) auto-pushes via `post-commit-push.js` hook. Why this matters:
- Disk death / OS crash / machine swap → work survives on remote.
- Different machine resumes via `git clone` + `/resume`.
- Auto-push is non-blocking: if offline, commit stays local but next successful push catches up.
- Never rely on local-only commits for safety. Push = the only true save.

If hook stderr shows `[auto-push] push failed`, do NOT panic — keep committing. Next commit retries automatically. But DO surface the failure to the user in the bail report so they know which commits aren't yet on remote.
