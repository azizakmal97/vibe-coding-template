---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/*.spec.ts"
  - "**/*_test.dart"
  - "**/__tests__/**"
  - "**/tests/**"
---

# Testing Rules

Loaded automatically when editing test files.

## Framework (Per Preset)

| Preset | Unit / Integration | E2E |
|---|---|---|
| web | Vitest + @testing-library/react | Playwright |
| mobile | flutter_test | integration_test |
| desktop | Vitest (FE) + `cargo test` (Rust) | Playwright via tauri-driver |
| fullstack | Vitest | Playwright |

## E2E Scaffold (web / fullstack)

A runnable Playwright skeleton ships with the web + fullstack presets (copied by
`pick-preset.mjs` into project root + `e2e/`):

- `playwright.config.ts` — webServer (`npm run dev`) + a `setup` project that logs
  in once and saves `storageState`, so specs start authenticated. Port/command
  override via `E2E_BASE_URL` / `E2E_WEBSERVER` env (no need to edit the file).
- `e2e/auth.setup.ts.template` — copy to `e2e/auth.setup.ts` and fill in your
  app's login (token-in-localStorage **or** session-cookie shape).
- `e2e/example.spec.ts` — replace with a real golden-path flow.
- `e2e/README.md` — one-time fill-in steps (install, seed, scripts).

CI runs E2E as a **separate job** that auto-skips until `e2e/auth.setup.ts` exists.
The scaffold is policy-made-runnable: this rule prescribes Playwright; the scaffold
is the working skeleton so each project doesn't rebuild it from scratch.

mobile → Flutter `integration_test`. desktop → Playwright via tauri-driver (wire
manually; the chromium scaffold above does not cover the native shell).

## Test-Before-Commit Gate (Mandatory)

Before every commit, run + paste output:

```bash
<typecheck command>     # zero errors
<lint command>          # zero warnings
<test command>          # all green
<build command>         # success
node scripts/check-file-sizes.mjs  # no hard breach
```

No "I think it passes." Paste the terminal output in the commit message body if needed.

## A green gate proves it COMPILES, not that it RENDERS

The gate above says the code type-checks, bundles and passes its assertions. It says nothing
about whether a human can use the screen. For any change a user looks at — a new component, a
reshaped layout, a control that appears conditionally — **open it and read it** before calling
it done: the dev server plus a screenshot, or a browser-driven e2e that walks the real page.

This is not belt-and-braces. Defects that a full green suite happily reports as passing:

- A list that clips at 6 of 31 rows with nothing to say it scrolls.
- An editor resolving against the stored document while the engine resolves against defaults,
  so every row reads "not set" while a rule is quietly in force.
- A card rendering flush against its top edge on desktop only, because a responsive variant
  beat the padding you passed.

Each of those had passing tests. Each was obvious in one look at the rendered page.

## Why typecheck AND build (Both Required)

`tsc --noEmit` and the bundler (esbuild / Vite / webpack) catch DIFFERENT classes of errors. Running typecheck alone is NOT sufficient.

| Tool | Catches | Misses |
|---|---|---|
| `tsc --noEmit` | type mismatches, missing imports, unused values | duplicate `const` declarations in same module, some module-resolution edge cases |
| `esbuild` / Vite build | duplicate declarations, malformed imports, tree-shaking failures | many type errors (it strips types fast) |

Real-world example: TypeScript happily compiles `const foo = ...` twice in the same file with type checking enabled, but esbuild fails with `multiple exports of name 'foo'`. tsc passes, build fails. CI catches it; local typecheck-only would miss it and ship broken.

Always run BOTH. The gate above is non-negotiable.

## No-Mock-DB Rule (Backend Tests)

Use the real database driver against a test instance:
- **Cloudflare D1**: `@cloudflare/vitest-pool-workers` with Miniflare bindings.
- **PostgreSQL**: Docker container (CI service) + Prisma `migrate deploy` against test DB.
- **SQLite (local)**: in-memory `:memory:` is OK if matching prod engine.

Mocks invent behavior; real bindings catch SQL bugs. Mock only outbound HTTP (Stripe, Resend, etc.).

## Test Layout

```
<source-file>.ts
__tests__/<source-file>.test.ts        # OR
<source-file>.test.ts (co-located)
```

Pick one convention per project. Document in CLAUDE.md §3.

## Naming

- `<module>.test.ts` for unit.
- `<flow>.spec.ts` for E2E.
- `<route>-characterization.test.ts` for legacy behavior capture before refactor.

## What Must Be Tested

Every NEW route: auth gate + happy path + one failure case.
Every NEW service method: happy + boundary + error.
Every NEW page / screen: e2e smoke (renders + zero uncaught errors) + a flow test for its primary journey.
Every BUG fix: regression test that fails before fix, passes after.
Every REFACTOR of legacy code: characterization test before the move, same test after.
Every REFACTOR / SPLIT of a frontend component: e2e smoke proving it STILL renders + zero uncaught errors. typecheck + build do NOT prove a component renders — only a browser does.

## E2E Smoke + Flow (Mandatory for UI Work)

A behaviour-preserving component split can still white-screen the page — a broken prop
wire, a changed hook order, a dead render branch — while `tsc` + build stay green. Only
a real browser catches that. So every frontend change / refactor gets a Playwright run.
This is non-negotiable (AGENTS.md rule #5) and it is YOUR job, not the human's — the
scaffold ships installed.

**Smoke** (always): load the page as the relevant role, assert every key region /
extracted panel renders, assert **zero uncaught page errors**:

```ts
import { test, expect } from '@playwright/test';

test('<page> renders for an authenticated user with no uncaught errors', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));

  await page.goto('/path');

  await expect(page.getByRole('heading', { name: '…' })).toBeVisible();
  // …assert each extracted region/panel…

  expect(pageErrors, `uncaught page errors: ${pageErrors.join(' | ')}`).toHaveLength(0);
});
```

**Flow** (where logic risk exists): exercise the actual logic — validation gating,
auth/role branches, dup-guard banners, confirm dialogs — not just rendering. A smoke
proves it mounts; a flow proves it still *works*.

**Run it, then commit:** `npx playwright test <spec> --project=chromium`, paste the pass
line, commit `test(<scope>): e2e smoke + flow for <page>`. "Owner will verify in the
browser" is NOT acceptable when the harness is installed.

**Gotchas (learned the hard way):**
- Seed e2e fixtures so they satisfy your API's id / validation guards. If a route
  rejects non-UUID ids, a `foo-1` seed id silently fails the fetch and the page renders
  empty — match the real id format.
- Playwright has NO `getByDisplayValue` (that's Testing Library). Assert input values
  with `expect(page.locator('input[name="…"]')).toHaveValue('…')`.
- The local seed command (`npm run seed:e2e`) may trip a permission/guardrail because it
  touches the DB. It's local-only and safe — run it or get it approved; don't skip the
  e2e because of it.
- `console.warn`/`console.error` are warnings, not `pageerror`. The smoke fails only on
  uncaught exceptions; pre-existing benign warnings won't (and shouldn't) block it.

## Coverage Targets

- Min 80% line coverage on changed files per PR (web/fullstack).
- Min 70% for mobile (Flutter tooling).
- Coverage report in CI artifacts. Drop > 5% fails the build.

## When an existing test contradicts your new rule, READ it first

A red test after a deliberate change is a claim, not a verdict — but the claim usually
deserves more credit than the change. Existing tests routinely encode a WORKFLOW that nobody
wrote down anywhere else: the order steps happen in, the intermediate state that is allowed to
be wrong because a later step fixes it, the escape hatch someone needs on a bad day.

Before you edit a test to match new behaviour, answer: **what did whoever wrote this believe,
and are they still right?** If the answer is "they were describing how the feature is actually
used", the new rule is wrong, not the test.

The common shape: a new guard REFUSES something that is genuinely invalid at that instant, and
breaks a flow where the next step would have resolved it. Usually the real defect was not that
the bad state could be created — it was that nobody was TOLD about it. Prefer reporting the
problem to forbidding the action:

```ts
// Refuses a clashing write, and makes the documented "do X then fix it with Y" flow impossible
if (clash) throw new Error('...');

// Allows it, hands the caller the problem, and lets the UI ask for the fixing step
if (clash) clashes.push({ date, reason });
return { ...result, clashes };
```

Record the decision next to the code, so the next person does not "tighten" it back.

## Forbidden in Tests

- `.skip` without a linked TODO + date.
- Mocking the database when real binding available.
- Time-sensitive assertions without fake timers.
- Network calls to real external services (use MSW or nock).
- Tests that depend on test ordering — every `beforeEach` resets state.

## Characterization Test Pattern (For Legacy Refactor)

Before moving / splitting a legacy route or component:

```ts
// __tests__/legacy/<route>-characterization.test.ts
// PURPOSE: Lock current behavior of POST /api/visits BEFORE refactor.
// DO NOT DELETE until refactor is shipped + verified in prod for 7 days.
test('[characterization] returns visit with status=PENDING', async () => {
  const res = await app.request('/api/visits', { method: 'POST', body: ... });
  expect(res.status).toBe(200);
  expect(await res.json()).toMatchObject({ data: { status: 'PENDING' } });
});
```

Rule: characterization test passes BEFORE the move AND after the move = safe refactor.
