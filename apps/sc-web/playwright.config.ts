/**
 * Playwright config for sc-web (Astro).
 *
 * Crane runbook: docs/runbooks/clerk-playwright-auth-setup.md (in crane-console)
 *
 * Notes:
 *   - Astro dev server defaults to port 4321
 *   - `setup-clerk` project runs auth.setup.ts once and saves storageState
 *   - Authenticated browser projects depend on it and load the captured state
 */

import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:4321'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL,
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'setup-clerk',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium-authed',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.clerk/user.json',
      },
      dependencies: ['setup-clerk'],
    },
    {
      name: 'chromium-public',
      testMatch: /.*\.public\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
