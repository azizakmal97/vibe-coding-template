---
description: Run autonomously — loop /resume → work → /checkpoint → /next-phase until phase done OR token budget threatens death. Bails gracefully at safe checkpoint.
---

<!-- GENERATED from .claude/ by scripts/sync-zcode.mjs — DO NOT EDIT. Edit the .claude/ source and re-run. -->

# /autonomous

Loop entry point. Drives the project forward without user "go" between phases.

## In ZCode: try Goal Mode first

ZCode's native `/goal <objective>` loops until the objective is *verified* met —
it is this command's built-in equivalent. Prefer it when the objective is
measurable ("test suite passes", "zero TS compile errors", "Lighthouse > 90")
and run it in Auto Edit or Full Access to keep iterations flowing — the
PreToolUse safety hooks fire in every mode, so the guardrails stay up. Fall
back to this command when the loop must follow the PROGRESS.md phase protocol
(wip/done commits, phase transitions, bail reports) or on Claude Code.

## Hard Safety Rules (Apply Every Iteration)

1. **Token-budget check FIRST.** See `rules/token-budget.md`. If context > 70% capacity → bail at next safe checkpoint, do NOT start a new phase, write `pause(<phase-id>): token budget low` commit, exit loop.
2. **One phase per session ideal.** If phase has > 10 plan bullets, finish current phase + bail; let user resume next session.
3. **Never auto-start a phase tagged `⛔ blocked` or `<requires user input>`.**
4. **Never bypass hooks.** Validate-command + pre-db-migrate + check-file-size + pre-commit-checkpoint stay active. If hook blocks → STOP, report to user.
5. **CI failure halts loop.** Before each `/next-phase`, run `/check-ci`. If red → switch active phase to "fix CI red" + bail at end of fix.
6. **Production readiness runs on disk, not in chat.** Follow the `/autonomous` section of `rules/production-readiness.md`: tier 2 safeguards are planned bullets, their plain-English explanations go under the phase's `Safeguards added`, anything only the owner can do (account settings, tier 3 decisions) goes under `Waiting on owner` while the loop continues with other work. Never stop the loop to ask.
7. **Model match: run only the work this session's model owns, or hand it down.** Apply the Model Gate below before every bullet. On Claude Code, work tagged for a cheaper Claude model goes to a subagent on that model; work tagged for a stronger model, or another tool, is skipped and left for later, not done on the wrong model and not a reason to stop early. The loop stops to ask for a model switch only once nothing is left for this model.

## Model Gate

`CLAUDE.md` §22 Rule 4 says a session only executes work assigned to its own
model. Inside this loop a mismatch defers the work instead of stopping the loop.

**This session's model** is the one named in your system prompt (e.g. Opus 5.5,
GLM-5.3). If it isn't named, ask once before the first bullet; never guess. Say it
once at loop start:
`Model gate: this session is **<model>** · effort **<owner-stated effort, or "not visible">**`.
Claude Code's own reading of the session effort can be missing or wrong, so an
effort the owner did not state counts as not visible.

**Owner override.** The gate is lifted only when the message that started the
loop says so ("run everything on this model", `/autonomous any-model`). Write
`owner override` next to every bullet run that way.

**A bullet's model** is its `(Model: …)` tag, else the phase's `Model:` line. If
neither exists, assign one from `AGENTS.md` → "Model & Tool Selection per Task"
and write it into PROGRESS.md before gating. Planning for another model is
allowed; executing its work is not.

**A bullet runs here** when its model names this session's model, or names a slot
this session is the listed substitute for in that same AGENTS.md table (on a GLM
plan: GLM-5.3 for Sonnet rows, GLM-5.3-Flash for Haiku rows). An Opus row runs on
GLM only if the bullet or phase explicitly says GLM is acceptable, because the
owner can't be asked mid-loop whether the trade is fine. DeepSeek and Gemini rows
never run here; they need the owner to open that tool. If the bullet carries an
effort and the owner-stated session effort is lower, treat it as a mismatch too.

**Handing down (Claude Code).** A bullet tagged for a cheaper Claude model than
this session (Fable > Opus > Sonnet > Haiku) runs as a subagent instead of being
deferred: the Agent tool with `model` and `effort` from the tag, and a brief naming
the files, the exact change and the check to run. Design, graphics and video
editing are Opus whatever their tag says, so they are never handed down or run on
GLM. Hand down only bullets a brief
can fully carry; a bullet that needs this conversation's context runs here instead.
Review the diff and run the check yourself before `/checkpoint`. If it fails, re-run
the subagent once one effort step up when it missed something, or take the bullet
back and do it here when it was wrong with full context (`CLAUDE.md` §22 Rule 5).
Never hand a bullet upward. Write `handed down` next to each bullet run this way.

**Deferring.** Skip a mismatched bullet and continue with the next one that runs
here, but only if that next bullet does not depend on the skipped one (it edits a
file the skipped one creates, tests its behaviour, or builds on its result). If
you can't tell, treat it as dependent. Skipped bullets stay `- [ ]`, keeping their
model tag.

**Parking a phase.** When the active phase has unfinished bullets but none that
run here:
1. Edit PROGRESS.md: the phase's `🟡` marker → `⏸` (in the template layout, the
   `### 🟡 <id>` header), `**Status:** waiting for <model> · <effort>`, and
   `**Active phase:** _none_ (⏸ <id> waiting for <model>)`.
2. `git commit -m "pause(<id>): waiting for <model> [skip ci]"`. Use the `pause`
   prefix, not `wip`: the progress hook would mark a `wip` phase active again.
3. Continue with `/next-phase`, which in this loop skips phases this session
   can't work on (see its "Inside /autonomous Loop" section).

**Unparking.** A `⏸` phase waiting for this session's model is resumed before
any new phase starts: flip `⏸` → `🟡`, set `**Status:** in-progress` and the
`Active phase:` line, commit `wip(<id>): resume on <model> [skip ci]`.

**Phase order.** Phases usually build on earlier ones. Skip past a parked or
mismatched phase only when the next phase does not depend on it (it says so, or
it touches separate files and features). If unsure, it depends: stop.

**Stop for a switch** when no bullet anywhere can run on this session (all
remaining work is parked, mismatched, or depends on one of those). Bail with
`REASON: model-switch`, naming the model that owns the earliest waiting work.

## Loop Sequence

```
LOOP:
  1. /resume                 # restore state, detect active phase
  2. IF no active phase:
       Unpark a ⏸ phase waiting for this session's model, if any (Model Gate)
       ELSE /check-ci        # absorb any CI failures into PROGRESS.md first
            /next-phase      # first ⬜ pending phase with work for this model
       IF nothing can run on this model → bail: model-switch
  3. Execute ONE plan bullet whose model matches this session, or hand down one
     tagged for a cheaper Claude model (Model Gate):
        - IF none passes → park the phase (Model Gate), goto step 2.
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
        - Hook blocked → report to user + exit loop.
        - Test or build failed → one repair, no more (CLAUDE.md §22 Rule 5). Still
          failing → report + exit loop, with the Rule 5 step up (more effort, or
          which model) in NEXT SESSION SHOULD.
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
REASON: <token-budget | hook-block | test-fail | ci-fail | user-interrupt | model-switch | all-done>
PHASES COMPLETED THIS SESSION: <list of phase-ids>
ACTIVE PHASE: <phase-id> — <N of M bullets done>
WAITING FOR OTHER MODELS: <phase-id: model, N bullets — one line each, or "nothing">
SWITCH TO: <model> · effort <level> — Claude Code: /model <name>, then /autonomous
           (ZCode: pick it in the model picker). Omit this line unless REASON is model-switch.
SAFEGUARDS ADDED: <one plain sentence each, or "none">
WAITING ON YOU: <owner-only steps from PROGRESS.md, or "nothing">
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
