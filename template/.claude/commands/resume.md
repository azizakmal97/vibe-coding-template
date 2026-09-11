---
description: Run the session-resume protocol. Reads PROGRESS.md + git state, decides next action.
---

# /resume

Execute the 9-step session-resume protocol:

1. Read `CLAUDE.md` (already auto-loaded; re-read §13).
2. Read `PROGRESS.md` — find the `🟡 in-progress` phase.
3. `git log --oneline -20` — see recent `wip:` commits.
4. `git status` — see if any file is mid-edit.
5. Read the active phase's "Plan for this phase" block.
6. Reconcile uncommitted changes:
   - Match plan? → finish that one edit + commit.
   - Don't match plan? → `git checkout -- <file>` (with user confirmation).
   - No uncommitted? → continue from next bullet in plan.
7. Run phase verification (`typecheck && build && test`).
8. Report state to user:
   ```
   PHASE: <id> — <title>
   PROGRESS: <X of Y bullets done>
   GIT: <clean | N uncommitted files>
   NEXT: <single concrete next action>
   ```
9. Wait for user "go" before continuing.

If no phase is `🟡 in-progress`, ask the user which phase to start.

## Fast path: same window, right after a quota limit hit

If THIS conversation was interrupted by a usage limit (the last assistant turn
errored or stopped mid-task) and the user says "go" / "continue" in the same
window: the context is already here — do not re-run steps 1–5 from scratch.

1. `git log --oneline -5` + `git status` — establish what survived the cutoff.
2. Read `PROGRESS.md`'s active phase only if its plan bullets are not in context.
3. Reconcile uncommitted changes per step 6.
4. Continue the interrupted bullet; checkpoint per edit as usual.

Per-edit checkpoint discipline means a limit hit costs at most one uncommitted
edit. Note: GLM Coding Plan quota refreshes on a rolling 5-hour window (and a
7-day weekly cycle), not at a fixed time of day — check Usage Stats in ZCode
for actual remaining quota before assuming a refresh.
