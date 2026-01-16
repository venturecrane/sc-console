import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware } from './middleware/auth';

// Environment bindings
interface Env {
  DB: D1Database;
  ASSETS: R2Bucket;
  SC_API_KEY: string;
  ENVIRONMENT: string;
  CORS_ORIGIN: string;
  API_VERSION: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  GA4_API_SECRET?: string;
  GA4_MEASUREMENT_ID?: string;
  KIT_API_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
}

// Error response format (Section 4.4)
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: object;
    request_id: string;
  };
}

// Success response format
interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
}

const app = new Hono<{ Bindings: Env; Variables: { requestId: string } }>();

// Request ID middleware (Section 4.7)
app.use('*', async (c, next) => {
  const requestId = `req_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  c.set('requestId', requestId);
  await next();
  c.header('X-Request-Id', requestId);
});

// CORS middleware (Section 4.3)
app.use('*', async (c, next) => {
  const corsMiddleware = cors({
    origin: c.env.CORS_ORIGIN,
    allowMethods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'X-SC-Key'],
    maxAge: 86400,
  });
  return corsMiddleware(c, next);
});

// Authentication middleware (Section 4.2)
app.use('*', authMiddleware);

// Global error handler (Section 4.4)
app.onError((err, c) => {
  console.error('Request failed', {
    requestId: c.get('requestId'),
    error: err.message,
    stack: err.stack,
  });

  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      request_id: c.get('requestId'),
    },
  };

  return c.json(errorResponse, 500);
});

// Health check endpoint (Section 4.8.1)
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: Date.now(),
    version: c.env.API_VERSION,
    environment: c.env.ENVIRONMENT,
  });
});

// POST /payments/webhook (Section 4.8.5, Issue #8)
// Public endpoint - uses Stripe signature verification
app.post('/payments/webhook', async (c) => {
  const requestId = c.get('requestId');

  try {
    // Get raw body and signature
    const body = await c.req.text();
    const signature = c.req.header('stripe-signature');

    if (!signature) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Missing stripe-signature header',
          request_id: requestId,
        },
      };
      return c.json(errorResponse, 400);
    }

    // Verify Stripe signature
    const webhookSecret = c.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured', { requestId });
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Webhook secret not configured',
          request_id: requestId,
        },
      };
      return c.json(errorResponse, 500);
    }

    // Parse signature header
    const sigElements = signature.split(',').reduce((acc, element) => {
      const [key, value] = element.split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const timestamp = sigElements['t'];
    const sig = sigElements['v1'];

    if (!timestamp || !sig) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Invalid stripe-signature format',
          request_id: requestId,
        },
      };
      return c.json(errorResponse, 400);
    }

    // Construct signed payload
    const signedPayload = `${timestamp}.${body}`;

    // Compute expected signature using HMAC SHA-256
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const expectedSig = signatureArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    // Verify signature
    if (sig !== expectedSig) {
      console.error('Stripe signature verification failed', { requestId });
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Invalid signature',
          request_id: requestId,
        },
      };
      return c.json(errorResponse, 400);
    }

    // Parse event
    const event = JSON.parse(body);
    const eventType = event.type;

    console.log('Stripe webhook received', {
      requestId,
      eventType,
      eventId: event.id,
    });

    // Handle different event types
    if (eventType === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;
      const amount = paymentIntent.amount;
      const currency = paymentIntent.currency;
      const customerId = paymentIntent.customer;
      const chargeId = paymentIntent.latest_charge;
      const receiptUrl = paymentIntent.charges?.data?.[0]?.receipt_url;

      // Check if payment already exists (idempotent)
      const existingPayment = await c.env.DB.prepare(
        'SELECT id FROM payments WHERE stripe_payment_intent_id = ?'
      )
        .bind(paymentIntentId)
        .first();

      if (existingPayment) {
        console.log('Payment already exists (idempotent)', {
          requestId,
          paymentIntentId,
          paymentId: existingPayment.id,
        });
        return c.json({ received: true }, 200);
      }

      // Find lead by metadata.lead_id or customer email
      let leadId = paymentIntent.metadata?.lead_id;
      let experimentId = paymentIntent.metadata?.experiment_id;

      if (!leadId && paymentIntent.receipt_email) {
        // Try to find lead by email
        const lead = await c.env.DB.prepare(
          'SELECT id, experiment_id FROM leads WHERE email = ? ORDER BY created_at DESC LIMIT 1'
        )
          .bind(paymentIntent.receipt_email.toLowerCase().trim())
          .first();

        if (lead) {
          leadId = lead.id;
          experimentId = experimentId || lead.experiment_id;
        }
      }

      // Create payment record
      await c.env.DB.prepare(
        `INSERT INTO payments (
          experiment_id,
          lead_id,
          stripe_payment_intent_id,
          stripe_customer_id,
          stripe_charge_id,
          amount_cents,
          currency,
          status,
          receipt_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          experimentId || null,
          leadId || null,
          paymentIntentId,
          customerId || null,
          chargeId || null,
          amount,
          currency,
          'succeeded',
          receiptUrl || null
        )
        .run();

      // Update lead payment_status if lead found
      if (leadId) {
        await c.env.DB.prepare(
          'UPDATE leads SET payment_status = ?, stripe_payment_id = ?, payment_amount_cents = ? WHERE id = ?'
        )
          .bind('succeeded', paymentIntentId, amount, leadId)
          .run();
      }

      console.log('Payment succeeded processed', {
        requestId,
        paymentIntentId,
        leadId,
        experimentId,
        amount,
      });
    } else if (eventType === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;

      console.log('Payment failed', {
        requestId,
        paymentIntentId,
        error: paymentIntent.last_payment_error?.message,
      });

      // Log failure event
      await c.env.DB.prepare(
        `INSERT INTO event_log (event_type, event_data) VALUES (?, ?)`
      )
        .bind('payment_failed', JSON.stringify({ payment_intent_id: paymentIntentId }))
        .run();
    } else if (eventType === 'charge.refunded') {
      const charge = event.data.object;
      const paymentIntentId = charge.payment_intent;

      console.log('Charge refunded', {
        requestId,
        paymentIntentId,
        chargeId: charge.id,
      });

      // Update payment status to refunded
      await c.env.DB.prepare(
        'UPDATE payments SET status = ? WHERE stripe_payment_intent_id = ?'
      )
        .bind('refunded', paymentIntentId)
        .run();

      // Update lead payment_status
      await c.env.DB.prepare(
        'UPDATE leads SET payment_status = ? WHERE stripe_payment_id = ?'
      )
        .bind('refunded', paymentIntentId)
        .run();
    } else if (eventType === 'charge.dispute.created') {
      const dispute = event.data.object;
      const chargeId = dispute.charge;
      const paymentIntentId = dispute.payment_intent;

      console.error('Charge disputed - ALERT', {
        requestId,
        paymentIntentId,
        chargeId,
        disputeId: dispute.id,
        reason: dispute.reason,
        amount: dispute.amount,
      });

      // Update payment status to disputed
      await c.env.DB.prepare(
        'UPDATE payments SET status = ? WHERE stripe_payment_intent_id = ?'
      )
        .bind('disputed', paymentIntentId)
        .run();

      // Log alert
      await c.env.DB.prepare(
        `INSERT INTO event_log (event_type, event_data) VALUES (?, ?)`
      )
        .bind('charge_disputed', JSON.stringify({ payment_intent_id: paymentIntentId, dispute_id: dispute.id }))
        .run();
    }

    return c.json({ received: true }, 200);
  } catch (error) {
    console.error('Webhook processing failed', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to process webhook',
        request_id: requestId,
      },
    };
    return c.json(errorResponse, 500);
  }
});

// 404 handler
app.notFound((c) => {
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
      request_id: c.get('requestId'),
    },
  };
  return c.json(errorResponse, 404);
});

export default app;
