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

/**
 * Compute SHA-256 hash of event for deduplication
 * Canonical representation includes: experiment_id, event_type, session_id, event_data (sorted keys)
 */
async function computeEventHash(
  experiment_id: string | null | undefined,
  event_type: string,
  session_id: string | null | undefined,
  event_data: unknown
): Promise<string> {
  // Create canonical representation
  const canonical = {
    experiment_id: experiment_id || null,
    event_type,
    session_id: session_id || null,
    event_data: event_data || null,
  };

  // Sort event_data keys if it's an object for determinism
  if (canonical.event_data && typeof canonical.event_data === 'object') {
    const sortedData: Record<string, unknown> = {};
    const keys = Object.keys(canonical.event_data).sort();
    for (const key of keys) {
      sortedData[key] = canonical.event_data[key as keyof typeof canonical.event_data];
    }
    canonical.event_data = sortedData;
  }

  // Stringify with sorted keys
  const canonicalJson = JSON.stringify(canonical);

  // Compute SHA-256 hash
  const encoder = new TextEncoder();
  const data = encoder.encode(canonicalJson);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

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

// POST /events (Section 4.8.3, Issue #6)
app.post('/events', async (c) => {
  const requestId = c.get('requestId');

  try {
    const body = await c.req.json();

    // Extract fields from request body
    const {
      experiment_id,
      event_type,
      event_data,
      session_id,
      visitor_id,
    } = body;

    // Validate required fields
    if (!event_type) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Missing required field: event_type',
          request_id: requestId,
        },
      };
      return c.json(errorResponse, 400);
    }

    // 1. Compute event_hash for deduplication
    const eventHash = await computeEventHash(
      experiment_id,
      event_type,
      session_id,
      event_data
    );

    // Extract tracking data from headers
    const ipCountry = c.req.header('CF-IPCountry') || null;
    const userAgent = c.req.header('User-Agent') || null;
    const referrer = c.req.header('Referer') || null;

    // 2. Check for existing event with same hash in last 5 minutes
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const existingEvent = await c.env.DB.prepare(
      'SELECT id FROM event_log WHERE event_hash = ? AND created_at > ? LIMIT 1'
    )
      .bind(eventHash, fiveMinutesAgo)
      .first();

    // 3. If exists, return 201 with existing event_id (idempotent)
    if (existingEvent) {
      console.log('Duplicate event detected (idempotent)', {
        requestId,
        event_id: existingEvent.id,
        event_hash: eventHash,
        event_type,
      });

      const successResponse: SuccessResponse = {
        success: true,
        data: {
          event_id: existingEvent.id,
          deduplicated: true,
        },
      };
      return c.json(successResponse, 201);
    }

    // 4. Insert new event
    const insertResult = await c.env.DB.prepare(
      `INSERT INTO event_log (
        experiment_id,
        event_type,
        event_data,
        event_hash,
        session_id,
        visitor_id,
        referrer,
        user_agent,
        ip_country
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        experiment_id || null,
        event_type,
        event_data ? JSON.stringify(event_data) : null,
        eventHash,
        session_id || null,
        visitor_id || null,
        referrer,
        userAgent,
        ipCountry
      )
      .run();

    // Get the inserted event_id
    const eventId = insertResult.meta.last_row_id;

    // Return 201 with new event_id
    const successResponse: SuccessResponse = {
      success: true,
      data: {
        event_id: eventId,
        deduplicated: false,
      },
    };

    console.log('Event created successfully', {
      requestId,
      event_id: eventId,
      event_type,
      experiment_id,
      event_hash: eventHash,
    });

    return c.json(successResponse, 201);
  } catch (error) {
    console.error('Event creation failed', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create event',
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
