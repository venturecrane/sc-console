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
