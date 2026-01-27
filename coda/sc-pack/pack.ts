import * as coda from '@codahq/packs-sdk';
import type {
  Experiment,
  ExperimentStatus,
  ApiSuccessResponse,
  PaginatedResponse,
  MetricsImportPayload,
} from './types';

/**
 * Silicon Crane Coda Pack
 *
 * Provides experiment management capabilities for Coda docs:
 * - Experiments sync table (list all experiments)
 * - GetExperiment formula (fetch single experiment by ID)
 * - UpdateStatus action (change experiment status)
 * - ImportMetrics action (import daily metrics)
 *
 * Authentication uses X-SC-Key header per spec Section 4.2.
 */
export const pack = coda.newPack();

// =============================================================================
// Configuration
// =============================================================================

const API_BASE_URL = 'https://sc-api.automation-ab6.workers.dev';

// Valid experiment statuses for validation
const VALID_STATUSES: ExperimentStatus[] = [
  'draft',
  'preflight',
  'build',
  'launch',
  'run',
  'decide',
  'archive',
];

// Valid experiment archetypes
const VALID_ARCHETYPES = [
  'waitlist',
  'priced_waitlist',
  'presale',
  'service_pilot',
  'content_magnet',
  'concierge',
  'interview',
];

// =============================================================================
// Authentication
// =============================================================================

/**
 * Custom header authentication using X-SC-Key
 * Per spec Section 4.2: Internal endpoints require X-SC-Key header
 */
pack.setUserAuthentication({
  type: coda.AuthenticationType.CustomHeaderToken,
  headerName: 'X-SC-Key',
  instructionsUrl: 'https://siliconcrane.com/docs/api-keys',
});

// Add network domain for API calls
pack.addNetworkDomain('automation-ab6.workers.dev');

// =============================================================================
// Schemas
// =============================================================================

/**
 * Experiment schema for sync table and formulas
 */
const ExperimentSchema = coda.makeObjectSchema({
  properties: {
    id: {
      type: coda.ValueType.String,
      description: 'Experiment ID (format: SC-YYYY-NNN)',
    },
    name: {
      type: coda.ValueType.String,
      description: 'Experiment name',
    },
    slug: {
      type: coda.ValueType.String,
      description: 'URL-safe slug',
    },
    status: {
      type: coda.ValueType.String,
      description: 'Current status (draft, preflight, build, launch, run, decide, archive)',
    },
    archetype: {
      type: coda.ValueType.String,
      description: 'Experiment archetype',
    },
    problemStatement: {
      type: coda.ValueType.String,
      description: 'Problem statement from Distill Brief',
    },
    targetAudience: {
      type: coda.ValueType.String,
      description: 'Target audience',
    },
    valueProposition: {
      type: coda.ValueType.String,
      description: 'Value proposition',
    },
    minSignups: {
      type: coda.ValueType.Number,
      description: 'Minimum signups threshold',
    },
    maxSpendCents: {
      type: coda.ValueType.Number,
      description: 'Maximum spend in cents',
    },
    maxDurationDays: {
      type: coda.ValueType.Number,
      description: 'Maximum duration in days',
    },
    priceCents: {
      type: coda.ValueType.Number,
      description: 'Price in cents (for priced experiments)',
    },
    createdAt: {
      type: coda.ValueType.String,
      codaType: coda.ValueHintType.DateTime,
      description: 'Creation timestamp',
    },
    updatedAt: {
      type: coda.ValueType.String,
      codaType: coda.ValueHintType.DateTime,
      description: 'Last update timestamp',
    },
    launchedAt: {
      type: coda.ValueType.String,
      codaType: coda.ValueHintType.DateTime,
      description: 'Launch timestamp',
    },
    decidedAt: {
      type: coda.ValueType.String,
      codaType: coda.ValueHintType.DateTime,
      description: 'Decision timestamp',
    },
  },
  displayProperty: 'name',
  idProperty: 'id',
  featuredProperties: ['status', 'archetype', 'slug'],
});

/**
 * Metrics import result schema
 */
const MetricsResultSchema = coda.makeObjectSchema({
  properties: {
    metricsId: {
      type: coda.ValueType.Number,
      description: 'ID of the created/updated metrics record',
    },
    experimentId: {
      type: coda.ValueType.String,
      description: 'Experiment ID',
    },
    date: {
      type: coda.ValueType.String,
      description: 'Date of metrics (YYYY-MM-DD)',
    },
    success: {
      type: coda.ValueType.Boolean,
      description: 'Whether the import was successful',
    },
  },
  displayProperty: 'experimentId',
});

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Convert Unix timestamp (ms) to ISO date string
 */
function timestampToIso(timestamp: number | null | undefined): string | undefined {
  if (timestamp === null || timestamp === undefined) {
    return undefined;
  }
  return new Date(timestamp).toISOString();
}

/**
 * Map API experiment to Coda schema format
 */
function mapExperimentToSchema(exp: Experiment): Record<string, unknown> {
  return {
    id: exp.id,
    name: exp.name,
    slug: exp.slug,
    status: exp.status,
    archetype: exp.archetype,
    problemStatement: exp.problem_statement || undefined,
    targetAudience: exp.target_audience || undefined,
    valueProposition: exp.value_proposition || undefined,
    minSignups: exp.min_signups || undefined,
    maxSpendCents: exp.max_spend_cents || undefined,
    maxDurationDays: exp.max_duration_days || undefined,
    priceCents: exp.price_cents || undefined,
    createdAt: timestampToIso(exp.created_at),
    updatedAt: timestampToIso(exp.updated_at),
    launchedAt: timestampToIso(exp.launched_at),
    decidedAt: timestampToIso(exp.decided_at),
  };
}

// =============================================================================
// Sync Table: Experiments
// =============================================================================

/**
 * Experiments sync table
 *
 * Syncs all experiments from the SC API with optional status filtering.
 * Uses cursor-based pagination per spec Section 4.5.
 */
pack.addSyncTable({
  name: 'Experiments',
  description: 'All Silicon Crane experiments with their current status and details.',
  identityName: 'Experiment',
  schema: ExperimentSchema,
  formula: {
    name: 'SyncExperiments',
    description: 'Fetches experiments from the SC API',
    parameters: [
      coda.makeParameter({
        type: coda.ParameterType.String,
        name: 'status',
        description: 'Filter by status (optional)',
        optional: true,
        autocomplete: VALID_STATUSES,
      }),
    ],
    execute: async function (args, context) {
      const [status] = args;
      const cursor = context.sync.continuation?.cursor as string | undefined;

      // Build URL with query params
      const url = new URL(`${API_BASE_URL}/experiments`);
      url.searchParams.set('limit', '50');

      if (status) {
        url.searchParams.set('status', status);
      }
      if (cursor) {
        url.searchParams.set('cursor', cursor);
      }

      // Fetch from API
      const response = await context.fetcher.fetch({
        method: 'GET',
        url: url.toString(),
      });

      const body = response.body as ApiSuccessResponse<PaginatedResponse<Experiment>>;

      if (!body.success) {
        throw new coda.UserVisibleError('Failed to fetch experiments from API');
      }

      // Map experiments to schema format
      const experiments = body.data.items.map(mapExperimentToSchema);

      // Return with continuation if more pages
      return {
        result: experiments,
        continuation: body.data.has_more
          ? { cursor: body.data.next_cursor }
          : undefined,
      };
    },
  },
});

// =============================================================================
// Formula: GetExperiment
// =============================================================================

/**
 * GetExperiment formula
 *
 * Fetches a single experiment by ID.
 * Uses GET /experiments/:id endpoint (requires auth).
 */
pack.addFormula({
  name: 'GetExperiment',
  description: 'Get a single experiment by ID',
  parameters: [
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: 'experimentId',
      description: 'The experiment ID (e.g., SC-2026-001)',
    }),
  ],
  resultType: coda.ValueType.Object,
  schema: ExperimentSchema,
  execute: async function (args, context) {
    const [experimentId] = args;

    // Validate ID format
    if (!experimentId.match(/^SC-\d{4}-\d{3}$/)) {
      throw new coda.UserVisibleError(
        `Invalid experiment ID format: ${experimentId}. Expected format: SC-YYYY-NNN`
      );
    }

    const url = `${API_BASE_URL}/experiments/${encodeURIComponent(experimentId)}`;

    const response = await context.fetcher.fetch({
      method: 'GET',
      url,
    });

    const body = response.body as ApiSuccessResponse<Experiment>;

    if (!body.success) {
      throw new coda.UserVisibleError(`Experiment not found: ${experimentId}`);
    }

    return mapExperimentToSchema(body.data);
  },
});

// =============================================================================
// Action: UpdateStatus
// =============================================================================

/**
 * UpdateStatus action
 *
 * Updates an experiment's status.
 * Uses PATCH /experiments/:id endpoint (requires auth).
 * Validates status transitions per spec.
 */
pack.addFormula({
  name: 'UpdateStatus',
  description: 'Update an experiment status',
  parameters: [
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: 'experimentId',
      description: 'The experiment ID (e.g., SC-2026-001)',
    }),
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: 'newStatus',
      description: 'The new status',
      autocomplete: VALID_STATUSES,
    }),
  ],
  resultType: coda.ValueType.Object,
  schema: ExperimentSchema,
  isAction: true,
  execute: async function (args, context) {
    const [experimentId, newStatus] = args;

    // Validate ID format
    if (!experimentId.match(/^SC-\d{4}-\d{3}$/)) {
      throw new coda.UserVisibleError(
        `Invalid experiment ID format: ${experimentId}. Expected format: SC-YYYY-NNN`
      );
    }

    // Validate status
    if (!VALID_STATUSES.includes(newStatus as ExperimentStatus)) {
      throw new coda.UserVisibleError(
        `Invalid status: ${newStatus}. Valid statuses: ${VALID_STATUSES.join(', ')}`
      );
    }

    const url = `${API_BASE_URL}/experiments/${encodeURIComponent(experimentId)}`;

    const response = await context.fetcher.fetch({
      method: 'PATCH',
      url,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: newStatus }),
    });

    const body = response.body as ApiSuccessResponse<Experiment>;

    if (!body.success) {
      const errorBody = response.body as { error?: { message?: string } };
      throw new coda.UserVisibleError(
        errorBody.error?.message || 'Failed to update experiment status'
      );
    }

    return mapExperimentToSchema(body.data);
  },
});

// =============================================================================
// Action: ImportMetrics
// =============================================================================

/**
 * ImportMetrics action
 *
 * Imports daily metrics for an experiment.
 * Uses POST /metrics endpoint (requires auth).
 * Derived metrics (CTR, CVR, CPL, ROAS) are computed server-side.
 */
pack.addFormula({
  name: 'ImportMetrics',
  description: 'Import daily metrics for an experiment',
  parameters: [
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: 'experimentId',
      description: 'The experiment ID (e.g., SC-2026-001)',
    }),
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: 'date',
      description: 'Date for the metrics (YYYY-MM-DD)',
    }),
    coda.makeParameter({
      type: coda.ParameterType.Number,
      name: 'impressions',
      description: 'Number of ad impressions',
    }),
    coda.makeParameter({
      type: coda.ParameterType.Number,
      name: 'clicks',
      description: 'Number of clicks',
    }),
    coda.makeParameter({
      type: coda.ParameterType.Number,
      name: 'sessions',
      description: 'Number of website sessions',
    }),
    coda.makeParameter({
      type: coda.ParameterType.Number,
      name: 'conversions',
      description: 'Number of conversions',
    }),
    coda.makeParameter({
      type: coda.ParameterType.Number,
      name: 'spendCents',
      description: 'Ad spend in cents',
    }),
    coda.makeParameter({
      type: coda.ParameterType.Number,
      name: 'revenueCents',
      description: 'Revenue in cents',
    }),
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: 'source',
      description: 'Ad platform source (facebook, google, tiktok, manual)',
      optional: true,
      autocomplete: ['facebook', 'google', 'tiktok', 'manual'],
    }),
  ],
  resultType: coda.ValueType.Object,
  schema: MetricsResultSchema,
  isAction: true,
  execute: async function (args, context) {
    const [
      experimentId,
      date,
      impressions,
      clicks,
      sessions,
      conversions,
      spendCents,
      revenueCents,
      source,
    ] = args;

    // Validate experiment ID format
    if (!experimentId.match(/^SC-\d{4}-\d{3}$/)) {
      throw new coda.UserVisibleError(
        `Invalid experiment ID format: ${experimentId}. Expected format: SC-YYYY-NNN`
      );
    }

    // Validate date format
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      throw new coda.UserVisibleError(
        `Invalid date format: ${date}. Expected format: YYYY-MM-DD`
      );
    }

    // Validate non-negative values
    const numericFields = { impressions, clicks, sessions, conversions, spendCents, revenueCents };
    for (const [field, value] of Object.entries(numericFields)) {
      if (value < 0) {
        throw new coda.UserVisibleError(`${field} cannot be negative`);
      }
    }

    const payload: MetricsImportPayload = {
      experiment_id: experimentId,
      date,
      impressions,
      clicks,
      sessions,
      conversions,
      spend_cents: spendCents,
      revenue_cents: revenueCents,
    };

    if (source) {
      payload.source = source;
    }

    const response = await context.fetcher.fetch({
      method: 'POST',
      url: `${API_BASE_URL}/metrics`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const body = response.body as ApiSuccessResponse<{ metrics_id: number }>;

    if (!body.success) {
      const errorBody = response.body as { error?: { message?: string } };
      throw new coda.UserVisibleError(
        errorBody.error?.message || 'Failed to import metrics'
      );
    }

    return {
      metricsId: body.data.metrics_id,
      experimentId,
      date,
      success: true,
    };
  },
});
