---
description: Auto-start the next ⬜ pending phase from PROGRESS.md. Marks 🟡 in-progress + commits intent BEFORE any code change (Layer 1 death defense).
---

# /next-phase

Pick the next phase from PROGRESS.md and start it safely.

## Refuse Conditions (Check First)

- A phase is already `🟡 in-progress` → run `/resume` instead, do not start a second concurrent phase.
- Working tree dirty → run `/checkpoint` first to commit current work, then `/next-phase`.
- Last test/build failed → fix that first; do not start new work on red.

## Steps (Layer 1 death-defense FIRST)

1. Read `PROGRESS.md`.
2. Find the first phase still marked `⬜ pending`. If none, ask user to add new phases (or run `/audit` to generate roadmap).
3. **Tool call 1: write intent on disk.** Edit PROGRESS.md:
   - Change `⬜ <phase-id>` → `🟡 <phase-id>` in the phase log AND in the header `Active phase:` line.
   - Update `Last update:` to today + agent name.
   - Fill in the "Plan for this phase" block with explicit bullet list of edits (3-8 items typical).
4. **Tool call 2: commit intent.**
   ```
   git add PROGRESS.md && git commit -m "wip(<phase-id>): starting <brief>"
   ```
   `post-commit-push.js` hook auto-pushes. If remote unreachable, commit stays local — work still survives session death; next successful push catches up.
5. Report to user:
   ```
   PHASE STARTED: <phase-id> — <title>
   PLAN: <N bullets>
   FIRST STEP: <bullet 1>
   ```
6. STOP. Wait for user "go" before executing the first bullet — unless inside `/autonomous` loop.

## Inside /autonomous Loop

When called by `/autonomous`, skip step 6 (no wait) and proceed to execute bullet 1 with `/checkpoint` after each focused edit.

## Token Discipline

- Do NOT re-read CLAUDE.md / AGENTS.md / rule files unless first phase of session.
- Do NOT run `grep`/`Glob` until you have a clear target.
- Do NOT spawn subagents for this command — it's a small file write + commit only.

## Output Format

```
NEXT PHASE: <phase-id> — <one-line title>
INTENT COMMITTED: <hash>
PLAN BULLETS: N
NEXT TOOL CALL: <Edit/Read/Bash + target>
```
