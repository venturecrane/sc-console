import { defineConfig } from 'vitest/config'

/**
 * sc-api test layout:
 *
 *   - unit-legacy  — the existing src/index.test.ts suite that spins up
 *                    wrangler via unstable_dev and exercises the worker
 *                    against a local D1 seeded by vitest.globalSetup.ts.
 *                    Kept as-is to preserve coverage; requires wrangler.
 *   - harness      — fast in-process tests via @venturecrane/crane-test-harness.
 *                    No wrangler, no globalSetup. Validates migrations against
 *                    a fresh in-memory D1 shim.
 *
 * `npm test` runs both projects.
 */
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit-legacy',
          include: ['src/**/*.test.ts'],
          globalSetup: './vitest.globalSetup.ts',
        },
      },
      {
        test: {
          name: 'harness',
          include: ['test/harness/**/*.test.ts'],
        },
      },
    ],
  },
})
