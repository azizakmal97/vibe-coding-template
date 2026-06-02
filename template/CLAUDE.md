# [PROJECT NAME] — Project Brain

> SETUP: Delete this line. Fill every [BRACKETED] section before first Claude session.
> This file loads every session. Keep it under 200 lines. Be specific, not verbose.

## What This Is

[One sentence: what does this project do and who uses it.]

Examples: "A SaaS dashboard for freelancers." / "Portable AI USB drive for offline chat." / "Personal research notes on quant trading." / "A CLI tool to batch-rename files."

## Stack

> Leave blank or delete rows that don't apply to your project.

| Layer | Choice |
|-------|--------|
| Language / Runtime | [Python / Node / Rust / Dart / none] |
| Framework | [Next.js / Vite+React / Flutter / Jupyter / none] |
| Backend | [FastAPI / Express / Tauri / Ollama / none] |
| Database | [PostgreSQL / SQLite / JSON files / none] |
| Auth | [Clerk / Supabase Auth / none] |
| State | [Zustand / Jotai / none — server state only] |
| Styling | [Tailwind + shadcn/ui / none] |
| Package Manager | Read `.claude/package-manager.json` — auto-detected on scaffold |
| Testing | [Vitest + Playwright / pytest / cargo test / none] |
| Deployment | [Vercel / USB drive / GitHub Releases / none] |

## Commands

> Fill from `commands.json` for your preset. Delete unused entries.

```bash
[dev command]     # Start dev server
[build command]   # Production build
[test command]    # Run tests
[lint command]    # Lint check
[typecheck cmd]   # Type check (must be zero errors)
```

## Conventions

> Delete or edit rows that don't apply. See `.claude/rules/naming.md` for detailed naming conventions.

- File naming: [snake_case / camelCase / PascalCase / kebab-case — pick one]
- Language rules: [TypeScript strict / Python mypy / Rust clippy — zero warnings]
- Error handling: [describe your pattern — try/catch? Result type? Error boundary?]
- Imports: [absolute paths via alias?] — no relative `../../` beyond 1 level
- API response shape (if backend): `{ data: T }` success, `{ error: string, code: string }` failure

## Testing Requirements

> Adapt to your project type. Not all projects have a UI or E2E suite.

- Unit tests: all utility functions, all handlers/endpoints
- Integration tests: critical user flows
- E2E tests (if UI project): [list critical paths, e.g., "signup → dashboard → create invoice"]
- **UI change → e2e smoke is MANDATORY** (if Playwright is scaffolded): load the page, assert key regions render, assert ZERO uncaught page errors. typecheck + build prove it compiles, NOT that it renders.
- **You CAN drive a browser** — if Playwright + Chromium are scaffolded (web/fullstack presets), run the e2e yourself; do NOT defer UI verification to the human. See `.claude/rules/testing.md` → "E2E Smoke + Flow".
- Minimum coverage: 80% on changed files per PR (where coverage tooling exists)
- Every bug fix includes a regression test

## Security Rules

- All secrets in `.env.local` only — never in code
- Input validation: Zod schema on every form and API route
- Auth check first line of every protected route
- CORS: restricted to `[your-domain.com]`
- Never log: passwords, tokens, full credit card numbers, SSNs

## Design System

> Skip this section if your project has no UI.

Colors, spacing, typography, and component patterns in:
`.claude/skills/design-system/SKILL.md`

Always read this before building any UI. Never hardcode color hex values in components.

## Architecture Decisions

[Document decisions that aren't obvious from the code.]

Examples:
- "We store chat logs as JSON files, not a database — simpler for USB portability."
- "All DB queries go through the `/lib/db` layer — never query from components directly."
- "We use server components by default, client components only when interactive."

## Git Rules

- Fix mistakes with `git revert` — not `git reset + force push`. Revert is safe, force push rewrites history.
- Only force push if user **explicitly asks** for it. Never do it to "clean up" history autonomously.
- Never amend a commit that is already pushed. Create a new commit instead.

## Off Limits (Do Not Touch Without Explicit Permission)

- [ ] [e.g., /lib/auth.ts — auth logic is frozen until security review]
- [ ] [e.g., database migrations — coordinate with team first]
- [ ] [e.g., stripe integration — payment code is audited separately]

## Current Focus

[What feature or bug is actively being worked on right now.]

## Known Issues

[Document tricky bugs or weird behaviors so the agent doesn't re-discover them.]

- None yet.

---

## 11. Forbidden Patterns

Project-wide. Add project-specific entries as you discover them.

- `any` TypeScript type — use `unknown` + narrow, or a proper type. (TS projects only)
- `// @ts-ignore` / `@ts-expect-error` without linked issue number. (TS projects only)
- `.catch(() => {})` silent failures — log + rethrow or handle explicitly.
- Hardcoded secrets / API keys — env vars only.
- `eval()` / `Function(...)` — never.
- `dangerouslySetInnerHTML` without DOMPurify-style sanitization. (UI projects only)
- Reading secret files (`.env`, `*.pem`, `*.key`, `secrets/`) via shell — blocked by hook.
- Untyped user input — validate (Zod / Pydantic / etc.) before processing.
- New code in any file already over hard LOC budget — extract first (see §19).
- Inline auth checks in routes (if backend) — use middleware.
- Raw DB queries inside route handlers (if backend) — use service layer.

## 12. File-Size Budgets

Read `file-budgets.json` at project root. CI fails on hard breach. Post-edit hook warns on soft breach.

Touch a file at hard limit → STOP. Extract the section to a new file (no-behavior-change move) FIRST, commit, THEN edit the new smaller file.

## 13. Session-Start Resume Protocol

Read `PROGRESS.md` on EVERY session start.

| File | Role | Updated when |
|---|---|---|
| `CLAUDE.md` | Root AI instructions; §13 = this protocol | Once, at start of project |
| `PROGRESS.md` | Live state of all phases | After every phase status change |
| `AUDIT_AND_ROADMAP.md` (if exists) | WHAT + WHY | Rarely, only on plan revisions |
| `git log` | Commit hashes per phase | Every commit |

If `PROGRESS.md` has a `🟡 in-progress` phase:
1. Run `/resume` slash command (or follow `PROGRESS.md` resume instructions verbatim).
2. Reconcile uncommitted changes against the phase plan.
3. `git pull --rebase` — pick up any commits another session/machine pushed.
4. Run typecheck + build + test.
5. Continue from next plan bullet.
6. Do NOT start a new phase until the active one is `✅ done`.

**Every commit auto-pushes.** `post-commit-push.js` hook runs after each successful `git commit`. Work survives disk death, machine swap, OS reinstall. Configure a git remote on day 1 OR work is local-only-safe (commit only protects from session death, not disk death).

## 14. When to Extract a Service / Module

> Applies mainly to backend / library projects. Skip if your project has no service layer.

Extract logic into a service/module when ANY trigger fires:

| Trigger | Reason |
|---|---|
| Same DB query in 3+ places | Single source of truth |
| Mutation requires 2+ steps | Centralize + transaction |
| Business rule appears > 1 place | Avoid drift |
| Handler / function > 80 LOC of logic | Readability |

See `rules/services.md` for service-class signature.

## 15. When to Split a Component / File

> For UI projects: split components. For all projects: split files before they hit hard budget.

Split a component (UI) or file (any project) BEFORE adding any new feature when ANY trigger fires:

| Trigger | Threshold |
|---|---|
| File LOC | > hard budget (`file-budgets.json`) |
| State variables | > 5 in one function/component |
| Dialogs / modals | > 2 in one component (UI only) |
| Domain concerns | > 3 unrelated responsibilities |

See `rules/frontend.md` for UI split pattern; `rules/refactor.md` for general split pattern.

## 16. Communication Style (caveman default)

Default response style is caveman-lite (see `.claude/skills/caveman-default/SKILL.md`).
Adjust via `.claude/identity.json` (`technicalLevel`, `verbosity`).

Cuts narration tokens ~40% without losing readability for a non-coder maintainer.

Write normally for: security warnings, irreversible action confirmations, multi-step sequences where compression risks misread, user-facing UI strings, error messages, code/commits/PRs.

User can switch via `/caveman lite|full|ultra` or `stop caveman`.

## 17. Graph-First Exploration

If `graphify-out/GRAPH_REPORT.md` exists, read it FIRST before any full-repo `grep` / `Glob`.

After structural changes (file add/rename/move/delete), run `/graphify` to update.

For "where is X" / "what calls Y" / "list uses of Z" questions, prefer the `graph-navigator` subagent — its output is caveman-compressed so main-thread context lasts longer.

`scripts/graphify-bootstrap.mjs` runs automatically on every SessionStart (wired in `.claude/settings.json`). It self-skips when source files < 50 OR when the existing graph is < 7 days old, so it's cheap when nothing needs doing. First session after the codebase crosses 50 files: graph generates without you asking. If `graphify` (the Python tool) isn't installed, the bootstrap prints the install hint and exits cleanly — surface that to the user so they can `pip install graphifyy`.

## 18. Test-Before-Commit Gate

Every commit passes ALL before commit. Paste actual terminal output in commit body if non-trivial.

The checklist varies by preset — see `commands.json` for your project's commands:

| Check | See commands.json key |
|---|---|
| Typecheck | `typecheck` |
| Lint | `lint` |
| Tests | `test` |
| Build | `build` |
| File-size | `filesize` |

No "I think it passes." No `.skip` without linked TODO + date.

Use `/checkpoint` slash command to run all of these + commit in one go.

## 19. AI Pre-Edit Checklist for Files Over Soft Budget

Before touching any file > soft budget OR any file > 400 LOC:

1. Read `rules/api.md`, `rules/services.md`, `rules/refactor.md`.
2. Identify edit range. Note line numbers.
3. If edit would grow file past current LOC → STOP. Extract that range into a new file as no-behavior-change move FIRST, commit, then edit there.
4. Search before adding helpers (use `graphify` to find canonical helpers).
5. typecheck + build both pass per-edit.
6. Commit with `wip(<phase-id>):` prefix if PROGRESS.md has an active phase.

[Project-specific "canonical helpers — do NOT duplicate" list goes here. Fill after first `/graphify` run.]

## 20. Hybrid SDD + TDD + Characterization Methodology

> Adapt to your project type. Not all projects have APIs or UIs.

| Building | Layer | Reason |
|---|---|---|
| New API route / endpoint | SDD (schema first) + TDD | Contract first, then test, then implement |
| New function / method | TDD (test → code → refactor) | Pure logic; no external interface |
| New UI component | Component test (Testing Library) | Render + interaction |
| Refactoring legacy code | Characterization → move → re-run | Behavior preservation |
| Bug fix | TDD (failing test → fix → green) | Regression prevention |

See `rules/methodology.md` for concrete examples.

## 21. Document Roles Split

| File | Role |
|---|---|
| `AUDIT_AND_ROADMAP.md` | WHAT + WHY. Rarely updated. |
| `PROGRESS.md` | WHERE + HOW to resume. Updated every phase change. |
| `CLAUDE.md` §13 | Session-start protocol gate (this section). |
| `docs/HANDOVER.md` | Plain-language owner doc (for non-coder maintainer). |
| `docs/ARCHITECTURE_PLAIN.md` | Plain-language architecture (for non-coder). |
| `docs/FINDINGS_AND_PLAN_PLAIN.md` | Plain-language audit (for non-coder). |
| `docs/LEARN_FULLSTACK.md` or `docs/LEARN.md` | Curated learning path tied to this codebase. |
| `git log` | Commit hashes per phase. |

Run `/audit` to generate / refresh AUDIT_AND_ROADMAP.md at project-maturity milestones.
Run `/handover` to generate / refresh the 4 plain-language docs.

## 22. Model Selection per Task

Every plan, phase, task block, or roadmap entry MUST carry an explicit per-task model assignment. Full vendor-neutral matrix + tradeoff explanation lives in `AGENTS.md` → "Model & Tool Selection per Task". This section adds Claude-Code-specific operational details.

### Project pin

`.claude/settings.json` carries `"model": "claude-sonnet-4-6"` (or current Sonnet) as the project default. Every fresh session in this repo opens on that model unless the user overrides with `/model`.

### Switching Claude models

- `/model opus` / `/model haiku` — swaps within the current session if the harness supports mid-session swap.
- If mid-session swap is not supported (current Claude Code behavior), close the session, open a new one, then `/model <target>` → `/resume`.
- **Never switch mid-task "just to try"** — costs the cache for no upside.

### Leaving Claude Code (DeepSeek / Gemini paths)

Before switching to Cursor / Aider / Continue / Gemini Studio / direct API:

1. `/checkpoint` — runs verification + commits current state in Claude Code so hooks fire.
2. Confirm push succeeded (`git status` shows "up to date with origin").
3. Open the alternate tool. Do the bulk / multimodal / translation work.
4. Return to Claude Code for verification: `bunx tsc --noEmit && <preset's lint/test/build commands>` so post-edit and file-budget hooks fire on the merged state.

### Per-phase assignment lives in `PROGRESS.md`

Every phase block carries a `Model:` line plus per-bullet annotation. Open the right model BEFORE marking the phase 🟡 in-progress.

### Concrete model lineup at template authorship (2026)

| Slot | Current name | Notes |
|---|---|---|
| Anthropic flagship | Opus 4.7 | Architecture, complex debug, copy, legal, security review |
| Anthropic workhorse | Sonnet 4.6 | Default project pin |
| Anthropic small | Haiku 4.5 | Status checks, mechanical edits |
| DeepSeek heavy | V4 Pro | Bulk codegen, mass test scaffolding |
| DeepSeek small | V4 Flash | Format / lint auto-fix |
| Google heavy | Gemini 3 Pro | Translation, multimodal QA, long-context |
| Google small | Gemini 3 Flash | Spell-check, screenshot smoke |

**Review at project adoption.** These names will go stale. Update both this section and `AGENTS.md` matrix when starting a new project from this template.

### Anti-patterns

- Opus for status checks, build runs, log inspection — burn for no upside.
- Sonnet for novel copywriting, brand voice, or architectural calls — output reads thin; you'll redo it.
- Leaving Claude Code without committing first — non-Claude tools don't fire `.claude/` hooks; you lose the safety net AND lose recovery if work is lost.
- Inheriting this lineup unchanged six months from now without checking what shipped since.
