---
paths:
  - "**/*"
---

# Hybrid Methodology: SDD + TDD + Characterization

Three-layer approach. Pick the right layer for what you're building.

## Layer A — SDD (Spec-Driven) for API Contracts

Every API route gets a Zod schema BEFORE the handler. The schema doubles as documentation and as the inferred TypeScript type for frontend.

```ts
// lib/contracts/invoices.contracts.ts
import { z } from 'zod';

export const CreateInvoiceRequest = z.object({
  client_id: z.string().uuid(),
  line_items: z.array(z.object({
    description: z.string().min(1),
    amount_cents: z.number().int().positive(),
  })).min(1),
  due_date: z.string().datetime(),
});

export const CreateInvoiceResponse = z.object({
  id: z.string().uuid(),
  total_cents: z.number().int(),
  status: z.enum(['DRAFT', 'SENT', 'PAID']),
});

export type CreateInvoiceInput = z.infer<typeof CreateInvoiceRequest>;
```

Route handler:
```ts
app.post('/api/invoices', requireRole('user'), async (c) => {
  const body = CreateInvoiceRequest.parse(await c.req.json());  // throws ZodError
  const jwt = c.get('jwtPayload')!;
  const invoice = await new InvoiceService(c.env, jwt.sub).create(body);
  return ok(c, invoice);
});
```

Benefits: contract IS the docs (OpenAPI generates from Zod), frontend imports same type, schema changes caught at compile time.

## Layer B — TDD (Test-Driven) for Service Logic

Every new service method: write the test FIRST, watch it fail, write minimum code to pass, refactor.

```ts
// lib/services/__tests__/invoice-service.test.ts
test('InvoiceService.create stores total + line items atomically', async () => {
  const env = await createTestEnv();
  const svc = new InvoiceService(env, 'user-test-id');
  const invoice = await svc.create({
    client_id: 'client-1',
    line_items: [
      { description: 'Design', amount_cents: 50_000 },
      { description: 'Code',   amount_cents: 100_000 },
    ],
    due_date: '2026-12-31T00:00:00Z',
  });
  expect(invoice.total_cents).toBe(150_000);
  expect(invoice.status).toBe('DRAFT');

  const items = await env.db.lineItem.findMany({ where: { invoiceId: invoice.id } });
  expect(items).toHaveLength(2);
});

test('InvoiceService.create rolls back if line item insert fails', async () => {
  // intentionally break line items, verify invoice row is also gone
});
```

Cycle:
1. **Red** — write test, run it, see it fail.
2. **Green** — write minimum code to pass.
3. **Refactor** — clean up, tests still pass.
4. Commit.

## Layer C — Characterization Tests for Refactoring Legacy Code

Legacy code has no spec — behavior IS the spec. Before moving / splitting / refactoring, capture current behavior:

```ts
// __tests__/legacy/invoices-create-characterization.test.ts
// PURPOSE: lock current behavior of POST /api/invoices BEFORE refactor.
// DO NOT DELETE until refactor verified in prod for 7+ days.

test('[characterization] POST /api/invoices returns invoice with DRAFT status', async () => {
  const res = await app.request('/api/invoices', {
    method: 'POST',
    headers: { Authorization: `Bearer ${testJwt}` },
    body: JSON.stringify({ client_id: 'c1', line_items: [...], due_date: '...' }),
  });
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.data).toMatchObject({
    id: expect.any(String),
    total_cents: 150_000,
    status: 'DRAFT',
  });
});
```

Rule: characterization test passes BEFORE the move AND after the move = safe refactor.

## When to Use Which

| Building | Layer | Reason |
|---|---|---|
| New API route | A (SDD) + B (TDD) | Contract first, then test, then implement |
| New service method | B (TDD) | Pure logic, no external interface |
| New frontend component | Component test (Testing Library) | Render + interaction |
| Refactoring legacy code | C (characterization) → move → re-run | Behavior preservation |
| Bug fix | B (TDD): failing test → fix → green | Prevents regression |
| New library / utility | B (TDD) | Pure function = easy to test |

## Forbidden Methodology Anti-Patterns

- Writing implementation FIRST, then tests later — defeats the purpose.
- Tests that mirror implementation line-by-line — they break on any refactor.
- One giant test for an entire feature — split into focused cases.
- Tests that depend on test ordering — every test resets state.
- Snapshot-everything testing without reading the snapshots — silent rot.

## Tooling

See `rules/testing.md` for framework choice per preset.
