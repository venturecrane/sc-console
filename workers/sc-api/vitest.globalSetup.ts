import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * Global setup for vitest tests
 * Initializes local D1 database with schema and seed data before any tests run
 */
export async function setup() {
  console.log('Setting up local D1 database for tests...')

  try {
    // Try to run schema migration (may fail if tables already exist)
    await execAsync('wrangler d1 execute sc-db --local --file=migrations/0001_initial_schema.sql', {
      cwd: process.cwd(),
    })
    console.log('Schema migration completed')
  } catch (error) {
    // Schema might already exist - check if it's the expected error
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (!errorMessage.includes('already exists')) {
      console.error('Failed to setup D1 schema:', error)
      throw error
    }
    console.log('Schema already exists, skipping migration')
  }

  try {
    // Run seed data (uses INSERT OR IGNORE, so safe to run multiple times)
    await execAsync('wrangler d1 execute sc-db --local --file=migrations/seed.sql', {
      cwd: process.cwd(),
    })
    console.log('Seed data loaded')
  } catch (error) {
    console.error('Failed to seed D1 database:', error)
    throw error
  }

  console.log('D1 database setup complete')
}
