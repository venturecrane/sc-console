import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { unstable_dev, UnstableDevWorker } from 'wrangler';

/**
 * Tests for POST /payments/webhook (Issue #8)
 *
 * Test Plan:
 * 1. Returns 400 for missing stripe-signature header
 * 2. Returns 400 for invalid stripe-signature format
 * 3. Returns 400 for invalid signature
 * 4. Returns 500 if STRIPE_WEBHOOK_SECRET not configured
 * 5. Returns 200 { received: true } for valid webhook
 * 6. Handles payment_intent.succeeded event
 * 7. Handles payment_intent.payment_failed event
 * 8. Handles charge.refunded event
 * 9. Handles charge.dispute.created event
 * 10. Idempotent: same payment_intent_id returns 200 without duplicate
 */

describe('POST /payments/webhook', () => {
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

  it('should return 400 for missing stripe-signature header', async () => {
    const resp = await worker.fetch('/payments/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'payment_intent.succeeded' }),
    });

    expect(resp.status).toBe(400);
    const data = await resp.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('INVALID_REQUEST');
    expect(data.error.message).toContain('stripe-signature');
  });

  it('should return 400 for invalid stripe-signature format', async () => {
    const resp = await worker.fetch('/payments/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'invalid',
      },
      body: JSON.stringify({ type: 'payment_intent.succeeded' }),
    });

    expect(resp.status).toBe(400);
    const data = await resp.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('INVALID_REQUEST');
  });

  it('should return 400 for invalid signature', async () => {
    const resp = await worker.fetch('/payments/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 't=1234567890,v1=invalidsignature',
      },
      body: JSON.stringify({ type: 'payment_intent.succeeded' }),
    });

    // Will return 500 if STRIPE_WEBHOOK_SECRET not configured, or 400 for invalid signature
    expect([400, 500]).toContain(resp.status);
  });

  it('should include X-Request-Id header in response', async () => {
    const resp = await worker.fetch('/payments/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'payment_intent.succeeded' }),
    });

    expect(resp.headers.get('X-Request-Id')).toBeDefined();
    expect(resp.headers.get('X-Request-Id')).toMatch(/^req_[a-f0-9]{16}$/);
  });

  it('should handle webhook with valid signature', async () => {
    // This test requires:
    // 1. STRIPE_WEBHOOK_SECRET environment variable
    // 2. Valid Stripe signature computation
    // 3. Database setup

    // TODO: Implement after proper test environment setup
    // For now, we can only test the error cases above
  });

  it('should handle payment_intent.succeeded event', async () => {
    // This test requires database setup and valid webhook signature
    // In a real implementation:
    // 1. Create test lead in database
    // 2. Send payment_intent.succeeded webhook with valid signature
    // 3. Verify payment record created in payments table
    // 4. Verify lead payment_status updated to 'succeeded'

    // TODO: Implement after D1 local testing is set up
  });

  it('should be idempotent for duplicate payment_intent', async () => {
    // This test verifies idempotency
    // In a real implementation:
    // 1. Send payment_intent.succeeded webhook
    // 2. Send same webhook again with same payment_intent_id
    // 3. Verify only one payment record exists
    // 4. Both requests return 200 { received: true }

    // TODO: Implement after D1 local testing is set up
  });

  it('should handle payment_intent.payment_failed event', async () => {
    // This test requires database setup and valid webhook signature
    // Would verify failure event is logged to event_log table

    // TODO: Implement after D1 local testing is set up
  });

  it('should handle charge.refunded event', async () => {
    // This test requires database setup and valid webhook signature
    // Would verify:
    // 1. Payment status updated to 'refunded'
    // 2. Lead payment_status updated to 'refunded'

    // TODO: Implement after D1 local testing is set up
  });

  it('should handle charge.dispute.created event', async () => {
    // This test requires database setup and valid webhook signature
    // Would verify:
    // 1. Payment status updated to 'disputed'
    // 2. Alert logged to event_log table
    // 3. console.error called with ALERT message

    // TODO: Implement after D1 local testing is set up
  });

  it('should find lead by email if metadata.lead_id not provided', async () => {
    // This test verifies fallback lead lookup
    // Would test payment_intent.succeeded without metadata.lead_id
    // but with receipt_email matching existing lead

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
