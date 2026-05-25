# Architecture in Plain English — [Project Name]

> Why the app is built the way it is. Written so a non-coder can follow.

## 1. The Big Picture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Browser    │────▶│   Backend    │────▶│   Database   │
│   (React)    │◀────│   (API)      │◀────│              │
└──────────────┘     └──────────────┘     └──────────────┘
```

When a user clicks something:
1. Their browser asks the backend a question (e.g. "give me my invoices").
2. The backend checks who they are, looks up the answer in the database, sends it back.
3. The browser displays the result.

## 2. Why This Stack?

| Layer | Choice | Why this and not something else |
|---|---|---|
| Frontend | _e.g. React + Vite_ | Most popular = most help available + AI knows it well |
| Backend | _e.g. Next.js API_ | Same language (TypeScript) as frontend = less context switching |
| Database | _e.g. PostgreSQL_ | Free, reliable, handles real scale |
| Auth | _e.g. Clerk_ | Hosted = we don't store passwords ourselves = fewer security mistakes |
| Hosting | _e.g. Vercel_ | One click deploy, free tier, scales automatically |

## 3. How a Request Flows (Detailed)

Example: user clicks "Create invoice"

```
1. Browser:    Form submits → JavaScript sends POST /api/invoices
2. Backend:    Receives request
3. Middleware: Is the user logged in? (Yes → continue; No → return 401)
4. Validation: Is the request body valid? (Zod schema check)
5. Service:    InvoiceService.create() runs business logic
6. Database:   INSERT INTO invoices ... (wrapped in transaction)
7. Audit log:  Records "user X created invoice Y at time Z"
8. Response:   { data: { id, total, status } } → back to browser
9. Browser:    Shows "Invoice created" toast + refreshes list
```

Every step has rules in `.claude/rules/*.md` so the AI doesn't reinvent.

## 4. Big Problems Explained Plainly

### Problem: "What if two people try to do the same thing at once?"
This is called a **race condition**. We solve it with **transactions** — either all the changes save, or none of them do.

### Problem: "What if someone tries to break in?"
Multiple layers:
- Login required for any sensitive page (auth middleware).
- Input validated before touching the database (Zod schemas).
- Database queries use parameters, not string-concatenation (prevents SQL injection).
- Passwords hashed with bcrypt, never stored as plaintext.

### Problem: "What if a feature crashes?"
- TypeScript catches many bugs before deploy.
- Tests run automatically on every commit.
- Error pages show a friendly message instead of a stack trace.
- We log the real error server-side so we can investigate.

### Problem: "What if the database fills up?"
- Tables that grow without bound (audit logs, sessions) have retention rules.
- We can archive old data to cheaper storage.
- See `AUDIT_AND_ROADMAP.md` Part 9 for storage forecast.

## 5. Why Each Rule Matters (For a Non-Coder)

| Rule | What happens if we skip it |
|---|---|
| Test before commit | Bugs reach production. Users hit them. Trust erodes. |
| File-size budgets | One file becomes too big to read. AI gets confused. New devs quit. |
| Per-edit commits | Session dies mid-task. Work lost. Have to redo. |
| graphify-first | AI wastes tokens re-grepping the same code over and over. |
| Zod on every input | User sends bad data, app crashes or DB gets garbage. |
| No `any` type | Bug hides. Production crash 6 months later. |

## 6. Where to Look When...

| Question | Where to look |
|---|---|
| "How does login work?" | `lib/auth.ts` + `rules/api.md` |
| "Where is the invoice list page?" | `app/invoices/page.tsx` or `src/pages/invoices.tsx` |
| "What does the database look like?" | `prisma/schema.prisma` or `migrations/*.sql` |
| "What changed last week?" | `git log --since="1 week ago"` |
| "Why is the build failing on GitHub?" | `gh run list` → click latest failed → read logs |
| "What's the AI agent supposed to do?" | `CLAUDE.md` + `.claude/agents/*.md` |
