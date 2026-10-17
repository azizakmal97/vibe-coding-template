# Is [Project Name] Ready for Real Users?

> Filled in by `/handover`. Last column: ✅ in place · ⬜ needed now and missing · ➖ not needed yet.
> Every ⬜ points to the fix in `PROGRESS.md`. Every ➖ says what would change that.

There is a widely shared list of 111 things that people who build apps with AI
often don't know about. Everything on it is real engineering, but most of it is
for companies with large teams and heavy traffic. This page explains each item in
plain words and says where this app stands today.

Expect a lot of ➖. For a young app that is the right amount of engineering, not a
gap. Building the "not yet" items early makes an app slower to change and harder to
fix.

The AI working on this project sorts the list into the same three groups (its
version is `.claude/rules/production-readiness.md`). When it adds a safeguard, it
tells you in one sentence what the safeguard stops.

## 1. Needed before real users

Cheap, and mostly settings on your host or login provider rather than code.
Skipping them causes the problems that end small projects: leaked keys, surprise
bills, lost data.

| Topic | In plain words | This app |
|---|---|---|
| Secrets Management | The passwords and keys that let your app use other services. They belong in a locked settings area on your host, never in the code, because code gets copied and shared. | [status] |
| IAM | Who and what can reach which parts of your accounts. Each key gets only the access it needs, like a cleaner's key that opens the front door but not the safe. | [status] |
| OAuth | "Sign in with Google" and similar. A specialist service handles logins, so your app never stores anyone's password. | [status] |
| JWT Rotation | A JWT is the digital pass that keeps someone logged in. Rotation means passes expire, and the secret that signs them can be swapped if it leaks. | [status] |
| TLS | The padlock in the browser bar. Traffic between the user and your app is scrambled, so nobody on the same Wi-Fi can read it. | [status] |
| Encryption in Transit | The same scrambling on every connection: browser to app, app to database, app to other services. | [status] |
| Encryption at Rest | Data stored on disk is scrambled, so a stolen drive or backup is useless. Most hosts do this by default; someone should still confirm it. | [status] |
| SQL Injection | An attacker types database commands into a form field to read or delete your data. Prevented by never pasting user input straight into a database query. | [status] |
| XSS | An attacker gets their own script to run on your page, inside other users' browsers. Prevented by never showing user input as raw HTML. | [status] |
| CSRF | Another website tricks a logged-in user's browser into pressing a button on your app. Prevented by cookie settings and hidden form tokens. | [status] |
| CORS | The browser rule for which other websites may call your app's behind-the-scenes API. It should list only your own sites. | [status] |
| Rate Limiting | A cap on how often one person can do something, such as 5 login attempts a minute. Stops password guessing and stops one user running up your bill. | [status] |
| Cost Optimization | Keeping the monthly bill sane. For a young app this mostly means a billing alert and a hard spending cap on every paid service, so a bug or an abuser can't cost you a fortune overnight. | [status] |
| Timeouts | How long your app waits for another service before giving up. Without one, a slow service makes your app hang too. | [status] |
| Logging | The app's diary of what happened, kept on the server. It is how anyone finds out why something broke. It must never contain passwords or personal data. | [status] |
| Monitoring | Something watching the app that notices when errors pile up, so you hear about problems before your users tell you. | [status] |
| Alerts | The message that reaches your phone or inbox when monitoring sees trouble or a bill crosses a limit. | [status] |
| Health Checks | A special address the app answers with "I'm fine" only if it can reach its database. Deploys and uptime checkers use it. | [status] |
| Backups | Copies of your data you can restore. A backup nobody has ever restored is a hope, not a backup. | [status] |
| Database Migrations | Changes to how your data is organised, written as numbered files, so every copy of the database changes the same way and each change can be reviewed. | [status] |
| Database Indexing | Like the index at the back of a book: the database finds rows without reading every one. Missing indexes are the most common reason apps get slow. | [status] |
| N+1 Queries | Asking the database one question per item in a list (100 orders, 100 questions) instead of one question for the whole list. Fine with 5 rows, painfully slow with 5,000. | [status] |
| Connection Pooling | Sharing a few open lines to the database instead of opening a new one for every request. On serverless hosts, skipping it can hit the database's limit and take the app down. | [status] |
| CI/CD | Robots that test every change automatically (CI) and put it live once the tests pass (CD). This template sets it up for you. | [status] |
| Rollbacks | Putting the previous working version back with one click when a new release breaks something. | [status] |
| DNS | The internet's address book, pointing your domain name at your app. Whoever controls your domain account controls your app's address, so it needs 2-step login. | [status] |
| CDN | Copies of your pages and images kept on servers near your users, so they load faster. Most hosts include one. | [status] |
| DDoS Protection | A shield against floods of fake traffic meant to knock the app offline. Comes with your host or a service like Cloudflare. | [status] |
| WAF | A filter in front of your app that blocks known attack patterns and bad bots. | [status] |
| Dependency Hell | Your app uses hundreds of packages written by others, each needing exact versions of the others. A lockfile freezes those versions so the app builds the same way every time. | [status] |

## 2. Needed when the app does certain things

Each group starts with the thing your app does. If it doesn't do that thing, the
whole group is ➖.

### When it calls another service (AI, payments, email)

| Topic | In plain words | This app |
|---|---|---|
| Retries | Trying again when a call to another service fails for a temporary reason. | [status] |
| Exponential Backoff | Waiting longer between each retry (1 second, then 2, then 4) so you don't hammer a service that is already struggling. | [status] |
| Circuit Breakers | After repeated failures, stop calling the broken service for a while and show a clear message instead. Works like a fuse that trips. | [status] |

### When it takes money, or anything that must happen exactly once

| Topic | In plain words | This app |
|---|---|---|
| Idempotency | Doing something twice has the same effect as doing it once. It is why a double-click on Pay charges the card once. | [status] |
| Race Conditions | Two things happening at the same moment and tripping over each other, such as two people buying the last ticket. | [status] |
| Deadlocks | Two database operations each waiting for the other to finish, so neither ever does. | [status] |
| Optimistic Locking | When two people edit the same thing, the second save is stopped with "someone changed this, please reload" instead of silently overwriting the first. | [status] |
| Pessimistic Locking | Locking a record while one person changes it, so nobody else can. Used for stock counts and account balances. | [status] |
| Distributed Transactions | One action that changes two separate systems, like charging a card and creating an order. The two can't be done as a single all-or-nothing step. | [status] |
| Saga Pattern | The practical answer: do the steps in order, and if a later one fails, undo the earlier ones (refund the charge). | [status] |

### When other services send it messages

| Topic | In plain words | This app |
|---|---|---|
| Webhooks | Messages other services send your app when something happens, such as Stripe reporting a payment. Each one must be checked as genuine, and the same message may arrive twice. | [status] |

### When it does slow work (AI generation, video, imports, bulk email)

| Topic | In plain words | This app |
|---|---|---|
| Cold Starts | The short delay when a serverless app wakes up after sitting idle. | [status] |
| Serverless Limits | Serverless hosts stop any request that runs too long or uses too much memory. Long jobs have to run in the background. | [status] |
| Message Queues | A waiting line for jobs. The app drops in a job ("make this video") and a worker handles it in the background, so users don't stare at a spinner. | [status] |
| Dead Letter Queues | Where jobs go after failing every retry, so they aren't lost silently and someone can look at them. | [status] |
| Backpressure | Slowing down intake when workers can't keep up, instead of letting work pile up until something breaks. | [status] |
| Pub/Sub | One message, many listeners. "New signup" can set off the welcome email, analytics and your CRM separately. | [status] |
| Event-Driven Architecture | Building the whole app around those messages. Useful when many separate jobs react to the same events; for a small app it usually adds complexity for no benefit. | [status] |

### When it runs things on a timetable

| Topic | In plain words | This app |
|---|---|---|
| Cron Jobs | Tasks that run on a schedule, like a nightly report. They must be safe to run twice and must tell someone when they fail. | [status] |
| Clock Skew | Different computers' clocks disagree by a few seconds. It matters for anything time-sensitive, like expiring logins. | [status] |

### When it shows live updates (chat, notifications, live dashboards)

| Topic | In plain words | This app |
|---|---|---|
| Long Polling | The browser asks "anything new?" and the server holds the question open until there is. A simple way to get near-live updates. | [status] |
| Server-Sent Events | The server pushes updates to the browser over one open connection. Good for notifications and live feeds. | [status] |
| WebSockets | A two-way open line between browser and server. Needed for chat and multiplayer, and more work to run than the other two. | [status] |

### When users can give it a link to open

| Topic | In plain words | This app |
|---|---|---|
| SSRF | Tricking your server into opening an internal address it should never reach, by handing it a crafted link. | [status] |

### When it gets slow, or traffic grows

| Topic | In plain words | This app |
|---|---|---|
| Latency | How long one request takes, from click to answer. | [status] |
| Throughput | How many requests the app handles per second. | [status] |
| P99 Latency | The time within which 99 out of 100 requests finish. Averages hide the slow ones; this number doesn't. | [status] |
| Tail Latency | The slowest requests at the far end, which is often where real users feel the pain. | [status] |
| Query Optimization | Rewriting slow database questions so they ask for less or use an index. | [status] |
| Caching | Keeping a ready-made answer so the app doesn't redo the same work every time. | [status] |
| Edge Caching | Caching on CDN servers near your users, so a page can be served without reaching your app at all. | [status] |
| Cache Invalidation | Deciding when a saved answer is out of date and must be thrown away. Get it wrong and users see old data. | [status] |
| Read Replicas | Extra read-only copies of the database that share the work of answering reads. | [status] |
| Replication | Keeping copies of the database in sync. Managed databases do this for you. | [status] |
| Eventual Consistency | Copies catch up after a short delay, so a change may not show up everywhere instantly. | [status] |
| Vertical Scaling | Moving to a bigger server. The simplest fix, and usually the first one to try. | [status] |
| Horizontal Scaling | Running more copies of the app side by side. Only works if the app keeps nothing important in memory between requests. | [status] |
| Autoscaling | Adding and removing copies automatically as traffic rises and falls. Serverless hosts do this for you. | [status] |
| Load Balancing | Spreading requests across those copies. Also handled by your host. | [status] |
| Memory Leaks | The app slowly uses more and more memory until it crashes, because something keeps holding data it no longer needs. | [status] |
| Garbage Collection | The programming language's automatic cleanup of memory nothing uses. Leaks happen when code accidentally keeps old data reachable. | [status] |
| Thread Safety | Code staying correct when many requests run at once. It breaks when requests share data they shouldn't. | [status] |

### When it releases risky changes to real users

| Topic | In plain words | This app |
|---|---|---|
| Feature Flags | An on/off switch for a feature, so you can ship it switched off, turn it on later, and turn it off again if it misbehaves. | [status] |
| Blue-Green Deployment | Two copies of the live app. The new version goes live by switching traffic over, and switching back is instant. | [status] |
| Canary Releases | Giving the new version to a small slice of users first and watching for errors before everyone gets it. | [status] |
| Rolling Deployments | Replacing running copies one at a time, so the app never goes fully offline during a release. | [status] |
| Schema Versioning | Knowing exactly which version of the database layout is live. The numbered migration files are that record. | [status] |
| API Versioning | Keeping older versions of your app's API working after you change it, so older mobile apps and partners don't break. | [status] |
| Semantic Versioning | Version numbers like 2.4.1 that tell people what changed: a breaking change, a new feature, or a small fix. | [status] |

### When people pay for it or depend on it

| Topic | In plain words | This app |
|---|---|---|
| SLIs | The few numbers that tell you whether users are having a good time, such as the share of requests that succeed. | [status] |
| SLOs | The target for each of those numbers, written down so "is it reliable enough?" has an answer. | [status] |
| Error Budgets | The amount of failure your target allows. Inside it, ship freely; once it's used up, fix reliability before adding features. | [status] |
| Metrics | Counts over time: requests, errors, response times. | [status] |
| Production Incidents | Anything broken for real users. Fixed first, explained second. | [status] |
| On-Call | Who gets woken up when it breaks. For a solo owner, that's you and your phone. | [status] |
| Postmortems | A short, blame-free write-up after an incident: what broke, why, and what will stop it happening again. | [status] |
| Disaster Recovery | The plan for losing the database or the host: how much data you would lose, and how long getting back would take. | [status] |
| Failover | Switching automatically to a standby copy when the main one dies. Managed databases offer it on higher plans. | [status] |
| Build Caching | Reusing work from the previous build so tests and releases finish faster. | [status] |

## 3. Not yet

These solve problems this app does not have. Each row says what would change that.
If the AI suggests building one, ask it which signal it saw.

| Topic | In plain words | Worth it when | This app |
|---|---|---|---|
| Docker | Packing the app and everything it needs into one box that runs the same anywhere. | Your host requires it, or the app needs special system software | [status] |
| Kubernetes | A system for running many of those boxes across many servers. | A team runs many services on its own servers | [status] |
| Helm Charts | Install packages for Kubernetes. | You run Kubernetes | [status] |
| Infrastructure as Code | Describing your servers and settings in files instead of clicking through dashboards, so they can be rebuilt exactly. | You keep several environments that must match, or infrastructure changes need review | [status] |
| Terraform | The most widely used tool for infrastructure as code. | Same as above | [status] |
| Reverse Proxies | A server in front of your app that passes requests along to it. | You run more than one backend service; your host already runs one for you | [status] |
| API Gateways | One front door for many backend services, handling logins and limits in one place. | You run several backend services | [status] |
| Service Discovery | How many services find each other's addresses. | You run many services | [status] |
| Liveness & Readiness Probes | Checks a container platform uses to restart a stuck app, or to hold traffic until the app is ready. | You run on a container platform | [status] |
| Distributed Tracing | Following one request as it hops between several services, to see where the time goes. | Two or more of your own services call each other | [status] |
| Observability | Being able to answer "why is it broken?" from logs, metrics and traces. At this size, good logs are most of it. | You run several services and logs alone can't explain a problem | [status] |
| Sharding | Splitting one huge database across several machines. | The database is maxed out after indexes, caching and a bigger plan | [status] |
| Partitioning | Splitting one huge table into smaller pieces, often by date. | A single table holds hundreds of millions of rows | [status] |
| Leader Election | Several copies of a worker agreeing which one is in charge. | Several workers must never run the same job | [status] |
| Distributed Locks | A lock that works across several machines, so only one of them does a job at a time. | Same as above, and a simple database lock isn't enough | [status] |
| CAP Theorem | When a network splits, a database spread over several machines must choose between always answering and always being correct. | Your data lives in several databases or regions | [status] |
| Network Partitions | Parts of a system losing contact with each other while each keeps running. | Same as above | [status] |
| Multi-Region Deployment | Running the app in several parts of the world at once. | Users on several continents complain about speed, or a contract promises uptime | [status] |
| Chaos Engineering | Breaking things on purpose to prove the system survives. | A team with on-call already meets its reliability targets | [status] |
| gRPC | A fast way for your own services to talk to each other. Browsers and most outside services use ordinary web requests. | High-volume traffic between your own services | [status] |
| TCP vs UDP | The two basic ways data travels over the internet: reliable and in order, or fast and allowed to drop bits. | You build your own voice, video or game networking (use a provider instead) | [status] |
| HTTP/2 & HTTP/3 | Newer versions of the web's language that load pages faster. | Never a task: your host turns them on | [status] |
