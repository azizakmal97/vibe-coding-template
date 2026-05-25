---
paths:
  - "prisma/**/*"
  - "drizzle/**/*"
  - "src/db/**/*"
  - "lib/db/**/*"
  - "migrations/**/*"
  - "*.sql"
---

# Database Rules

Loaded automatically when editing schema, migration, or query files.

## Schema Change Protocol

**Adding a column:** OK. Always include a default value.
```sql
ALTER TABLE users ADD COLUMN display_name TEXT NOT NULL DEFAULT '';
```

**Removing a column:** NOT OK directly. Follow this process:
1. Deploy code that stops reading/writing the column
2. Wait one release cycle
3. Then drop the column in next release

**Renaming a column:** NOT OK. Instead:
1. Add new column with new name
2. Migrate data: `UPDATE table SET new_name = old_name`
3. Deploy code using new column
4. Drop old column next release

**Changing column type:** Extreme caution. Always test on a copy first.

## Every Migration Needs

1. Forward migration (the change)
2. Rollback migration (how to undo it)
3. Test on dev database before staging/prod
4. Documented estimated run time for large tables

```sql
-- migration: 20240315_add_user_display_name.sql
ALTER TABLE users ADD COLUMN display_name TEXT NOT NULL DEFAULT '';

-- rollback: 20240315_rollback_user_display_name.sql
ALTER TABLE users DROP COLUMN display_name;
```

## Accidental Deletion Prevention

### Rule: Use Soft Deletes, Not Hard Deletes

Never `DELETE FROM` on user-created content. Add `deletedAt` instead:

```typescript
// Schema — add to every user-content table
model Post {
  id        String    @id
  deletedAt DateTime? // null = active, timestamp = deleted
}

// Delete = set timestamp, not remove row
await prisma.post.update({
  where: { id },
  data: { deletedAt: new Date() }
})

// All queries MUST filter deleted records
await prisma.post.findMany({
  where: { deletedAt: null }  // Never forget this
})
```

Hard `DELETE` only on: sessions, temp tokens, audit logs older than retention period.

### Rule: WHERE Clause Audit Before Any Delete/Update

Before writing any DELETE or UPDATE, state:
1. "This affects rows where [condition]"
2. "Estimated row count: [run SELECT COUNT(*) first]"
3. Run `SELECT COUNT(*) WHERE [same condition]` before the write

```typescript
// Always COUNT before bulk UPDATE/DELETE
const affected = await prisma.post.count({ where: { status: 'draft', authorId: userId } })
console.log(`About to update ${affected} rows`) // Verify this looks right
await prisma.post.updateMany({ where: { status: 'draft', authorId: userId }, data: { ... } })
```

### Rule: Cascade Delete Awareness

Before adding `onDelete: Cascade` to any foreign key — state what records will be deleted transitively. Document it in the schema:

```prisma
model Order {
  items OrderItem[] @relation(onDelete: Cascade) // CASCADES: deleting Order removes all OrderItems
}
```

If cascade would delete >1 table of data, use `onDelete: Restrict` and handle deletion explicitly in code.

### Rule: prisma db push — Data Loss Flag

`prisma db push` silently drops columns that no longer exist in schema.

Before running: compare schema diff first:
```bash
prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma
```

If output contains `Drop` → write a migration instead, do not use `db push`.

## Query Rules

```typescript
// ORM only — no string interpolation
// WRONG:
const users = await db.query(`SELECT * FROM users WHERE id = ${userId}`)

// CORRECT (Prisma):
const users = await prisma.user.findUnique({ where: { id: userId } })

// CORRECT (raw SQL when needed — parameterized only):
const users = await db.execute(sql`SELECT * FROM users WHERE id = ${userId}`)
```

- Never `SELECT *` in production — list columns explicitly
- Always paginate: include `limit` and `offset` / cursor on list queries
- Add database index for every column used in `WHERE`, `JOIN`, or `ORDER BY`

## Sensitive Data

```typescript
// Passwords — bcrypt, never plaintext
import bcrypt from 'bcryptjs'
const hash = await bcrypt.hash(password, 12)
const valid = await bcrypt.compare(password, hash)

// Password reset tokens — hash before storing
import crypto from 'crypto'
const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
// Store tokenHash, send raw token to user

// Never store: plaintext passwords, raw reset tokens, API keys
```

## Transactions

Required when:
- Creating multiple related records together
- Financial or inventory operations
- Any "all succeed or all fail" operation

```typescript
await prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data: orderData })
  await tx.orderItem.createMany({ data: itemsData.map(i => ({ ...i, orderId: order.id })) })
  await tx.inventory.update({ where: { id: item.id }, data: { quantity: { decrement: qty } } })
})
```

## CASCADE Backup Pattern (Critical)

If a table has child tables with `ON DELETE CASCADE`, **back up children before recreating parent**:

```sql
-- Before any DROP TABLE on a parent with cascades:
CREATE TABLE _backup_visit_doctors AS SELECT * FROM visit_doctors;
CREATE TABLE _backup_diagnoses    AS SELECT * FROM diagnoses;
-- Now safe to recreate parent.
DROP TABLE visits;
CREATE TABLE visits ( ... );
-- Reinsert children.
INSERT INTO visit_doctors SELECT * FROM _backup_visit_doctors;
DROP TABLE _backup_visit_doctors;
```

State in migration comment header which child tables cascade. Future agents searching the codebase will find it.

## INSERT Binding Lockstep Rule

Column count, `?` placeholder count, and `.bind()` argument count MUST match exactly:

```typescript
// WRONG — 3 columns, 2 placeholders, 4 binds
db.prepare('INSERT INTO users (id, email, role) VALUES (?, ?)').bind(id, email, role, extra)

// RIGHT — all three counts equal
db.prepare('INSERT INTO users (id, email, role) VALUES (?, ?, ?)').bind(id, email, role)
```

Mismatch = silent corruption on SQLite, runtime error on Postgres. Adding a column to an INSERT requires updating ALL THREE in one commit.

## Production DB Flag (Cloudflare D1 / Supabase / Neon)

For cloud-hosted databases with a separate `--remote` / `--prod` flag, **always pass the flag explicitly** when querying production:

```bash
# Cloudflare D1
npx wrangler d1 execute MY_DB --remote --command "SELECT 1"

# Supabase CLI
supabase db --linked execute "SELECT 1"
```

Hooks in `.claude/hooks/pre-db-migrate.js` block migrations against URLs that look like production. Do NOT bypass.

## Schema Conventions

- Naming: snake_case (most engines) or camelCase (MongoDB) — pick one per project and never mix.
- Every table has: `id` (uuid or autoincrement), `created_at`, `updated_at` (auto-managed).
- Every FK gets an index. CI should flag missing FK indexes (add a check).
- Denormalization is OK when documented — add a comment in the schema and in `database.md`.
- Migration naming: `NNNN_descriptive_name.sql` (or framework convention like Prisma).
