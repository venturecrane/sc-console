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

// GET /experiments/by-slug/:slug (Section 4.8.4, Issue #4)
app.get('/experiments/by-slug/:slug', async (c) => {
  const slug = c.req.param('slug');
  const requestId = c.get('requestId');

  try {
    // Query experiments with slug and status in ('launch', 'run')
    const result = await c.env.DB.prepare(
      'SELECT * FROM experiments WHERE slug = ? AND status IN (?, ?)'
    )
      .bind(slug, 'launch', 'run')
      .first();

    // If no result, return 404
    if (!result) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'EXPERIMENT_NOT_FOUND',
          message: `Experiment with slug '${slug}' not found or not available`,
          request_id: requestId,
        },
      };
      return c.json(errorResponse, 404);
    }

    // Sanitize response to only include public fields
    const sanitizedExperiment: Record<string, unknown> = {
      id: result.id,
      name: result.name,
      slug: result.slug,
      status: result.status,
      archetype: result.archetype,
      copy_pack: result.copy_pack,
      created_at: result.created_at,
    };

    // Include pricing fields if experiment is priced
    if (result.price_cents !== null && result.price_cents !== undefined) {
      sanitizedExperiment.price_cents = result.price_cents;
    }
    if (result.stripe_price_id) {
      sanitizedExperiment.stripe_price_id = result.stripe_price_id;
    }

    const successResponse: SuccessResponse = {
      success: true,
      data: sanitizedExperiment,
    };

    return c.json(successResponse, 200);
  } catch (error) {
    console.error('Database query failed', {
      requestId,
      slug,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve experiment',
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
