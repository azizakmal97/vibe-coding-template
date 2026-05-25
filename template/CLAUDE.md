# [PROJECT NAME] — Project Brain

> SETUP: Delete this line. Fill every [BRACKETED] section before first Claude session.
> This file loads every session. Keep it under 200 lines. Be specific, not verbose.

## What This Is

[One sentence: what does this app do and who uses it.]

Example: "A SaaS dashboard for freelancers to track invoices and client payments."

## Stack

| Layer | Choice |
|-------|--------|
| Frontend | [Next.js 15 / React 19 / Vue 3] |
| Backend | [Next.js API Routes / Node Express / Python FastAPI] |
| Database | [PostgreSQL via Prisma / Supabase / MongoDB] |
| Auth | [Clerk / NextAuth v5 / Supabase Auth] |
| State | [Zustand / Jotai / none — server state only] |
| Styling | [Tailwind CSS + shadcn/ui] |
| Testing | [Vitest + Playwright] |
| Deployment | [Vercel / Railway / Fly.io] |

## Commands

```bash
npm run dev       # Start dev server at localhost:3000
npm run build     # Production build
npm test          # Run unit + integration tests
npm run test:e2e  # Run Playwright E2E tests
npm run lint      # ESLint check
npm run typecheck # TypeScript check (must be zero errors)
```

## Conventions

- TypeScript strict mode — zero `any` types, ever
- Component naming: PascalCase files, one component per file
- Hook naming: `useHookName.ts` in `/hooks` or `/lib/hooks`
- API response shape: `{ data: T }` success, `{ error: string, code: string }` failure
- Error handling: [describe your pattern — try/catch? Result type? Error boundary?]
- State: useState for UI-only, Zustand for shared/global, React Query for server state
- Imports: absolute paths via `@/` alias — no relative `../../` beyond 1 level

## Testing Requirements

- Unit tests: all utility functions, all API handlers
- Integration tests: critical user flows
- E2E tests (Playwright): [list your critical paths, e.g., "signup → dashboard → create invoice"]
- Minimum coverage: 80% on changed files per PR
- Every bug fix includes a regression test

## Security Rules

- All secrets in `.env.local` only — never in code
- Input validation: Zod schema on every form and API route
- Auth check first line of every protected route
- CORS: restricted to `[your-domain.com]`
- Never log: passwords, tokens, full credit card numbers, SSNs

## Design System

Colors, spacing, typography, and component patterns in:
`.claude/skills/design-system/SKILL.md`

Always read this before building any UI. Never hardcode color hex values in components.

## Architecture Decisions

[Document decisions that aren't obvious from the code.]

Example:
- "We use Zustand over Redux because the app state is simple and we wanted minimal boilerplate."
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

- `any` TypeScript type — use `unknown` + narrow, or a proper type.
- `// @ts-ignore` / `@ts-expect-error` without linked issue number.
- `.catch(() => {})` silent failures — log + rethrow or handle explicitly.
- Inline auth checks (`if (!jwt) return 401`) — use middleware.
- Raw DB queries inside route handlers — use service layer (`rules/services.md`).
- Hardcoded secrets / API keys — env vars only.
- `eval()` / `Function(...)` — never.
- `dangerouslySetInnerHTML` without DOMPurify-style sanitization.
- Audit-log actor from request body — use verified `jwt.sub` / session user.
- Untyped JSON body — Zod-validate first, then destructure.
- New routes in any file already over hard LOC budget — extract first (see §19).

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

## 14. When to Extract a Service

Extract logic into a service when ANY trigger fires:

| Trigger | Reason |
|---|---|
| Same DB query in 3+ routes | Single source of truth |
| Mutation requires 2+ statements | Centralise + transaction |
| Business rule appears > 1 place | Avoid drift |
| Route handler > 80 LOC of business logic | Readability |

See `rules/services.md` for service-class signature.

## 15. When to Split a Component

Split a frontend component BEFORE adding any new feature when ANY trigger fires:

| Trigger | Threshold |
|---|---|
| File LOC | > hard budget |
| `useState` calls | > 5 in one component |
| Dialogs / sheets / modals | > 2 in one component |
| Domain concerns | > 3 unrelated responsibilities |

See `rules/frontend.md` for split pattern.

## 16. Communication Style (caveman default)

Default response style is caveman-lite (see `.claude/skills/caveman-default/SKILL.md`).

Cuts narration tokens ~40% without losing readability for a non-coder maintainer.

Write normally for: security warnings, irreversible action confirmations, multi-step sequences where compression risks misread, user-facing UI strings, error messages, code/commits/PRs.

User can switch via `/caveman lite|full|ultra` or `stop caveman`.

## 17. Graph-First Exploration

If `graphify-out/GRAPH_REPORT.md` exists, read it FIRST before any full-repo `grep` / `Glob`.

After structural changes (file add/rename/move/delete), run `/graphify` to update.

For "where is X" / "what calls Y" / "list uses of Z" questions, prefer the `graph-navigator` subagent — its output is caveman-compressed so main-thread context lasts longer.

If codebase > 50 source files and no graph exists, run `node scripts/graphify-bootstrap.mjs`.

## 18. Test-Before-Commit Gate

Every commit passes ALL before commit. Paste actual terminal output in commit body if non-trivial:

| Check | Command (web preset) |
|---|---|
| Typecheck | `npx tsc --noEmit` |
| Lint | `npm run lint` |
| Tests | `npm test -- --run` |
| Build | `npm run build` |
| File-size | `node scripts/check-file-sizes.mjs` |

Other presets: see `commands.json`.

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

| Building | Layer | Reason |
|---|---|---|
| New API route | SDD (Zod contract) + TDD (test first) | Contract first, then test, then implement |
| New service method | TDD | Pure logic; no external interface |
| New frontend component | Component test (Testing Library) | Render + interaction |
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
| `docs/LEARN_FULLSTACK.md` | Curated learning path tied to this codebase. |
| `git log` | Commit hashes per phase. |

Run `/audit` to generate / refresh AUDIT_AND_ROADMAP.md at project-maturity milestones.
Run `/handover` to generate / refresh the 4 plain-language docs.
