# Global Brain — Cross-Project Rules

> This file loads in EVERY project on this machine. It holds rules that must
> apply everywhere. A project's own `CLAUDE.md` extends or overrides this.
> Keep it short. Project-specific facts belong in that project's CLAUDE.md or memory.

## 1. Model Selection per Task (Always)

Every plan, phase, task block, or roadmap entry MUST carry an explicit per-task
model assignment. Never run a whole project on one model by default.

### Current lineup (review periodically — names go stale)

| Slot | Current name | Use for |
|---|---|---|
| Anthropic flagship | **Opus 4.8** (`claude-opus-4-8`) | Architecture, hard debugging, security review, novel copy/brand voice, tricky refactors |
| Anthropic workhorse | **Sonnet 4.6** (`claude-sonnet-4-6`) | Default for normal feature work and edits |
| Anthropic small | **Haiku 4.5** (`claude-haiku-4-5-20251001`) | Status checks, log inspection, mechanical edits, build runs |
| DeepSeek heavy | V-series Pro | Bulk codegen, mass test scaffolding |
| DeepSeek small | V-series Flash | Format / lint auto-fix |
| Google heavy | Gemini 3 Pro | Translation, multimodal QA, long-context reads |
| Google small | Gemini 3 Flash | Spell-check, screenshot smoke |

### Rules

**Rule 1 — Declare model at the start of EVERY task, in plans AND in live prompts.**
Whenever the user gives you any instruction — whether inside a formal plan phase OR
as a direct one-off prompt — your FIRST sentence must declare which model owns this
task and whether the current session matches. Format:
> `Model for this task: **Sonnet 4.6** (current session ✓)` — then proceed.
> `Model for this task: **Opus 4.8** (current session is Sonnet — switch first)` — then stop.

This applies to EVERY task: feature work, bug fix, a single file edit, a question
that leads to code, a refactor, a review, anything. No exceptions. The declaration
must come before the first tool call or line of output.

**Rule 2 — In plans, every entry carries a model line.**
In `PROGRESS.md`, every phase block carries a `Model:` line plus per-bullet
annotation. A plan bullet with no model annotation is incomplete.

**Rule 3 — End every turn by naming the model for the NEXT step.**
Explicitly, every time, even if it's already written in the plan. The user opens a
fresh session per phase/step and needs the next-model called out so they pick the
cheapest capable session without re-reading the plan.

**Rule 4 — Only execute tasks matching the CURRENT session's model — in BOTH directions.**
Don't take Opus-assigned work on a Sonnet session, and don't do Sonnet-assigned
work on an Opus session. Check the assignment BEFORE the first edit. On a mismatch:
stop, state which model to switch to, wait for the user to swap. Planning across
the boundary is fine; executing is not, unless the user explicitly says "run it on
this model anyway."

- Switch Claude models with `/model opus|sonnet|haiku`. If mid-session swap isn't
  supported: checkpoint → new session → `/model <target>` → `/resume`.
- Before leaving Claude Code for another tool (Cursor/Aider/Gemini/direct API):
  `/checkpoint` first so hooks fire and work is pushed. Return to Claude Code for
  final verification so post-edit + file-budget hooks run on the merged state.

### Anti-patterns

- Opus for status checks / build runs / log reading — burns cost for no upside.
- Sonnet for novel copywriting, brand voice, or architecture calls — output reads thin.
- Never switch model mid-task "just to try" — it costs the prompt cache for nothing.

## 2. Token Budget (Always)

Estimate context use from turns elapsed, files read, response length. You don't
see exact %; act on the tier.

| Used | State | Behavior |
|---|---|---|
| 0-30% | green | normal; spawn subagents freely |
| 30-50% | yellow | prefer subagents for big reads |
| 50-70% | orange | finish current phase, do NOT start the next |
| > 70% | red | bail at next safe checkpoint; commit; exit |

Habits: graph/grep before broad reads; spawn a subagent for any file > 500 LOC or
multi-file investigation (it keeps the big read in its own context); never re-read
static files (CLAUDE.md, rules) mid-session; prefer one expensive tool call over
many small ones; skip restating tool output — `[brief result] [next action]`.

Refuse a tool call that would: push context past ~80%, Read a file > 5000 LOC
without a subagent, or Grep across `**/*` without scoping. Instead narrow scope,
spawn a subagent, or bail.

## 3. Graphify After Structural Changes (Always)

- If `graphify-out/GRAPH_REPORT.md` exists, read it FIRST before any full-repo
  Grep/Glob — it cuts exploration 60-80%.
- After any structural change (file add / rename / move / delete), run `/graphify`
  to update the graph.
- For "where is X" / "what calls Y" questions, prefer the `graph-navigator`
  subagent — its output is compressed so main-thread context lasts longer.
- If the `graphify` tool isn't installed, surface the install hint
  (`pip install graphifyy`) rather than failing silently.

## 4. Push After Every Commit (Automated)

Every successful `git commit` auto-pushes to its remote via the global
`~/.claude/hooks/post-commit-push.mjs` hook. This is deterministic — you don't
have to remember it. Notes:

- Auto-push is non-blocking. Offline / no-remote / auth failure → commit stays
  local and the next successful push catches up. Don't panic on `[auto-push] push failed`.
- Push = the only true save. Local-only commits protect against session death, not
  disk death. Configure a git remote on day 1 so work survives a machine swap.
- Toggle off for a session with env `AUTO_PUSH=0` (e.g. a private repo you don't
  want pushed yet).
- When you bail (token budget / pause), surface in your report which commits are
  NOT yet on the remote.
- **Verify every push AND every deploy actually succeeded before reporting work
  done — never assume.** On failure, read the real error, fix the root cause
  (rebase a rejected push, fix a build error, re-auth), retry, re-verify.
- **Whether a push auto-deploys is PER-PROJECT — check that project's CLAUDE.md;
  never assume.** Some projects auto-deploy on push (e.g. Cloudflare Pages / Workers
  Builds git integration); others need a separate manual deploy command
  (e.g. `npx wrangler deploy`). Don't carry one project's deploy model into another.

## 5. Commit & Git Discipline (Always)

- One commit = one logical change. Conventional prefixes:
  `feat | fix | refactor | test | docs | chore | wip | done`. Format:
  `<type>(<scope>): <imperative> <what>` (≤ 50 chars).
- Commit after every focused edit (per-edit commits = death defense). Run
  typecheck + build before committing where the project has them.
- Fix mistakes with `git revert`, never `reset --hard` + force push. Force push
  only when the user explicitly asks. Never amend an already-pushed commit.

## 6. Learn From Errors — Capture & Recall (this IS "gets faster over time")

A non-obvious problem should be solved ONCE, then recalled instantly. That only
works if lessons get written down (capture) and consulted (recall). Both are on you.

### Capture — right after you solve it (same turn, while it's fresh)

When you resolve an error / bug / gotcha that took real digging, write it down
BEFORE moving on. Don't wait for "the end."
- Save a memory in this project's `memory/` dir (one file, per the session's memory
  instructions) — or, if it's load-every-session critical, add it to the project
  `CLAUDE.md` "Known Issues" / gotcha section.
- Record four things: **symptom** (what you saw), **root cause** (why), **fix** (the
  exact command/change), **how to apply next time**. Add a one-line pointer to `MEMORY.md`.
- Worth capturing: OS/env-specific failures, flaky tests, data-wiping footguns,
  "use script X not command Y", non-obvious config, anything you'd otherwise
  re-derive next time. NOT worth it: one-off typos, anything obvious from the code.
- **A wrong lesson is worse than none.** Only write what you actually VERIFIED fixed
  it — never a guess. (This is the discipline auto-learning agents skip, and why
  their memory rots.)

### Recall — at session start and before editing an area

Before re-debugging anything, check what this project already knows:
- The project `CLAUDE.md` "Known Issues" / gotcha sections (loaded every session).
- The `memory/` index (`MEMORY.md`) + any gotcha memories for this project.
- If a recalled note names a file / flag / command, VERIFY it still exists before
  relying on it — a memory reflects what was true when written.

Reading the note is far cheaper than re-deriving the fix. Don't re-solve a solved
problem.

## 7. Code Quality Charter — One Coherent Animal (Always)

The goal: a junior dev opens any file I touched and stays — it reads like ONE
person with taste wrote the whole thing, not AI stitching a giraffe-octopus-shark
into one creature. This OVERRIDES "just make it work." Working but incoherent =
not done.

### 7.1 Fit the body you're in (the #1 anti-Frankenstein rule)

- BEFORE writing, read 2-3 neighboring files. Mirror their naming, file layout,
  error handling, import style, test style, async style. The existing codebase's
  conventions WIN over my personal defaults — even if I'd do it differently.
- One paradigm per area. Don't mix callbacks+promises+async, or OOP+functional,
  or two HTTP clients, or two date libs, in the same layer. Pick what's already
  there. If none exists, pick ONE and use it everywhere.
- No snippet teleporting. Never paste a pattern from a different stack/era that
  clashes with house style. Adapt it to fit, or don't use it.

### 7.2 Readable for a tired junior at 5pm

- Names say intent: `activeUserCount` not `n`, `cancelSubscription()` not `doIt()`.
  No cryptic abbreviations, no single letters except loop indices/math.
- Small, single-purpose functions. One job each. If it needs "and" to describe it,
  split it. Guard-clause early returns over deep nesting (max ~3 levels).
- Comments explain WHY (the non-obvious decision, the gotcha, the link), never
  WHAT the code already says. Delete narration comments.
- Predictable shape: same kind of thing lives where they'd expect. No surprise
  side effects, no spooky-action-at-a-distance, no clever one-liners that need a
  PhD to parse. Boring and obvious beats clever.

### 7.3 Structured & scalable — right altitude

- Separation of concerns: IO / business logic / presentation don't bleed together.
  No 800-line god file, no god function. Split by responsibility, not by accident.
- BUT no speculative architecture. YAGNI. No abstraction/interface/config knob for
  a need that doesn't exist yet. Build for the real requirement + one obvious step,
  not an imagined enterprise. Wrong abstraction is worse than duplication.
- Single source of truth. No copy-pasted logic that must change in two places.
  Types/contracts at boundaries so callers can't hold it wrong.

### 7.4 Correct — no bugs, no silent failure

- Handle the unhappy path: nulls, empties, zero/one/many, network failure,
  bad input. Don't swallow errors; fail loud and clear with context.
- Validate inputs at trust boundaries. No off-by-one, no unawaited promises, no
  resource leaks (close files/handles/connections).
- Tests for the logic that matters (happy path + the nasty edge). Run typecheck +
  build + lint + tests and SEE them pass before claiming done. "Should work" ≠ done.

### 7.5 Secured by default

- Never hardcode secrets/keys/tokens — env vars or a secrets manager. Never log
  secrets or PII.
- Parameterize all queries (no string-built SQL). Escape/encode output (no XSS).
  Validate + sanitize every external input. Least privilege everywhere.
- Safe defaults: deny by default, enforce authn/authz on protected paths, no
  secrets/stack traces leaked to clients, pin/keep deps current, no obvious OWASP
  Top 10 holes. If unsure whether something's exploitable, flag it.

### 7.6 Leave it cleaner — no leftovers

- Remove dead code, unused imports/vars, commented-out blocks, debug prints, and
  scaffolding before finishing. No orphaned TODOs without an owner/issue.
- Consistent formatting via the project's formatter/linter — don't fight it.

### 7.7 Mandatory self-review pass (before saying "done")

Re-read the final diff as a hostile senior reviewer who didn't write it. Ask:
would a junior understand this in one read? Does it match the surrounding code?
Any frankenstein seams, dead code, unhandled edge, or security hole? Fix what you
find. Then state plainly what you verified (typecheck/build/test/lint) and call out
anything you did NOT verify — never claim done on hope.
