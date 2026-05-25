# [PROJECT NAME] — Web App (React + Vite + TS)

> Preset: **web**. Stack pre-filled. Fill [BRACKETED] sections before first session.
> §§ 1–21 will be appended on final assembly. Keep this file under 300 lines.

## 1. What This Is

[One sentence: what does this app do and who uses it.]

## 2. Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + Vite 6 |
| Language | TypeScript 5 strict |
| Styling | Tailwind CSS + shadcn/ui |
| State | Zustand (shared) + React Query (server) + useState (local) |
| Routing | React Router 6 |
| Forms | React Hook Form + Zod |
| Testing | Vitest + @testing-library/react + Playwright (E2E) |
| Auth | [Clerk / Supabase Auth / Auth0] |
| Backend | [your API URL or `none — static SPA`] |
| Deployment | [Vercel / Cloudflare Pages / Netlify] |

## 3. Commands

```bash
npm run dev        # Vite dev server (localhost:5173)
npm run build      # Production build
npm test           # Vitest unit + integration
npm run test:e2e   # Playwright
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

## 4. Conventions

- TypeScript strict — zero `any`.
- Components: PascalCase.tsx, one per file.
- Hooks: `useFooBar.ts` in `src/hooks/`.
- Imports: `@/` alias; no `../../` beyond 1 level.
- Tailwind only; no inline hex (use design-system tokens).
- API response shape: `{ data }` / `{ error, code }`.

## 5. Testing

- Unit: every utility + every hook.
- Integration: critical user flows.
- E2E: signup → core flow → logout.
- Min 80% coverage on changed files per PR.
- Every bug fix ships with regression test.

## 6. Design System

Tokens in `.claude/skills/design-system/SKILL.md`. Read before any UI work. Never hardcode hex.

## 7. Architecture Decisions

[Document non-obvious choices.]

- _e.g. "React Query for server state, Zustand for client-shared, useState for local."_
- _e.g. "All API calls go through `src/lib/api-client.ts` — never inline `fetch`."_

## 8. Git Rules

- Fix mistakes with `git revert`, not `git reset + force push`.
- Never force push unless explicitly asked.
- Never amend an already-pushed commit.

## 9. Off Limits

- [ ] _e.g. `src/lib/auth.ts` — frozen until security review._
- [ ] _e.g. database migrations — coordinate before adding._

## 10. Current Focus / Known Issues

[What's actively being worked on. Tricky bugs to know about.]

---

## 11. Forbidden Patterns

- `any` type — use `unknown` + narrow.
- `// @ts-ignore` without linked issue.
- `.catch(() => {})` silent fail.
- Inline auth checks — use middleware.
- Raw `fetch` in components — use api-client hook.
- Hardcoded secrets — env vars only.
- `dangerouslySetInnerHTML` without sanitization.

## 12. File-Size Budgets

See `file-budgets.json`. Hard breach → extract first.

## 13. Session-Start Resume Protocol

See `PROGRESS.md`. If `🟡 in-progress` phase exists → run `/resume` before any other action.

| File | Role |
|---|---|
| `CLAUDE.md` | Root AI instructions |
| `PROGRESS.md` | Live phase state |
| `AUDIT_AND_ROADMAP.md` | WHAT + WHY (rarely updated) |
| `git log` | Commit hashes per phase |

## 14. When to Extract a Service / Custom Hook

Extract logic when ANY trigger fires:
- Same network call / data shape in 3+ components → custom hook.
- Mutation requires 2+ steps → service or hook with internal coordination.
- Business rule appears > 1 place → extract.

See `rules/services.md`.

## 15. When to Split a Component

| Trigger | Threshold |
|---|---|
| File LOC | > 400 (page) / > 300 (leaf) |
| `useState` calls | > 5 |
| Dialogs / modals | > 2 |
| Domain concerns | > 3 |

See `rules/frontend.md`.

## 16. Communication Style (caveman default)

caveman-lite default. Switch via `/caveman lite|full|ultra`. Write normally for security, irreversible ops, UI strings.

## 17. Graph-First Exploration

If `graphify-out/GRAPH_REPORT.md` exists → read it FIRST. After structural changes → run `/graphify`. Use `graph-navigator` agent for "where is X" questions.

## 18. Test-Before-Commit Gate

```bash
npx tsc --noEmit && npm run lint && npm test -- --run && npm run build && node scripts/check-file-sizes.mjs
```

All green or no commit. Use `/checkpoint` to run + commit in one go.

## 19. Pre-Edit Checklist for Files Over Soft Budget

1. Read `rules/api.md`, `rules/services.md`, `rules/refactor.md`.
2. If edit grows file past current LOC → STOP, extract first.
3. Search before adding helpers.
4. typecheck + build per-edit.
5. Commit with `wip(<phase-id>):` prefix.

[Canonical helpers list — fill after first `/graphify`.]

## 20. Hybrid SDD + TDD + Characterization

See `rules/methodology.md`.
- New API call / hook: TDD.
- New component: component test.
- Refactor legacy: characterization → move → re-run.
- Bug fix: failing test → fix → green.

## 21. Document Roles

| File | Role |
|---|---|
| `AUDIT_AND_ROADMAP.md` | WHAT + WHY |
| `PROGRESS.md` | WHERE + HOW |
| `docs/HANDOVER.md` | Non-coder owner doc |
| `docs/ARCHITECTURE_PLAIN.md` | Plain-English architecture |
| `docs/FINDINGS_AND_PLAN_PLAIN.md` | Plain-English audit |
| `docs/LEARN_FULLSTACK.md` | Learning path tied to this codebase |
| `git log` | Commit hashes per phase |

Run `/audit` to refresh AUDIT_AND_ROADMAP.md. Run `/handover` to refresh plain-English docs.
