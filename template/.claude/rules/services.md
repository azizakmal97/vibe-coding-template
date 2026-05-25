---
paths:
  - "src/services/**/*"
  - "lib/services/**/*"
  - "worker/services/**/*"
  - "services/**/*"
---

# Service Layer Rules

Loaded automatically when editing service files.

## When to Create a Service

Extract logic into a service when ANY trigger fires:

| Trigger | Reason |
|---|---|
| Same DB query in 3+ routes | Single source of truth |
| Mutation requires 2+ statements | Centralise + wrap in transaction |
| Business rule appears in > 1 place | Avoid drift |
| Route handler exceeds 80 LOC of business logic | Readability |

## Service Class Signature

Services accept `(env, actorId)` in constructor. They do NOT read `req`, `c.req`, or `jwt` directly — those belong in the route handler.

```ts
class VisitService {
  constructor(private env: Env, private actorId: string) {}

  async create(input: CreateVisitInput): Promise<Visit> {
    // business logic + audit log
  }

  async update(id: string, patch: UpdateVisitPatch): Promise<Visit> { /* ... */ }
}
```

Route handler usage:
```ts
app.post('/api/visits', requireRole('registrar', 'admin'), async (c) => {
  const body = CreateVisitRequest.parse(await c.req.json());
  const jwt = c.get('jwtPayload')!;
  const visit = await new VisitService(c.env, jwt.sub).create(body);
  return ok(c, visit);
});
```

## Mandatory Properties

1. **Stateless** — no module-level mutable state. Every call independent.
2. **Audit log on every mutation** — write to `audit_logs` (or equivalent) BEFORE returning. Use `actorId` (from constructor), never trust body.
3. **Transaction wrapper** for multi-statement mutations:
   ```ts
   await withTx(this.env, async (tx) => {
     await tx.execute(insertVisit);
     await tx.execute(insertVisitDoctors);
   });
   ```
4. **Typed input + output** — Zod-inferred input types, explicit return type. No `any`.
5. **No HTTP concerns** — do NOT return `Response` objects. Throw `AppError` or return domain objects.

## Error Convention

```ts
class AppError extends Error {
  constructor(public message: string, public status: number, public code: string) { super(message); }
}

// In service:
if (!patient) throw new AppError('Patient not found', 404, 'NOT_FOUND');

// In global error handler:
app.onError((err, c) => {
  if (err instanceof AppError) return c.json({ error: err.message, code: err.code }, err.status);
  console.error(err);
  return c.json({ error: 'Internal error', code: 'INTERNAL_ERROR' }, 500);
});
```

## Naming

- Class name: `<Domain>Service` (e.g. `PatientService`, `OrderService`).
- File name: `PatientService.ts` (matches class).
- One service per file.
- Methods named for business operation: `create`, `assignDoctors`, `transferOwnership`, `archive`. Not CRUD-generic when business operation is specific.

## Forbidden in Services

- Reading `req` / `c.req` / `request` (HTTP coupling — belongs in route).
- Returning HTTP `Response` (belongs in route).
- Direct env var access (`process.env.X`) — accept config in constructor.
- Module-level mutable state.
- Auto-retrying failed external calls inside a transaction.
