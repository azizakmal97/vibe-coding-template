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
