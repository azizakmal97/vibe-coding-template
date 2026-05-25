import { test, expect } from '@playwright/test';

/**
 * Example E2E spec. Starts already authenticated (storageState from the `setup`
 * project — see playwright.config.ts). Replace with a real golden-path flow:
 * the highest-value journey a user takes through your app.
 *
 * Naming: `<flow>.spec.ts` (e.g. checkout.spec.ts, safe-delete.spec.ts).
 */
test('authenticated user lands on the app, not the login page', async ({ page }) => {
  await page.goto('/');

  // Sanity: storageState worked → we are NOT bounced to login.
  await expect(page).not.toHaveURL(/login/i);

  // [Replace below with a real assertion against your authenticated UI,
  //  e.g. await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();]
});
