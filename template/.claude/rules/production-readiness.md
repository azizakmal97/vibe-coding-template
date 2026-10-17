# Production Readiness: by Trigger, Not by Buzzword

Always loaded. The owner of this project may not read code. They will ask for "a
pay button", never for "idempotency". Your job: recognise which production
concerns the requested change carries, handle them at the size this app actually
is, and tell the owner in one plain sentence what you protected them from.

Most topics below belong to systems with teams, many services and heavy traffic.
Building those early is over-engineering, which `simplicity.md` §1 treats as a
defect. So every topic sits in one of three tiers:

| Tier | Meaning | What you do |
|---|---|---|
| 1. Baseline | Cheap, and skipping it causes the disasters that end small projects: leaked keys, surprise bills, lost data | In place before the first real user. `/deploy` checks it |
| 2. Triggered | Needed only when a change does a specific thing | Handle it in the SAME change that fires the trigger, with its test. Never "later" |
| 3. Not yet | Solves problems this app does not have | Do not build it. If the owner asks, explain what it solves and name the signal that would justify it |

The owner-facing version of every topic is `docs/PRODUCTION_READINESS_PLAIN.md`
(filled by `/handover` from its `.template.md`). Borrow its wording when you explain.

## Tier 1: Baseline (every app with real users)

Most of these are a setting on the host or the auth provider, not code. Done means
in place AND written in `docs/HANDOVER.md`, so the owner can find it.

| Topic | Done at small scale means |
|---|---|
| Secrets Management | Keys live in env vars or the host's secret store. `.env.example` lists names only. Dev and prod use separate keys |
| IAM | Every key and database user has the least access that works. Nobody shares the owner's root login |
| OAuth | Login goes through an auth provider (Clerk, Supabase Auth, Auth.js). Never hand-roll password storage or session tokens |
| JWT Rotation | If the app issues its own JWTs: short expiry, refresh tokens, signing secret in env so it can be rotated. Provider-issued: nothing to do |
| TLS, Encryption in Transit | HTTPS only (the host provides it). No `http://` calls to your own API or to third parties |
| Encryption at Rest | Database and file storage encrypted. Default on mainstream hosts: confirm in the host docs, never assume |
| SQL Injection | ORM or parameterised queries only (`database.md`) |
| XSS | Framework escaping. No raw HTML from user input without a sanitiser |
| CSRF | Cookie-based auth uses SameSite cookies plus the framework's CSRF protection on forms |
| CORS | Allowlist your own domains. Never `*` together with credentials |
| Rate Limiting | On login, signup, password reset, AI calls, email and SMS sends, anything billed per call (`backend.md`) |
| Cost Optimization | A billing alert AND a hard spending cap on every paid service (AI, email, SMS, hosting, database) before launch. Per-user caps on AI features |
| Timeouts | Every outbound call has one (`api.md`: 10 s default) |
| Logging | Server logs carry route, user id and a request id. Never secrets or personal data |
| Monitoring, Alerts | An error tracker (Sentry or the host's own) is wired, and error spikes plus billing alerts reach the owner's phone or inbox |
| Health Checks | `GET /api/health` returns 200 only when the database is reachable. `/deploy` and any uptime monitor call it |
| Backups | The host's automatic backups are on, the owner knows how far back they go, and one test restore happened before real users |
| Database Migrations | Every schema change is a migration file (`database.md`) |
| Database Indexing | Every foreign key and every column you filter or sort on has an index |
| N+1 Queries | No query inside a loop. Use a join, an `include`, or one batched query |
| Connection Pooling | Serverless plus Postgres: use the host's pooled connection string (Supabase pooler, Neon pooled URL, Prisma Accelerate, Cloudflare Hyperdrive) |
| CI/CD | CI runs typecheck, lint, test and build on every push (the template ships it). Production deploys come from `main` |
| Rollbacks | The host's one-click rollback is known and written in `docs/HANDOVER.md` |
| DNS | The domain sits at a registrar with 2FA on. The records the host needs are written in `docs/HANDOVER.md` |
| CDN, DDoS Protection, WAF | Use the host's CDN and its included protection. Turn on bot protection for signup and login if offered. Never build your own |
| Dependency Hell | Lockfile committed, one package manager, ask before adding a package (`AGENTS.md` rule 10) |

## Tier 2: Triggered (handle in the same change)

Match every change against these triggers. Each match is part of the change and
part of its test.

### The change calls another service (AI, payments, email, any external API)

- Timeouts (tier 1), plus Retries with Exponential Backoff and jitter: at most 3 tries, only for network errors, 429 and 5xx. Never retry a non-idempotent call without an idempotency key.
- Circuit Breakers: only when most requests depend on that one service, so its outage would stall every page. Otherwise a timeout plus a clear error message is enough.
- The UI shows a real error state when the service is down, never an endless spinner.

### The change takes money, or does anything that must happen exactly once

- Idempotency: send an idempotency key to the payment provider, put a unique constraint on the order or payment id, and disable the button while submitting AND enforce it on the server.
- Race Conditions: two requests at once (double-click, two tabs) must not both win. Use a unique constraint or a conditional update (`UPDATE ... WHERE status = 'pending'`) inside a transaction.
- Deadlocks: keep transactions short and lock rows in the same order everywhere.
- Optimistic Locking: when two people can edit the same record, add a `version` column and reject a stale save with "someone else changed this, reload".
- Pessimistic Locking (`SELECT ... FOR UPDATE`): only for counters, stock or balances under real contention.
- Distributed Transactions, Saga Pattern: when one action spans two systems (charge the card, then create the order), never pretend it is atomic. Record each step, do the reversible step first, and write the compensating step (the refund) as code.

### The change receives Webhooks (Stripe, GitHub, any provider)

- Verify the signature (`api.md`), return 2xx fast, then process.
- Deduplicate by the provider's event id (providers retry), and tolerate events arriving out of order.

### The change does slow work (more than a few seconds: AI generation, file processing, bulk email, imports)

- Cold Starts, Serverless Limits: know the host's max request duration and memory. Work that can exceed them is a background job, not a request.
- Message Queues: use the host's queue (Cloudflare Queues, Inngest, QStash, Supabase Queues) or a jobs table, rather than adding a broker.
- Dead Letter Queues: after the last retry a failed job lands somewhere visible, and the owner is alerted.
- Backpressure: cap concurrency. Queue extra work instead of fanning out without limit.
- Pub/Sub, Event-Driven Architecture: only when one event must start several independent jobs (signup starts the welcome email, the CRM sync and analytics) and one failing must not block the others. Otherwise call them in sequence.

### The change runs on a schedule

- Cron Jobs: use the host's cron. The job is safe to run twice, two runs never overlap, start and end are logged, and failure alerts the owner.
- Clock Skew: store and compare times in UTC using the database clock, and allow a little leeway when checking token expiry.

### The change shows live updates (chat, notifications, live dashboards)

- Start with plain polling every few seconds. Use Long Polling or Server-Sent Events when updates flow from server to browser only, and WebSockets only for two-way traffic (chat, multiplayer). Prefer the host's realtime product over running your own socket server.

### The change makes the server fetch a URL a user supplied

- SSRF: allow only `http` and `https`, block private and internal IP ranges and the cloud metadata address `169.254.169.254`, and set a timeout and a max response size.

### The app got slow, or traffic is growing

Measure before changing anything: Latency per route, P99 Latency and Tail Latency
(the slowest 1% of requests), Throughput. The host's analytics usually show these.
Then work down this list and stop at the first step that fixes it:

1. Query Optimization and Database Indexing (tier 1).
2. Caching: Edge Caching through CDN headers for public pages first, then app-level caching. Every cache gets a written Cache Invalidation rule (which change clears it) or a short expiry.
3. Read Replicas: only when the database is the measured bottleneck on reads. Replication lag means Eventual Consistency, so read-your-own-writes go to the primary.
4. Vertical Scaling (a bigger plan) before Horizontal Scaling (more copies). Serverless hosts already do Autoscaling and Load Balancing.

- Memory Leaks, Garbage Collection: on long-running servers (not serverless), watch the memory graph. The usual causes are caches with no size limit, listeners never removed and timers never cleared.
- Thread Safety: never keep request data in module-level variables (`refactor.md`). Concurrent requests share them.

### The change ships something risky to real users

- Feature Flags: once real users exist and a change is risky. An env var or the host's flags is enough. Delete the flag once the feature is fully on.
- Blue-Green Deployment, Canary Releases, Rolling Deployments: the host's preview deploys plus promote-to-production give you this. Check the preview URL before promoting.
- Database Migrations in two steps (expand, then contract): add the new column, deploy code that uses it, backfill, and only later drop the old one. Never rename in one step. The migrations folder is the Schema Versioning.
- API Versioning (`api.md`) once a mobile app or anyone else calls the API. Semantic Versioning for anything people install (mobile, desktop, libraries); `/deploy` tags releases.

### The app has paying users, or someone depends on it

- SLOs, SLIs, Error Budgets: one sentence in `docs/HANDOVER.md` naming the target, for example "99.5% of requests succeed and pages load in under 2 s", checked monthly. At this size that is the whole practice.
- Metrics: request count, error rate and latency per route, from the host's analytics.
- Production Incidents, Postmortems: after any outage, a short note in `docs/incidents/` (what broke, who was affected, the fix, what prevents a repeat) plus a `memory/` lesson (`memory.md`).
- On-Call: for a solo owner this means alerts reach their phone. Nothing more.
- Disaster Recovery, Failover: write down how much data could be lost and how long a restore takes, and do one practice restore.
- Build Caching: when CI takes longer than about 5 minutes, turn on the CI provider's dependency cache.

## Tier 3: Not yet (build only when the signal is real)

The owner may ask for one of these after seeing a list like this online. Explain
in plain words what it solves and name the signal below. Build it only when the
signal is real, and write the evidence into `PROGRESS.md`.

| Topic | The signal that would justify it |
|---|---|
| Docker | The host needs a container (Fly, Railway, a VPS) or the app needs native system packages. Vercel, Netlify and Cloudflare do not |
| Kubernetes, Helm Charts | A team running many services on its own servers |
| Infrastructure as Code, Terraform | Several environments that must be rebuilt identically, or infra changes that need review. Until then: the host dashboard plus a written setup list in `docs/HANDOVER.md` |
| Reverse Proxies, API Gateways, Service Discovery | More than one backend service. For one app the host already does this |
| Liveness & Readiness Probes | Running on a container platform that restarts unhealthy containers. The tier 1 health check covers everything else |
| Distributed Tracing, Observability tooling | Two or more of your own services calling each other. Until then, logs with a request id are enough |
| Sharding, Partitioning | One table in the hundreds of millions of rows, or the database maxed out after indexing, caching and a bigger plan |
| Leader Election, Distributed Locks | Several copies of a worker that must never run the same job. Try a database row lock or the host's single-instance cron first |
| CAP Theorem, Network Partitions | Data spread across several databases or regions |
| Multi-Region Deployment | Users on several continents with measured latency complaints, or a contract that promises uptime |
| Chaos Engineering | A team with on-call that already meets its SLOs |
| gRPC | High-volume traffic between your own services. Browsers and webhooks use JSON over HTTP |
| TCP vs UDP | Building your own real-time voice, video or game networking. Use a provider instead |
| HTTP/2 & HTTP/3 | Never a task: the host turns them on |

## Telling the owner

- One plain sentence per safeguard you added, in the reply and not only in the commit. Say what it stops, then put the term in brackets: "If someone double-clicks Pay, they are charged once (idempotency)."
- When `.claude/identity.json` sets `technicalLevel` to `beginner` or `intermediate`, never use a term on its own.
- When you decline a tier 3 topic the owner asked about, name the signal that would make it worth doing. A bare "not needed" gives them nothing to watch for.
- A missing tier 1 item is a blocker to report at `/deploy`, not a footnote.
