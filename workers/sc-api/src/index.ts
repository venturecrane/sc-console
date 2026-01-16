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
 * Generate experiment ID: SC-{year}-{sequence_number}
 * Query database for max sequence number in current year
 */
async function generateExperimentId(db: D1Database): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `SC-${currentYear}-`;

  // Get max sequence number for current year
  const result = await db
    .prepare(`SELECT id FROM experiments WHERE id LIKE ? ORDER BY id DESC LIMIT 1`)
    .bind(`${prefix}%`)
    .first();

  let sequenceNumber = 1;
  if (result && result.id) {
    const match = String(result.id).match(/SC-\d{4}-(\d+)/);
    if (match) {
      sequenceNumber = parseInt(match[1], 10) + 1;
    }
  }

  // Format: SC-2026-001
  return `${prefix}${String(sequenceNumber).padStart(3, '0')}`;
}

/**
 * Valid status transitions per spec
 * Maps current status -> allowed next statuses
 */
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['preflight', 'archive'],
  preflight: ['build', 'draft', 'archive'],
  build: ['launch', 'preflight', 'archive'],
  launch: ['run', 'archive'],
  run: ['decide', 'archive'],
  decide: ['archive'],
  archive: [], // Terminal state
};

/**
 * Validate status transition
 */
function isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
  if (currentStatus === newStatus) {
    return true; // Same status is allowed
  }
  const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
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

// GET /experiments (Section 4.8.6, Issue #7)
// Internal endpoint - requires X-SC-Key
app.get('/experiments', async (c) => {
  const requestId = c.get('requestId');

  try {
    // Parse query parameters
    const status = c.req.query('status');
    const limitParam = c.req.query('limit');
    const cursor = c.req.query('cursor');

    // Validate and set limit (default 20, max 100)
    let limit = 20;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        const errorResponse: ErrorResponse = {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Invalid limit parameter',
            request_id: requestId,
          },
        };
        return c.json(errorResponse, 400);
      }
      limit = Math.min(parsedLimit, 100);
    }

    // Build query
    let query = 'SELECT * FROM experiments';
    const bindings: (string | number)[] = [];

    // Add WHERE clauses
    const whereClauses: string[] = [];
    if (status) {
      whereClauses.push('status = ?');
      bindings.push(status);
    }
    if (cursor) {
      whereClauses.push('id > ?');
      bindings.push(cursor);
    }

    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }

    // Order and limit
    query += ' ORDER BY id ASC LIMIT ?';
    bindings.push(limit + 1); // Fetch one extra to determine has_more

    // Execute query
    const result = await c.env.DB.prepare(query).bind(...bindings).all();
    const experiments = result.results || [];

    // Determine pagination
    const hasMore = experiments.length > limit;
    const items = hasMore ? experiments.slice(0, limit) : experiments;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : null;

    const successResponse: SuccessResponse = {
      success: true,
      data: {
        items,
        next_cursor: nextCursor,
        has_more: hasMore,
      },
    };

    return c.json(successResponse, 200);
  } catch (error) {
    console.error('List experiments failed', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to list experiments',
        request_id: requestId,
      },
    };
    return c.json(errorResponse, 500);
  }
});

// GET /experiments/:id (Section 4.8.6, Issue #7)
// Internal endpoint - requires X-SC-Key
app.get('/experiments/:id', async (c) => {
  const requestId = c.get('requestId');
  const id = c.req.param('id');

  try {
    const experiment = await c.env.DB.prepare('SELECT * FROM experiments WHERE id = ?')
      .bind(id)
      .first();

    if (!experiment) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'EXPERIMENT_NOT_FOUND',
          message: `Experiment '${id}' not found`,
          request_id: requestId,
        },
      };
      return c.json(errorResponse, 404);
    }

    const successResponse: SuccessResponse = {
      success: true,
      data: experiment,
    };

    return c.json(successResponse, 200);
  } catch (error) {
    console.error('Get experiment failed', {
      requestId,
      id,
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

// POST /experiments (Section 4.8.6, Issue #7)
// Internal endpoint - requires X-SC-Key
app.post('/experiments', async (c) => {
  const requestId = c.get('requestId');

  try {
    const body = await c.req.json();
    const { name, slug, archetype } = body;

    // Validate required fields
    if (!name || !slug || !archetype) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Missing required fields: name, slug, and archetype are required',
          request_id: requestId,
        },
      };
      return c.json(errorResponse, 400);
    }

    // Validate archetype
    const validArchetypes = [
      'waitlist',
      'priced_waitlist',
      'presale',
      'service_pilot',
      'content_magnet',
      'concierge',
      'interview',
    ];
    if (!validArchetypes.includes(archetype)) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: `Invalid archetype. Must be one of: ${validArchetypes.join(', ')}`,
          request_id: requestId,
        },
      };
      return c.json(errorResponse, 400);
    }

    // Generate ID
    const id = await generateExperimentId(c.env.DB);

    // Insert experiment with default status='draft'
    const insertResult = await c.env.DB.prepare(
      `INSERT INTO experiments (id, name, slug, archetype, status) VALUES (?, ?, ?, ?, ?)`
    )
      .bind(id, name, slug, archetype, 'draft')
      .run();

    // Fetch the created experiment
    const experiment = await c.env.DB.prepare('SELECT * FROM experiments WHERE id = ?')
      .bind(id)
      .first();

    const successResponse: SuccessResponse = {
      success: true,
      data: experiment,
    };

    console.log('Experiment created successfully', {
      requestId,
      id,
      name,
      slug,
      archetype,
    });

    return c.json(successResponse, 201);
  } catch (error) {
    console.error('Create experiment failed', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Check for UNIQUE constraint violation on slug
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (
      errorMessage.includes('UNIQUE constraint failed') &&
      errorMessage.includes('slug')
    ) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'DUPLICATE_SLUG',
          message: 'An experiment with this slug already exists',
          request_id: requestId,
        },
      };
      return c.json(errorResponse, 409);
    }

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create experiment',
        request_id: requestId,
      },
    };
    return c.json(errorResponse, 500);
  }
});

// PATCH /experiments/:id (Section 4.8.6, Issue #7)
// Internal endpoint - requires X-SC-Key
app.patch('/experiments/:id', async (c) => {
  const requestId = c.get('requestId');
  const id = c.req.param('id');

  try {
    const body = await c.req.json();

    // Fetch current experiment
    const currentExperiment = await c.env.DB.prepare('SELECT * FROM experiments WHERE id = ?')
      .bind(id)
      .first();

    if (!currentExperiment) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'EXPERIMENT_NOT_FOUND',
          message: `Experiment '${id}' not found`,
          request_id: requestId,
        },
      };
      return c.json(errorResponse, 404);
    }

    // Build update fields
    const updateFields: string[] = [];
    const bindings: unknown[] = [];

    // Handle status update with validation
    if (body.status !== undefined) {
      const currentStatus = String(currentExperiment.status);
      const newStatus = body.status;

      // Validate status transition
      if (!isValidStatusTransition(currentStatus, newStatus)) {
        const errorResponse: ErrorResponse = {
          success: false,
          error: {
            code: 'INVALID_STATUS_TRANSITION',
            message: `Cannot transition from '${currentStatus}' to '${newStatus}'`,
            details: {
              current_status: currentStatus,
              requested_status: newStatus,
              allowed_transitions: VALID_STATUS_TRANSITIONS[currentStatus],
            },
            request_id: requestId,
          },
        };
        return c.json(errorResponse, 400);
      }

      updateFields.push('status = ?');
      bindings.push(newStatus);

      // Auto-set launched_at when transitioning to 'launch'
      if (newStatus === 'launch' && !currentExperiment.launched_at) {
        updateFields.push('launched_at = ?');
        bindings.push(Date.now());
      }

      // Auto-set decided_at when transitioning to 'decide'
      if (newStatus === 'decide' && !currentExperiment.decided_at) {
        updateFields.push('decided_at = ?');
        bindings.push(Date.now());
      }
    }

    // Handle other updatable fields
    const updatableFields = [
      'name',
      'slug',
      'problem_statement',
      'target_audience',
      'value_proposition',
      'market_size_estimate',
      'min_signups',
      'max_spend_cents',
      'max_duration_days',
      'kill_criteria',
      'copy_pack',
      'creative_brief',
      'stripe_price_id',
      'stripe_product_id',
      'price_cents',
    ];

    for (const field of updatableFields) {
      if (body[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        bindings.push(body[field]);
      }
    }

    if (updateFields.length === 0) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'No valid fields to update',
          request_id: requestId,
        },
      };
      return c.json(errorResponse, 400);
    }

    // Execute update
    bindings.push(id);
    const updateQuery = `UPDATE experiments SET ${updateFields.join(', ')} WHERE id = ?`;
    await c.env.DB.prepare(updateQuery).bind(...bindings).run();

    // Fetch updated experiment
    const updatedExperiment = await c.env.DB.prepare('SELECT * FROM experiments WHERE id = ?')
      .bind(id)
      .first();

    const successResponse: SuccessResponse = {
      success: true,
      data: updatedExperiment,
    };

    console.log('Experiment updated successfully', {
      requestId,
      id,
      updatedFields: Object.keys(body),
    });

    return c.json(successResponse, 200);
  } catch (error) {
    console.error('Update experiment failed', {
      requestId,
      id,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update experiment',
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
