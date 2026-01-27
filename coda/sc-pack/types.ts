/**
 * TypeScript types for the Silicon Crane Coda Pack
 *
 * These types mirror the sc-api data model (spec Section 3).
 */

/**
 * Experiment status values
 */
export type ExperimentStatus =
  | 'draft'
  | 'preflight'
  | 'build'
  | 'launch'
  | 'run'
  | 'decide'
  | 'archive';

/**
 * Experiment archetype values
 */
export type ExperimentArchetype =
  | 'waitlist'
  | 'priced_waitlist'
  | 'presale'
  | 'service_pilot'
  | 'content_magnet'
  | 'concierge'
  | 'interview';

/**
 * Experiment record from the API
 */
export interface Experiment {
  id: string;
  name: string;
  slug: string;
  status: ExperimentStatus;
  archetype: ExperimentArchetype;
  problem_statement?: string | null;
  target_audience?: string | null;
  value_proposition?: string | null;
  market_size_estimate?: string | null;
  min_signups?: number | null;
  max_spend_cents?: number | null;
  max_duration_days?: number | null;
  kill_criteria?: string | null;
  copy_pack?: string | null;
  creative_brief?: string | null;
  stripe_price_id?: string | null;
  stripe_product_id?: string | null;
  price_cents?: number | null;
  created_at: number;
  updated_at: number;
  launched_at?: number | null;
  decided_at?: number | null;
}

/**
 * Daily metrics record from the API
 */
export interface MetricsDaily {
  id: number;
  experiment_id: string;
  date: string;
  impressions: number;
  clicks: number;
  sessions: number;
  conversions: number;
  spend_cents: number;
  revenue_cents: number;
  ctr_bp?: number | null;
  cvr_bp?: number | null;
  cpl_cents?: number | null;
  roas_bp?: number | null;
  source?: string | null;
  created_at: number;
  updated_at: number;
}

/**
 * API success response wrapper
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * API error response
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    request_id: string;
  };
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> {
  items: T[];
  next_cursor: string | null;
  has_more: boolean;
}

/**
 * Metrics import request payload
 */
export interface MetricsImportPayload {
  experiment_id: string;
  date: string;
  impressions: number;
  clicks: number;
  sessions: number;
  conversions: number;
  spend_cents: number;
  revenue_cents: number;
  source?: string;
}
