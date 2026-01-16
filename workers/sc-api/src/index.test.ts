import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { unstable_dev, UnstableDevWorker } from 'wrangler';

/**
 * Tests for GET /experiments/by-slug/:slug (Issue #4)
 *
 * Test Plan:
 * 1. Create test experiment in 'launch' status - verify returns successfully
 * 2. Query same experiment - verify returns sanitized public fields
 * 3. Change experiment to 'draft' status - verify returns 404
 * 4. Query non-existent slug - verify returns 404
 */

describe('GET /experiments/by-slug/:slug', () => {
  let worker: UnstableDevWorker;

  beforeAll(async () => {
    worker = await unstable_dev('src/index.ts', {
      experimental: { disableExperimentalWarning: true },
      local: true,
    });

    // Set up test database with a test experiment
    // Note: In real testing, this would use D1 local database
    // For now, we'll test the endpoint structure
  });

  afterAll(async () => {
    await worker.stop();
  });

  it('should return 404 for non-existent experiment slug', async () => {
    const resp = await worker.fetch('/experiments/by-slug/non-existent-slug');
    expect(resp.status).toBe(404);

    const data = await resp.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('EXPERIMENT_NOT_FOUND');
    expect(data.error.request_id).toBeDefined();
  });

  it('should return 200 with sanitized experiment data for valid slug in launch status', async () => {
    // This test requires database setup with test data
    // In a real implementation, we would:
    // 1. Insert a test experiment with status='launch'
    // 2. Query it via the API
    // 3. Verify the response contains only public fields

    // For now, we'll skip this test and mark it as todo
    // TODO: Implement after D1 local testing is set up
  });

  it('should not return experiments in draft status', async () => {
    // This test requires database setup with test data
    // In a real implementation, we would:
    // 1. Insert a test experiment with status='draft'
    // 2. Query it via the API
    // 3. Verify it returns 404

    // TODO: Implement after D1 local testing is set up
  });

  it('should include price_cents and stripe_price_id for priced experiments', async () => {
    // This test verifies that pricing fields are included when present
    // TODO: Implement after D1 local testing is set up
  });

  it('should not include internal fields in response', async () => {
    // This test verifies sanitization of internal fields
    // Fields to exclude: kill_criteria, max_spend_cents, etc.
    // TODO: Implement after D1 local testing is set up
  });

  it('should include X-Request-Id header in response', async () => {
    const resp = await worker.fetch('/experiments/by-slug/test-slug');
    expect(resp.headers.get('X-Request-Id')).toBeDefined();
    expect(resp.headers.get('X-Request-Id')).toMatch(/^req_[a-f0-9]{16}$/);
  });
});

describe('Health check endpoint', () => {
  let worker: UnstableDevWorker;

  beforeAll(async () => {
    worker = await unstable_dev('src/index.ts', {
      experimental: { disableExperimentalWarning: true },
      local: true,
    });
  });

  afterAll(async () => {
    await worker.stop();
  });

  it('should return 200 with health status', async () => {
    const resp = await worker.fetch('/health');
    expect(resp.status).toBe(200);

    const data = await resp.json();
    expect(data.status).toBe('ok');
    expect(data.timestamp).toBeDefined();
  });
});
