# Security Audit Checklists

Used by `SKILL.md`. Choose the sections that apply to this project and give each
hunter its sections word for word. **A checklist hit is a lead, not a finding.**
Every hit still has to pass the candidate gate: principal, input, control, boundary,
affected, result.

Sources: attack classes adapted from Cloudflare's security-audit skill (MIT, `NOTICE.md`).
Some API, JWT, CI and AI items take ideas from mukul975/Anthropic-Cybersecurity-Skills
(Apache-2.0) and are written here in our own words. The stack sections are this template's own.

Suggested hunter split: **A** access control + data isolation · **B** auth, sessions and
tokens · **C** injection, client side and files · **D** business logic, money and
resource spend · **E** AI, MCP and integrations · **F** obvious things + supply chain + CI
(Sonnet is fine for F). `quick` merges these into 3 hunters: A+B, C+D+E, F.

---

## 1. Access control and data isolation (A01, API1, API3, API5)

- Every route that reads or writes a row filters by the caller's tenant (workspace,
  org, clinic) **in the query**. A check done before the query on a different id does not count.
- Object ids in the path, query **and body** (`accountId`, `categoryId`, `parentId`):
  is each one checked to belong to the caller's tenant before it is used or linked?
  A foreign id that gets linked into your own row counts as a write across the boundary.
- Role gates: owner-only and admin-only actions are enforced on the server, inside the
  router that owns the route, not only hidden in the UI.
- Sibling paths compared for **equivalence**: app API vs public or token API vs MCP
  tools vs import vs export vs cron. One path with a weaker filter is the finding.
- Bulk, batch, export and backup: per-item checks? Do they include other members'
  private rows, deleted rows or other tenants?
- Visibility inside a tenant (private vs shared rows between members): every list, count,
  total, search, report and AI context applies it, not only the detail route.
- Removed member or revoked token: does every path re-check membership on each request,
  or does a cached identity outlive the removal?
- Mass assignment: are Zod schemas `.strict()`, or do they pick fields? Can the body set
  `role`, `workspaceId`, `userId`, `ownerId`, `balance`, `status`, `createdBy`?
- Enumeration oracles: does "not found" differ from "no access"? Do search and filter
  reveal that hidden rows exist?

## 2. Authentication, sessions and tokens (A07, API2, A04)

- Every protected route is behind the auth middleware. List the routes mounted outside
  it and justify each one (health check, login, webhook with a signature check).
- JWT: algorithm pinned on verify; `exp` checked; the secret comes from env with **no
  fallback in production**; `aud`/`iss` checked when there are several issuers.
- Server-side sessions: revocation is checked on every request; logout ends the session
  on the server; "sign out everywhere" really ends the others; the session id is
  rotated at login (fixation).
- Cookies: `HttpOnly`, `Secure`, `SameSite=Lax` or `Strict`, narrow `Path` and `Domain`.
  A cookie-auth API that changes state needs CSRF protection: SameSite plus an
  Origin/Referer check, or a token.
- OAuth: `state` is checked, PKCE for public clients, the redirect URI comes from an
  allowlist, account linking does not trust an unverified email.
- API and personal tokens: stored hashed (HMAC or SHA-256 with a pepper), scopes enforced
  per route, constant-time comparison, revocable, shown once.
- Dev or test login routes and header-based auth: physically impossible in production
  (gated on env **and** on the request host), not just undocumented.
- Rate limits on login, signup, password reset, invite, token creation and AI calls,
  each with a bucket of its own.
- Password storage (if any): argon2id, scrypt or bcrypt, never a fast hash. Prefer an
  auth provider.

## 3. Injection, client side and files (A05, A03, API7, API10)

- SQL: ORM or bound parameters only. Look for `sql.raw`, template-string SQL, dynamic
  `ORDER BY` or column names taken from input, and `LIKE` patterns built from input
  without escaping.
- XSS: `dangerouslySetInnerHTML`, `innerHTML`, markdown or HTML renderers for user or
  **AI** content, `href={userValue}` (a `javascript:` URL), and SVG uploads served inline.
- Second-order: a value stored safely and later used as HTML, a URL, a file key, a
  regex or a CSV cell. CSV/XLSX export: cells starting with `= + - @` are neutralised
  (formula injection).
- Open redirect: `redirect`, `next`, `returnTo` and `url` parameters checked against an allowlist.
- SSRF: any server fetch of a user-supplied URL (webhooks, imports, link previews, BYOK
  base URLs). Allow only `https`, block private ranges and `169.254.169.254`, set a timeout
  and a size cap, re-check after redirects.
- File uploads: type allowlist decided on the server from content (not the extension or the
  client's `Content-Type`), a size cap, a server-generated object key (no user path), and
  served with `Content-Disposition: attachment` or a safe type. Signed URLs are short-lived
  and scoped to one object.
- Imports (CSV, XLSX, JSON, bank exports): the same validation and tenant rules as the
  UI; size and row caps; no prototype pollution from parsed keys (`__proto__`, `constructor`).
- Headers: CSP present and not just `unsafe-inline` everywhere; HSTS; `X-Content-Type-Options`;
  frame-ancestors. Credentialed CORS uses an explicit allowlist and never reflects the Origin.
- Service worker and browser storage: no tokens in `localStorage`; cached API responses do
  not survive logout or serve one user's data to the next.

## 4. Business logic, money and spend (A06, API4, API6, LLM10)

- Money is stored as integer minor units; no float maths; currency is always carried with
  the amount; rounding has one owner.
- Exactly-once actions (pay, transfer, post a recurring entry, accept an invite): the
  server enforces it (unique constraint or a conditional update), not only a disabled button.
  Double-click and two tabs give one result.
- State machines: a step cannot be skipped, replayed or reversed (accept an invite twice,
  confirm an already-posted entry, restore a deleted row with someone else's id).
- Cron jobs: safe to run twice; cannot be triggered over HTTP; a missed or duplicated run
  does not post money twice.
- Time: due dates and calendar days compared in one defined time zone; expiry checks
  allow a little leeway for clock skew; boundary moments (month end, leap day) are handled.
- Negative, zero and huge amounts, quantities and page sizes are rejected or capped.
- Spend on the owner's bill: AI calls, email, SMS, storage, and DB reads (free-tier caps
  are a hard stop). Per-user caps, request size caps, no unbounded pagination or fan-out.
- Defaults when config is missing: the app fails closed (refuses to run), never open.

## 5. AI, MCP and integrations (LLM01, LLM02, LLM05, LLM06, LLM07, API10)

- Indirect prompt injection: receipts, imported rows, notes, emails, web pages and file
  text are untrusted input to the model. The system prompt never grants the model
  authority the user lacks.
- Tool calls (agentic or MCP): every tool runs **as the calling user** with that user's
  tenant and visibility filters; arguments are validated with Zod like an API body;
  allowlist, not denylist. Writes and irreversible actions need the user's confirmation,
  bound to the exact action and values the user saw.
- Context bleed: the context sent to the model never includes other tenants', other
  members' private rows, or secrets. Logs and egress audits do not store prompts that hold PII.
- Output handling: model output rendered as text or through a sanitiser; never `eval`'d,
  never used directly as SQL, a URL, a file path or a redirect.
- BYOK keys: encrypted at rest with a key from env; never returned to the client after
  saving; never logged; the provider base URL cannot point at internal addresses (SSRF).
- Unbounded loops: max tool steps, max tokens, request timeout, per-user rate limit.
- MCP server: auth on every call, scopes per tool, tool descriptions not built from
  user-controlled text.
- Webhooks in: signature verified over the raw body with a constant-time compare,
  timestamp tolerance, de-duplication by event id.
- Calls out: a timeout on every call; a response is Zod-parsed before use (the provider
  is input too).

## 6. Obvious things (literal, check every item)

Check each item literally and give a result for every one. **A flag is not a finding:**
trace the impact before raising it as a candidate.

- Secrets in the tree or in git history: `password`, `secret`, `apikey`, `token`, `Bearer`,
  `-----BEGIN`, `sk-`, `AKIA`, `ghp_`, `AIza`. Committed `.env*`, `.dev.vars`, `*.pem`, `*.key`.
- `.gitignore` covers secrets, uploads, local DB files and backups.
- `TODO`, `FIXME`, `HACK` and `XXX` comments that mention auth, validation or permissions.
- Debug, dev or seed routes and credentials, and whether they can run in production.
- Unprotected `/debug`, `/admin`, `/test`, `/metrics`, `/env`, `/config` routes.
- `eval`, `new Function`, `child_process` and dynamic `import()` fed by input.
- Error responses in production: no stack traces, SQL errors, internal paths or upstream bodies.
- Logs: no secrets, tokens, cookies or full request bodies with PII.
- Every catch logs or rethrows (silent catches hide auth failures).
- Health route: does not leak versions, env names or binding ids beyond what is needed.

## 7. Supply chain and CI (A03, A08)

- Lockfile committed; one package manager; `scripts/audit-gate.mjs` passes; every
  `.audit-accepted.json` entry has an in-date `reviewBy`.
- New or unusual dependencies: lifecycle scripts (`postinstall`), typosquat-looking names,
  packages with a single maintainer pulled in for a trivial job.
- GitHub Actions: top-level `permissions:` is read-only by default; third-party actions
  pinned to a commit SHA; no `pull_request_target` that checks out PR code; no
  `${{ github.event.* }}` interpolated into `run:` (pass it through `env:`); secrets only in
  the jobs that need them; deploy jobs restricted to `main` or an environment with reviewers.
- Build output: source maps and `.env` values are not shipped to the public bundle;
  only `VITE_`/`NEXT_PUBLIC_` values that are meant to be public reach the client.

## 8. Stack notes

### Cloudflare Workers + Hono + D1 / R2 / KV / Durable Objects

- **Hono middleware order**: an `app.use()` at the top level runs before a sub-router's
  middleware, and a sub-router's `use('*')` can apply across a shared base path. Check
  which middleware really runs for each route, not which one the file suggests.
- `c.req.json()` used without a Zod parse (`zValidator`); `c.req.param()` ids used without
  a tenant check.
- Secrets: set as Worker secrets (`wrangler secret put`), never under `[vars]` in
  `wrangler.toml`. Code that falls back to a default secret when env is missing must
  refuse to run in production. The dashboard state is an owner check.
- `APP_ENV`, `ENVIRONMENT` or dev flags decide security behaviour: what happens when the
  variable is unset in production?
- D1: `prepare().bind()` or Drizzle only. `db.batch` is the only atomic group: a
  multi-statement change that is not batched can half-apply. Read-cap pricing matters
  for API4.
- R2: no public bucket for private files; object keys made by the server and prefixed
  per tenant; signed or Worker-proxied access re-checks ownership.
- KV is eventually consistent: do not use it for revocation lists or exactly-once flags.
- Durable Objects: the object id comes from server state (tenant + resource), not raw
  client input; `fetch` on the DO re-checks the caller.
- `scheduled()` handlers: no HTTP route exposes the same job; each cron string matches
  `wrangler.toml`.
- Static assets and SPA fallback: the HTML shell or `_headers` file does not cache
  authenticated API responses at the edge; `Cache-Control: private` or `no-store` on per-user JSON.
- `workers.dev` and preview URLs: do they bypass a WAF or Access policy that the custom
  domain has? (owner check)

### Supabase / Postgres

- RLS enabled on **every** table in exposed schemas; policies use `auth.uid()`, not a
  column the client can set; `USING` and `WITH CHECK` both present for writes.
- The `service_role` key never reaches the client, an edge function response or the logs.
- `security definer` functions set `search_path` and re-check the caller.
- Storage buckets: policies per bucket; private by default.

### Next.js

- Server actions and route handlers re-check auth and tenant (middleware alone is not
  enough; matcher gaps happen).
- No secrets in `NEXT_PUBLIC_*`; `server-only` on modules that hold secrets.
- `revalidate` and fetch caching never mix per-user data into a shared cache.

### React SPA (Vite)

- Route guards are UX only; the server enforces everything.
- No tokens in `localStorage` or `sessionStorage`; prefer HttpOnly cookies.
- Third-party scripts limited and listed in the CSP.

## 9. Wildcard (one hunter in `standard`)

No class is assigned. Read the code that looks boring or half-finished.
- What API calls are possible that the client never makes?
- Which features were bolted on late (import, sharing, AI, export)? They got the least review.
- What happens when features mix: import + sharing, invite + token, AI tool + member privacy?
- What do the tests **not** cover? Compare the edge cases tested with the ones not tested.
- Git history: reverted security fixes, removed auth checks, secrets committed then deleted.
- A comment explaining why something is safe: verify the explanation.
