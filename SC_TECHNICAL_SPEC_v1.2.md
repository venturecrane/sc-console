# Silicon Crane — Technical Specification v1.2

**Version:** 1.2  
**Date:** January 15, 2026  
**Status:** READY FOR DEV HANDOFF

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-15 | PM Team | Initial draft |
| 1.1 | 2026-01-15 | PM Team | Incorporated ChatGPT, Codex, Gemini reviews; resolved all open decisions |
| 1.2 | 2026-01-15 | PM Team | Consolidated fixes from Claude Code, Codex, Gemini final reviews |

---

## 1. Executive Summary

### 1.1 Decision

**Option B: Cloudflare-native stack** — Astro (SSR) + Workers + D1 + R2

### 1.2 Rationale

- DFG-aligned infrastructure (same Cloudflare account, patterns, tooling)
- Lowest operational complexity for early-stage validation service
- No recurring infrastructure costs at low traffic
- Single deployment target for all environments

### 1.3 Intentional Divergence from DFG

**Astro instead of Next.js 14** — This is a conscious choice:
- SC is a content-heavy marketing/landing page system
- Astro's island architecture is better suited than Next.js App Router for this use case
- DFG patterns (Next.js) make sense for data-heavy dashboards; SC is not that
- This divergence is documented and accepted

---

## 2. System Architecture

### 2.1 Component Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     siliconcrane.com                            │
│                   (Cloudflare Pages)                            │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │ Marketing Pages │  │ Experiment LPs  │  │ Lead Forms     │  │
│  │ (Static SSG)    │  │ (SSR dynamic)   │  │ (HTML + JS)    │  │
│  └─────────────────┘  └─────────────────┘  └────────────────┘  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼ HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                       sc-api                                    │
│                  (Cloudflare Worker)                            │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ /leads      │  │ /events     │  │ /experiments (internal) │ │
│  │ /payments/* │  │ /metrics    │  │ /decision_memos         │ │
│  └─────────────┘  └─────────────┘  │ /learning_memos         │ │
│                                    └─────────────────────────┘ │
└─────────┬──────────────────┬──────────────────┬──────────────────┘
         │                  │                  │
         ▼                  ▼                  ▼
   ┌──────────┐       ┌──────────┐       ┌──────────┐
   │  sc-db   │       │ sc-assets│       │  Stripe  │
   │   (D1)   │       │   (R2)   │       │ Webhooks │
   └──────────┘       └──────────┘       └──────────┘
```

### 2.2 Component Registry

| Component | Type | Purpose | Binding |
|-----------|------|---------|---------|
| `sc-web` | Cloudflare Pages | Marketing + experiment landing pages | — |
| `sc-api` | Cloudflare Worker | Backend API (leads, events, metrics) | `DB`, `ASSETS` |
| `sc-db` | D1 Database | All structured data | `DB` |
| `sc-assets` | R2 Bucket | Creative assets, evidence | `ASSETS` |

### 2.3 External Integrations

| Service | Purpose | Auth Method |
|---------|---------|-------------|
| Stripe | Payment processing | Webhook signature verification |
| Kit | Email sequences (waitlist, followup) | API key |
| GA4 | Analytics (Measurement Protocol) | API secret |

### 2.4 Client/Server Boundary (v1.2)

**Critical security note:**

```
┌─────────────────────────────────────────────────────────────────┐
│ BROWSER (sc-web client-side JS)                                 │
│                                                                 │
│ ✅ CAN call:                                                    │
│    - POST /leads (public)                                       │
│    - POST /events (public)                                      │
│    - GET /experiments/by-slug/:slug (public, launch/run only)   │
│                                                                 │
│ ❌ CANNOT call (requires X-SC-Key):                             │
│    - GET /experiments (list)                                    │
│    - POST /experiments                                          │
│    - PATCH /experiments/:id                                     │
│    - POST /metrics                                              │
│    - */decision_memos                                           │
│    - */learning_memos                                           │
│                                                                 │
│ ⚠️  NEVER expose SC_API_KEY in browser code or Pages env vars   │
└─────────────────────────────────────────────────────────────────┘
```

**sc-web environment variables:**
- `PUBLIC_API_URL` — Full URL to sc-api Worker (used in client JS)
- No `SC_API_KEY` — Pages should never have this

**Internal endpoints are server-only.** If sc-web needs internal data at build/SSR time, use Astro server-side fetches with the key stored in Worker secrets, not Pages.

---

## 3. Data Model

### 3.1 Database: sc-db (D1)

**ID:** `29424de8-2f7c-400f-bd23-03f8d2f390bc`

### 3.2 Schema Design Principles (v1.2)

- **Timestamps:** All `*_at` fields use INTEGER (Unix epoch milliseconds), not TEXT
- **Financial values:** All rates/percentages use INTEGER (basis points), not REAL
- **Money:** All currency stored as INTEGER (cents), calculated with `@dfg/money-math`
- **JSON fields:** All have schema definitions in this spec
- **Derived fields:** Stored for performance, recomputed on metrics import
- **Email normalization:** All emails lowercase and trimmed before insert/lookup
- **Rounding:** All basis point calculations use `Math.round()` — see Section 3.6

### 3.3 Schema Definition

```sql
-- ============================================================
-- EXPERIMENTS TABLE
-- Core experiment records (Distill Brief + Experiment Spec)
-- ============================================================
CREATE TABLE IF NOT EXISTS experiments (
  id TEXT PRIMARY KEY,                    -- Format: SC-YYYY-NNN
  
  -- Basic Info
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,              -- URL-safe, e.g., "accessibility-auditor"
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK(status IN ('draft','preflight','build','launch','run','decide','archive')),
  archetype TEXT NOT NULL
    CHECK(archetype IN ('waitlist','priced_waitlist','presale','service_pilot','content_magnet','concierge','interview')),
  
  -- Distill Brief (structured)
  problem_statement TEXT,
  target_audience TEXT,
  value_proposition TEXT,
  market_size_estimate TEXT,              -- TAM/SAM/SOM notes
  
  -- Experiment Spec (thresholds)
  min_signups INTEGER,
  max_spend_cents INTEGER CHECK(max_spend_cents IS NULL OR max_spend_cents >= 0),
  max_duration_days INTEGER CHECK(max_duration_days IS NULL OR max_duration_days > 0),
  kill_criteria TEXT,                     -- JSON: KillCriteriaSchema
  
  -- Copy Pack (generated content)
  copy_pack TEXT,                         -- JSON: CopyPackSchema
  
  -- Creative Brief
  creative_brief TEXT,                    -- JSON: CreativeBriefSchema
  
  -- Stripe Config (for priced_waitlist, presale)
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  price_cents INTEGER CHECK(price_cents IS NULL OR price_cents >= 0),
  
  -- Timestamps (Unix epoch ms)
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  launched_at INTEGER,
  decided_at INTEGER
);

CREATE INDEX idx_experiments_status ON experiments(status);
CREATE INDEX idx_experiments_slug ON experiments(slug);

-- ============================================================
-- LEADS TABLE
-- Captured leads with attribution
-- ============================================================
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  experiment_id TEXT NOT NULL REFERENCES experiments(id),
  
  -- Contact Info (email MUST be lowercase/trimmed before insert)
  email TEXT NOT NULL,
  name TEXT,
  company TEXT,
  phone TEXT,
  
  -- Custom Fields (archetype-specific)
  custom_fields TEXT,                     -- JSON: varies by archetype
  
  -- Status
  status TEXT NOT NULL DEFAULT 'new'
    CHECK(status IN ('new','qualified','scheduled','closed_won','closed_lost','disqualified')),
  
  -- Attribution
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  referrer TEXT,
  landing_page TEXT,
  
  -- Tracking
  session_id TEXT,
  visitor_id TEXT,
  ip_country TEXT,
  user_agent TEXT,
  
  -- Payment (if priced experiment)
  stripe_payment_id TEXT,
  payment_amount_cents INTEGER CHECK(payment_amount_cents IS NULL OR payment_amount_cents >= 0),
  payment_status TEXT
    CHECK(payment_status IS NULL OR payment_status IN ('pending','succeeded','failed','refunded')),
  
  -- Timestamps (Unix epoch ms)
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  
  -- Dedupe: one lead per email per experiment
  UNIQUE(experiment_id, email)
);

CREATE INDEX idx_leads_experiment ON leads(experiment_id);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created ON leads(created_at);

-- ============================================================
-- PAYMENTS TABLE
-- Stripe payment records for reconciliation
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  experiment_id TEXT NOT NULL REFERENCES experiments(id),
  lead_id INTEGER REFERENCES leads(id),
  
  -- Stripe Data
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  stripe_charge_id TEXT,
  
  -- Amount
  amount_cents INTEGER NOT NULL CHECK(amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'usd',
  
  -- Status
  status TEXT NOT NULL
    CHECK(status IN ('pending','succeeded','failed','refunded','disputed')),
  
  -- Metadata
  payment_method_type TEXT,               -- card|bank_transfer|etc
  receipt_url TEXT,
  
  -- Timestamps (Unix epoch ms)
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

CREATE INDEX idx_payments_experiment ON payments(experiment_id);
CREATE INDEX idx_payments_stripe_pi ON payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ============================================================
-- METRICS_DAILY TABLE
-- Daily snapshots of campaign metrics
-- ============================================================
CREATE TABLE IF NOT EXISTS metrics_daily (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  experiment_id TEXT NOT NULL REFERENCES experiments(id),
  date TEXT NOT NULL,                     -- ISO 8601 date: YYYY-MM-DD
  
  -- Raw metrics (source of truth)
  impressions INTEGER NOT NULL DEFAULT 0 CHECK(impressions >= 0),
  clicks INTEGER NOT NULL DEFAULT 0 CHECK(clicks >= 0),
  sessions INTEGER NOT NULL DEFAULT 0 CHECK(sessions >= 0),
  conversions INTEGER NOT NULL DEFAULT 0 CHECK(conversions >= 0),
  spend_cents INTEGER NOT NULL DEFAULT 0 CHECK(spend_cents >= 0),
  revenue_cents INTEGER NOT NULL DEFAULT 0 CHECK(revenue_cents >= 0),
  
  -- Derived metrics (computed on import, stored for query performance)
  -- All rates in basis points (80 = 0.80%), computed with Math.round()
  ctr_bp INTEGER,                         -- Math.round((clicks / impressions) * 10000)
  cvr_bp INTEGER,                         -- Math.round((conversions / sessions) * 10000)
  cpl_cents INTEGER,                      -- Math.round(spend_cents / conversions)
  roas_bp INTEGER,                        -- Math.round((revenue_cents / spend_cents) * 10000)
  
  -- Ad platform source
  source TEXT,                            -- facebook|google|tiktok|manual
  
  -- Timestamps (Unix epoch ms)
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  
  UNIQUE(experiment_id, date, source)
);

CREATE INDEX idx_metrics_experiment ON metrics_daily(experiment_id);
CREATE INDEX idx_metrics_date ON metrics_daily(date);

-- ============================================================
-- DECISION_MEMOS TABLE
-- GO/KILL/PIVOT decisions with rationale
-- v1.2: Removed UNIQUE constraint to allow multiple decisions (PIVOT then KILL)
-- ============================================================
CREATE TABLE IF NOT EXISTS decision_memos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  experiment_id TEXT NOT NULL REFERENCES experiments(id),
  
  -- Decision
  decision TEXT NOT NULL
    CHECK(decision IN ('GO','KILL','PIVOT','INVALID')),
  confidence_pct INTEGER CHECK(confidence_pct >= 0 AND confidence_pct <= 100),
  
  -- Context
  rationale TEXT NOT NULL,
  key_metrics TEXT,                       -- JSON: snapshot of metrics at decision
  next_steps TEXT,
  
  -- Author
  author TEXT,
  
  -- Timestamps (Unix epoch ms)
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
  
  -- NOTE: No UNIQUE constraint. Multiple decisions per experiment allowed.
  -- Query for latest: ORDER BY created_at DESC LIMIT 1
);

CREATE INDEX idx_decisions_experiment ON decision_memos(experiment_id);
CREATE INDEX idx_decisions_decision ON decision_memos(decision);

-- ============================================================
-- LEARNING_MEMOS TABLE
-- Weekly learning memos during experiment run
-- ============================================================
CREATE TABLE IF NOT EXISTS learning_memos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  experiment_id TEXT NOT NULL REFERENCES experiments(id),
  
  -- Period
  week_number INTEGER NOT NULL,           -- Week 1, 2, 3...
  week_start TEXT NOT NULL,               -- ISO 8601 date
  week_end TEXT NOT NULL,                 -- ISO 8601 date
  
  -- Content
  observations TEXT NOT NULL,             -- What we saw
  hypotheses TEXT,                        -- What we think it means
  actions_taken TEXT,                     -- What we changed
  next_week_plan TEXT,                    -- What we'll do next
  
  -- Metrics snapshot
  metrics_snapshot TEXT,                  -- JSON: key metrics for the week
  
  -- Author
  author TEXT,
  
  -- Timestamps (Unix epoch ms)
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  
  UNIQUE(experiment_id, week_number)
);

CREATE INDEX idx_learnings_experiment ON learning_memos(experiment_id);

-- ============================================================
-- EVENT_LOG TABLE
-- All events for tracking and audit
-- ============================================================
CREATE TABLE IF NOT EXISTS event_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  experiment_id TEXT,
  
  -- Event type
  event_type TEXT NOT NULL,               -- page_view|form_start|generate_lead|purchase|etc
  
  -- Event data
  event_data TEXT,                        -- JSON payload
  
  -- De-dupe hash (v1.2: for stable de-duplication)
  event_hash TEXT,                        -- SHA-256 of canonical event representation
  
  -- Attribution
  session_id TEXT,
  visitor_id TEXT,
  utm_source TEXT,
  
  -- Context
  url TEXT,
  referrer TEXT,
  user_agent TEXT,                        -- PII-like: auto-purge after 90 days
  ip_country TEXT,                        -- Cloudflare CF-IPCountry (not IP)
  
  -- Timestamps (Unix epoch ms)
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

CREATE INDEX idx_events_experiment ON event_log(experiment_id);
CREATE INDEX idx_events_type ON event_log(event_type);
CREATE INDEX idx_events_created ON event_log(created_at);
CREATE INDEX idx_events_session ON event_log(session_id);
CREATE INDEX idx_events_hash ON event_log(event_hash);

-- ============================================================
-- AUTO-UPDATE TRIGGERS (v1.2)
-- ============================================================
CREATE TRIGGER update_experiments_timestamp
AFTER UPDATE ON experiments
BEGIN
  UPDATE experiments SET updated_at = (strftime('%s', 'now') * 1000)
  WHERE id = NEW.id;
END;

CREATE TRIGGER update_leads_timestamp
AFTER UPDATE ON leads
BEGIN
  UPDATE leads SET updated_at = (strftime('%s', 'now') * 1000)
  WHERE id = NEW.id;
END;

CREATE TRIGGER update_payments_timestamp
AFTER UPDATE ON payments
BEGIN
  UPDATE payments SET updated_at = (strftime('%s', 'now') * 1000)
  WHERE id = NEW.id;
END;

CREATE TRIGGER update_metrics_timestamp
AFTER UPDATE ON metrics_daily
BEGIN
  UPDATE metrics_daily SET updated_at = (strftime('%s', 'now') * 1000)
  WHERE id = NEW.id;
END;
```

### 3.4 JSON Schema Definitions

#### KillCriteriaSchema

```typescript
interface KillCriteria {
  version: 1;
  rules: Array<{
    metric: 'cpl_cents' | 'cvr_bp' | 'roas_bp' | 'total_spend_cents' | 'days_elapsed';
    operator: 'gt' | 'lt' | 'gte' | 'lte';
    threshold: number;
    label: string;  // Human-readable description
  }>;
}
```

**Example:**
```json
{
  "version": 1,
  "rules": [
    { "metric": "cpl_cents", "operator": "gt", "threshold": 5000, "label": "Cost per lead exceeds $50" },
    { "metric": "cvr_bp", "operator": "lt", "threshold": 100, "label": "Conversion rate below 1%" },
    { "metric": "total_spend_cents", "operator": "gte", "threshold": 100000, "label": "Total spend reaches $1,000 budget cap" }
  ]
}
```

#### CopyPackSchema

```typescript
interface CopyPack {
  version: 1;
  headline: string;
  subheadline: string;
  value_props: string[];          // 3-5 bullet points
  cta_primary: string;            // Button text
  cta_secondary?: string;
  social_proof?: string;
  urgency_hook?: string;
  
  // Platform-specific
  meta_title: string;             // <60 chars
  meta_description: string;       // <160 chars
  og_title: string;
  og_description: string;
  
  // Ad copy variants
  ad_headlines: string[];         // 3-5 options
  ad_descriptions: string[];      // 3-5 options
}
```

**Example:**
```json
{
  "version": 1,
  "headline": "Get Your Website ADA-Compliant in 24 Hours",
  "subheadline": "Free automated accessibility scan with actionable fixes",
  "value_props": [
    "Identify all WCAG 2.1 AA violations",
    "Get step-by-step remediation guide",
    "Avoid costly ADA lawsuits"
  ],
  "cta_primary": "Get Free Scan",
  "cta_secondary": "Learn More",
  "social_proof": "Used by 500+ small businesses",
  "urgency_hook": "Limited to 50 scans this week",
  "meta_title": "Free Website Accessibility Scan - ADA Compliance Tool",
  "meta_description": "Check your website for ADA compliance issues in 24 hours. Free automated WCAG 2.1 scan with actionable fixes.",
  "og_title": "Get Your Website ADA-Compliant in 24 Hours",
  "og_description": "Free automated accessibility scan with step-by-step fixes",
  "ad_headlines": [
    "Avoid ADA Lawsuits - Get Free Scan",
    "Website Not Accessible? Fix It in 24h",
    "Free Accessibility Audit for Your Site"
  ],
  "ad_descriptions": [
    "Automated WCAG 2.1 scan with remediation guide. Used by 500+ businesses.",
    "Identify accessibility violations and get step-by-step fixes in 24 hours.",
    "Protect your business from ADA lawsuits. Free scan takes 5 minutes."
  ]
}
```

#### CreativeBriefSchema

```typescript
interface CreativeBrief {
  version: 1;
  image_style: 'photo' | 'illustration' | 'abstract' | 'screenshot';
  primary_subject: string;
  color_palette?: string[];
  text_overlay: boolean;
  aspect_ratios: Array<'1:1' | '9:16' | '1.91:1' | '16:9'>;
  reference_urls?: string[];
  
  // Generated assets (populated after creation)
  assets?: Array<{
    id: string;
    filename: string;
    r2_key: string;
    aspect_ratio: string;
    created_at: number;
  }>;
}
```

### 3.5 Data Retention Policy

| Data Type | Retention | Rationale |
|-----------|-----------|-----------|
| `event_log.user_agent` | 90 days | PII-adjacent, anonymize after |
| `event_log.*` | 2 years | Audit trail |
| `leads.*` | Indefinite | Business records |
| `payments.*` | 7 years | Financial compliance |
| `experiments.*` | Indefinite | Historical reference |

**Implementation:** Scheduled Worker `sc-maintenance` runs daily at 2 AM UTC. See Section 10.

### 3.6 Derived Metrics Calculation (v1.2)

All derived metrics use `Math.round()` for consistent integer results:

```typescript
function computeDerivedMetrics(raw: RawMetrics): DerivedMetrics {
  return {
    ctr_bp: raw.impressions > 0 
      ? Math.round((raw.clicks / raw.impressions) * 10000) 
      : null,
    cvr_bp: raw.sessions > 0 
      ? Math.round((raw.conversions / raw.sessions) * 10000) 
      : null,
    cpl_cents: raw.conversions > 0 
      ? Math.round(raw.spend_cents / raw.conversions) 
      : null,
    roas_bp: raw.spend_cents > 0 
      ? Math.round((raw.revenue_cents / raw.spend_cents) * 10000) 
      : null,
  };
}
```

**Basis point interpretation:** 100 bp = 1%, 250 bp = 2.5%, 10000 bp = 100%

---

## 4. API Specification

### 4.1 Base Configuration

**Worker Name:** `sc-api`  
**Production URL:** `https://sc-api.automation-ab6.workers.dev` (or custom domain)  
**Preview URL:** `https://sc-api-preview.automation-ab6.workers.dev`

### 4.2 Authentication (v1.2 Updated)

| Endpoint Pattern | Auth Required | Method | Notes |
|------------------|---------------|--------|-------|
| `POST /leads` | No | Public | Rate limited |
| `POST /events` | No | Public | Rate limited |
| `GET /experiments/by-slug/:slug` | **No** | **Public** | **Only if status = launch\|run** |
| `POST /payments/webhook` | Stripe signature | `Stripe-Signature` header | |
| `GET /experiments` | Yes | `X-SC-Key: {api_key}` | List all |
| `GET /experiments/:id` | Yes | `X-SC-Key: {api_key}` | By ID |
| `POST /experiments` | Yes | `X-SC-Key: {api_key}` | Create |
| `PATCH /experiments/:id` | Yes | `X-SC-Key: {api_key}` | Update |
| `* /metrics` | Yes | `X-SC-Key: {api_key}` | |
| `* /decision_memos` | Yes | `X-SC-Key: {api_key}` | |
| `* /learning_memos` | Yes | `X-SC-Key: {api_key}` | |

### 4.3 CORS Configuration

```typescript
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': env.CORS_ORIGIN,  // https://siliconcrane.com
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-SC-Key',
  'Access-Control-Max-Age': '86400',
};

// Preview environment: CORS_ORIGIN = '*'
// Production environment: CORS_ORIGIN = 'https://siliconcrane.com'
```

### 4.4 Error Response Format

All errors use consistent structure:

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;           // Machine-readable: 'VALIDATION_ERROR', 'NOT_FOUND', etc.
    message: string;        // Human-readable description
    details?: object;       // Additional context (validation errors, etc.)
    request_id: string;     // UUID for debugging
  };
}
```

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": { "field": "email", "value": "not-an-email" },
    "request_id": "req_abc123def456"
  }
}
```

### 4.5 Pagination Format (v1.2)

All list endpoints use cursor-based pagination:

```typescript
// Request
interface PaginationParams {
  cursor?: string;  // Omit for first page (base64-encoded JSON)
  limit?: number;   // Default varies by endpoint, max 100
}

// Response
interface PaginatedResponse<T> {
  success: true;
  data: {
    items: T[];
    total_count?: number;      // Optional, expensive to compute
    next_cursor: string | null;
    has_more: boolean;
  };
}

// Cursor implementation
function encodeCursor(lastItem: { id: string | number; created_at: number }): string {
  return btoa(JSON.stringify({ id: lastItem.id, created_at: lastItem.created_at }));
}

function decodeCursor(cursor: string): { id: string | number; created_at: number } {
  return JSON.parse(atob(cursor));
}
```

### 4.6 SQL Injection Prevention (v1.2)

**REQUIRED: Always use parameterized queries.**

```typescript
// ✅ CORRECT: Parameterized query
const result = await env.DB
  .prepare('SELECT * FROM experiments WHERE id = ?')
  .bind(experimentId)
  .first();

// ✅ CORRECT: Multiple parameters
const result = await env.DB
  .prepare('SELECT * FROM leads WHERE experiment_id = ? AND status = ?')
  .bind(experimentId, status)
  .all();

// ❌ NEVER: String concatenation
const result = await env.DB
  .prepare(`SELECT * FROM experiments WHERE id = '${experimentId}'`)
  .first();

// ❌ NEVER: Template literals with user input
const result = await env.DB
  .prepare(`SELECT * FROM experiments ORDER BY ${sortField}`)
  .first();

// ❌ NEVER: Unvalidated column/table names
// If dynamic columns needed, use allowlist:
const ALLOWED_SORT_FIELDS = ['created_at', 'name', 'status'];
if (!ALLOWED_SORT_FIELDS.includes(sortField)) {
  throw new Error('Invalid sort field');
}
```

### 4.7 Request ID Middleware (v1.2)

All requests get a UUID for debugging:

```typescript
async function handleRequest(request: Request, env: Env, ctx: ExecutionContext) {
  const requestId = `req_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  
  try {
    const response = await routeRequest(request, env, ctx, requestId);
    response.headers.set('X-Request-Id', requestId);
    return response;
  } catch (error) {
    console.error('Request failed', { requestId, error });
    return Response.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        request_id: requestId
      }
    }, { status: 500, headers: { 'X-Request-Id': requestId } });
  }
}
```

### 4.8 Endpoint Specifications

#### 4.8.1 Health Check

```
GET /health

Response 200:
{
  "status": "ok",
  "timestamp": 1705320000000,
  "version": "1.2.0",
  "environment": "production"
}
```

---

## 5. Frontend (sc-web)

### 5.1 Technology Stack

**Framework:** Astro 4.x with SSR  
**Deployment:** Cloudflare Pages with `@astrojs/cloudflare` adapter  
**Styling:** Tailwind CSS  
**Forms:** Plain HTML + vanilla JS (no framework islands for forms)

---

## 6. Security

### 6.1 Authentication

| Context | Method |
|---------|--------|
| Public endpoints | Rate limiting only |
| Internal endpoints | `X-SC-Key` header with rotatable API key |
| Stripe webhooks | Signature verification |
| Admin access | Coda (v1), simple dashboard (v2) |

### 6.2 Rate Limiting

Cloudflare WAF rules:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /leads` | 10 | 1 minute |
| `POST /events` | 60 | 1 minute |
| `GET /experiments/by-slug/*` | 100 | 1 minute |
| Internal endpoints | 300 | 1 minute |

---

## 7. Deployment

### 7.1 Environments

| Environment | URL | Purpose |
|-------------|-----|---------|
| Production | `siliconcrane.com`, `sc-api.automation-ab6.workers.dev` | Live traffic |
| Preview | `*.siliconcrane.pages.dev`, `sc-api-preview.*.workers.dev` | PR previews |
| Local | `localhost:4321`, `localhost:8787` | Development |

### 7.2 Environment Variables

**sc-api (Worker):**

```toml
# wrangler.toml
[vars]
ENVIRONMENT = "production"
CORS_ORIGIN = "https://siliconcrane.com"
API_VERSION = "1.2.0"

# Secrets (set via `wrangler secret put`)
# SC_API_KEY
# STRIPE_SECRET_KEY
# STRIPE_WEBHOOK_SECRET
# GA4_API_SECRET
# GA4_MEASUREMENT_ID
# KIT_API_KEY
# TURNSTILE_SECRET_KEY (Phase 2)

[[d1_databases]]
binding = "DB"
database_name = "sc-db"
database_id = "29424de8-2f7c-400f-bd23-03f8d2f390bc"

[[r2_buckets]]
binding = "ASSETS"
bucket_name = "sc-assets"

[env.preview]
vars = { ENVIRONMENT = "preview", CORS_ORIGIN = "*" }
```

**sc-web (Pages):**

```
# Environment variables (Cloudflare Pages dashboard)
PUBLIC_API_URL=https://sc-api.automation-ab6.workers.dev
PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX

# ⚠️ NEVER add SC_API_KEY to Pages - it would be exposed to browsers
```

### 7.3 Local Development

```bash
# Prerequisites
# - Node.js 20+
# - npm 9+
# - wrangler CLI (npm i -g wrangler)

# Clone and setup
git clone <repo>
cd silicon-crane
npm install

# Setup local database
cd workers/sc-api
npm run db:migrate:local

# Create .dev.vars for local secrets
cat > .dev.vars << EOF
SC_API_KEY=dev_key_12345
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
GA4_API_SECRET=dev_secret
KIT_API_KEY=kit_dev_key
CORS_ORIGIN=http://localhost:4321
EOF

# Start API worker (terminal 1)
wrangler dev --local --port 8787

# Start web frontend (terminal 2)
cd apps/sc-web
npm run dev  # Runs on localhost:4321
```

---

## 8. Testing Strategy

### 8.1 API Testing (sc-api)

**Framework:** Vitest + Miniflare

```typescript
// src/index.test.ts
import { env, createExecutionContext } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from './index';

describe('POST /leads', () => {
  it('creates lead and returns 201 with slug', async () => {
    const request = new Request('http://localhost/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        experiment_id: 'SC-2026-001',
        email: 'test@example.com'
      })
    });
    
    const response = await worker.fetch(request, env, createExecutionContext());
    expect(response.status).toBe(201);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.lead_id).toBeDefined();
    expect(data.data.slug).toBeDefined();  // v1.2: slug returned
  });
});
```

---

## 9. Admin Interface

### 9.1 Phase 1: Coda Integration

**Decision:** Coda for all admin operations in v1.

**Coda Pack capabilities needed:**
- List experiments
- View experiment details
- Update experiment status
- Import metrics
- View leads
- Create decision memos
- Create learning memos

**Implementation:** Custom Coda Pack calling sc-api with `X-SC-Key` auth.

---

## 10. Operations

### 10.1 Data Retention Enforcement

**Worker:** `sc-maintenance`  
**Trigger:** Daily cron at 2 AM UTC

```typescript
// workers/sc-maintenance/src/index.ts
export default {
  async scheduled(event: ScheduledEvent, env: Env) {
    const now = Date.now();
    
    // Anonymize user_agent after 90 days
    const ninetyDaysAgo = now - (90 * 24 * 60 * 60 * 1000);
    await env.DB
      .prepare('UPDATE event_log SET user_agent = NULL WHERE created_at < ? AND user_agent IS NOT NULL')
      .bind(ninetyDaysAgo)
      .run();
    
    console.log('Maintenance: user_agent anonymization complete');
  }
};
```

**wrangler.toml:**
```toml
name = "sc-maintenance"
main = "src/index.ts"

[triggers]
crons = ["0 2 * * *"]

[[d1_databases]]
binding = "DB"
database_name = "sc-db"
database_id = "29424de8-2f7c-400f-bd23-03f8d2f390bc"
```

---

## 11. Migrations

### 11.1 Migration System

```
workers/sc-api/
├── migrations/
│   ├── 0001_initial_schema.sql
│   └── README.md
└── package.json
```

**package.json scripts:**
```json
{
  "scripts": {
    "db:migrate": "wrangler d1 execute sc-db --remote --file=migrations/0001_initial_schema.sql",
    "db:migrate:local": "wrangler d1 execute sc-db --local --file=migrations/0001_initial_schema.sql"
  }
}
```

---

## 12. Implementation Phases

### Phase 1: Foundation (10-12 hours)

| Task | Est. | Deliverable |
|------|------|-------------|
| D1 schema setup + migrations | 2h | All tables created |
| Worker scaffold | 2h | /health, error handling, CORS, request ID |
| GET /experiments/by-slug/:slug | 1h | Public endpoint for SSR |
| /leads endpoint | 2h | Public lead capture with honeypot, email normalization |
| /events endpoint | 2h | Public event tracking with de-dupe hash |
| Stripe webhook | 2h | Payment processing |

**Exit criteria:** Can capture leads via API, SSR can fetch experiments.

---

**End of Technical Specification v1.2**
