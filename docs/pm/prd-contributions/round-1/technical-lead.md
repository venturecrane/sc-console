# Technical Lead Contribution - PRD Review Round 1

**Author:** Technical Lead
**Date:** 2026-03-02
**Scope:** MVP / Phase 0 only (Functional Spec v2.0, Phases 1-3)
**Source Documents:** `sc-project-instructions.md`, `sc-functional-spec-v2.md`
**Baseline:** Tech Spec v1.2 (implemented), `0001_initial_schema.sql`

---

## 1. Architecture & Technical Design

### 1.1 System Boundaries (Current State)

The v1.2 system is deployed and operational. The architecture diagram below shows the current production state plus the v2.0 additions for MVP scope (Phases 1-3).

```
                           siliconcrane.com
                         (Cloudflare Pages)
  ┌──────────────────────────────────────────────────────┐
  │                                                      │
  │  Static SSG Pages    SSR Landing Pages    Lead Forms │
  │  (marketing)         [slug].astro         (HTML+JS)  │
  │                                                      │
  └──────────────────────┬───────────────────────────────┘
                         │ HTTPS (public + internal)
                         v
  ┌──────────────────────────────────────────────────────┐
  │                     sc-api                           │
  │               (Cloudflare Worker / Hono)             │
  │                                                      │
  │  Public:             Internal (X-SC-Key):            │
  │  POST /leads         GET/POST/PATCH /experiments     │
  │  POST /events        GET /experiments/:id/leads      │
  │  POST /contact       POST /metrics                   │
  │  GET /exp/by-slug/*  */decision_memos                │
  │  POST /pay/webhook   */learning_memos                │
  │                                                      │
  │  v2.0 MVP additions (Phase 3):                       │
  │  POST /experiments/:id/discovery/start               │
  │  POST /experiments/:id/interviews                    │
  │  GET  /experiments/:id/discovery/summary             │
  │  POST /experiments/:id/discovery/finalize            │
  │  GET  /experiments/:id/discovery/gate                │
  │                                                      │
  └───────┬──────────────────┬───────────────────────────┘
          │                  │
          v                  v
    ┌──────────┐       ┌──────────┐
    │  sc-db   │       │ sc-assets│
    │   (D1)   │       │   (R2)   │
    └──────────┘       └──────────┘

  ┌──────────────────────────────────────────────────────┐
  │                sc-maintenance                        │
  │          (Cloudflare Worker, cron 2AM UTC)           │
  │  - event_log.user_agent 90-day purge (existing)     │
  └──────────────────────────────────────────────────────┘
```

### 1.2 Key Design Decisions

**Decision 1: All v2.0 artifact columns are TEXT (JSON), nullable.**
Rationale: D1/SQLite does not support native JSON columns. Storing JSON as TEXT with application-layer validation follows the established v1.2 pattern (`copy_pack`, `creative_brief`, `kill_criteria`). Nullable columns ensure zero-downtime migration -- existing experiments continue to function without modification.

**Decision 2: Write invariant pattern over column deprecation.**
The Distill Brief columns (`problem_statement`, `target_audience`, `value_proposition`, `market_size_estimate`) are not dropped. Instead, when `hypothesis_card` is non-null, those 4 columns become read-only projections auto-extracted from the card. This preserves backward compatibility with the existing Coda admin pack and any scripts that read Distill Brief fields directly.

**Decision 3: CHECK constraint migration via create-copy-drop-rename.**
SQLite/D1 cannot ALTER CHECK constraints. The `archetype` and `status` constraint changes require recreating the `experiments` table. This is the only supported approach in D1 and must be executed carefully in a single migration file with verification queries.

**Decision 4: No Cloudflare Queue in MVP.**
Campaign generation (Phase 5) and threshold recalculation (Phase 7) require Cloudflare Queue. These are explicitly out of MVP scope. MVP delivers schema foundation, Hypothesis Card, and Discovery Engine only.

**Decision 5: interviews table uses R2 for transcript storage.**
Interview transcripts contain PII and can be large. The `transcript_ref` column stores an R2 key, not the transcript body. This matches the established `creative_brief.assets[].r2_key` pattern from v1.2.

### 1.3 Layers

| Layer          | Technology                 | Responsibility                              |
| -------------- | -------------------------- | ------------------------------------------- |
| Frontend       | Astro 5 SSR + Tailwind CSS | Landing pages, lead forms, marketing        |
| API            | Cloudflare Worker (Hono)   | All business logic, validation, persistence |
| Database       | Cloudflare D1 (SQLite)     | Structured data, schema enforcement         |
| Object Storage | Cloudflare R2              | Creative assets, interview transcripts      |
| Scheduled Jobs | sc-maintenance Worker      | Data retention, PII anonymization           |

---

## 2. Proposed Data Model

### 2.1 Migration 0002: New Columns on `experiments`

```sql
-- Artifact Columns (all TEXT/JSON, nullable)
ALTER TABLE experiments ADD COLUMN hypothesis_card TEXT;
ALTER TABLE experiments ADD COLUMN test_blueprint TEXT;
ALTER TABLE experiments ADD COLUMN discovery_summary TEXT;
ALTER TABLE experiments ADD COLUMN campaign_package TEXT;
ALTER TABLE experiments ADD COLUMN page_config TEXT;
ALTER TABLE experiments ADD COLUMN validation_report TEXT;

-- Supporting Columns
ALTER TABLE experiments ADD COLUMN venture_id TEXT;
ALTER TABLE experiments ADD COLUMN category TEXT;
ALTER TABLE experiments ADD COLUMN sequence_position INTEGER;
ALTER TABLE experiments ADD COLUMN prior_test_ref TEXT;
```

**Notes:**

- `venture_id` is a TEXT reference to `ventures.id`. Not enforced as FK (D1 does not enforce FKs by default; PRAGMA foreign_keys is OFF).
- `category` will have an application-layer CHECK: `demand_signal | willingness_to_pay | solution_validation`. Not a DB constraint initially because adding it requires table recreation -- defer to the same migration step that handles `archetype`/`status`.
- `sequence_position` is INTEGER (1-based). Populated on experiment creation when the Test Blueprint is built (Phase 4). NULL for MVP.
- `prior_test_ref` is a self-referencing TEXT to `experiments.id`. NULL for first tests in a sequence.

### 2.2 Migration 0002: New Column on `decision_memos`

```sql
ALTER TABLE decision_memos ADD COLUMN decision_detail TEXT;
```

`decision_detail` is TEXT (JSON) conforming to the DD#6 Section 6.5 schema. Nullable. Not populated until Phase 7.

### 2.3 Migration 0002: New Table `interviews`

```sql
CREATE TABLE IF NOT EXISTS interviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  experiment_id TEXT NOT NULL REFERENCES experiments(id),
  participant_id TEXT NOT NULL,
  mode TEXT NOT NULL CHECK(mode IN ('ai', 'hybrid', 'human')),
  protocols_covered TEXT NOT NULL,         -- JSON array: ["problem_discovery", "solution_fit", ...]
  duration_minutes INTEGER,
  pain_scores TEXT,                        -- JSON: { functional: N, emotional: N, opportunity: N }
  signal_extraction TEXT,                  -- JSON: full extraction report
  transcript_ref TEXT,                     -- R2 key to transcript file
  new_themes_detected INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

CREATE INDEX idx_interviews_experiment ON interviews(experiment_id);
```

**Column details:**

| Column                | Type        | Nullable | Description                                                              |
| --------------------- | ----------- | -------- | ------------------------------------------------------------------------ |
| `id`                  | INTEGER     | No (PK)  | Auto-incrementing primary key                                            |
| `experiment_id`       | TEXT        | No       | FK to experiments.id                                                     |
| `participant_id`      | TEXT        | No       | Opaque identifier for the interviewee (not PII -- use pseudonym or hash) |
| `mode`                | TEXT        | No       | `ai`, `hybrid`, or `human` -- determines weighting in gate calculations  |
| `protocols_covered`   | TEXT (JSON) | No       | Array of protocol names covered in this interview                        |
| `duration_minutes`    | INTEGER     | Yes      | Interview length (null for AI-only)                                      |
| `pain_scores`         | TEXT (JSON) | Yes      | `{ functional: 0-10, emotional: 0-10, opportunity: 0-10 }`               |
| `signal_extraction`   | TEXT (JSON) | Yes      | Full AI extraction report (themes, quotes, WTP signals)                  |
| `transcript_ref`      | TEXT        | Yes      | R2 object key for full transcript (PII -- 90-day retention)              |
| `new_themes_detected` | INTEGER     | No       | Count of new themes found in this interview (for saturation tracking)    |
| `created_at`          | INTEGER     | No       | Unix epoch milliseconds                                                  |

### 2.4 Migration 0002: New Table `ventures`

```sql
CREATE TABLE IF NOT EXISTS ventures (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand_profile TEXT,                      -- JSON: BrandProfile schema
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

**Note:** The `ventures` table is created in Phase 1 (schema foundation) but the CRUD API is deferred to Phase 5. The table exists so `venture_id` has a valid target, but no endpoints or application logic reference it during MVP.

### 2.5 Migration 0002: New Table `threshold_registry`

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

**Note:** Created in Phase 1 but not populated until Phase 7. Phase 4 uses hardcoded per-archetype defaults in application code.

### 2.6 Migration 0002: New Table `venture_benchmarks`

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

**Note:** Created in Phase 1 but not populated until Phase 7.

### 2.7 Migration 0002: CHECK Constraint Recreation

The `experiments` table must be recreated to update `archetype` and `status` CHECK constraints. Full SQL is specified in Functional Spec v2.0, Section 7, Step 3. Key changes:

**archetype:** Remove `interview`, add `fake_door`, reorder to match Validation Ladder.

```sql
-- v1.2: CHECK(archetype IN ('waitlist','priced_waitlist','presale','service_pilot','content_magnet','concierge','interview'))
-- v2.0: CHECK(archetype IN ('fake_door','waitlist','content_magnet','priced_waitlist','presale','concierge','service_pilot'))
```

**status:** Add `discovery` between `preflight` and `build`.

```sql
-- v1.2: CHECK(status IN ('draft','preflight','build','launch','run','decide','archive'))
-- v2.0: CHECK(status IN ('draft','preflight','discovery','build','launch','run','decide','archive'))
```

**category** should also be added as a CHECK on the recreated table:

```sql
category TEXT CHECK(category IS NULL OR category IN ('demand_signal','willingness_to_pay','solution_validation'))
```

**Data migration** runs BEFORE table recreation:

```sql
-- Move draft/preflight interview experiments to fake_door
UPDATE experiments SET archetype = 'fake_door'
  WHERE archetype = 'interview' AND status IN ('draft', 'preflight');

-- Archive active interview experiments that cannot be migrated
UPDATE experiments SET status = 'archive'
  WHERE archetype = 'interview' AND status NOT IN ('draft', 'preflight');

-- Catch any remaining
UPDATE experiments SET archetype = 'fake_door'
  WHERE archetype = 'interview';
```

### 2.8 Status Transition Map v2.0

```
draft --> preflight --> discovery --> build --> launch --> run --> decide --> archive
                    \                 ^
                     \-> build ------/  (requires discovery_gate_exception)
```

Updated transition table (application layer enforcement in `VALID_STATUS_TRANSITIONS`):

| From      | To        | Condition                                                                  |
| --------- | --------- | -------------------------------------------------------------------------- |
| draft     | preflight | None                                                                       |
| draft     | archive   | None                                                                       |
| preflight | discovery | None                                                                       |
| preflight | build     | Phase 4: requires `discovery_gate_exception` flag. Phase 3: unconditional. |
| preflight | draft     | None (rollback)                                                            |
| preflight | archive   | None                                                                       |
| discovery | build     | Phase 4: requires Discovery Gate pass. Phase 3: unconditional.             |
| discovery | archive   | None                                                                       |
| build     | launch    | None                                                                       |
| build     | preflight | None (rollback)                                                            |
| build     | archive   | None                                                                       |
| launch    | run       | None                                                                       |
| launch    | archive   | None                                                                       |
| run       | decide    | None                                                                       |
| run       | archive   | None                                                                       |
| decide    | archive   | None                                                                       |

**MVP (Phase 3) implementation:** Add `discovery` to `VALID_STATUS_TRANSITIONS` without gate enforcement. Gate logic is advisory only until Phase 4.

### 2.9 Distill Brief Write Invariant

When `hypothesis_card` is non-null on an experiment:

| Distill Brief Column   | Projected From                        | Behavior             |
| ---------------------- | ------------------------------------- | -------------------- |
| `target_audience`      | `hypothesis_card.customer_segment`    | Read-only projection |
| `problem_statement`    | `hypothesis_card.problem_statement`   | Read-only projection |
| `value_proposition`    | `hypothesis_card.solution_hypothesis` | Read-only projection |
| `market_size_estimate` | `hypothesis_card.market_sizing`       | Read-only projection |

`PATCH /experiments/:id` MUST reject direct updates to these 4 columns when `hypothesis_card` is non-null, returning:

```json
{
  "success": false,
  "error": {
    "code": "WRITE_INVARIANT_VIOLATION",
    "message": "Cannot update problem_statement directly when hypothesis_card is set. Update hypothesis_card instead.",
    "request_id": "req_..."
  }
}
```

HTTP status: `409 Conflict`.

---

## 3. API Surface

All endpoints use the established v1.2 patterns: Hono router, JSON request/response, `X-Request-Id` header on all responses, consistent `ErrorResponse` / `SuccessResponse` shapes.

### 3.1 Modified Endpoints (MVP)

#### POST /experiments

**Changes:**

- Validate archetype against v2.0 enum: `fake_door | waitlist | content_magnet | priced_waitlist | presale | concierge | service_pilot`
- Accept optional `hypothesis_card` in request body
- When `hypothesis_card` is provided, auto-extract projections into Distill Brief columns

```
POST /experiments
Auth: X-SC-Key
Content-Type: application/json

Request:
{
  "name": "Accessibility Auditor",
  "slug": "accessibility-auditor",
  "archetype": "waitlist",
  "hypothesis_card": { ... }  // optional, JSON conforming to DD#1 Section 3.7
}

Response 201:
{
  "success": true,
  "data": { <full experiment record> }
}

Error 400: INVALID_REQUEST (missing required fields, invalid archetype)
Error 409: DUPLICATE_SLUG
```

#### PATCH /experiments/:id

**Changes:**

- Add to updatable fields: `hypothesis_card`, `test_blueprint`, `discovery_summary`, `campaign_package`, `page_config`, `validation_report`, `venture_id`, `category`, `sequence_position`, `prior_test_ref`
- Enforce Distill Brief write invariant (see Section 2.9)
- Add `discovery` to valid status transitions
- When `hypothesis_card` is written, auto-extract projections into Distill Brief columns

```
PATCH /experiments/:id
Auth: X-SC-Key
Content-Type: application/json

Request:
{
  "hypothesis_card": { ... },
  "status": "discovery"
}

Response 200:
{
  "success": true,
  "data": { <full experiment record with projections applied> }
}

Error 400: INVALID_STATUS_TRANSITION, INVALID_REQUEST
Error 404: EXPERIMENT_NOT_FOUND
Error 409: WRITE_INVARIANT_VIOLATION (direct Distill Brief update when hypothesis_card set)
```

### 3.2 New Discovery Endpoints (Phase 3)

#### POST /experiments/:id/discovery/start

Transitions experiment status to `discovery`. Must be in `preflight` status.

```
POST /experiments/:id/discovery/start
Auth: X-SC-Key

Request: {} (empty body)

Response 200:
{
  "success": true,
  "data": {
    "experiment_id": "SC-2026-001",
    "status": "discovery",
    "discovery_summary": null
  }
}

Error 400: INVALID_STATUS_TRANSITION (not in preflight)
Error 404: EXPERIMENT_NOT_FOUND
```

Side effect: Inserts `discovery_sprint_started` event into `event_log`.

#### POST /experiments/:id/interviews

Records a completed interview.

```
POST /experiments/:id/interviews
Auth: X-SC-Key
Content-Type: application/json

Request:
{
  "participant_id": "P-001",
  "mode": "human",
  "protocols_covered": ["problem_discovery", "solution_fit"],
  "duration_minutes": 45,
  "pain_scores": {
    "functional": 8,
    "emotional": 6,
    "opportunity": 7
  },
  "signal_extraction": { ... },
  "transcript_ref": "interviews/SC-2026-001/P-001-20260302.txt",
  "new_themes_detected": 2
}

Response 201:
{
  "success": true,
  "data": {
    "id": 1,
    "experiment_id": "SC-2026-001",
    "participant_id": "P-001",
    "mode": "human",
    "protocols_covered": ["problem_discovery", "solution_fit"],
    "duration_minutes": 45,
    "pain_scores": { "functional": 8, "emotional": 6, "opportunity": 7 },
    "signal_extraction": { ... },
    "transcript_ref": "interviews/SC-2026-001/P-001-20260302.txt",
    "new_themes_detected": 2,
    "created_at": 1740000000000
  }
}

Error 400: INVALID_REQUEST (missing required fields, invalid mode)
Error 404: EXPERIMENT_NOT_FOUND
```

Validation rules:

- `participant_id`: Required, non-empty string
- `mode`: Required, must be one of `ai | hybrid | human`
- `protocols_covered`: Required, non-empty JSON array of strings
- `pain_scores`: Optional, each value 0-10 integer
- `duration_minutes`: Optional, positive integer
- `new_themes_detected`: Optional, defaults to 0, non-negative integer

Side effect: Inserts `interview_completed` event into `event_log`.

#### GET /experiments/:id/discovery/summary

Returns the current Discovery Summary for an experiment. The summary is stored in `experiments.discovery_summary`.

```
GET /experiments/:id/discovery/summary
Auth: X-SC-Key

Response 200:
{
  "success": true,
  "data": {
    "experiment_id": "SC-2026-001",
    "discovery_summary": { ... } | null,
    "interview_count": 5,
    "weighted_interview_count": 3.75,
    "stage": "draft" | "final"
  }
}

Error 404: EXPERIMENT_NOT_FOUND
```

The `weighted_interview_count` is computed on the fly using the mode-weighted formula:

- `ai` interviews count as 0.5
- `hybrid` interviews count as 0.75
- `human` interviews count as 1.0

#### POST /experiments/:id/discovery/finalize

Locks the Discovery Summary to "final" stage. After finalization, the summary cannot be modified.

```
POST /experiments/:id/discovery/finalize
Auth: X-SC-Key

Request: {} (empty body)

Response 200:
{
  "success": true,
  "data": {
    "experiment_id": "SC-2026-001",
    "discovery_summary": { ... },
    "stage": "final"
  }
}

Error 400: INVALID_REQUEST (no discovery_summary to finalize, already finalized)
Error 404: EXPERIMENT_NOT_FOUND
```

Side effect: Inserts `discovery_summary_finalized` event into `event_log`.

#### GET /experiments/:id/discovery/gate

Evaluates 6 gate checks and returns pass/fail status with details. Does NOT enforce the gate (enforcement is Phase 4).

```
GET /experiments/:id/discovery/gate
Auth: X-SC-Key

Response 200:
{
  "success": true,
  "data": {
    "experiment_id": "SC-2026-001",
    "gate_status": "pass" | "fail",
    "checks": [
      {
        "name": "minimum_interviews",
        "status": "pass",
        "detail": "5 weighted interviews (threshold: 3)"
      },
      {
        "name": "pain_severity",
        "status": "pass",
        "detail": "Mean pain score 7.2 (threshold: 5)"
      },
      {
        "name": "peak_dimension",
        "status": "pass",
        "detail": "Functional pain is peak at 8.1"
      },
      {
        "name": "problem_confirmed",
        "status": "pass",
        "detail": "4/5 participants confirmed core problem"
      },
      {
        "name": "assumption_evidence",
        "status": "fail",
        "detail": "2 key assumptions lack evidence"
      },
      {
        "name": "saturation",
        "status": "pass",
        "detail": "3 consecutive interviews with 0 new themes"
      }
    ],
    "recommendation": "fail -- 1 check did not pass"
  }
}

Error 404: EXPERIMENT_NOT_FOUND
```

Side effect: Inserts `discovery_gate_evaluated` event into `event_log`.

### 3.3 Auth Summary for New Endpoints

| Method | Path                                  | Auth     | Public? |
| ------ | ------------------------------------- | -------- | ------- |
| POST   | `/experiments/:id/discovery/start`    | X-SC-Key | No      |
| POST   | `/experiments/:id/interviews`         | X-SC-Key | No      |
| GET    | `/experiments/:id/discovery/summary`  | X-SC-Key | No      |
| POST   | `/experiments/:id/discovery/finalize` | X-SC-Key | No      |
| GET    | `/experiments/:id/discovery/gate`     | X-SC-Key | No      |

All new endpoints are internal (require `X-SC-Key`). No new public endpoints in MVP.

### 3.4 Updated Public Endpoint: GET /experiments/by-slug/:slug

The sanitized public response should include `page_config` when it is non-null, so the frontend can render archetype-specific landing page configurations:

```
GET /experiments/by-slug/:slug

Response 200 (updated fields):
{
  "success": true,
  "data": {
    "id": "SC-2026-001",
    "name": "Accessibility Auditor",
    "slug": "accessibility-auditor",
    "status": "launch",
    "archetype": "waitlist",
    "copy_pack": { ... },
    "page_config": { ... } | null,      // NEW: v2.0 addition
    "price_cents": 0,
    "stripe_price_id": null,
    "created_at": 1740000000000
  }
}
```

**Note:** `hypothesis_card`, `discovery_summary`, `test_blueprint`, `campaign_package`, and `validation_report` are NOT included in the public endpoint response. These are internal artifacts.

---

## 4. Non-Functional Requirements

### 4.1 Performance Budgets

| Metric                          | Target  | Measurement                                                   |
| ------------------------------- | ------- | ------------------------------------------------------------- |
| API response time (p50)         | < 50ms  | Cloudflare Worker analytics                                   |
| API response time (p99)         | < 200ms | Cloudflare Worker analytics                                   |
| D1 query time (single row)      | < 10ms  | D1 analytics dashboard                                        |
| D1 query time (list, paginated) | < 30ms  | D1 analytics dashboard                                        |
| Discovery gate evaluation       | < 100ms | Application-level timing (aggregates across interviews table) |
| Migration 0002 execution time   | < 30s   | Manual timing during deployment                               |
| Landing page TTFB               | < 200ms | Cloudflare Speed analytics                                    |
| Landing page LCP                | < 2.5s  | Core Web Vitals                                               |

### 4.2 Data Size Budgets

| Column                         | Max Payload Size | Enforcement                       |
| ------------------------------ | ---------------- | --------------------------------- |
| `hypothesis_card`              | 50 KB            | Application-layer JSON size check |
| `discovery_summary`            | 100 KB           | Application-layer JSON size check |
| `test_blueprint`               | 50 KB            | Application-layer JSON size check |
| `campaign_package`             | 200 KB           | Application-layer JSON size check |
| `page_config`                  | 100 KB           | Application-layer JSON size check |
| `validation_report`            | 200 KB           | Application-layer JSON size check |
| `interviews.signal_extraction` | 50 KB            | Application-layer JSON size check |

D1 has a 1 MB row size limit. With all JSON columns populated, worst case is ~750 KB per experiment row. This is within limits but should be monitored.

### 4.3 Security Requirements

| Requirement                            | Implementation                                                   | Status   |
| -------------------------------------- | ---------------------------------------------------------------- | -------- |
| All new endpoints behind X-SC-Key auth | Auth middleware allowlist (no additions to PUBLIC_ROUTES)        | MVP      |
| Parameterized queries only             | `.bind()` on all D1 queries -- no string interpolation           | MVP      |
| No PII in JSON artifact columns        | `participant_id` uses pseudonyms, not real names                 | MVP      |
| Interview transcript PII retention     | R2 objects under `interviews/` prefix, 90-day TTL rule           | MVP      |
| JSON payload validation                | Validate structure before INSERT/UPDATE -- reject malformed JSON | MVP      |
| No secrets in experiment data          | Stripe keys, API keys never stored in experiment columns         | Existing |
| CORS unchanged                         | Only `siliconcrane.com` in production                            | Existing |
| Rate limiting unchanged                | Existing WAF rules sufficient -- no new public endpoints         | Existing |

### 4.4 Scalability Targets (MVP context)

These are not scaling for high traffic -- SC is a validation service with low volume. Targets reflect correctness at small scale.

| Metric                    | Target   | Rationale                       |
| ------------------------- | -------- | ------------------------------- |
| Concurrent experiments    | 50       | Far exceeds near-term need      |
| Interviews per experiment | 100      | Discovery typically needs 5-20  |
| Events per day            | 10,000   | Covers moderate ad traffic      |
| D1 database size          | < 500 MB | Well within D1 free tier (5 GB) |
| R2 storage                | < 1 GB   | Transcripts + creative assets   |

### 4.5 Reliability

| Requirement             | Target                                                        |
| ----------------------- | ------------------------------------------------------------- |
| Worker uptime           | 99.9% (Cloudflare SLA)                                        |
| Migration rollback plan | Manual restore from D1 backup snapshot (taken pre-migration)  |
| Data loss tolerance     | Zero -- D1 automatic backups, verify pre-migration row counts |

---

## 5. Technical Risks

### 5.1 Critical Risks

| #   | Risk                                                                                                                                                                                 | Severity | Likelihood | Mitigation                                                                                                                                                                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | **Table recreation loses data during Migration 0002 Step 3.** The create-copy-drop-rename pattern on `experiments` could fail mid-execution, leaving the database in a broken state. | Critical | Low        | Run migration on local D1 first. Take D1 backup snapshot before remote execution. Verify row counts in Step 4. D1 executes migration SQL as a single batch -- partial failures roll back.                                  |
| R2  | **Existing experiments with `archetype = 'interview'` in active states (build, launch, run, decide) get archived during data migration.** This could interrupt live experiments.     | High     | Low        | Query production D1 for `SELECT count(*), status FROM experiments WHERE archetype = 'interview' GROUP BY status` BEFORE running migration. If any are in `launch` or `run`, coordinate with stakeholder before proceeding. |
| R3  | **JSON schema drift between application code and stored data.** Hypothesis Card schema evolves but old records have stale schema versions.                                           | Medium   | Medium     | Include `version` field in all JSON artifact schemas (DD#1 already specifies this). Application code must handle version migration on read.                                                                                |

### 5.2 Moderate Risks

| #   | Risk                                                                                                                                                                                                                  | Severity | Likelihood | Mitigation                                                                                                                                                                                                             |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R4  | **D1 row size limit (1 MB) approached with all JSON columns populated.** If `campaign_package` (200 KB) + `validation_report` (200 KB) + other columns are all large, a single experiment row could hit limits.       | Medium   | Low        | Enforce per-column size budgets (Section 4.2). Log warnings when a column exceeds 80% of its budget. Long term: move large payloads to R2 with a reference key.                                                        |
| R5  | **Mode-weighted interview counting produces non-intuitive results.** An experiment with 6 AI interviews (weight 0.5) = 3.0 weighted count, which meets the minimum threshold but may not represent genuine discovery. | Medium   | Medium     | Gate evaluation response includes both raw count and weighted count. Documentation should clarify that AI-only discovery is acceptable but lower confidence. Consider raising the minimum threshold for AI-only modes. |
| R6  | **Trigger cascade on table recreation.** Dropping `experiments` drops the `update_experiments_timestamp` trigger. The migration must explicitly recreate it on `experiments` after rename.                            | High     | Low        | Migration Step 3 already includes trigger recreation. Verify trigger exists as part of Step 4 verification: `SELECT name FROM sqlite_master WHERE type = 'trigger' AND tbl_name = 'experiments'`.                      |

### 5.3 Low Risks

| #   | Risk                                                                                                                                                                                                      | Severity | Likelihood | Mitigation                                                                                                                                |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| R7  | **FK references from 6 tables (leads, payments, metrics_daily, decision_memos, learning_memos, event_log) break during table recreation.** If PRAGMA foreign_keys is ON, dropping experiments would fail. | Medium   | Very Low   | Verify `PRAGMA foreign_keys` returns 0 (OFF, the D1 default) before running migration. If ON, the migration script must disable it first. |

---

## 6. Open Decisions / ADRs

### ADR-001: JSON Schema Validation Location

**Status:** PROPOSED
**Context:** v2.0 adds 6 JSON artifact columns. Where should schema validation happen?
**Options:**

- (A) Full JSON Schema validation in the API layer (using a library like `ajv`)
- (B) Lightweight structural checks only (presence of required top-level keys, `version` field)
- (C) No validation -- trust the caller (internal endpoints only)

**Recommendation:** Option B for MVP. Full JSON Schema validation adds bundle size and complexity. Since all new endpoints are internal (X-SC-Key), the callers are controlled. Validate `version` field and top-level structure. Defer comprehensive validation to post-MVP.

**Consequences:** Malformed JSON could be stored if an API consumer sends bad data. Mitigated by controlled access (X-SC-Key only) and the `version` field enabling future migration.

---

### ADR-002: Discovery Summary Computation Strategy

**Status:** PROPOSED
**Context:** The Discovery Summary aggregates data from multiple interviews. Should it be computed on-write (when interviews are added) or on-read (when the summary endpoint is called)?
**Options:**

- (A) Compute on read: `GET /experiments/:id/discovery/summary` aggregates from `interviews` table each time
- (B) Compute on write: `POST /experiments/:id/interviews` updates `experiments.discovery_summary` after each interview insert
- (C) Explicit command: A separate `POST /experiments/:id/discovery/recompute` endpoint

**Recommendation:** Option B (compute on write). Interview volume is low (5-20 per experiment). Recomputing after each insert ensures the summary column is always current and the GET endpoint is a simple column read. The `/discovery/finalize` endpoint locks the summary, preventing further updates.

**Consequences:** The `POST /experiments/:id/interviews` endpoint does more work (read all interviews, recompute summary, update experiment). Acceptable given the low volume.

---

### ADR-003: Discovery Gate Enforcement Timing

**Status:** DECIDED (per Functional Spec v2.0, Section 2.2)
**Decision:** Phase 3 adds `discovery` status and gate evaluation endpoint. Phase 4 adds enforcement on `-> build` transitions.
**Rationale:** Decoupling the gate evaluation from enforcement allows the team to validate the gate logic against real interview data before it becomes a hard blocker. In Phase 3, the gate is advisory: the endpoint returns pass/fail but does not block status transitions.

---

### ADR-004: Handling `category` CHECK Constraint

**Status:** PROPOSED
**Context:** The `category` column has a defined set of valid values (`demand_signal`, `willingness_to_pay`, `solution_validation`). Should this be a SQL CHECK constraint or application-layer only?
**Options:**

- (A) Add CHECK constraint during table recreation in Migration 0002 Step 3
- (B) Application-layer validation only

**Recommendation:** Option A. Since we are already recreating the table for `archetype` and `status` CHECK changes, adding the `category` CHECK is zero incremental cost. It provides defense-in-depth against bad data.

---

### ADR-005: Interview Transcript R2 Key Convention

**Status:** PROPOSED
**Context:** Interview transcripts are stored in R2 with a key referenced in `interviews.transcript_ref`. What key format should be used?
**Recommendation:** `interviews/{experiment_id}/{participant_id}-{ISO_DATE}.txt`
Example: `interviews/SC-2026-001/P-001-2026-03-02.txt`
**Rationale:** Groups by experiment for easy bulk operations (e.g., 90-day purge of all transcripts for archived experiments). The date suffix prevents overwrites if a participant has multiple sessions.

---

### ADR-006: Pre-Migration Backup Protocol

**Status:** PROPOSED
**Context:** Migration 0002 includes a destructive table recreation (create-copy-drop-rename). D1 does not support transactional DDL across multiple statements in the same way that PostgreSQL does.
**Recommendation:**

1. Before executing migration on any remote environment, export D1 data via `wrangler d1 export sc-db --remote`
2. Run migration on local D1 first and execute all Step 4 verification queries
3. Run migration on preview environment and verify
4. Run migration on production and verify
5. Keep the export for 7 days as rollback insurance

---

## 7. Implementation Notes

### 7.1 Code Changes Required for MVP

**workers/sc-api/src/index.ts:**

- Update `validArchetypes` array (line ~905): replace `interview` with `fake_door`, add reordering
- Update `VALID_STATUS_TRANSITIONS` (line ~112): add `discovery` state
- Add `hypothesis_card` and other v2.0 columns to `updatableFields` in PATCH handler (line ~1058)
- Implement Distill Brief write invariant logic in PATCH handler
- Add 5 new route handlers for discovery endpoints
- Add `page_config` to sanitized public response in `GET /experiments/by-slug/:slug` (line ~791)

**workers/sc-api/src/middleware/auth.ts:**

- No changes needed. All new endpoints are internal (require X-SC-Key). No additions to `PUBLIC_ROUTES`.

**workers/sc-api/migrations/0002_v2_schema.sql:**

- New migration file containing all 4 steps from Functional Spec Section 7

**workers/sc-maintenance/src/index.ts:**

- No changes for MVP. Extended PII purge for archived experiments is Phase 7.

### 7.2 Test Coverage Requirements

| Endpoint/Feature                       | Test Cases                                                                          |
| -------------------------------------- | ----------------------------------------------------------------------------------- |
| Migration 0002                         | Row count preserved, no `interview` archetypes remain, triggers fire, indexes exist |
| PATCH write invariant                  | Reject direct Distill Brief update when hypothesis_card set; allow when not set     |
| POST /experiments archetype validation | Reject `interview`, accept `fake_door` and all others                               |
| Status transition: discovery           | preflight -> discovery (pass), draft -> discovery (fail), discovery -> build (pass) |
| POST /interviews                       | Valid insert, missing required fields, invalid mode, experiment not found           |
| GET /discovery/gate                    | All 6 checks evaluated, weighted counting correct, pass/fail logic                  |
| POST /discovery/finalize               | Locks summary, rejects re-finalization                                              |

### 7.3 Migration Execution Order

1. **Phase 1:** Run `0002_v2_schema.sql` (all steps). Verify in local, preview, production.
2. **Phase 2:** Deploy updated `sc-api` with hypothesis_card support and write invariant.
3. **Phase 3:** Deploy discovery endpoints and status transition updates.

Phases 2 and 3 can be deployed incrementally. The schema supports all phases from the moment Migration 0002 completes (all columns exist, all are nullable, all new tables exist empty).

---

**End of Technical Lead Contribution**
