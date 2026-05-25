---
paths:
  - "src/api/**/*"
  - "src/server/**/*"
  - "src/lib/server/**/*"
  - "app/api/**/*"
  - "pages/api/**/*"
  - "server/**/*"
---

# Backend / API Rules

Loaded automatically when editing API route or server files.

## Route Template

Every API route follows this exact structure:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth' // or your auth method

const RequestSchema = z.object({
  field: z.string().min(1).max(255),
})

export async function POST(req: NextRequest) {
  // 1. Auth check — always first
  const session = await getServerSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 })
  }

  // 2. Validate input
  const body = await req.json()
  const result = RequestSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.message, code: 'VALIDATION_ERROR' }, { status: 400 })
  }

  // 3. Business logic
  try {
    const data = await doSomething(result.data)
    return NextResponse.json({ data })
  } catch (error) {
    console.error('[POST /api/resource]', error) // Log server-side
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
```

## Consistent Response Shape

```typescript
// Success
{ data: T }
{ data: T, meta: { total: number, page: number, pageSize: number } }

// Error — always this shape, never variations
{ error: string, code: string }
```

## Authentication

- Check session as line 1 of every protected handler
- Never trust client-provided user IDs — use session user ID
- Never trust client-provided role claims — verify from database

## Validation

- Validate ALL inputs: body, params, query string, headers
- Zod schemas defined at top of file or in `/lib/schemas/`
- Use `safeParse` and return 400 on failure — never let invalid data through

## Error Handling

- Log full error server-side: `console.error('[route]', error)`
- Return generic message to client — no stack traces, no DB error messages
- Consistent error codes for client-side handling: `AUTH_REQUIRED`, `NOT_FOUND`, `VALIDATION_ERROR`, `INTERNAL_ERROR`

## Database

- All queries through ORM layer (`/lib/db.ts` or Prisma client)
- Transactions for operations that modify multiple records
- Handle unique constraint violations explicitly (return 409, not 500)

## Rate Limiting

Apply to:
- All auth endpoints (login, signup, password reset)
- Expensive operations (AI calls, email sends, file processing)
- Any endpoint with user-provided external requests

## Service-Layer Extraction (Mandatory Triggers)

Extract logic from route handler into a service when ANY trigger fires:

| Trigger | Reason |
|---|---|
| Same DB query used by 3+ routes | Single source of truth |
| Mutation requires 2+ statements | Wrap in transaction; centralise |
| Business rule (validation, derived field, audit log) appears in > 1 place | Avoid drift |
| Route handler exceeds 80 LOC of business logic | Readability |

Service rules:
- Services NEVER read `req` / `c.req` / `jwt` directly. Accept `(env, actorId)` in constructor.
- Every mutating method takes `actorId` and writes an audit log entry before returning.
- Multi-statement mutations MUST use the transaction wrapper (`withTx` / `prisma.$transaction` / equivalent).
- Services are stateless. No module-level mutable state.

See `rules/services.md` for full pattern.

## Forbidden Patterns

- Inline auth (`if (!jwt) return 401`) — use middleware (`requireAuth()` / `requireRole()`).
- Raw DB queries inside route handlers — go through service.
- `any` TypeScript type — define proper type or use `unknown` + narrow.
- `// @ts-ignore` / `// @ts-expect-error` without linked issue.
- `.catch(() => {})` silent failures — log + rethrow or handle explicitly.
- Audit-log actor from request body — always use `jwt.sub` / verified session user.
- Untyped JSON body — always Zod-validate before destructuring.
