---
description: Generate or refresh AUDIT_AND_ROADMAP.md from current code state. Run at project-maturity milestones.
---

# /audit

Produce a brutal-honest architecture audit + N-month roadmap. Fills `AUDIT_AND_ROADMAP.md` from the `AUDIT_AND_ROADMAP.template.md` skeleton.

## When to Run

- Project crosses ~50 source files (first audit).
- Before any major refactor (re-baseline).
- After every major architecture change.
- Quarterly for any live project.

## Steps

1. Check that `AUDIT_AND_ROADMAP.template.md` exists. If missing, ask user to run setup script first.
2. If `graphify-out/GRAPH_REPORT.md` exists, read it for big-picture structure. Else recommend running `/graphify` first.
3. For each Part of the template (1-13), gather evidence:
   - **Part 1.1 Architecture Score** — read entry points, count god files, eyeball test coverage, observe layering.
   - **Part 1.2 Code Org** — `Glob` for `**/*.{ts,tsx,js,jsx,dart,rs}`, count LOC per file, list any over hard budget.
   - **Part 1.3 Security** — read `.claude/rules/*.md` adherence, grep for forbidden patterns (`@ts-ignore`, `any`, `.catch(()=>{})`, hardcoded secrets, inline auth checks).
   - **Part 1.4 Database** — read schema / migrations folder. List FKs missing indexes. Identify CASCADE chains.
   - **Part 1.5 Maintainability** — assess "new dev day-one quit risk" from above.
   - **Part 1.6 Scalability** — guess breaking point + identify race conditions / N+1 / unbounded growth.
   - **Part 1.7 Code smells** — fill the table with concrete file:line citations.
   - **Part 2 Refactor blueprint** — propose target directory structure with LOC budgets matching `file-budgets.json`.
   - **Part 4 Testing** — count existing tests; propose next 10 if coverage is low.
   - **Part 5 Roadmap** — slice the refactor blueprint into Month 1/2/3 weeks.
   - **Part 9 Storage** — read schema, ask user for scale assumptions if needed.
4. Write the populated audit to `AUDIT_AND_ROADMAP.md` at project root. Date it.
5. Update `PROGRESS.md` plan reference to point at the new audit.
6. Suggest next: "Run `/handover` to refresh plain-language docs from this audit."

## Output (summary back to user)

```
AUDIT WRITTEN: AUDIT_AND_ROADMAP.md (N words)
ARCHITECTURE SCORE: X / 10
TOP 3 RISKS:
  1. <risk>
  2. <risk>
  3. <risk>
NEXT ACTIONS: see Part 5 — Month 1 Week 1.
```

## Rules

- Be brutal-honest. The audit is useless if it flatters.
- Cite file:line for every claim.
- Score conservatively. "8/10" is rare.
- Never propose a rewrite. Only refactors that preserve behavior.
- Match Part 5 roadmap to user's actual capacity (solo / team / part-time).
