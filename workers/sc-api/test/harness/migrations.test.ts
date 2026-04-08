/**
 * sc-api migration validation using @venturecrane/crane-test-harness.
 *
 * Asserts:
 *   1. discoverNumericMigrations returns sc-api's migration files in order.
 *   2. runMigrations applies them cleanly to a fresh in-memory D1 shim.
 *   3. Every table sc-api (and sc-maintenance, which shares sc-db) reads
 *      from or writes to exists post-migration. Catches accidental schema
 *      drift if a migration is dropped, renamed, or reordered.
 */

import { describe, it, expect } from 'vitest'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  createTestD1,
  runMigrations,
  discoverNumericMigrations,
} from '@venturecrane/crane-test-harness'

const __dirname = dirname(fileURLToPath(import.meta.url))
const migrationsDir = join(__dirname, '..', '..', 'migrations')

describe('sc-api migrations via harness', () => {
  it('discoverNumericMigrations returns migration files in order', () => {
    const files = discoverNumericMigrations(migrationsDir)
    expect(files.length).toBeGreaterThan(0)
    // First numeric migration should be 0001_initial_schema.sql.
    const firstNumbered = files.find((f) => /\d{4}_/.test(f))
    expect(firstNumbered).toMatch(/0001_initial_schema\.sql$/)
  })

  it('runMigrations applies the full chain cleanly to a fresh DB', async () => {
    const db = createTestD1()
    const files = discoverNumericMigrations(migrationsDir)
    await runMigrations(db, { files })

    const row = await db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='experiments'")
      .first<{ name: string }>()
    expect(row?.name).toBe('experiments')
  })

  it('post-migration schema includes every table sc-api + sc-maintenance use', async () => {
    const db = createTestD1()
    await runMigrations(db, { files: discoverNumericMigrations(migrationsDir) })

    // Tables referenced by workers/sc-api/src and workers/sc-maintenance/src.
    // If a migration is dropped or renamed, one of these will be missing.
    const expectedTables = [
      'experiments',
      'leads',
      'payments',
      'metrics_daily',
      'decision_memos',
      'learning_memos',
      'event_log',
    ]

    const result = await db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all<{ name: string }>()
    const actual = result.results.map((r) => r.name)

    for (const expected of expectedTables) {
      expect(actual, `expected table ${expected} to exist post-migration`).toContain(expected)
    }
  })
})
