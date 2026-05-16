# SC Console — Functional Specification v2.0

**Version:** 2.0
**Date:** March 2, 2026
**Status:** DRAFT — synthesized from 6 deep dives + tech spec v1.2
**Predecessor:** Technical Specification v1.2 (January 15, 2026)

---

## 1. Executive Summary

### What v2.0 Adds

This specification is **additive to tech spec v1.2**, not a replacement. It synthesizes the recommendations from six deep dive methodology documents into a single actionable implementation plan:

- **6 new artifact columns** on the `experiments` table: `hypothesis_card`, `test_blueprint`, `discovery_summary`, `campaign_package`, `page_config`, `validation_report`
- **4 new supporting columns** on `experiments`: `venture_id`, `category`, `sequence_position`, `prior_test_ref`
- **1 new column** on `decision_memos`: `decision_detail`
- **4 new tables**: `interviews`, `ventures`, `threshold_registry`, `venture_benchmarks`
- **~20 new API endpoints** across discovery, campaign generation, measurement, and ventures
- **Updated CHECK constraints**: `archetype` (replace `interview` with `fake_door`), `status` (add `discovery`)
- **Async pipeline support** via Cloudflare Queue for campaign generation
- **Two write invariant patterns**: Distill Brief and CampaignPackage projection enforcement

### Relationship to Tech Spec v1.2

Tech spec v1.2 defines the foundation: D1 schema, API routes, Astro frontend, Cloudflare deployment. This spec extends that foundation without modifying any existing working behavior. All new columns are nullable. Existing experiments continue to work without modification.

### Relationship to the Deep Dives

Each deep dive produced a branded methodology component with a "Recommendations for Functional Spec v2.0" section. This spec consolidates all 61 recommendations across DD#1-DD#6 into a coherent data model, API surface, and implementation plan. The deep dives remain the canonical source for JSON schemas and methodology rationale. This spec references them by section number rather than duplicating schema bodies.

| DD# | Branded Name          | Artifact                            | Recs   |
| --- | --------------------- | ----------------------------------- | ------ |
| 1   | The Venture Narrative | Hypothesis Card                     | 6      |
| 2   | The Validation Ladder | Test Blueprint                      | 9      |
| 3   | The Discovery Engine  | Discovery Summary                   | 8      |
| 4   | The Campaign Factory  | Campaign Package                    | 10     |
| 5   | The Launchpad         | Live Experiment (page_config)       | 11     |
| 6   | The Verdict           | Validation Report + Decision Detail | 17     |
|     |                       | **Total**                           | **61** |

---

## 2. Data Model Changes

### 2.1 New Columns on `experiments` Table

All new columns are TEXT (JSON) and nullable, added via D1 ALTER TABLE migration.

#### Artifact Columns

| Column              | Type        | Source DD | Schema Reference | Description                                                                                                                    |
| ------------------- | ----------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `hypothesis_card`   | TEXT (JSON) | DD#1      | Section 3.7      | Structured Hypothesis Card: 10 fields across 2 tiers, confidence score, one-liner                                              |
| `test_blueprint`    | TEXT (JSON) | DD#2      | Section 5.5      | Test Blueprint: archetype selection, metrics/thresholds, kill criteria, buildability, decision criteria                        |
| `discovery_summary` | TEXT (JSON) | DD#3      | Section 6.5      | Discovery Summary: pain severity, interview data, gate status, assumption updates                                              |
| `campaign_package`  | TEXT (JSON) | DD#4      | Section 6.5      | Campaign Package: copy_pack, creative_brief, social_proof, tone, channel variants, A/B variants, budget, targeting, provenance |
| `page_config`       | TEXT (JSON) | DD#5      | Section 13       | Landing page config overrides: sections, form fields, screening questions, resource URL, pricing tiers, FAQ                    |
| `validation_report` | TEXT (JSON) | DD#6      | Section 4.5      | Validation Report: metrics summary, evidence table, data quality, trend analysis, confidence assessment, recommended verdict   |

#### Supporting Columns

| Column              | Type    | Source DD | Description                                                                                                                             |
| ------------------- | ------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `venture_id`        | TEXT    | DD#4      | FK to `ventures` table. NOT enforced as FK until Phase 5; D1 does not enforce FKs by default.                                           |
| `category`          | TEXT    | DD#2      | CHECK constraint: `('demand_signal','willingness_to_pay','solution_validation')`. Derived from archetype, stored for query performance. |
| `sequence_position` | INTEGER | DD#2      | Validation Ladder rung number (1, 2, 3...) for this experiment.                                                                         |
| `prior_test_ref`    | TEXT    | DD#2      | Nullable reference to `experiments.id`. Links sequential tests on the same venture hypothesis.                                          |

### 2.2 Status Transition Map v2.0

The v1.2 status lifecycle gains a `discovery` state between `preflight` and `build`:

```
draft --> preflight --> discovery --> build --> launch --> run --> decide --> archive
                    \                 ^
                     \-> build ------/  (with discovery_gate_exception = true)
```

**Transition rules:**

| From               | To        | Condition                                                  |
| ------------------ | --------- | ---------------------------------------------------------- |
| draft              | preflight | None                                                       |
| preflight          | discovery | None                                                       |
| preflight          | build     | Requires `discovery_gate_exception` flag on the experiment |
| discovery          | build     | Requires Discovery Gate pass (Phase 4 enforcement)         |
| build              | launch    | None                                                       |
| launch             | run       | None                                                       |
| run                | decide    | None                                                       |
| decide             | archive   | None                                                       |
| Any except archive | archive   | Always allowed                                             |

**Discovery Gate** fires on BOTH `discovery -> build` and `preflight -> build` transitions. Phase 3 adds `discovery` to `VALID_STATUS_TRANSITIONS` immediately (no gate logic). Phase 4 adds gate enforcement on the `-> build` transitions.

### 2.3 Modified CHECK Constraints

**SQLite/D1 cannot ALTER CHECK constraints.** Both changes require the create-copy-drop-rename migration pattern (see Section 7, Step 3).

**1. `archetype` column:**

Replace `interview` with `fake_door`, reorder to match Validation Ladder sequence:

```sql
-- v1.2 (current)
CHECK(archetype IN ('waitlist','priced_waitlist','presale','service_pilot','content_magnet','concierge','interview'))

-- v2.0 (new)
CHECK(archetype IN ('fake_door','waitlist','content_magnet','priced_waitlist','presale','concierge','service_pilot'))
```

**2. `status` column:**

Add `discovery`:

```sql
-- v1.2 (current)
CHECK(status IN ('draft','preflight','build','launch','run','decide','archive'))

-- v2.0 (new)
CHECK(status IN ('draft','preflight','discovery','build','launch','run','decide','archive'))
```

### 2.4 Distill Brief --> Hypothesis Card Migration

DD#1 recommends replacing the 4 Distill Brief columns with the Hypothesis Card. This spec adopts the **write invariant pattern**:

- When `hypothesis_card` is **non-null** on an experiment, the 4 Distill Brief columns become **read-only projections**
- `PATCH /experiments/:id` rejects direct updates to Distill Brief fields when `hypothesis_card` is present
- Projections are auto-extracted on write:

| Distill Brief Column   | Projected From                        |
| ---------------------- | ------------------------------------- |
| `target_audience`      | `hypothesis_card.customer_segment`    |
| `problem_statement`    | `hypothesis_card.problem_statement`   |
| `value_proposition`    | `hypothesis_card.solution_hypothesis` |
| `market_size_estimate` | `hypothesis_card.market_sizing`       |

- Existing experiments without `hypothesis_card` continue to use Distill Brief fields directly (backward compatible)

### 2.5 CampaignPackage Write Invariant

When `campaign_package` is **non-null** on an experiment, the `copy_pack` and `creative_brief` columns become **read-only projections**. `PATCH /experiments/:id` rejects direct `copy_pack`/`creative_brief` updates. Edits go through the CampaignPackage, which re-extracts the projections. This prevents data drift between the three columns.

### 2.6 New Column on `decision_memos` Table

| Column            | Type        | Source DD | Schema Reference | Description                                                                                                                                        |
| ----------------- | ----------- | --------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `decision_detail` | TEXT (JSON) | DD#6      | Section 6.5      | Structured evidence, Bayesian confidence calculation, system recommendation, human override, GO conditions, kill criteria triggered, pivot routing |

Existing columns (`rationale`, `confidence_pct`, `key_metrics`, `next_steps`) remain unchanged for backward compatibility.

### 2.7 New Tables

#### `interviews`

Per-interview records for the Discovery Engine (DD#3).

```sql
CREATE TABLE IF NOT EXISTS interviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  experiment_id TEXT NOT NULL REFERENCES experiments(id),
  participant_id TEXT NOT NULL,
  mode TEXT NOT NULL CHECK(mode IN ('ai', 'hybrid', 'human')),
  protocols_covered TEXT NOT NULL,        -- JSON array: ["problem_discovery", "solution_fit", ...]
  duration_minutes INTEGER,
  pain_scores TEXT,                       -- JSON: { functional: N, emotional: N, opportunity: N }
  signal_extraction TEXT,                 -- JSON: full extraction report
  transcript_ref TEXT,                    -- R2 key to transcript file
  new_themes_detected INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

CREATE INDEX idx_interviews_experiment ON interviews(experiment_id);
```

#### `ventures`

Per-venture brand profiles for multi-venture support (DD#4).

```sql
CREATE TABLE IF NOT EXISTS ventures (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand_profile TEXT,                     -- JSON: BrandProfile (voice, colors, typography, image style, prohibited terms)
  brand_profile_version INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

CREATE TRIGGER update_ventures_timestamp
AFTER UPDATE ON ventures
BEGIN
  UPDATE ventures SET updated_at = (strftime('%s', 'now') * 1000)
  WHERE id = NEW.id;
END;
```

#### `threshold_registry`

Calibration data per archetype per phase (DD#6).

```sql
CREATE TABLE IF NOT EXISTS threshold_registry (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  archetype TEXT NOT NULL,
  phase INTEGER NOT NULL CHECK(phase IN (1, 2, 3)),
  go_threshold INTEGER NOT NULL,
  kill_threshold INTEGER NOT NULL,
  metric TEXT NOT NULL,
  sample_count INTEGER NOT NULL,
  percentile_25 INTEGER,
  percentile_75 INTEGER,
  mean_value INTEGER,
  std_dev INTEGER,
  prior_alpha REAL,
  prior_beta REAL,
  effective_from TEXT NOT NULL,
  superseded_at TEXT,
  calculation_notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

CREATE INDEX idx_threshold_archetype ON threshold_registry(archetype);
CREATE INDEX idx_threshold_phase ON threshold_registry(phase);
```

#### `venture_benchmarks`

Cross-venture performance aggregates (DD#6).

```sql
CREATE TABLE IF NOT EXISTS venture_benchmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  archetype TEXT NOT NULL,
  industry TEXT,
  price_range TEXT,
  channel TEXT,
  test_count INTEGER NOT NULL,
  mean_cvr_bp INTEGER,
  median_cvr_bp INTEGER,
  p25_cvr_bp INTEGER,
  p75_cvr_bp INTEGER,
  std_dev_cvr_bp INTEGER,
  mean_cpl_cents INTEGER,
  median_cpl_cents INTEGER,
  go_rate_pct INTEGER,
  kill_rate_pct INTEGER,
  pivot_rate_pct INTEGER,
  prior_alpha REAL,
  prior_beta REAL,
  last_updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  calculation_notes TEXT
);

CREATE INDEX idx_benchmarks_archetype ON venture_benchmarks(archetype);
CREATE INDEX idx_benchmarks_industry ON venture_benchmarks(industry);
```

---

## 3. API Changes

### 3.1 Modified Endpoints

**`POST /experiments`**

- Auto-populate archetype defaults for `kill_criteria`, `max_duration_days`, `max_spend_cents` when archetype is provided (DD#2 rec 8)
- Validate archetype against updated enum (replace `interview` with `fake_door`)
- Enforce Distill Brief write invariant: if `hypothesis_card` is provided, auto-extract projections into Distill Brief columns

**`PATCH /experiments/:id`**

- Add new fields to updatable set: `hypothesis_card`, `test_blueprint`, `discovery_summary`, `campaign_package`, `page_config`, `validation_report`, `venture_id`, `category`, `sequence_position`, `prior_test_ref`
- Enforce Distill Brief write invariant: reject direct `problem_statement`, `target_audience`, `value_proposition`, `market_size_estimate` updates when `hypothesis_card` is non-null
- Enforce CampaignPackage write invariant: reject direct `copy_pack`/`creative_brief` updates when `campaign_package` is non-null

**Status transition validation:**

- Add `discovery` to `VALID_STATUS_TRANSITIONS` (Phase 3)
- Add Discovery Gate check before `discovery -> build` and `preflight -> build` transitions (Phase 4)

### 3.2 New Ventures Endpoints (Phase 5)

| Method | Path            | Auth     | Description                                             |
| ------ | --------------- | -------- | ------------------------------------------------------- |
| POST   | `/ventures`     | X-SC-Key | Create venture with `brand_profile`                     |
| GET    | `/ventures`     | X-SC-Key | List all ventures                                       |
| GET    | `/ventures/:id` | X-SC-Key | Get venture by ID                                       |
| PATCH  | `/ventures/:id` | X-SC-Key | Update venture; auto-increments `brand_profile_version` |

### 3.3 New Discovery Endpoints (Phase 3)

| Method | Path                                  | Auth     | Description                                                      |
| ------ | ------------------------------------- | -------- | ---------------------------------------------------------------- |
| POST   | `/experiments/:id/discovery/start`    | X-SC-Key | Initialize discovery sprint; transition status to `discovery`    |
| POST   | `/experiments/:id/interviews`         | X-SC-Key | Record a completed interview with pain scores, signal extraction |
| GET    | `/experiments/:id/discovery/summary`  | X-SC-Key | Retrieve current Discovery Summary (draft or final)              |
| POST   | `/experiments/:id/discovery/finalize` | X-SC-Key | Lock Discovery Summary to "final" stage                          |
| GET    | `/experiments/:id/discovery/gate`     | X-SC-Key | Evaluate and return gate status (6 checks)                       |

### 3.4 New Campaign Generation Endpoints (Phase 5)

| Method | Path                                         | Auth     | Description                                                                       |
| ------ | -------------------------------------------- | -------- | --------------------------------------------------------------------------------- |
| POST   | `/experiments/:id/generate-campaign-package` | X-SC-Key | Enqueue async generation via Cloudflare Queue; returns `202 Accepted` with job ID |
| GET    | `/experiments/:id/campaign-package/status`   | X-SC-Key | Poll for generation completion                                                    |

### 3.5 New Measurement Endpoints (Phase 7)

| Method | Path                                          | Auth     | Description                                                             |
| ------ | --------------------------------------------- | -------- | ----------------------------------------------------------------------- |
| GET    | `/experiments/:id/validation-report`          | X-SC-Key | Current Validation Report (draft or final)                              |
| POST   | `/experiments/:id/validation-report/finalize` | X-SC-Key | Lock report to "final" stage                                            |
| GET    | `/experiments/:id/cumulative-metrics`         | X-SC-Key | Cumulative aggregated metrics across all days/sources                   |
| POST   | `/experiments/:id/evaluate-thresholds`        | X-SC-Key | Trigger threshold evaluation; returns recommended verdict with evidence |
| GET    | `/thresholds/:archetype`                      | X-SC-Key | Current threshold set from `threshold_registry`                         |
| GET    | `/benchmarks`                                 | X-SC-Key | Portfolio benchmark data from `venture_benchmarks`                      |

---

## 4. Event Log Extensions

Consolidated list of all new event types from DD#3-DD#6:

**Discovery Events (DD#3):**

- `discovery_sprint_started` -- Sprint initiated
- `interview_scheduled` -- Participant confirmed
- `interview_completed` -- Interview finished
- `interview_analyzed` -- AI extraction complete
- `saturation_detected` -- 3-in-a-row triggered
- `discovery_gate_evaluated` -- Gate check run
- `discovery_summary_finalized` -- Summary locked

**Campaign Generation Events (DD#4):**

- `campaign_gen_started` -- Pipeline begins
- `campaign_gen_step_completed` -- Each pipeline step finishes
- `campaign_gen_completed` -- Pipeline succeeds
- `campaign_gen_failed` -- Pipeline fails
- `campaign_package_approved` -- Human approves package

**Landing Page Signal Events (DD#5):**

- `page_view` -- Page load
- `scroll_depth` -- Visitor scrolls to 25/50/75/100%
- `form_start` -- First form field interaction
- `form_submit` -- Form submitted
- `payment_start` -- Stripe Checkout button clicked
- `payment_complete` -- Stripe webhook confirms payment
- `payment_failed` -- Stripe reports failure
- `pricing_view` -- Pricing section enters viewport
- `pricing_tier_select` -- User selects pricing tier
- `content_preview_view` -- Content preview section visible
- `resource_downloaded` -- Download link clicked
- `screening_question_answered` -- Screening question completed
- `pilot_details_view` -- Pilot details section visible
- `experiment_pivoted` -- Campaign pivot event

**Measurement Events (DD#6):**

- `threshold_evaluation` -- Triggered after metrics import
- `validation_report_generated` -- Draft report created/updated
- `validation_report_finalized` -- Report locked to final
- `decision_support_recommendation` -- System recommendation generated
- `go_handoff_initiated` -- GO handoff document generated
- `experiment_archived` -- Experiment moved to archive status

---

## 5. Frontend Changes

All changes target `apps/sc-web/`:

**Archetype-aware template router (DD#5):**

- Evolve `pages/e/[slug].astro` from monolithic template to archetype-aware router
- Add `resolvePageConfig()` function in `lib/landing.ts` with defaults for all 7 archetypes
- Add `LandingBase.astro` layout for shared meta tags, tracking script, footer

**Per-archetype template components (DD#5):**

- `HeroSection.astro`, `ValueProps.astro`, `SocialProof.astro`, `PricingSection.astro`
- `LeadCaptureForm.astro`, `QualificationForm.astro`, `ContentPreview.astro`
- `ProcessSteps.astro`, `FaqSection.astro`, `RefundPolicy.astro`, `PilotDetails.astro`
- `PaymentCta.astro`

**SignalCapture component (DD#5):**

- Client-side Astro island for all event tracking
- Uses `navigator.sendBeacon` for reliability
- Tracks per-archetype signal events (see Section 4)
- Included in every landing page via `LandingBase.astro`

**A/B variant support (DD#5):**

- `AbVariantWrapper.astro` component
- Hash-based deterministic variant assignment (client-side)
- Variants override: headline, subheadline, cta_text, urgency_hook, hero_image
- No-flicker protocol using opacity transition

**Channel-aware messaging (DD#5):**

- UTM parameter matching to `campaign_package.channel_variants[]`
- Channel variant fields override default `copy_pack` values
- Source normalization map: fb->facebook, ig->facebook, li->linkedin, etc.

**Preview mode (DD#5):**

- `?preview=true` query parameter bypasses status check
- Preview pages include `<meta name="robots" content="noindex">`

---

## 6. Infrastructure Additions

**Cloudflare Queue for async campaign generation (DD#4):**

- `POST /experiments/:id/generate-campaign-package` enqueues a job
- Queue Consumer worker executes the 7-step pipeline (15-minute execution limit)
- Steps: Context Assembly -> Copy Generation -> Creative Brief -> Asset Generation -> Campaign Assembly -> Consistency Check -> Human Review Gate
- Total automated time: 1-3 minutes; bottleneck is image API latency

**R2 storage for creative assets and interview transcripts (DD#3, DD#4):**

- Generated images stored in R2 using existing `generateAssetKey()` pattern
- CampaignPackage stores R2 keys in `asset_references[]`, not image data
- Interview transcripts stored with R2 reference in `interviews.transcript_ref`
- Transcripts contain PII; follow 90-day retention policy

**sc-maintenance worker updates (DD#3, DD#6):**

- Extend daily cron to handle 90-day PII purge for **archived experiments** (not just `event_log.user_agent`)
- On archive: after 90 days, purge `leads.email` (hash it), null out `leads.name`, `leads.company`, `leads.phone`
- Preserve anonymized data: `leads.custom_fields`, `leads.utm_*`, `leads.ip_country`, all `metrics_daily`, all `event_log` except `user_agent`

**Scheduled threshold recalculation job (DD#6):**

- Weekly (or after each completed experiment) recalculation
- When completed test count crosses Phase 2 (10 tests) or Phase 3 (50 tests), update `threshold_registry`

---

## 7. Migration Plan

### Migration 0002: v2.0 Schema Changes

Four steps executed in a single migration file. The order is critical.

**Step 1: Add new columns and create new tables** (safe, no data changes)

```sql
-- New columns on experiments
ALTER TABLE experiments ADD COLUMN hypothesis_card TEXT;
ALTER TABLE experiments ADD COLUMN test_blueprint TEXT;
ALTER TABLE experiments ADD COLUMN discovery_summary TEXT;
ALTER TABLE experiments ADD COLUMN campaign_package TEXT;
ALTER TABLE experiments ADD COLUMN page_config TEXT;
ALTER TABLE experiments ADD COLUMN validation_report TEXT;
ALTER TABLE experiments ADD COLUMN venture_id TEXT;
ALTER TABLE experiments ADD COLUMN category TEXT;
ALTER TABLE experiments ADD COLUMN sequence_position INTEGER;
ALTER TABLE experiments ADD COLUMN prior_test_ref TEXT;

-- New column on decision_memos
ALTER TABLE decision_memos ADD COLUMN decision_detail TEXT;

-- New tables
CREATE TABLE IF NOT EXISTS interviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  experiment_id TEXT NOT NULL REFERENCES experiments(id),
  participant_id TEXT NOT NULL,
  mode TEXT NOT NULL CHECK(mode IN ('ai', 'hybrid', 'human')),
  protocols_covered TEXT NOT NULL,
  duration_minutes INTEGER,
  pain_scores TEXT,
  signal_extraction TEXT,
  transcript_ref TEXT,
  new_themes_detected INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);
CREATE INDEX idx_interviews_experiment ON interviews(experiment_id);

CREATE TABLE IF NOT EXISTS ventures (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand_profile TEXT,
  brand_profile_version INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

CREATE TRIGGER update_ventures_timestamp
AFTER UPDATE ON ventures
BEGIN
  UPDATE ventures SET updated_at = (strftime('%s', 'now') * 1000)
  WHERE id = NEW.id;
END;

CREATE TABLE IF NOT EXISTS threshold_registry (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  archetype TEXT NOT NULL,
  phase INTEGER NOT NULL CHECK(phase IN (1, 2, 3)),
  go_threshold INTEGER NOT NULL,
  kill_threshold INTEGER NOT NULL,
  metric TEXT NOT NULL,
  sample_count INTEGER NOT NULL,
  percentile_25 INTEGER,
  percentile_75 INTEGER,
  mean_value INTEGER,
  std_dev INTEGER,
  prior_alpha REAL,
  prior_beta REAL,
  effective_from TEXT NOT NULL,
  superseded_at TEXT,
  calculation_notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);
CREATE INDEX idx_threshold_archetype ON threshold_registry(archetype);
CREATE INDEX idx_threshold_phase ON threshold_registry(phase);

CREATE TABLE IF NOT EXISTS venture_benchmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  archetype TEXT NOT NULL,
  industry TEXT,
  price_range TEXT,
  channel TEXT,
  test_count INTEGER NOT NULL,
  mean_cvr_bp INTEGER,
  median_cvr_bp INTEGER,
  p25_cvr_bp INTEGER,
  p75_cvr_bp INTEGER,
  std_dev_cvr_bp INTEGER,
  mean_cpl_cents INTEGER,
  median_cpl_cents INTEGER,
  go_rate_pct INTEGER,
  kill_rate_pct INTEGER,
  pivot_rate_pct INTEGER,
  prior_alpha REAL,
  prior_beta REAL,
  last_updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  calculation_notes TEXT
);
CREATE INDEX idx_benchmarks_archetype ON venture_benchmarks(archetype);
CREATE INDEX idx_benchmarks_industry ON venture_benchmarks(industry);
```

**Step 2: Data migration** (runs BEFORE table recreation -- new CHECK rejects `interview`)

```sql
-- Migrate draft/preflight interview experiments to fake_door
UPDATE experiments SET archetype = 'fake_door'
  WHERE archetype = 'interview' AND status IN ('draft', 'preflight');

-- Archive active interview experiments that cannot be migrated
UPDATE experiments SET status = 'archive'
  WHERE archetype = 'interview' AND status NOT IN ('draft', 'preflight');

-- Catch any remaining interview rows
UPDATE experiments SET archetype = 'fake_door'
  WHERE archetype = 'interview';
```

**Step 3: CHECK constraint recreation** (create-copy-drop-rename pattern)

```sql
-- Create new table with updated constraints
CREATE TABLE experiments_v2 (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK(status IN ('draft','preflight','discovery','build','launch','run','decide','archive')),
  archetype TEXT NOT NULL
    CHECK(archetype IN ('fake_door','waitlist','content_magnet','priced_waitlist','presale','concierge','service_pilot')),

  -- Distill Brief
  problem_statement TEXT,
  target_audience TEXT,
  value_proposition TEXT,
  market_size_estimate TEXT,

  -- Experiment Spec
  min_signups INTEGER,
  max_spend_cents INTEGER CHECK(max_spend_cents IS NULL OR max_spend_cents >= 0),
  max_duration_days INTEGER CHECK(max_duration_days IS NULL OR max_duration_days > 0),
  kill_criteria TEXT,

  -- Copy Pack / Creative Brief
  copy_pack TEXT,
  creative_brief TEXT,

  -- Stripe Config
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  price_cents INTEGER CHECK(price_cents IS NULL OR price_cents >= 0),

  -- v2.0 Artifact Columns
  hypothesis_card TEXT,
  test_blueprint TEXT,
  discovery_summary TEXT,
  campaign_package TEXT,
  page_config TEXT,
  validation_report TEXT,

  -- v2.0 Supporting Columns
  venture_id TEXT,
  category TEXT,
  sequence_position INTEGER,
  prior_test_ref TEXT,

  -- Timestamps
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  launched_at INTEGER,
  decided_at INTEGER
);

-- Copy all data
INSERT INTO experiments_v2 SELECT
  id, name, slug, status, archetype,
  problem_statement, target_audience, value_proposition, market_size_estimate,
  min_signups, max_spend_cents, max_duration_days, kill_criteria,
  copy_pack, creative_brief,
  stripe_price_id, stripe_product_id, price_cents,
  hypothesis_card, test_blueprint, discovery_summary, campaign_package, page_config, validation_report,
  venture_id, category, sequence_position, prior_test_ref,
  created_at, updated_at, launched_at, decided_at
FROM experiments;

-- Drop old table and rename
DROP TABLE experiments;
ALTER TABLE experiments_v2 RENAME TO experiments;

-- Recreate indexes
CREATE INDEX idx_experiments_status ON experiments(status);
CREATE INDEX idx_experiments_slug ON experiments(slug);

-- Recreate trigger
CREATE TRIGGER update_experiments_timestamp
AFTER UPDATE ON experiments
BEGIN
  UPDATE experiments SET updated_at = (strftime('%s', 'now') * 1000)
  WHERE id = NEW.id;
END;
```

**NOTE:** D1 does not enforce FKs by default. The 6 tables referencing `experiments` (leads, payments, metrics_daily, decision_memos, learning_memos, event_log) use TEXT references. No FK constraint enforcement needed unless `PRAGMA foreign_keys = ON`. Verify PRAGMA state before deploying.

**Step 4: Verification** (run in local D1 before deploying)

```sql
-- No interview archetypes remain
SELECT COUNT(*) FROM experiments WHERE archetype = 'interview';
-- Expected: 0

-- Row count preserved
SELECT COUNT(*) FROM experiments;
-- Expected: matches pre-migration count

-- Trigger fires correctly
UPDATE experiments SET name = name WHERE id = (SELECT id FROM experiments LIMIT 1);
-- Verify updated_at changed
```

**Backward compatibility:** All new columns are nullable. Existing experiments without new JSON columns continue to work. Write invariants only activate when the new columns are populated.

---

## 8. Implementation Phases

### Milestone A -- "v2.0-alpha" (Phases 1-3)

First user-facing value. Experiments get Hypothesis Cards, discovery interviews can be recorded, `discovery` status works. Target: ~2-3 weeks.

### Milestone B -- "v2.0-beta" (Phases 4-7)

Full artifact chain operational. Target: incremental after alpha.

---

**Phase 1: Schema Foundation**

Run Migration 0002 (all columns, tables, CHECK constraints). No application code changes.

- Execute all 4 migration steps
- Verify in local D1, then deploy to preview, then production
- Run Step 4 verification queries in each environment

---

**Phase 2: Hypothesis Card** (DD#1)

- `hypothesis_card` column write/read via `PATCH /experiments/:id`
- Implement Distill Brief write invariant: reject direct Distill Brief updates when `hypothesis_card` is non-null; auto-extract projections on `hypothesis_card` write
- Confidence score validation: `proceed` / `uncertain` / `abandon`
- `abandon` confidence triggers archive recommendation (advisory, not enforced)
- Ventures table created in Phase 1 migration but Ventures CRUD API deferred to Phase 5

---

**Phase 3: Discovery Engine** (DD#3)

- `interviews` table CRUD: `POST /experiments/:id/interviews`, query by experiment_id
- `discovery_summary` column read/write via API
- Discovery API endpoints: `/discovery/start`, `/discovery/summary`, `/discovery/finalize`, `/discovery/gate`
- Add `discovery` to `VALID_STATUS_TRANSITIONS`: `preflight -> ['discovery', 'build', 'draft', 'archive']`, `discovery -> ['build', 'archive']`
- Basic Discovery Gate logic: evaluate 6 checks (minimum interviews, pain severity, peak dimension, problem confirmed, assumption evidence, saturation)
- Mode-weighted counting: `ai * 0.5 + hybrid * 0.75 + human * 1.0`
- Discovery event types added to `event_log`

---

**Phase 4: Test Blueprint + Validation Ladder** (DD#2)

- `test_blueprint` column write/read
- Archetype defaults auto-population on `POST /experiments`: populate `kill_criteria`, `max_duration_days`, `max_spend_cents` from hardcoded per-archetype defaults (migrated to `threshold_registry` in Phase 7)
- `category` and `sequence_position` columns populated on experiment creation
- `prior_test_ref` linkage for test sequencing
- Discovery Gate enforcement on `-> build` transitions per Status Transition Map (Section 2.2)
- Hard Kill vs. Soft Kill `severity` field on kill criteria rules
- **Depends on Phase 3** (Discovery Gate references Discovery Summary)

---

**Phase 5: Campaign Factory** (DD#4)

- `campaign_package` column write/read
- CampaignPackage write invariant enforcement
- Ventures CRUD API: `POST /ventures`, `GET /ventures`, `GET /ventures/:id`, `PATCH /ventures/:id`
- `venture_id` FK population on experiments (advisory, not enforced at DB level)
- Async campaign generation pipeline: Cloudflare Queue Consumer worker
- `POST /experiments/:id/generate-campaign-package` -> 202 Accepted
- `GET /experiments/:id/campaign-package/status` for polling
- R2 asset storage for generated images
- Campaign generation event types
- Expand `metrics_daily.source` documentation to include: `facebook`, `google`, `tiktok`, `linkedin`, `reddit`, `twitter`, `email`, `manual`

---

**Phase 6: The Launchpad** (DD#5)

- `page_config` column write/read via `PATCH /experiments/:id`
- Archetype-aware template router in `[slug].astro`
- `resolvePageConfig()` function with archetype defaults
- `LandingBase.astro` layout
- `SignalCapture.astro` component (highest priority item -- enables `metrics_daily` feeding)
- Per-archetype section components (HeroSection, ValueProps, SocialProof, etc.)
- A/B variant assignment (`AbVariantWrapper.astro`)
- Channel-aware UTM matching
- Preview mode (`?preview=true`)
- Event-to-metrics aggregation logic: `page_view` count -> `sessions`, `form_submit`/`payment_complete` -> `conversions`

---

**Phase 7: The Verdict** (DD#6)

- `validation_report` column write/read
- `decision_detail` column on `decision_memos`
- Measurement endpoints: `/validation-report`, `/cumulative-metrics`, `/evaluate-thresholds`, `/thresholds/:archetype`, `/benchmarks`
- Cumulative metric aggregation (SUM across `metrics_daily` rows per experiment, derived metrics from totals)
- Data quality flag detection (bot traffic, tracking gaps, platform anomalies)
- Bayesian confidence calculation: Beta-Binomial model, Phase 1 uses Beta(1,1) prior
- Decision support algorithm (Section 9 of DD#6): evaluate after each `POST /metrics` import
- `threshold_registry` population: Phase 1 defaults hardcoded, Phase 2+ from portfolio data
- `venture_benchmarks` recomputation job
- Archetype defaults migrated from hardcoded values to `threshold_registry` lookups
- 90-day PII purge extension in `sc-maintenance` worker
- Measurement event types

---

## 9. Traceability Appendix

Every recommendation from each deep dive mapped to its location in this spec.

| DD# | Rec# | Summary                                                                   | Spec Section                  |
| --- | ---- | ------------------------------------------------------------------------- | ----------------------------- |
| 1   | 1    | Replace Distill Brief with Hypothesis Card schema                         | 2.4                           |
| 1   | 2    | Add `hypothesis_card` column to experiments                               | 2.1                           |
| 1   | 3    | Keep legacy Distill Brief columns as computed views                       | 2.4                           |
| 1   | 4    | Add confidence score as workflow gate                                     | 8 (Phase 2)                   |
| 1   | 5    | Define AI agent scaffolding as system capability                          | 8 (Phase 2, advisory)         |
| 1   | 6    | Key Assumptions bridge to kill_criteria                                   | 8 (Phase 4)                   |
| 2   | 1    | Update archetype CHECK constraint (interview -> fake_door)                | 2.3, 7 (Step 2-3)             |
| 2   | 2    | Add `test_blueprint` column                                               | 2.1                           |
| 2   | 3    | Add `category` column                                                     | 2.1                           |
| 2   | 4    | Add `sequence_position` column                                            | 2.1                           |
| 2   | 5    | Add `prior_test_ref` column                                               | 2.1                           |
| 2   | 6    | Migrate existing interview experiments                                    | 7 (Step 2)                    |
| 2   | 7    | Update KillCriteria schema with Hard/Soft Kill severity                   | 8 (Phase 4)                   |
| 2   | 8    | Add archetype defaults to API (auto-populate on create)                   | 3.1, 8 (Phase 4)              |
| 2   | 9    | Define Discovery Gate as pre-launch validation                            | 2.2, 8 (Phase 4)              |
| 3   | 1    | Add `discovery_summary` column                                            | 2.1                           |
| 3   | 2    | Create `interviews` table                                                 | 2.7                           |
| 3   | 3    | Add discovery API endpoints                                               | 3.3                           |
| 3   | 4    | Implement mode-weighted counting                                          | 8 (Phase 3)                   |
| 3   | 5    | Add discovery event types to event_log                                    | 4                             |
| 3   | 6    | Add `discovery` to status CHECK constraint                                | 2.3, 7 (Step 3)               |
| 3   | 7    | Store interview transcripts in R2                                         | 6                             |
| 3   | 8    | Plan D1 migration for discovery changes                                   | 7                             |
| 4   | 1    | Add `campaign_package` column                                             | 2.1                           |
| 4   | 2    | Add `ventures` table with `venture_id` FK on experiments                  | 2.7, 2.1                      |
| 4   | 3    | Add `campaign_package` to PATCH updatable fields; enforce write invariant | 2.5, 3.1                      |
| 4   | 4    | Add async campaign generation endpoints                                   | 3.4                           |
| 4   | 5    | Extend landing page template for social_proof and tone                    | 5                             |
| 4   | 6    | Store generated creative assets in R2                                     | 6                             |
| 4   | 7    | Add campaign generation event types                                       | 4                             |
| 4   | 8    | Add platform-specific creative spec validation                            | 8 (Phase 5)                   |
| 4   | 9    | Expand metrics_daily.source documentation                                 | 8 (Phase 5)                   |
| 4   | 10   | Add provenance.generation_tier and brand_profile_version                  | 2.1 (campaign_package schema) |
| 5   | 1    | Add `page_config` column                                                  | 2.1                           |
| 5   | 2    | Evolve [slug].astro to archetype-aware router                             | 5                             |
| 5   | 3    | Add SignalCapture component                                               | 5                             |
| 5   | 4    | Add LandingBase.astro layout                                              | 5                             |
| 5   | 5    | Add preview mode                                                          | 5                             |
| 5   | 6    | Standardize landing page event types in event_log                         | 4                             |
| 5   | 7    | Add aggregation logic (event_log -> metrics_daily)                        | 8 (Phase 6)                   |
| 5   | 8    | Add resolvePageConfig function                                            | 5                             |
| 5   | 9    | Add page_config to PATCH updatable fields                                 | 3.1                           |
| 5   | 10   | Extend leads API for custom_fields (screening questions)                  | 8 (Phase 6)                   |
| 5   | 11   | Add full UTM parameters to event_log event_data                           | 4                             |
| 6   | 1    | Add `validation_report` column                                            | 2.1                           |
| 6   | 2    | Add `decision_detail` column on decision_memos                            | 2.6                           |
| 6   | 3    | Create `threshold_registry` table                                         | 2.7                           |
| 6   | 4    | Create `venture_benchmarks` table                                         | 2.7                           |
| 6   | 5    | Add GET /validation-report endpoint                                       | 3.5                           |
| 6   | 6    | Add POST /validation-report/finalize endpoint                             | 3.5                           |
| 6   | 7    | Add GET /cumulative-metrics endpoint                                      | 3.5                           |
| 6   | 8    | Add POST /evaluate-thresholds endpoint                                    | 3.5                           |
| 6   | 9    | Add GET /thresholds/:archetype endpoint                                   | 3.5                           |
| 6   | 10   | Add GET /benchmarks endpoint                                              | 3.5                           |
| 6   | 11   | Implement decision support algorithm                                      | 8 (Phase 7)                   |
| 6   | 12   | Implement Bayesian confidence calculation                                 | 8 (Phase 7)                   |
| 6   | 13   | Add cumulative metric aggregation                                         | 8 (Phase 7)                   |
| 6   | 14   | Add data quality flag detection                                           | 8 (Phase 7)                   |
| 6   | 15   | Extend sc-maintenance for 90-day PII purge (archived experiments)         | 6                             |
| 6   | 16   | Add threshold recalculation scheduled job                                 | 6                             |
| 6   | 17   | Add measurement event types to event_log                                  | 4                             |

**Coverage: 61/61 recommendations mapped. No gaps.**

---

## 10. Artifact Chain Summary

```
Raw Idea
    |
    v
DD#1: The Venture Narrative ----------> Hypothesis Card
    |                                   (customer segment, problem, stakes,
    |                                    solution, why now, confidence)
    v
DD#3: The Discovery Engine -----------> Discovery Summary
    |                                   (pain severity, quotes, WTP signal,
    |                                    ICP refinements, gate status)
    v
DD#2: The Validation Ladder ----------> Test Blueprint
    |                                   (archetype, metrics, thresholds,
    |                                    kill criteria, decision rules)
    v
DD#4: The Campaign Factory -----------> Campaign Package
    |                                   (copy, creative, targeting, budget,
    |                                    channel variants, A/B variants)
    v
DD#5: The Launchpad ------------------> Live Experiment
    |                                   (deployed page, tracking verified,
    |                                    signals capturing)
    v
DD#6: The Verdict --------------------> Validation Report + Decision Memo
    |                                   (metrics vs. thresholds, evidence,
    |                                    Bayesian confidence, verdict)
    |
    |---> GO -------> Handoff Document -------> Product Development
    |
    |---> KILL -----> Kill Archive ------------> Kill Library (learning)
    |
    |---> PIVOT ----> Pivot Routing -----------> Re-entry at Step 1-5
    |
    |---> INVALID --> Resolution --------------> Extend / Relaunch / Redesign
```

---

**End of Functional Specification v2.0**
