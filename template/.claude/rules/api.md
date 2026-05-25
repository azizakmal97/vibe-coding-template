---
paths:
  - "src/lib/**/*"
  - "src/services/**/*"
  - "lib/**/*"
  - "services/**/*"
---

# API Design & External Services Rules

## REST Conventions

| Method | Use | Idempotent |
|--------|-----|-----------|
| GET | Read only, safe to cache | Yes |
| POST | Create new resource | No |
| PUT | Full replacement | Yes |
| PATCH | Partial update | Yes |
| DELETE | Remove resource | Yes |

## URL Naming

- Resources: lowercase, plural, hyphens: `/api/user-profiles`
- Nested resources: `/api/users/:id/orders`
- Actions (when REST doesn't fit): `/api/payments/:id/refund`
- Version prefix: `/api/v1/` — mandatory

## API Versioning

Never break existing consumers:
- Add new fields to responses — never remove
- Add new endpoints — never delete old ones
- Deprecated endpoints: return response + `X-Deprecated: true` header for one release cycle

## External API Calls

```typescript
// Always: timeout, retry, error handling
async function callExternalAPI(data: RequestData): Promise<ResponseData> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000) // 10s timeout

  try {
    const response = await fetch('https://api.service.com/endpoint', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.SERVICE_API_KEY}` },
      body: JSON.stringify(data),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`)
    }

    return response.json()
  } catch (error) {
    console.error('[callExternalAPI] Failed:', error)
    throw error // Re-throw — let caller handle
  } finally {
    clearTimeout(timeout)
  }
}
```

Rules:
- All API keys from environment variables — never hardcoded
- Always set request timeout (default: 10 seconds)
- Log errors with context, re-throw for caller to handle
- Handle rate limit responses (429): back off, don't retry immediately
- Handle network failures: don't let them bubble as 500s to client

## Webhook Handling

```typescript
// Always verify webhook signatures
const signature = req.headers['x-service-signature']
const isValid = verifySignature(body, signature, process.env.WEBHOOK_SECRET)
if (!isValid) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
```

## New Endpoint Checklist

Every new endpoint needs:
- [ ] TypeScript request and response types
- [ ] Zod validation schema for request
- [ ] Auth check (if protected)
- [ ] At least one integration test
- [ ] Added to API documentation (if you maintain one)

## Standard Error Shape (Lock Forever)

Every error response everywhere:
```ts
{ error: string, code: string }
```
Common codes: `AUTH_REQUIRED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL_ERROR`.

Frontend `api-client` switches behaviour on `code`, not on message string. Changing a `code` value = breaking change.

## Zod Schema Per Input (Mandatory)

Every API route validates body / params / query via Zod **before** destructuring:

```ts
const Body = z.object({ name: z.string().min(1).max(100), email: z.string().email() });
const result = Body.safeParse(await req.json());
if (!result.success) return bad(c, 'VALIDATION_ERROR', result.error.message);
const { name, email } = result.data;  // now typed + validated
```

Schemas live in `lib/contracts/<domain>.ts` so frontend can import the same type:
```ts
export type CreateUserInput = z.infer<typeof Body>;
```

## Pagination Shape (Standard)

```ts
GET /api/items?cursor=<id>&limit=20
→ { data: Item[], meta: { nextCursor: string | null, hasMore: boolean } }
```

OR offset-based:
```ts
GET /api/items?page=1&pageSize=20
→ { data: Item[], meta: { total, page, pageSize, totalPages } }
```

Pick one per project. Never mix in same API.
