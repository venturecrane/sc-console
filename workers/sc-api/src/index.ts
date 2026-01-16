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

// POST /leads (Section 4.8.2, Issue #5)
app.post('/leads', async (c) => {
  const requestId = c.get('requestId');

  try {
    const body = await c.req.json();

    // Extract fields from request body
    const {
      experiment_id,
      email,
      name,
      company,
      phone,
      custom_fields,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
      hp_field, // honeypot field
    } = body;

    // Validate required fields
    if (!experiment_id || !email) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Missing required fields: experiment_id and email are required',
          request_id: requestId,
        },
      };
      return c.json(errorResponse, 400);
    }

    // 1. Validate experiment exists and status IN ('launch', 'run')
    const experiment = await c.env.DB.prepare(
      'SELECT id, slug, status FROM experiments WHERE id = ? AND status IN (?, ?)'
    )
      .bind(experiment_id, 'launch', 'run')
      .first();

    if (!experiment) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'EXPERIMENT_NOT_FOUND',
          message: `Experiment '${experiment_id}' not found or not accepting leads`,
          request_id: requestId,
        },
      };
      return c.json(errorResponse, 404);
    }

    // 2. Honeypot detection - if hp_field is non-empty, it's a bot
    if (hp_field && hp_field.trim() !== '') {
      console.log('Bot detected via honeypot', {
        requestId,
        experiment_id,
        email,
        hp_field,
      });

      // Return 201 with fake lead_id (don't store in DB)
      const fakeLeadId = Math.floor(Math.random() * 1000000);
      const successResponse: SuccessResponse = {
        success: true,
        data: {
          lead_id: fakeLeadId,
          experiment_id,
          slug: experiment.slug,
        },
      };
      return c.json(successResponse, 201);
    }

    // 3. Normalize email: lowercase and trim
    const normalizedEmail = email.toLowerCase().trim();

    // Extract additional tracking data from headers
    const ipCountry = c.req.header('CF-IPCountry') || null;
    const userAgent = c.req.header('User-Agent') || null;
    const referrer = c.req.header('Referer') || null;

    // 4. Try INSERT INTO leads
    try {
      const insertResult = await c.env.DB.prepare(
        `INSERT INTO leads (
          experiment_id,
          email,
          name,
          company,
          phone,
          custom_fields,
          utm_source,
          utm_medium,
          utm_campaign,
          utm_term,
          utm_content,
          referrer,
          ip_country,
          user_agent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          experiment_id,
          normalizedEmail,
          name || null,
          company || null,
          phone || null,
          custom_fields ? JSON.stringify(custom_fields) : null,
          utm_source || null,
          utm_medium || null,
          utm_campaign || null,
          utm_term || null,
          utm_content || null,
          referrer,
          ipCountry,
          userAgent
        )
        .run();

      // Get the inserted lead_id
      const leadId = insertResult.meta.last_row_id;

      // 6. Return 201 with lead_id, experiment_id, slug
      const successResponse: SuccessResponse = {
        success: true,
        data: {
          lead_id: leadId,
          experiment_id,
          slug: experiment.slug,
        },
      };

      console.log('Lead created successfully', {
        requestId,
        leadId,
        experiment_id,
        email: normalizedEmail,
      });

      return c.json(successResponse, 201);
    } catch (dbError: unknown) {
      // 5. Check for UNIQUE constraint violation (duplicate lead)
      const errorMessage =
        dbError instanceof Error ? dbError.message : String(dbError);

      if (
        errorMessage.includes('UNIQUE constraint failed') ||
        errorMessage.includes('unique constraint')
      ) {
        const errorResponse: ErrorResponse = {
          success: false,
          error: {
            code: 'DUPLICATE_LEAD',
            message: `Lead with email '${normalizedEmail}' already exists for this experiment`,
            request_id: requestId,
          },
        };
        return c.json(errorResponse, 409);
      }

      // Re-throw other database errors
      throw dbError;
    }
  } catch (error) {
    console.error('Lead creation failed', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create lead',
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
