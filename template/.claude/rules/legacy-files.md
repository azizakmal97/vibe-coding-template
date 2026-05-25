---
paths:
  - "**/*"
---

# Legacy / Big File Pre-Edit Checklist

Loaded for all files. Triggers when you're about to edit a file > soft budget OR > 400 LOC.

## Decision Tree

```
About to edit a file?
├─ File ≤ soft budget → just edit (still per-edit commit).
├─ File between soft and hard budget → continue with caution; do NOT add LOC if avoidable.
└─ File > hard budget → STOP. Extract first.
```

## Pre-Edit Checklist

Before touching any file > soft budget:

1. Read `rules/api.md`, `rules/services.md`, `rules/refactor.md`.
2. Identify edit range. Note line numbers.
3. **If your edit would grow the file past current LOC → STOP.**
   - Extract that range (or a related cohesive range) into a new file.
   - The extraction is a no-behavior-change move.
   - Verify with `typecheck + build`.
   - Commit: `refactor(<scope>): extract <what> into <new-file>`.
4. Search before adding a helper — duplicates are forbidden.
   - Use `graphify-out/GRAPH_REPORT.md` if it exists.
   - Use `Grep` for `function <name>` / `const <name> =` / `export function`.
5. `typecheck && build` must both pass per-edit (see `rules/testing.md`).
6. Commit with `wip(<phase-id>):` prefix if `PROGRESS.md` has an active phase.

## Canonical Helpers — Do NOT Duplicate

> Fill in after first `/graphify` run. List utilities that already exist so AI doesn't recreate them.

| Helper | Location | Purpose |
|---|---|---|
| _e.g. canonicalEmail()_ | _lib/utils.ts:42_ | _normalises email for storage_ |
| _e.g. logAction()_ | _lib/audit.ts:18_ | _writes audit log entry_ |
| _e.g. requireRole()_ | _lib/middleware/auth.ts_ | _role check middleware_ |

Add to this list AS YOU FIND helpers. Future AI sessions read it FIRST to avoid duplication.

## Refusal Triggers

The AI MUST refuse to add code when:
- The target file is already over hard budget. (Extract first.)
- The change would duplicate a canonical helper. (Use the canonical one.)
- The change adds inline auth / DB access in a route handler. (Use middleware / service.)
- The change introduces a `any` type. (Type it properly.)

If the refusal is wrong (e.g. user has a legit reason), the user must say so explicitly. Don't second-guess without confirmation.
