# [PROJECT NAME] — Fullstack App (Next.js + Prisma + PostgreSQL)

> Preset: **fullstack**. Stack pre-filled. Fill [BRACKETED] sections before first session.
> §§ 1–21 will be appended on final assembly. Keep this file under 300 lines.

## 1. What This Is

[One sentence: what does this app do and who uses it.]

## 2. Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript strict |
| UI | React 19 + Tailwind + shadcn/ui |
| ORM | Prisma 5 |
| Database | PostgreSQL 16 (local Docker; prod [Supabase / Neon / RDS]) |
| Auth | [NextAuth v5 / Clerk / Lucia] |
| Forms | React Hook Form + Zod |
| Server state | React Query (TanStack) |
| Client state | Zustand |
| Testing | Vitest + Playwright |
| Email | [Resend / Postmark] |
| Deployment | [Vercel / Railway / Fly.io] |

## 3. Commands

```bash
npm run dev          # Next dev (localhost:3000)
npm run build        # Production build
npm test             # Vitest
npm run test:e2e     # Playwright
npm run lint         # next lint
npm run typecheck    # tsc --noEmit
npm run db:migrate   # prisma migrate dev
npm run db:studio    # prisma studio
npm run db:reset     # prisma migrate reset (LOCAL ONLY — hook blocks prod)
```

## 4. Conventions

- App Router only; no Pages Router.
- Server Components default; `'use client'` only when interactive.
- API routes: `app/api/<route>/route.ts`, Zod-validated input, `{ data }` / `{ error, code }` response.
- DB access via Prisma client from `lib/db.ts` only — never inline `new PrismaClient()`.
- Auth check first line of every protected route handler / server action.
- Migrations: every schema change = `prisma migrate dev --name descriptive_name`.

## 5. Testing

- Unit: utilities, server actions, API route handlers.
- Integration: API routes against test DB (Docker postgres in CI).
- E2E (Playwright): signup → dashboard → 1 core mutation.
- Min 80% coverage on changed files.
- Bug fixes ship with regression test.

## 6. Design System

Tokens in `.claude/skills/design-system/SKILL.md`. shadcn/ui wrapped in `components/ui/` (whitelisted from file-size budget — shadcn-owned).

## 7. Architecture Decisions

- _e.g. "Server Components by default; client only when interactive."_
- _e.g. "All DB access via Prisma client from `lib/db.ts` — never inline `new PrismaClient()`."_
- _e.g. "Server actions for mutations; route handlers for read APIs consumed by 3rd parties."_

## 8. Git Rules

- Fix mistakes with `git revert`.
- Never force push.
- Migrations land in same PR as the code that uses them.

## 9. Off Limits

- [ ] `lib/auth.ts` — security audit required.
- [ ] `prisma/migrations/` — never edit applied migrations; write a new one.
- [ ] Production `DATABASE_URL` — local Docker only for dev.

## 10. Current Focus / Known Issues

[Active work.]

---

## 11. Forbidden Patterns

- `any` type — use `unknown` + narrow.
- `// @ts-ignore` without linked issue.
- `.catch(() => {})` silent fail.
- Inline auth checks — use middleware / `auth()` helper.
- Direct `new PrismaClient()` — import from `lib/db.ts`.
- Mutating DB without transaction when multi-statement.
- Audit-log actor from request body — use session user.

## 12. File-Size Budgets

See `file-budgets.json`. Hard breach → extract route to service first.

## 13. Session-Start Resume Protocol

See `PROGRESS.md`. If `🟡 in-progress` → `/resume`.

## 14. When to Extract a Service

| Trigger | Reason |
|---|---|
| Same Prisma query in 3+ routes / actions | Single source |
| Mutation needs 2+ statements | Centralise + `$transaction` |
| Route handler > 80 LOC of business logic | Readability |

See `rules/services.md`.

## 15. When to Split a Component

| Trigger | Threshold |
|---|---|
| File LOC | > 400 (page) / > 300 (leaf) |
| `useState` calls | > 5 |
| Dialogs / modals | > 2 |
| Domain concerns | > 3 |

## 16. Communication Style (caveman default)

caveman-lite default. Switch via `/caveman`.

## 17. Graph-First Exploration

If `graphify-out/GRAPH_REPORT.md` exists → read first. Run `/graphify` after structural changes.

## 18. Test-Before-Commit Gate

```bash
npx tsc --noEmit && npm run lint && npm test -- --run && npm run build && node scripts/check-file-sizes.mjs
```

Use `/checkpoint`.

## 19. Pre-Edit Checklist for Files Over Soft Budget

1. Read `rules/api.md`, `rules/services.md`, `rules/refactor.md`.
2. If edit grows file past current LOC → STOP, extract first.
3. Search for canonical helpers (especially in `lib/db.ts`, `lib/auth.ts`, `lib/utils.ts`).
4. typecheck + build per-edit.
5. Commit with `wip(<phase-id>):` prefix.

[Canonical helpers list — fill after first `/graphify`.]

## 20. Hybrid SDD + TDD + Characterization

See `rules/methodology.md`. For fullstack: Zod contract first → test against Prisma test DB → server action / route handler.

## 21. Document Roles

| File | Role |
|---|---|
| `AUDIT_AND_ROADMAP.md` | WHAT + WHY |
| `PROGRESS.md` | WHERE + HOW |
| `docs/HANDOVER.md` | Non-coder owner doc |
| `docs/ARCHITECTURE_PLAIN.md` | Plain-English architecture |
| `docs/FINDINGS_AND_PLAN_PLAIN.md` | Plain-English audit |
| `docs/LEARN_FULLSTACK.md` | Learning path |
| `git log` | Commit hashes per phase |

Run `/audit` to refresh audit. Run `/handover` to refresh plain docs.
