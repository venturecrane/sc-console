/**
 * Playwright global auth setup for Clerk-protected Astro app (sc-web).
 *
 * Source: https://clerk.com/docs/guides/development/testing/playwright/test-authenticated-flows
 * Crane runbook: docs/runbooks/clerk-playwright-auth-setup.md (in crane-console)
 *
 * Astro variant note:
 *   @clerk/testing's clerkSetup() auto-detects publishable key from
 *   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, VITE_CLERK_PUBLISHABLE_KEY,
 *   CLERK_PUBLISHABLE_KEY, REACT_APP_CLERK_PUBLISHABLE_KEY, EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY.
 *   It does NOT auto-detect Astro's PUBLIC_CLERK_PUBLISHABLE_KEY.
 *   We bridge by reading PUBLIC_CLERK_PUBLISHABLE_KEY (or CLERK_PUBLISHABLE_KEY)
 *   and passing it explicitly to clerkSetup().
 *
 * Required env (in apps/sc-web/.env or CI secrets):
 *   - CLERK_SECRET_KEY              — server-side Clerk key for the test instance
 *   - PUBLIC_CLERK_PUBLISHABLE_KEY  — Astro frontend Clerk key
 *   - E2E_CLERK_USER_EMAIL          — test user email, e.g. agent-test+clerk_test@venturecrane.com
 */

import { clerk, clerkSetup } from '@clerk/testing/playwright'
import { test as setup } from '@playwright/test'
import path from 'path'

setup.describe.configure({ mode: 'serial' })

setup('global clerk setup', async () => {
  const publishableKey =
    process.env.PUBLIC_CLERK_PUBLISHABLE_KEY ?? process.env.CLERK_PUBLISHABLE_KEY

  if (!publishableKey) {
    throw new Error(
      'PUBLIC_CLERK_PUBLISHABLE_KEY (or CLERK_PUBLISHABLE_KEY) is required. ' +
        'Astro convention is PUBLIC_; @clerk/testing does not auto-detect that prefix, ' +
        'so we pass it explicitly. See docs/runbooks/clerk-playwright-auth-setup.md.'
    )
  }

  await clerkSetup({ publishableKey })
})

const authFile = path.join(__dirname, '.clerk/user.json')

setup('authenticate and save state', async ({ page }) => {
  if (!process.env.E2E_CLERK_USER_EMAIL) {
    throw new Error(
      'E2E_CLERK_USER_EMAIL not set. See docs/runbooks/clerk-playwright-auth-setup.md'
    )
  }
  if (!process.env.CLERK_SECRET_KEY) {
    throw new Error('CLERK_SECRET_KEY not set. Required for server-side sign-in token.')
  }

  await page.goto('/')
  await clerk.signIn({
    page,
    emailAddress: process.env.E2E_CLERK_USER_EMAIL,
  })

  await page.context().storageState({ path: authFile })
})
