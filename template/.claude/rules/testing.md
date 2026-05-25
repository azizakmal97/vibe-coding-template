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
Every BUG fix: regression test that fails before fix, passes after.
Every REFACTOR of legacy code: characterization test before the move, same test after.

## Coverage Targets

- Min 80% line coverage on changed files per PR (web/fullstack).
- Min 70% for mobile (Flutter tooling).
- Coverage report in CI artifacts. Drop > 5% fails the build.

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
