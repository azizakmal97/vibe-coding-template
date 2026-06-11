---
description: Run autonomously — loop /resume → work → /checkpoint → /next-phase until phase done OR token budget threatens death. Bails gracefully at safe checkpoint.
---

# /autonomous

Loop entry point. Drives the project forward without user "go" between phases.

## Hard Safety Rules (Apply Every Iteration)

1. **Token-budget check FIRST.** See `rules/token-budget.md`. If context > 70% capacity → bail at next safe checkpoint, do NOT start a new phase, write `pause(<phase-id>): token budget low` commit, exit loop.
2. **One phase per session ideal.** If phase has > 10 plan bullets, finish current phase + bail; let user resume next session.
3. **Never auto-start a phase tagged `⛔ blocked` or `<requires user input>`.**
4. **Never bypass hooks.** Validate-command + pre-db-migrate + check-file-size + pre-commit-checkpoint stay active. If hook blocks → STOP, report to user.
5. **CI failure halts loop.** Before each `/next-phase`, run `/check-ci`. If red → switch active phase to "fix CI red" + bail at end of fix.

## Loop Sequence

```
LOOP:
  1. /resume                 # restore state, detect active phase
  2. IF no active phase:
       /check-ci             # absorb any CI failures into PROGRESS.md first
       /next-phase           # auto-pick next ⬜ pending phase
  3. Execute ONE plan bullet from the active phase:
        - Edit target file(s) (one focused change).
        - /checkpoint        # typecheck + build + test + commit wip(phase-id) [skip ci]
  4. IF all plan bullets done:
        - Run full verification.
        - Edit PROGRESS.md → mark phase ✅ done + hash.
        - git commit -m "done(<phase-id>): <summary>"   # NO [skip ci] — this run CI-verifies the phase
        - Verify a CI run triggered (docs-only done commit → paths-ignore skips it;
          then: gh workflow run "<CI workflow name>" --ref main, watch green).
        - Goto step 2.
  5. IF token-budget > 70%:
        - Commit current edit as wip if not yet committed.
        - Edit PROGRESS.md → add "Resume note: continue from bullet N" to active phase.
        - git commit -m "pause(<phase-id>): token budget low [skip ci]"
        - Exit loop with summary report.
  6. IF hook blocked OR test failed OR build failed:
        - Do NOT auto-fix repeatedly. Report to user + exit loop.
  7. IF user has interrupted (input received):
        - Bail at next safe checkpoint.
```

## Per-Iteration Token Hygiene (Mandatory)

- Caveman mode: bump to `full` (or `ultra` if context > 50%) for narration. User-facing reports stay readable.
- Reads: prefer `graph-navigator` subagent over direct `Read` for files > 200 LOC.
- Greps: prefer graphify report over Grep when graph fresh.
- No re-read of CLAUDE.md / rule files mid-loop (loaded once per session).
- Spawn subagents for: legacy file analysis, security audits, anything > 500 lines of file content.

## Bail Report Format

```
═══════════════════════════════════
AUTONOMOUS LOOP BAILED
═══════════════════════════════════
REASON: <token-budget | hook-block | test-fail | ci-fail | user-interrupt>
PHASES COMPLETED THIS SESSION: <list of phase-ids>
ACTIVE PHASE: <phase-id> — <N of M bullets done>
LAST COMMIT: <hash> <message>
NEXT SESSION SHOULD: <one specific action>
═══════════════════════════════════
```

## When To Use

- Long refactor windows where user wants AI to grind through 3-5 phases unattended.
- Weekend / overnight runs (with `ScheduleWakeup` or external cron).
- Cleaning up tech debt during low-activity periods.

## When NOT to Use

- First feature build (user wants to direct creative decisions).
- Anything touching billing / payments / auth without explicit per-step approval.
- During production incident response (human-in-loop).
- Any phase requiring user input mid-execution.

## Refuse Conditions

- No `PROGRESS.md` → ask user to run setup or `/audit` first.
- No phases logged → ask user to add a roadmap.
- Active phase plan empty → cannot autonomously execute "make it good"; user must specify bullets.
- Git not initialised → cannot follow per-edit commit discipline.

## Token-Budget Estimation

Rough rule (Claude Sonnet 200k context):
- < 50% context → safe, continue.
- 50-70% → finish current phase, do NOT start next.
- > 70% → bail at next safe checkpoint NOW.

If unsure, bail early. Restart cheaper than mid-task death.
