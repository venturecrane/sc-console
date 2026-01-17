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
