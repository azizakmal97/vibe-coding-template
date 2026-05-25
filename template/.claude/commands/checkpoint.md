---
description: Run verification then commit one logical change with wip(phase-id) prefix.
---

# /checkpoint

Per-edit commit ritual. Use after EVERY focused change.

## Steps

1. Read `PROGRESS.md` — find the `🟡 in-progress` phase id (e.g. `M1-W2-P03`).
2. Read `commands.json` (project root or `.claude/commands.json`) — get `checkpoint` command for current preset.
3. Run the checkpoint command (typecheck + lint + test + build). MUST pass.
4. `git status` — list files changed.
5. `git add <specific files>` — never `git add -A` (avoids accidentally staging secrets / build output).
6. Generate commit message:
   - Subject: `wip(<phase-id>): <imperative verb> <what>` — ≤ 50 chars.
   - Body (only if needed): why this change, not how.
7. `git commit -m "<message>"`.
8. `post-commit-push.js` hook auto-pushes to remote (non-blocking; commit stays local if push fails).
9. Report:
   ```
   COMMITTED: <hash> <message>
   PUSHED:    origin/<branch> | local-only (no remote / push failed)
   PHASE PROGRESS: <X of Y bullets done>
   NEXT: <next plan bullet>
   ```

## Refuse Conditions

- Checkpoint command failed → fix first, do not commit.
- `git diff --cached` empty → nothing to commit, abort.
- Files contain hardcoded secrets (post-edit hook should already block; double-check).
- No active phase in PROGRESS.md → ask user to start one first.

## Phase Completion

If this checkpoint completes the LAST bullet of the active phase:
1. Edit `PROGRESS.md` — mark phase `✅ done` + summary + this commit hash.
2. Run full verification one more time.
3. `git add PROGRESS.md && git commit -m "done(<phase-id>): <one-line summary>"`.
4. Ask user: "phase done. Start next phase or pause?"
