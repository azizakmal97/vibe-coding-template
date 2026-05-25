# E2E (Playwright) — scaffold

Real-browser end-to-end tests so frontend changes get verified without manual
clicking. Drives the full local stack in Chromium. The `setup` project logs in
once and saves `storageState`, so every spec starts authenticated.

This scaffold is **policy made runnable** — `testing.md` prescribes Playwright;
this is the working skeleton. It does NOT run until you fill in your app's login.

## One-time fill-in

1. Install (once per project):
   ```bash
   npm i -D @playwright/test
   npx playwright install --with-deps chromium
   ```
2. Copy the auth template and fill the `[PLACEHOLDERS]`:
   ```bash
   cp e2e/auth.setup.ts.template e2e/auth.setup.ts
   ```
   Pick Shape A (token in localStorage) or Shape B (session cookie) — see the
   comments in that file. Mirror EXACTLY what your real login writes.
3. Add scripts to `package.json`:
   ```jsonc
   "scripts": {
     "seed:e2e": "<command that seeds your test user + fixtures into the LOCAL db>",
     "test:e2e": "npm run seed:e2e && playwright test"
   }
   ```
4. Replace `e2e/example.spec.ts` with a real golden-path flow.

## Seeding

The test user in `auth.setup.ts` must exist in the local/test DB before login.
Seed it idempotently in `seed:e2e` (e.g. a `.sql` file piped into your local DB,
or a setup script). Keep the seed minimal: one user per role you test + the
fixtures the golden path needs.

## Config knobs (no need to edit `playwright.config.ts`)

| Env | Default | Use |
|---|---|---|
| `E2E_BASE_URL` | `http://localhost:3000` | dev server URL / port |
| `E2E_WEBSERVER` | `npm run dev` | command that boots the full stack |

## Conventions

- `<flow>.spec.ts` — feature specs (run in the `chromium` project).
- `*.setup.ts` — auth/seed setup (run first, in the `setup` project).
- Specs assume an authenticated context; don't re-implement login per spec.

## Gitignore

These are generated, never commit them:
```
e2e/.auth/
playwright-report/
test-results/
```
