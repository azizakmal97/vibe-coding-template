---
description: Generate + apply a DB migration. Wraps migration-writer agent + local-first apply + verify.
---

# /migrate

End-to-end DB migration workflow. Local-first. Safe by default.

## Steps

1. **Spawn `migration-writer` subagent** with user's intent (e.g. "add `display_name` column to users"). Agent:
   - Detects DB engine (Prisma / Drizzle / Cloudflare D1 / plain SQL).
   - Generates migration file with safety pattern (forward + rollback + CASCADE notes + runtime estimate).
   - Refuses destructive ops without explicit confirmation phrase.
2. **Show user the generated file** before applying. User reviews.
3. **Apply LOCAL first** (engine-specific):
   - Prisma: `npx prisma migrate dev --name <name>`
   - D1: `npm run db:migrate:local` (or `wrangler d1 migrations apply DB --local`)
   - Drizzle: `npx drizzle-kit migrate`
4. **Verify schema** with sample query:
   ```bash
   # Prisma
   npx prisma studio
   # D1
   wrangler d1 execute DB --local --command "SELECT sql FROM sqlite_master WHERE name='users'"
   # plain SQL
   psql -d $DATABASE_URL -c "\d users"
   ```
5. **Run test suite** — migration may break tests.
6. **Commit migration file** with message: `feat(db): <descriptive>`. Auto-pushed.
7. **Apply REMOTE only after** user explicitly confirms ("yes apply remote"):
   - D1: `npm run db:migrate:remote`
   - Prisma: `npx prisma migrate deploy` (in CI usually)
8. **Update PROGRESS.md** if part of an active phase.

## Refuse Conditions

- Migration file contains `DROP TABLE` / `TRUNCATE` / `DELETE FROM` without WHERE — require confirmation phrase from migration-writer agent.
- Production DB URL detected in current env without `--remote` flag — block.
- Local migration not applied OR local tests not run — block remote apply.
- Working tree dirty (uncommitted) — checkpoint first.

## Output Format

```
MIGRATION GENERATED: <path>
LOCAL APPLIED:       <yes/no>
TESTS:               <green/red>
SCHEMA VERIFIED:     <yes/no>
COMMITTED:           <hash>
PUSHED:              <yes/no>
REMOTE APPLIED:      <yes/no — requires user confirm>
```
