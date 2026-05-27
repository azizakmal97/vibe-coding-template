import { test, expect } from '@playwright/test';

/**
 * Example E2E SMOKE — the MANDATORY shape for any frontend change or component
 * refactor (AGENTS.md rule #5). Starts already authenticated (storageState from the
 * `setup` project — see playwright.config.ts). Replace the path + assertions with
 * your real page; keep the pageerror guard. Add a separate FLOW test where the page
 * has real logic (validation, auth/role gates, dup-guard banners, confirm dialogs).
 *
 * Naming: `<flow>.spec.ts` (e.g. checkout.spec.ts, safe-delete.spec.ts).
 */
test('app shell renders for an authenticated user with no uncaught errors', async ({ page }) => {
  // White-screen guard: a behaviour-preserving refactor must not introduce uncaught
  // errors. Keep this in every smoke. (console.warn/error are NOT pageerror.)
  const pageErrors: string[] = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));

  await page.goto('/');

  // Sanity: storageState worked → we are NOT bounced to login.
  await expect(page).not.toHaveURL(/login/i);

  // [Replace with real assertions against your authenticated UI, e.g.
  //  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  //  Assert input values with toHaveValue — Playwright has NO getByDisplayValue:
  //  await expect(page.locator('input[name="email"]')).toHaveValue('a@b.com');]

  expect(pageErrors, `uncaught page errors: ${pageErrors.join(' | ')}`).toHaveLength(0);
});
