import { defineConfig, devices } from '@playwright/test';

/**
 * Generic Playwright E2E config (template scaffold).
 *
 * Drives the full local stack (`npm run dev`) in real Chromium. The `setup`
 * project authenticates ONCE and saves storageState so feature specs start
 * already logged in — see e2e/auth.setup.ts (copy from auth.setup.ts.template
 * and fill in your app's login).
 *
 * Run with `npm run test:e2e`.
 *
 * Per-project knobs (override via env, no need to edit this file):
 *   E2E_BASE_URL   — where the dev server serves (default http://localhost:3000)
 *   E2E_WEBSERVER  — command that boots the full stack (default `npm run dev`)
 */
const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const WEBSERVER_CMD = process.env.E2E_WEBSERVER ?? 'npm run dev';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : [['list'], ['html', { open: 'never' }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts$/ },
    {
      name: 'chromium',
      testMatch: /.*\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/user.json' },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: WEBSERVER_CMD,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
