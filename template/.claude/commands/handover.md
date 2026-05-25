---
description: Generate or refresh the 4 plain-language docs in docs/ (HANDOVER, ARCHITECTURE_PLAIN, FINDINGS_AND_PLAN_PLAIN, LEARN_FULLSTACK). For non-coder maintainers.
---

# /handover

Refresh the plain-language docs so a non-coder can pick up the project at any time.

## Steps

1. Check `docs/*.template.md` exists. Use them as skeletons.
2. Read `CLAUDE.md` (stack + commands), `PROGRESS.md` (current state), `AUDIT_AND_ROADMAP.md` (if exists), `package.json` / equivalent.
3. For each of the 4 docs, fill the template with real project-specific details:

| Doc | Fill with |
|---|---|
| `docs/HANDOVER.md` | App description, user types, real commands from `commands.json`, real off-limits list from CLAUDE.md §9 |
| `docs/ARCHITECTURE_PLAIN.md` | Real stack, real request flow (trace one real route from frontend → backend → DB), real file paths |
| `docs/FINDINGS_AND_PLAN_PLAIN.md` | Distil `AUDIT_AND_ROADMAP.md` into plain English |
| `docs/LEARN_FULLSTACK.md` | Replace example file paths with actual ones in this codebase |

4. Write each filled doc to `docs/<name>.md` (drop the `.template` suffix).
5. Preserve any user edits already in the non-template files (do a 3-way merge if possible).
6. Report back:
   ```
   HANDOVER DOCS REFRESHED:
     docs/HANDOVER.md          (N words, M file refs)
     docs/ARCHITECTURE_PLAIN.md
     docs/FINDINGS_AND_PLAN_PLAIN.md
     docs/LEARN_FULLSTACK.md
   ```

## Style Rules

- **No jargon without glossary entry.** First mention of any technical term → plain-English explanation in parentheses OR linked to the HANDOVER glossary.
- **Concrete file paths.** Never "the auth file" — always `lib/auth.ts` or whatever it actually is.
- **Real commands.** Never "run the test command" — always the literal `npm test` / `flutter test` / etc.
- **No marketing fluff.** "World-class platform" / "industry-leading" — delete.
- **Active voice.** "We log every action" not "Every action is logged."

## When to Run

- After first audit.
- After every major refactor.
- Before handing the project to a new owner / maintainer.
- Quarterly for any live project.

## Boundary

This is the ONE place AI should write at length in normal English (not caveman). The audience is a non-technical person who needs to understand without coaching.
