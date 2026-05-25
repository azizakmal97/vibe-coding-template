# Learn Fullstack — Tied to [Project Name]

> Curated learning path. Each topic points at a real file in THIS codebase. Read the topic, then open the file.

## How to Use This Doc

1. Pick a topic you don't understand.
2. Read the 2-sentence "what + why" below.
3. Open the file path in your editor.
4. Read it slowly. Ask the AI to explain any line you don't get.
5. Make one tiny change to see what happens. `git stash` to undo.

## Topic 1 — How a Page Loads

**What:** When you visit a URL, React decides which component to render.
**Why:** All UI is "this component renders this data this way."
**File:** `src/pages/IndexPage.tsx` (or `app/page.tsx` for Next.js App Router).

Exercise: change the page title text. Refresh browser. See it change.

## Topic 2 — Fetching Data

**What:** The page asks the backend for data via an HTTP request.
**Why:** Frontend has no database access; it must go through the API.
**File:** `src/hooks/useInvoices.ts` (or wherever your first React Query / SWR hook lives).

Exercise: add `console.log` after the fetch. Open dev tools. See the data.

## Topic 3 — How the Backend Receives a Request

**What:** Hono / Next.js / Express picks up the URL, runs middleware, calls the handler.
**Why:** Same code can handle many URLs.
**File:** `app/api/invoices/route.ts` (or `worker/routes/invoices.ts`).

Exercise: add a `console.log('hit')` at the top. Trigger the request from frontend. See it log server-side.

## Topic 4 — Auth Middleware

**What:** Every protected route checks "is this user logged in?" before doing anything.
**Why:** No check = anyone can do anything.
**File:** `lib/middleware/auth.ts` or `worker/middleware/auth.ts`.

Exercise: read the `requireRole(...)` function. Trace how it pulls the user ID from the request.

## Topic 5 — Database Queries

**What:** Backend talks to PostgreSQL / SQLite / D1 via an ORM (Prisma / Drizzle).
**Why:** ORM = type-safe queries + protection against SQL injection.
**File:** `lib/db.ts` + any `prisma.invoice.findMany(...)` call.

Exercise: look at the SQL Prisma generates: `npx prisma studio` → run a query → see the SQL in terminal.

## Topic 6 — Transactions

**What:** "Either all these database changes save together, or none do."
**Why:** Stops half-finished state when something crashes mid-write.
**File:** Any `prisma.$transaction(...)` call in `lib/services/*.ts`.

Exercise: read one transaction. Imagine what would go wrong WITHOUT it.

## Topic 7 — Form Validation with Zod

**What:** Define what the data should look like. Reject anything that doesn't match.
**Why:** Never trust user input.
**File:** `lib/contracts/*.ts` or `components/forms/*Form.tsx`.

Exercise: read one Zod schema. Try submitting a form with wrong data. See the error.

## Topic 8 — How Tests Work

**What:** Code that proves your code does what you think.
**Why:** Without tests, every change is a coin flip.
**File:** Any `*.test.ts` file. Start with the smallest.

Exercise: run `npm test -- <file>`. Watch one test run.

## Topic 9 — Why Hooks Exist (Frontend)

**What:** Reusable logic (auth state, data fetching) lives in `use*.ts` files.
**Why:** Don't repeat logic across components.
**File:** `src/hooks/useAuth.ts`.

Exercise: count how many components use `useAuth()`. Imagine writing the logic in each one.

## Topic 10 — How Deployment Works

**What:** Code → GitHub → CI runs tests → if green, deploy to Vercel/Cloudflare/etc.
**Why:** Automated = predictable. Manual = mistakes.
**File:** `.github/workflows/ci.yml` + `vercel.json` / `wrangler.jsonc`.

Exercise: push a tiny change to a test branch. Watch CI run on GitHub.

## Next Steps After These 10

- Build one full feature end-to-end (form → API → DB → display).
- Write one test for it.
- Open a pull request. Read your own diff.
- Run `/pr-review` and read the AI feedback.
