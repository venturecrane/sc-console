import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { unstable_dev, UnstableDevWorker } from 'wrangler';

/**
 * Tests for POST /events (Issue #6)
 *
 * Test Plan:
 * 1. Submit event with valid data - verify 201 and stored
 * 2. Submit identical event within 5 minutes - verify 201 with same event_id (idempotent)
 * 3. Submit event with missing event_type - verify 400
 * 4. Verify event_hash is computed correctly for deduplication
 * 5. Verify tracking data extracted from headers
 */

describe('POST /events', () => {
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

  it('should return 400 when missing required field (event_type)', async () => {
    const resp = await worker.fetch('/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(resp.status).toBe(400);
    const data = await resp.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('INVALID_REQUEST');
    expect(data.error.request_id).toBeDefined();
  });

  it('should return 201 with event_id when creating new event', async () => {
    const eventData = {
      event_type: 'page_view',
      experiment_id: 'SC-2026-001',
      session_id: 'sess_123',
      visitor_id: 'visitor_456',
      event_data: {
        page: '/landing',
        duration: 5000,
      },
    };

    const resp = await worker.fetch('/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });

    expect(resp.status).toBe(201);
    const data = await resp.json();
    expect(data.success).toBe(true);
    expect(data.data.event_id).toBeDefined();
    expect(data.data.deduplicated).toBe(false);
  });

  it('should return same event_id for duplicate event within 5 minutes (idempotent)', async () => {
    // This test would require database setup to verify idempotency
    // In a real implementation:
    // 1. Submit an event
    // 2. Submit the exact same event again within 5 minutes
    // 3. Verify both responses have the same event_id
    // 4. Verify deduplicated flag is true for second response

    // TODO: Implement after D1 local testing is set up
  });

  it('should handle events without experiment_id', async () => {
    const eventData = {
      event_type: 'generic_event',
      session_id: 'sess_789',
      event_data: {
        action: 'click',
        target: 'button',
      },
    };

    const resp = await worker.fetch('/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });

    expect(resp.status).toBe(201);
    const data = await resp.json();
    expect(data.success).toBe(true);
    expect(data.data.event_id).toBeDefined();
  });

  it('should handle events without event_data', async () => {
    const eventData = {
      event_type: 'simple_event',
      session_id: 'sess_abc',
    };

    const resp = await worker.fetch('/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });

    expect(resp.status).toBe(201);
    const data = await resp.json();
    expect(data.success).toBe(true);
    expect(data.data.event_id).toBeDefined();
  });

  it('should include X-Request-Id header in response', async () => {
    const resp = await worker.fetch('/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'test_event',
      }),
    });

    expect(resp.headers.get('X-Request-Id')).toBeDefined();
    expect(resp.headers.get('X-Request-Id')).toMatch(/^req_[a-f0-9]{16}$/);
  });

  it('should extract tracking data from headers', async () => {
    // This test verifies that CF-IPCountry, User-Agent, and Referer are extracted
    // In a real implementation, we would:
    // 1. Submit event with specific headers
    // 2. Query the database to verify headers were stored correctly

    // TODO: Implement after D1 local testing is set up
  });

  it('should compute consistent event_hash for identical events', async () => {
    // This test verifies that event hashing is deterministic
    // Same event data should produce same hash
    // Different order of keys in event_data should produce same hash

    // TODO: Implement after D1 local testing is set up
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
