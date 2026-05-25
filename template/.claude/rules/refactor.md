---
paths:
  - "**/*"
---

# Refactor Rules (Always Loaded)

Forbidden patterns + component-split + service-extraction triggers + LOC budgets.

## File-Size Budgets (Read `file-budgets.json`)

CI fails on hard breach. Post-edit hook warns on soft breach.

Touch a file already > hard limit?
1. STOP. Do not add lines.
2. Extract the section you wanted to edit into a new file (no-behavior-change move).
3. Run typecheck + build to prove the move is safe.
4. Commit the extraction with `refactor(<scope>): extract X into Y`.
5. Now edit the new (smaller) file.

## Forbidden Patterns (Universal)

| Pattern | Why forbidden | Use instead |
|---|---|---|
| `any` TypeScript type | Hides bugs, defeats compiler | `unknown` + narrow, or proper type |
| `// @ts-ignore` / `@ts-expect-error` w/o issue # | Disables compiler silently | Fix the root cause |
| `.catch(() => {})` | Silent failure invisible in prod | Log + rethrow or handle |
| Inline auth checks | Easy to forget on new routes | Middleware (`requireAuth` / `requireRole`) |
| Raw DB queries in route handlers | No reuse, no audit | Service layer |
| Hardcoded secrets / API keys | Leak risk | Env vars |
| Reading/printing a secret file (`.env`, `.dev.vars`, `*.pem/*.key/*.p12`, `secrets/`) | Leaks credentials into the transcript | Let the runtime load them; never `cat`/`type`/echo. Hook + `Read` deny enforce this. |
| `eval()` / `Function(...)` | Code injection | Never. No exception. |
| `dangerouslySetInnerHTML` w/o sanitization | XSS | DOMPurify first |
| `process.env.X` outside config bootstrap | Untracked dependency | Centralised `config.ts` |
| `.skip` on tests w/o linked TODO + date | Silent test loss | Fix the test or delete it |
| Module-level mutable state | Hard to test, race conditions | Pass via constructor / scope |

## Component-Split Triggers (Frontend)

See `rules/frontend.md` for full table. Split BEFORE adding feature.

## Service-Extraction Triggers (Backend)

See `rules/services.md` for full table. Extract BEFORE adding feature.

## Pre-Edit Checklist for Files Over Soft Limit

1. Read `rules/api.md`, `rules/services.md`, `rules/refactor.md`.
2. Identify edit range. Note line numbers.
3. If edit will grow file past current LOC → STOP. Extract first.
4. Search before adding a helper — duplicates ruin maintainability.
5. typecheck + build must both pass after every edit.
6. Commit with `wip(phase-id):` prefix if PROGRESS.md has an active phase.

## Refactor Commit Discipline

- One commit = one logical change. Never "various fixes".
- Conventional commits: `feat | fix | refactor | test | docs | chore | wip | done`.
- Extraction commit message format: `refactor(<scope>): extract <what> into <new-file>`.
- Squash `wip(...)` commits at phase end ONLY if `git rebase -i` is safe (branch hasn't been shared).

## Anti-Pattern: "Fixing While I'm Here"

If you spot another problem while editing — DO NOT fix it in the same commit. Either:
- File a new task in PROGRESS.md and continue with current scope, OR
- Finish current scope, commit, then start a new phase for the new problem.

Scope creep destroys reviewability and breaks per-edit-commit discipline.
