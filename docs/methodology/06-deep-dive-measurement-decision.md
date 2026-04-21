# Deep Dive #6: Measurement & Decision System — The Verdict

> **Source:** New document (DD#6)
> **Document Type:** Deep Dive Working Document
> **Series:** SC Validation Methodology
> **Date:** March 2, 2026
> **Status:** Complete — pending functional spec integration
> **Parent:** SC Validation Methodology — Strategy Session (March 2026)
> **Prior:** Deep Dive #5: Landing Page Automation

---

# 1. Purpose & Scope

This deep dive defines the **Measurement & Decision System** — the final two stages in the SC validation workflow (Steps 6 and 7). It specifies the measurement infrastructure, the Validation Report artifact, the enhanced Decision Memo, the threshold calibration system, automated decision support logic, the GO handoff to product development, the KILL archival protocol, and the INVALID handling process. The framework is branded **The Verdict**.

The naming progression now spans the complete methodology arc: **Narrative** (story) -> **Ladder** (testing) -> **Engine** (discovery) -> **Factory** (production) -> **[DD#5]** (deployment) -> **Verdict** (measurement and decision). This is the capstone document — it closes the loop on the entire validation methodology and defines how data becomes decisions.

**What this document covers:**

- Why measurement for validation is fundamentally different from product analytics
- Measurement infrastructure built on existing `metrics_daily`, `event_log`, and D1 tables
- The Validation Report artifact (Step 6 output) — specification, schema, auto-generation logic
- The enhanced Decision Memo artifact (Step 7 output) — structured evidence, confidence calculation, recommendation engine
- The 3-phase threshold calibration system (fleshing out DD#2 Section 7)
- Automated decision support — not automated decisions, but automated evidence presentation
- INVALID handling — detection, root causes, resolution paths
- Learning Memos and continuous improvement
- GO handoff from Silicon Crane validation into Ventracrane product development
- KILL archival protocol with the "kill library" for cross-venture learning
- Explicit answers to the 5 strategy session questions for DD#6
- Recommendations for Functional Spec v2.0
- Complete methodology summary across all 6 deep dives

**Relationship to DD#1 (The Venture Narrative):**

The Hypothesis Card is the starting artifact. When a venture receives a GO verdict, the validated Hypothesis Card — enriched through discovery and confirmed by market data — becomes the foundation for the product specification. When a venture is killed, the Hypothesis Card is archived with the kill rationale for pattern recognition.

**Relationship to DD#2 (The Validation Ladder):**

DD#2 Section 7 defined a 3-phase calibration plan: Phase 1 (industry defaults), Phase 2 (internal benchmarking after 10+ tests), Phase 3 (dynamic calibration after 50+ tests). DD#2 explicitly stated "This is Deep Dive #6 territory — covered there in detail." This document fulfills that promise. The per-archetype thresholds from DD#2 Section 3 are the Phase 1 defaults that this document's calibration system evolves.

**Relationship to DD#3 (The Discovery Engine):**

The Discovery Summary's pain severity score is one of the four GO criteria (pain severity >= 3/5). The Validation Report references the Discovery Summary as qualitative evidence alongside quantitative campaign metrics.

**Relationship to DD#4 (The Campaign Factory):**

The Campaign Package's provenance metadata, A/B variant structure, and channel allocation data flow into the Validation Report's campaign performance analysis. The budget allocation model (75% ad spend, 15% creative buffer, 5% generation, 5% reserve) constrains the measurement infrastructure's cost expectations.

**Relationship to existing infrastructure:**

The system builds on top of the existing D1 schema: `metrics_daily` (daily campaign snapshots with derived metrics in basis points), `event_log` (raw events), `decision_memos` (verdict records), and `learning_memos` (weekly observations). No existing tables are replaced — they are extended and augmented.

---

# 2. The Measurement Challenge

## Why Validation Measurement is Different

Validation testing is not product analytics. The goals, constraints, sample sizes, and decision outcomes are fundamentally different.

| Dimension                | Product Analytics                                       | Validation Measurement                                                          |
| ------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Goal**                 | Optimize a metric (conversion rate, retention, revenue) | Make a binary decision (GO / KILL / PIVOT / INVALID)                            |
| **Sample size**          | Thousands to millions of data points                    | 15-60 conversions from \$300-500 spend                                          |
| **Time horizon**         | Ongoing, indefinite                                     | Time-boxed: 7-30 days                                                           |
| **Statistical standard** | p < 0.05 frequentist significance                       | Practical significance — is the signal strong enough to bet on?                 |
| **Cost of wrong answer** | Suboptimal feature deployment                           | \$1,500 cap wasted (false positive) or killed a viable venture (false negative) |
| **Data quality**         | Mature instrumentation, clean pipelines                 | New tracking, potential bot traffic, platform anomalies                         |
| **Iteration**            | Continuous improvement                                  | Discrete test → decision → next test or exit                                    |

## The Small Sample Reality

The strategy session established the budget rationale: \$300-500 per test buys 150-600 clicks at typical \$0.50-\$2.00 CPCs. At a 10% CVR baseline, that yields 15-60 conversions. This is the data the entire decision hangs on.

**What this means for statistics:**

- **Frequentist significance testing (p < 0.05) is not appropriate.** To detect a meaningful difference in conversion rates with 95% confidence typically requires hundreds to thousands of conversions. We have 15-60.
- **Bayesian approaches are appropriate.** The Beta-Binomial conjugate model works naturally with small samples: the posterior distribution is Beta(alpha + conversions, beta + sessions - conversions). With a weakly informative prior, even 20 conversions produce a useful posterior distribution.
- **Practical significance matters more than statistical significance.** The question is not "is this CVR different from zero?" — it is "is this CVR high enough to justify building a product?"
- **Directional confidence replaces binary significance.** Instead of "significant / not significant," the system reports "85% probability that true CVR exceeds the GO threshold" — which is actionable information.

## The Asymmetric Error Cost

The strategy session noted that Phase 1 thresholds should be deliberately conservative — "it is better to kill ventures that might have worked than to invest further in ventures that probably will not."

This establishes a clear asymmetry:

- **False positive (saying GO when the venture will fail):** Cost = remaining validation budget (\$500-1,000) plus opportunity cost of product development time. High cost.
- **False negative (saying KILL when the venture could have worked):** Cost = the missed venture. Lower immediate cost, but accumulated false negatives reduce portfolio hit rate.

Phase 1 calibration leans toward false negatives. Phase 2-3 calibration tightens as data allows more precise thresholds.

---

# 3. Measurement Infrastructure

## Data Pipeline Architecture

The measurement infrastructure consists of four stages, built on existing SC infrastructure:

```
Ad Platforms          Landing Pages           SC-API               Decision Support
(Meta, Google,        (event_log via          (metrics_daily        (Validation Report
 LinkedIn, etc.)       POST /events)           via POST /metrics)    + Decision Memo)
     │                      │                       │                      │
     ▼                      ▼                       ▼                      ▼
┌──────────┐         ┌──────────┐            ┌──────────────┐      ┌──────────────┐
│ Platform │         │ Real-time │            │ Daily Batch  │      │  Threshold   │
│ APIs     │────────>│ Events   │            │ Aggregation  │─────>│  Evaluation  │
│ (manual/ │         │ (event_  │────────────│ (metrics_    │      │  + Report    │
│  import) │         │  log)    │ nightly    │  daily)      │      │  Generation  │
└──────────┘         └──────────┘ rollup     └──────────────┘      └──────────────┘
```

### Stage 1: Raw Event Capture (Real-Time)

**Already built.** The `event_log` table captures every landing page interaction in real-time via `POST /events`. Events include `page_view`, `form_start`, `generate_lead`, `purchase`, and custom archetype-specific events.

**What already works:**

- Session tracking via `session_id` and `visitor_id`
- UTM attribution (`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`)
- De-duplication via `event_hash` (SHA-256)
- Country-level geo data from Cloudflare CF-IPCountry

**What needs extension for DD#6:**

- New event types for measurement: `threshold_evaluation`, `validation_report_generated`, `decision_memo_created`
- Structured `event_data` payloads for measurement events (metric snapshots, threshold comparison results)

### Stage 2: Ad Platform Metrics Import (Manual / Semi-Automated)

**Already built.** The `POST /metrics` endpoint accepts daily metric snapshots. The `metrics_daily` table stores raw metrics (impressions, clicks, sessions, conversions, spend_cents, revenue_cents) and derived metrics (ctr_bp, cvr_bp, cpl_cents, roas_bp) with the `source` field tracking the ad platform.

**Phase 1 (now):** Manual import via the admin interface (Coda Pack or direct API calls). The operator exports daily metrics from each ad platform and imports them via `POST /metrics`.

**Phase 2 (future):** Semi-automated import via ad platform APIs (Meta Marketing API, Google Ads API). A scheduled Cloudflare Worker fetches yesterday's metrics and writes to `metrics_daily`. This eliminates the manual import bottleneck but requires platform API credentials and rate limit management.

### Stage 3: Daily Batch Aggregation

**Already built (partially).** Derived metrics are computed on import using the `computeDerivedMetrics()` function from the tech spec (Section 3.6). All rates use basis points (100 bp = 1%).

**What needs extension for DD#6:**

- **Cumulative aggregation:** Sum raw metrics across all days for an experiment to produce running totals (total impressions, total clicks, total sessions, total conversions, total spend, total revenue).
- **Cumulative derived metrics:** Recalculate derived metrics from cumulative raw totals (not averages of daily derived metrics — that produces incorrect results due to Simpson's paradox).
- **Per-source aggregation:** Split cumulative metrics by `source` for channel-level analysis.
- **Trend calculation:** Track whether cumulative CVR is improving, stable, or declining over the test period (useful for PIVOT decisions).

### Stage 4: Threshold Evaluation & Report Generation

**New (DD#6).** This is the core of The Verdict. After each daily metrics import:

1. Compute cumulative metrics for the experiment
2. Evaluate cumulative metrics against kill criteria from the Test Blueprint
3. Check for Hard Kill triggers (strategy session criteria)
4. Check for Soft Kill triggers
5. Evaluate GO criteria (all four conditions from strategy session)
6. Generate or update the draft Validation Report
7. If a terminal condition is reached (all criteria met for GO, or a Hard Kill triggered), flag the experiment for human review

This evaluation runs as part of the metrics import pipeline — not as a separate scheduled job. Every time new data arrives, the system re-evaluates.

## Real-Time vs. Batch: Design Decision

| Data Type            | Processing Model                  | Rationale                                                                            |
| -------------------- | --------------------------------- | ------------------------------------------------------------------------------------ |
| Landing page events  | Real-time (event_log)             | Needed for live tracking, session analysis, form funnel debugging                    |
| Ad platform metrics  | Daily batch (metrics_daily)       | Ad platforms report daily; sub-daily data is unreliable due to attribution windows   |
| Threshold evaluation | Triggered on batch import         | Decision thresholds operate on cumulative metrics, which change daily, not per-event |
| Validation Report    | Generated on demand / after batch | Needs cumulative data; auto-generated after each metrics import                      |

The system does not attempt real-time decision-making. Campaign metrics have attribution delays (Meta reports up to 7 days after click for conversions). Evaluating thresholds on incomplete daily data produces false alarms. The daily batch model aligns with how ad platforms actually report data.

---

# 4. The Validation Report — Artifact Specification

The **Validation Report** is the Step 6 output artifact. It is the structured summary of all campaign data, evaluated against the Test Blueprint's thresholds, with data quality verification and trend analysis. For internal Ventracrane use, it informs the Decision Memo. For VaaS clients, it is the client-facing deliverable.

## What the Validation Report Contains

| Section                      | Description                                                                | Source                                                       |
| ---------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **Experiment summary**       | ID, name, archetype, duration, budget, channels                            | experiments table + test_blueprint                           |
| **Metrics summary**          | Cumulative raw + derived metrics                                           | metrics_daily (aggregated)                                   |
| **Evidence table**           | Each archetype metric vs. its threshold, with GO/AMBER/KILL classification | metrics_daily + test_blueprint thresholds                    |
| **Sample size verification** | Whether minimum conversion count was met                                   | metrics_daily.conversions vs. test_blueprint.min_conversions |
| **Data quality flags**       | Bot traffic detection, tracking failures, platform anomalies               | event_log analysis + metrics_daily consistency checks        |
| **Trend analysis**           | Are metrics improving, stable, or declining over the test period?          | metrics_daily (time series)                                  |
| **Channel breakdown**        | Per-source metrics for multi-channel campaigns                             | metrics_daily grouped by source                              |
| **Cost analysis**            | Total spend, CPL, ROAS, budget utilization                                 | metrics_daily.spend_cents + revenue_cents                    |
| **Discovery context**        | Pain severity, problem confirmation, WTP signal                            | discovery_summary (if available)                             |
| **Recommended verdict**      | System-generated recommendation based on threshold evaluation              | Automated decision support logic (Section 9)                 |
| **Confidence assessment**    | Bayesian probability that true metrics exceed GO thresholds                | Calculated from cumulative data (Section 8)                  |

## Two Completion Stages

### Draft (Auto-Generated)

After each metrics import, the system updates the draft Validation Report. All quantitative sections are populated automatically. The recommended verdict and confidence assessment are computed from the data. The draft is a living document during the test run.

### Final (Human-Reviewed)

When the test reaches a terminal condition (budget exhausted, duration expired, or Hard Kill triggered), or when the operator decides the test has sufficient data, the report is finalized. The operator reviews the auto-generated content, adds contextual notes, and locks the report. The final report becomes the input to Decision Memo creation (Step 7).

**For VaaS:** The final Validation Report is the primary client deliverable. It must be professional, clear, and self-contained — a client with no SC context should be able to read it and understand what happened, what was measured, and what the data suggests.

## Evidence Table Format

The evidence table is the heart of the Validation Report. It compares each metric against the archetype's thresholds from DD#2.

| Metric      | Value | Unit           | GO Threshold | Kill Threshold | Status | Notes                 |
| ----------- | ----- | -------------- | ------------ | -------------- | ------ | --------------------- |
| CVR         | 280   | bp (2.80%)     | >= 200 bp    | < 50 bp        | GO     | Exceeds target by 40% |
| CPL         | 714   | cents (\$7.14) | <= 800       | > 2000         | GO     | Well within target    |
| CTR         | 180   | bp (1.80%)     | >= 100 bp    | < 40 bp        | GO     | Strong ad engagement  |
| Conversions | 42    | count          | >= 20        | < 10           | GO     | 2.1x minimum sample   |

All metrics use the existing basis point and cents conventions from the `metrics_daily` schema.

## Trend Analysis Method

The trend analysis evaluates whether cumulative CVR is improving, stable, or declining over the test period. The method:

1. Split the test duration into 3 equal periods (e.g., days 1-3, 4-6, 7-9 for a 9-day test)
2. Calculate cumulative CVR at the end of each period
3. Classify the trend:
   - **Improving:** Period 3 CVR > Period 1 CVR by more than 10% relative
   - **Declining:** Period 3 CVR < Period 1 CVR by more than 10% relative
   - **Stable:** Within 10% relative of Period 1

**Why this matters:** A declining trend suggests the initial audience was more receptive than the broader market. A test that passes GO thresholds but shows a declining trend should be noted in the report — the GO verdict holds, but the product team should expect lower conversion rates at scale.

## Data Quality Flags

| Flag                            | Detection Method                                       | Severity | Action                                                |
| ------------------------------- | ------------------------------------------------------ | -------- | ----------------------------------------------------- |
| **Bot traffic suspected**       | CTR > 5% with CVR < 0.1% (many clicks, no conversions) | High     | Investigate — may invalidate test                     |
| **Tracking gap**                | Days with zero sessions but non-zero ad spend          | Medium   | Check tracking code deployment                        |
| **Platform anomaly**            | Single day with metrics > 3x the daily average         | Medium   | Check for platform reporting errors                   |
| **Attribution mismatch**        | Clicks >> sessions (> 2x)                              | Low      | Expected with attribution windows; flag if persistent |
| **Insufficient data**           | Total sessions < 50% of archetype minimum              | High     | Test may need extension or relaunch                   |
| **Revenue without conversions** | revenue_cents > 0 but conversions = 0                  | High     | Data integrity issue — investigate immediately        |

---

# 4.5. Validation Report Schema Sketch

Field specification for a `validation_report` TEXT (JSON) column on the experiments table:

```json
{
  "experiment_id": { "type": "string", "required": true },
  "report_version": { "type": "integer", "required": true, "default": 1 },
  "stage": { "type": "string", "enum": ["draft", "final"], "required": true },

  "experiment_summary": {
    "type": "object",
    "required": true,
    "properties": {
      "name": { "type": "string" },
      "archetype": { "type": "string" },
      "category": { "type": "string" },
      "start_date": { "type": "string", "format": "date" },
      "end_date": { "type": "string", "format": "date" },
      "duration_days": { "type": "integer" },
      "budget_cents": { "type": "integer" },
      "channels": { "type": "array", "items": { "type": "string" } }
    }
  },

  "metrics_summary": {
    "type": "object",
    "required": true,
    "properties": {
      "total_impressions": { "type": "integer" },
      "total_clicks": { "type": "integer" },
      "total_sessions": { "type": "integer" },
      "total_conversions": { "type": "integer" },
      "total_spend_cents": { "type": "integer" },
      "total_revenue_cents": { "type": "integer" },
      "cumulative_ctr_bp": { "type": "integer" },
      "cumulative_cvr_bp": { "type": "integer" },
      "cumulative_cpl_cents": { "type": "integer" },
      "cumulative_roas_bp": { "type": "integer" }
    }
  },

  "evidence_table": {
    "type": "array",
    "required": true,
    "items": {
      "metric": { "type": "string" },
      "value": { "type": "integer" },
      "unit": { "type": "string" },
      "go_threshold": { "type": "integer" },
      "kill_threshold": { "type": "integer" },
      "status": { "type": "string", "enum": ["go", "amber", "kill"] },
      "notes": { "type": "string" }
    }
  },

  "sample_size_check": {
    "type": "object",
    "required": true,
    "properties": {
      "conversions_actual": { "type": "integer" },
      "conversions_required": { "type": "integer" },
      "sessions_actual": { "type": "integer" },
      "sessions_minimum": { "type": "integer" },
      "sufficient": { "type": "boolean" }
    }
  },

  "data_quality": {
    "type": "object",
    "required": true,
    "properties": {
      "flags": {
        "type": "array",
        "items": {
          "flag": { "type": "string" },
          "severity": { "type": "string", "enum": ["high", "medium", "low"] },
          "detail": { "type": "string" },
          "detected_at": { "type": "string", "format": "date" }
        }
      },
      "overall_quality": {
        "type": "string",
        "enum": ["clean", "minor_issues", "major_issues", "unreliable"]
      }
    }
  },

  "trend_analysis": {
    "type": "object",
    "required": true,
    "properties": {
      "direction": { "type": "string", "enum": ["improving", "stable", "declining"] },
      "period_1_cvr_bp": { "type": "integer" },
      "period_2_cvr_bp": { "type": "integer" },
      "period_3_cvr_bp": { "type": "integer" },
      "notes": { "type": "string" }
    }
  },

  "channel_breakdown": {
    "type": "array",
    "required": false,
    "items": {
      "source": { "type": "string" },
      "impressions": { "type": "integer" },
      "clicks": { "type": "integer" },
      "sessions": { "type": "integer" },
      "conversions": { "type": "integer" },
      "spend_cents": { "type": "integer" },
      "cvr_bp": { "type": "integer" },
      "cpl_cents": { "type": "integer" }
    }
  },

  "cost_analysis": {
    "type": "object",
    "required": true,
    "properties": {
      "total_spend_cents": { "type": "integer" },
      "budget_utilization_pct": { "type": "integer" },
      "cpl_cents": { "type": "integer" },
      "roas_bp": { "type": "integer" },
      "cost_per_session_cents": { "type": "integer" }
    }
  },

  "discovery_context": {
    "type": "object",
    "required": false,
    "properties": {
      "pain_severity_composite": { "type": "number" },
      "problem_confirmed": { "type": "boolean" },
      "wtp_signal": { "type": "string" },
      "interview_count_weighted": { "type": "number" }
    }
  },

  "confidence_assessment": {
    "type": "object",
    "required": true,
    "properties": {
      "method": { "type": "string", "default": "bayesian_beta_binomial" },
      "prior_alpha": { "type": "number" },
      "prior_beta": { "type": "number" },
      "posterior_alpha": { "type": "number" },
      "posterior_beta": { "type": "number" },
      "prob_exceeds_go_threshold": {
        "type": "number",
        "description": "P(true CVR >= GO threshold)"
      },
      "prob_below_kill_threshold": {
        "type": "number",
        "description": "P(true CVR < KILL threshold)"
      },
      "credible_interval_90": {
        "type": "object",
        "properties": {
          "lower_bp": { "type": "integer" },
          "upper_bp": { "type": "integer" }
        }
      }
    }
  },

  "recommended_verdict": {
    "type": "object",
    "required": true,
    "properties": {
      "verdict": { "type": "string", "enum": ["GO", "KILL", "PIVOT", "INVALID"] },
      "reasoning": { "type": "string", "maxLength": 1000 },
      "conditions_met": {
        "type": "array",
        "items": {
          "condition": { "type": "string" },
          "met": { "type": "boolean" },
          "detail": { "type": "string" }
        }
      }
    }
  },

  "analyst_notes": { "type": "string", "required": false, "maxLength": 2000 },

  "generated_at": { "type": "string", "format": "date-time" },
  "finalized_at": { "type": "string", "format": "date-time" },
  "finalized_by": { "type": "string" }
}
```

---

# 5. Cumulative Metrics Computation

The Validation Report requires cumulative metrics across the entire test period, not just daily snapshots. This section specifies the aggregation logic.

## Aggregation Query

```sql
SELECT
  experiment_id,
  SUM(impressions) AS total_impressions,
  SUM(clicks) AS total_clicks,
  SUM(sessions) AS total_sessions,
  SUM(conversions) AS total_conversions,
  SUM(spend_cents) AS total_spend_cents,
  SUM(revenue_cents) AS total_revenue_cents
FROM metrics_daily
WHERE experiment_id = ?
GROUP BY experiment_id
```

## Cumulative Derived Metrics

Derived metrics are recalculated from cumulative raw totals — **not** averaged from daily derived metrics. This is critical because averaging ratios produces incorrect results.

```typescript
function computeCumulativeMetrics(totals: CumulativeRaw): CumulativeDerived {
  return {
    cumulative_ctr_bp:
      totals.total_impressions > 0
        ? Math.round((totals.total_clicks / totals.total_impressions) * 10000)
        : null,
    cumulative_cvr_bp:
      totals.total_sessions > 0
        ? Math.round((totals.total_conversions / totals.total_sessions) * 10000)
        : null,
    cumulative_cpl_cents:
      totals.total_conversions > 0
        ? Math.round(totals.total_spend_cents / totals.total_conversions)
        : null,
    cumulative_roas_bp:
      totals.total_spend_cents > 0
        ? Math.round((totals.total_revenue_cents / totals.total_spend_cents) * 10000)
        : null,
  }
}
```

This uses the same `Math.round()` convention as the existing `computeDerivedMetrics()` function in the tech spec (Section 3.6), maintaining consistency across all metric calculations.

---

# 6. The Decision Memo — Enhanced Specification

The existing `decision_memos` table stores GO/KILL/PIVOT/INVALID decisions with a free-text `rationale`, `key_metrics` JSON snapshot, `confidence_pct`, and `next_steps`. This is functional but minimal. DD#6 enhances the Decision Memo with structured evidence, calculated confidence, and a link to the Validation Report.

## What Changes

| Current (v1.0)                            | Enhanced (v2.0)                                                                | Rationale                                                |
| ----------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------- |
| `rationale` — free text                   | `rationale` — free text + structured `evidence` JSON                           | Structured evidence enables cross-venture analysis       |
| `confidence_pct` — human estimate (0-100) | `confidence_pct` — calculated from Bayesian posterior + human override option  | Reproducible confidence methodology                      |
| `key_metrics` — ad-hoc JSON snapshot      | `key_metrics` — standardized snapshot matching evidence table format           | Consistent format for querying and comparison            |
| No link to Validation Report              | `validation_report_ref` — references the specific report                       | Decision traceable to evidence                           |
| No recommendation tracking                | `system_recommendation` — what the system suggested vs. what the human decided | Calibration data for improving the recommendation engine |

## Enhanced Decision Memo Fields

The existing table columns remain unchanged (backward compatibility). The enhancement is a new `decision_detail` TEXT (JSON) column that stores structured data alongside the existing free-text fields.

| Field                     | Type           | Description                                                                     |
| ------------------------- | -------------- | ------------------------------------------------------------------------------- |
| `validation_report_ref`   | string         | References the Validation Report this decision is based on                      |
| `evidence`                | array          | Structured evidence items (metric, value, threshold, status, weight)            |
| `confidence_calculation`  | object         | Method, inputs, and result of the confidence calculation                        |
| `system_recommendation`   | object         | The automated recommendation and its reasoning                                  |
| `human_override`          | object or null | If the human chose a different verdict, the override rationale                  |
| `go_conditions`           | array          | The 4 GO criteria from the strategy session, each with pass/fail status         |
| `kill_criteria_triggered` | array          | Which kill criteria (hard or soft) were triggered, if any                       |
| `pivot_routing`           | object or null | If PIVOT: which signal pattern, which re-entry point (from Pivot Routing Table) |
| `handoff_initiated`       | boolean        | Whether a GO handoff was initiated (GO verdicts only)                           |

## Confidence Calculation Methodology

Confidence is not a gut feeling — it is a calculated probability that the true underlying conversion rate supports the verdict.

### For GO Verdicts

Confidence = P(true CVR >= GO threshold | observed data)

Using the Beta-Binomial model:

1. **Prior:** Beta(1, 1) — uniform prior (no strong assumptions). As SC accumulates data (Phase 2+), informative priors derived from portfolio data can be used.
2. **Posterior:** Beta(1 + conversions, 1 + sessions - conversions)
3. **Confidence:** 1 - CDF(GO_threshold | posterior)

> **Worked example:** A `fake_door` test with 42 conversions from 1,400 sessions.
>
> - Observed CVR = 42/1400 = 3.0% (300 bp)
> - GO threshold = 2.0% (200 bp)
> - Prior: Beta(1, 1)
> - Posterior: Beta(43, 1359)
> - P(true CVR >= 200 bp) = 1 - BetaCDF(0.02 | 43, 1359) = 0.997
> - **Confidence: 99.7%** — very high confidence that true CVR exceeds the GO threshold
>
> Compare with a marginal result: 22 conversions from 1,400 sessions (CVR = 1.57%, 157 bp).
>
> - Posterior: Beta(23, 1379)
> - P(true CVR >= 200 bp) = 1 - BetaCDF(0.02 | 23, 1379) = 0.138
> - **Confidence: 13.8%** — low confidence; this CVR likely does not exceed the GO threshold

### For KILL Verdicts

Confidence = P(true CVR < KILL threshold | observed data)

Same model, evaluated at the kill threshold.

### For PIVOT Verdicts

Confidence is reported as "N/A — PIVOT is a routing decision, not a threshold evaluation." The Decision Memo instead records which metrics fell in the amber range and the signal pattern that triggered the pivot.

### Human Override

The operator can override the calculated confidence with their own assessment. When this happens:

- `confidence_calculation.system_value` records the calculated confidence
- `confidence_calculation.override_value` records the human's assessment
- `confidence_calculation.override_rationale` explains why
- Over time, the delta between system and human confidence becomes calibration data

---

# 6.5. Decision Memo Enhanced Schema Sketch

Field specification for a `decision_detail` TEXT (JSON) column on the `decision_memos` table:

```json
{
  "validation_report_ref": {
    "type": "string",
    "required": true,
    "description": "Reference to the experiment's validation_report that this decision is based on"
  },

  "evidence": {
    "type": "array",
    "required": true,
    "items": {
      "metric": { "type": "string" },
      "value": { "type": "integer" },
      "unit": { "type": "string" },
      "go_threshold": { "type": "integer" },
      "kill_threshold": { "type": "integer" },
      "status": { "type": "string", "enum": ["go", "amber", "kill"] },
      "weight": {
        "type": "number",
        "description": "Relative importance: 1.0 = primary metric, 0.5 = secondary"
      }
    }
  },

  "confidence_calculation": {
    "type": "object",
    "required": true,
    "properties": {
      "method": { "type": "string", "default": "bayesian_beta_binomial" },
      "prior": { "type": "object", "properties": { "alpha": "number", "beta": "number" } },
      "posterior": { "type": "object", "properties": { "alpha": "number", "beta": "number" } },
      "system_value": { "type": "integer", "description": "Calculated confidence 0-100" },
      "override_value": {
        "type": "integer",
        "description": "Human override 0-100, null if not overridden"
      },
      "override_rationale": { "type": "string" },
      "credible_interval_90_bp": {
        "type": "object",
        "properties": { "lower": "integer", "upper": "integer" }
      }
    }
  },

  "system_recommendation": {
    "type": "object",
    "required": true,
    "properties": {
      "verdict": { "type": "string", "enum": ["GO", "KILL", "PIVOT", "INVALID"] },
      "reasoning": { "type": "string" },
      "confidence_pct": { "type": "integer" }
    }
  },

  "human_override": {
    "type": "object",
    "required": false,
    "properties": {
      "original_recommendation": { "type": "string" },
      "final_decision": { "type": "string" },
      "rationale": { "type": "string" }
    }
  },

  "go_conditions": {
    "type": "array",
    "required": true,
    "description": "The 4 GO criteria from the strategy session",
    "items": {
      "condition": { "type": "string" },
      "met": { "type": "boolean" },
      "detail": { "type": "string" }
    }
  },

  "kill_criteria_triggered": {
    "type": "array",
    "required": false,
    "items": {
      "criterion": { "type": "string" },
      "severity": { "type": "string", "enum": ["hard", "soft"] },
      "metric": { "type": "string" },
      "value": { "type": "integer" },
      "threshold": { "type": "integer" }
    }
  },

  "pivot_routing": {
    "type": "object",
    "required": false,
    "properties": {
      "signal_pattern": { "type": "string" },
      "reentry_step": { "type": "integer", "minimum": 1, "maximum": 5 },
      "what_changes": { "type": "string" },
      "pivot_number": {
        "type": "integer",
        "description": "1 or 2 (max 2 pivots per strategy session)"
      },
      "cumulative_spend_cents": { "type": "integer" },
      "remaining_budget_cents": { "type": "integer" }
    }
  },

  "handoff_initiated": {
    "type": "boolean",
    "required": false,
    "default": false,
    "description": "Whether a GO handoff document was generated"
  }
}
```

---

# 7. GO Conditions Evaluation

The strategy session defined four conditions that must ALL be met for a GO verdict. This section operationalizes each one.

## Condition 1: Primary Metric Meets or Exceeds Threshold

**Check:** `cumulative_{primary_metric} >= test_blueprint.metrics.target_threshold`

The primary metric varies by archetype (CVR for most, ROAS for presale). The threshold comes from the Test Blueprint, which inherits archetype defaults from DD#2 but may include overrides.

**Example:** `fake_door` with CVR target >= 200 bp. If cumulative CVR = 280 bp, condition 1 is met.

## Condition 2: Sample Size Rule Satisfied

**Check:** `total_conversions >= test_blueprint.min_conversions`

Minimum conversions are archetype-specific (from DD#2): fake_door = 20, waitlist = 25, content_magnet = 25, priced_waitlist = 20, presale = 15, concierge = 10, service_pilot = 10.

**Important:** Time-box expiration alone does NOT satisfy this condition. A test that ran for 14 days but collected only 8 conversions cannot receive a GO verdict — it is INVALID regardless of other metrics.

## Condition 3: Data Quality Verified

**Check:** No data quality flags with severity = "high" in the Validation Report.

Specifically:

- No INVALID flags (bot traffic, tracking failures, platform anomalies)
- Attribution mismatch ratio (clicks/sessions) <= 2.0
- No days with revenue but zero conversions
- At least 70% of test days have non-zero sessions (tracking was operational)

## Condition 4: Discovery Summary Pain Severity >= 3/5

**Check:** `discovery_summary.pain_severity.composite >= 3.0` OR `discovery_summary.pain_severity.{any_dimension} >= 4.0`

This references DD#3's pain severity scoring and the Peak Dimension Rule. A venture can have moderate overall pain but extreme pain in one dimension and still qualify.

**Exception:** If no Discovery Summary exists (edge case: fake_door test run before discovery, with documented Discovery Gate exception from DD#2), this condition is evaluated as "N/A — gate exception documented" and does not block the GO verdict. This should be rare.

---

# 8. Threshold Calibration System

DD#2 Section 7 defined a 3-phase calibration plan. This section fleshes out each phase in detail, specifying data structures, calculation methods, and transition criteria.

## Phase 1: Industry Defaults (Now — Fewer Than 10 Completed Tests)

### How the Defaults Were Derived

The Phase 1 thresholds in DD#2 are based on industry benchmarks from multiple sources:

| Data Source                                   | What It Informed                                                                 |
| --------------------------------------------- | -------------------------------------------------------------------------------- |
| Meta Ads benchmarks (2024-2025)               | Average CTR by industry: 0.9%-1.5%. SC's CTR thresholds use these as baselines.  |
| Google Ads benchmarks (2024-2025)             | Average CVR by industry: 2.35%-4.4% for search, 0.5%-1.5% for display.           |
| Unbounce landing page benchmarks              | Median LP CVR: 3.2% across industries. Informed waitlist/content_magnet targets. |
| Lean Startup literature                       | Minimum viable sample sizes, innovation accounting metrics                       |
| Y Combinator / Techstars published thresholds | Typical validation metrics for accelerator portfolio companies                   |

### Why They Are Conservative

"Conservative" in this context means: **the GO thresholds are set above industry average, and the KILL thresholds are set below industry worst-case.** This creates a wide amber zone where the venture gets a PIVOT recommendation rather than a premature GO.

The asymmetry is intentional (see Section 2): false positives (premature GO) cost more than false negatives (premature KILL) in Phase 1, when SC has no portfolio data to calibrate against.

### Phase 1 Prior for Bayesian Confidence

In Phase 1, the Bayesian confidence calculation uses a weakly informative prior: **Beta(1, 1)** — the uniform distribution. This says "we have no strong prior belief about the conversion rate." The posterior is entirely determined by the observed data.

**Why not use industry benchmarks as the prior?** Because the prior should reflect SC-specific experience, not general market data. Industry benchmarks informed the _thresholds_, not the _priors_. In Phase 2, SC's own data becomes the prior.

### Data Structure for Phase 1

No additional data structure is needed. Phase 1 uses the archetype defaults hardcoded in DD#2 Section 3 and the uniform Beta(1, 1) prior.

## Phase 2: Internal Benchmarking (After 10+ Completed Tests)

### Transition Criteria

Phase 2 begins when SC has completed 10 or more experiments (across all archetypes) with non-INVALID verdicts. "Completed" means a Decision Memo exists with a GO, KILL, or PIVOT verdict.

### What Changes

1. **Percentile-based thresholds replace fixed defaults** for archetypes with 5+ completed tests
2. **Portfolio-derived priors replace the uniform prior** for Bayesian confidence
3. **Cross-venture learning** becomes available

### Percentile-Based Thresholds

For each archetype with 5+ completed tests, calculate the distribution of cumulative CVR (the primary metric for most archetypes):

- **GO threshold:** Set at the 75th percentile of observed CVR across completed tests for that archetype. This means a test must perform in the top quartile of SC's historical performance to receive a GO.
- **KILL threshold:** Set at the 25th percentile. Tests in the bottom quartile are killed.
- **Amber zone:** 25th to 75th percentile. Tests in this range receive a PIVOT recommendation.

> **Worked example:** After 8 completed `fake_door` tests with CVRs: [80, 120, 180, 210, 280, 300, 350, 420] bp.
>
> - p25 = 150 bp (between 120 and 180)
> - p75 = 325 bp (between 300 and 350)
> - Phase 2 thresholds: GO >= 325 bp, KILL < 150 bp, Amber = 150-325 bp
>
> Compare with Phase 1 defaults: GO >= 200 bp, KILL < 50 bp. Phase 2 is more stringent for GO (the portfolio's top quartile performs better than the industry default) and more lenient for KILL (SC's bottom quartile is above the industry worst-case).

### Portfolio-Derived Priors

Instead of the uniform Beta(1, 1), the prior for Bayesian confidence becomes:

**Prior = Beta(alpha_portfolio, beta_portfolio)** where alpha and beta are derived from the portfolio's historical conversion data for that archetype.

Calculation method:

1. Collect all completed tests for the archetype
2. Calculate the mean CVR (mu) and variance (sigma^2) across tests
3. Derive Beta parameters using method-of-moments:
   - `alpha = mu * (mu * (1 - mu) / sigma^2 - 1)`
   - `beta = (1 - mu) * (mu * (1 - mu) / sigma^2 - 1)`

**Safety guardrail:** If the derived prior has alpha + beta > 50, cap it at 50. This prevents the prior from dominating the posterior when sample sizes are small. The prior should inform, not overwhelm.

### Data Structure: `threshold_registry` Table

```sql
CREATE TABLE IF NOT EXISTS threshold_registry (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  archetype TEXT NOT NULL,
  phase INTEGER NOT NULL CHECK(phase IN (1, 2, 3)),

  -- Thresholds (in native units: bp for rates, cents for costs)
  go_threshold INTEGER NOT NULL,
  kill_threshold INTEGER NOT NULL,
  metric TEXT NOT NULL,

  -- Calibration data
  sample_count INTEGER NOT NULL,
  percentile_25 INTEGER,
  percentile_75 INTEGER,
  mean_value INTEGER,
  std_dev INTEGER,

  -- Bayesian prior
  prior_alpha REAL,
  prior_beta REAL,

  -- Metadata
  effective_from TEXT NOT NULL,
  superseded_at TEXT,
  calculation_notes TEXT,

  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

CREATE INDEX idx_threshold_archetype ON threshold_registry(archetype);
CREATE INDEX idx_threshold_phase ON threshold_registry(phase);
```

When a new threshold set is calculated, the previous entry gets `superseded_at` set to the current timestamp. The system always uses the entry with `superseded_at IS NULL` for each archetype.

### Cross-Venture Learning

With 10+ tests, SC can begin identifying patterns across ventures:

- **Industry correlations:** Do B2B ventures consistently have lower CVR but higher CPL than B2C? If so, industry-adjusted thresholds may be warranted in Phase 3.
- **Channel performance:** Does LinkedIn consistently outperform or underperform Meta for certain archetypes?
- **Pain severity correlation:** Do ventures with higher discovery pain severity consistently produce better campaign metrics?

These patterns are captured in learning memos and inform Phase 3 calibration, but they do not change thresholds automatically in Phase 2.

## Phase 3: Dynamic Calibration (After 50+ Completed Tests)

### Transition Criteria

Phase 3 begins when SC has completed 50 or more experiments with non-INVALID verdicts. At this scale, the portfolio has enough data for fine-grained calibration.

### What Changes

1. **Per-category and per-industry threshold adjustments**
2. **Bayesian updating of thresholds after each new test**
3. **Confidence intervals on verdicts**
4. **Predictive scoring** — can the system predict GO/KILL before the test completes?

### Bayesian Threshold Updating

After each completed test, the threshold registry is updated:

1. The new test's CVR is added to the archetype's historical distribution
2. Percentile thresholds are recalculated
3. The Beta prior is re-derived from the updated portfolio data
4. If the new thresholds differ from the current ones by more than 10%, a new `threshold_registry` entry is created

This creates a self-improving system: every test makes the thresholds more accurate.

### Per-Category Adjustments

With 50+ tests, there should be enough data to split thresholds by:

- **Industry:** B2B SaaS, B2C consumer, B2B services, B2C e-commerce, etc.
- **Price point:** Free/low-commitment, \$10-50/mo, \$50-200/mo, \$200+/mo
- **Channel:** Meta, Google, LinkedIn (different channels have different baseline CVRs)

Each sub-category follows the same percentile-based threshold calculation, but only when the sub-category has 5+ tests. Below that threshold, the archetype-level data is used.

### Data Structure: `venture_benchmarks` Table

```sql
CREATE TABLE IF NOT EXISTS venture_benchmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Categorization
  archetype TEXT NOT NULL,
  industry TEXT,
  price_range TEXT,
  channel TEXT,

  -- Aggregated metrics
  test_count INTEGER NOT NULL,
  mean_cvr_bp INTEGER,
  median_cvr_bp INTEGER,
  p25_cvr_bp INTEGER,
  p75_cvr_bp INTEGER,
  std_dev_cvr_bp INTEGER,
  mean_cpl_cents INTEGER,
  median_cpl_cents INTEGER,

  -- Outcome correlation
  go_rate_pct INTEGER,
  kill_rate_pct INTEGER,
  pivot_rate_pct INTEGER,

  -- Bayesian prior
  prior_alpha REAL,
  prior_beta REAL,

  -- Metadata
  last_updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  calculation_notes TEXT
);

CREATE INDEX idx_benchmarks_archetype ON venture_benchmarks(archetype);
CREATE INDEX idx_benchmarks_industry ON venture_benchmarks(industry);
```

This table is recomputed periodically (weekly or after each completed test) from the full experiment history.

### Confidence Intervals on Verdicts

In Phase 3, the Decision Memo includes a confidence interval on the verdict itself:

> "GO with 92% confidence. The 90% credible interval for true CVR is [240 bp, 380 bp], which lies entirely above the GO threshold of 200 bp."

Or for marginal cases:

> "PIVOT recommended. The 90% credible interval for true CVR is [130 bp, 270 bp], which straddles the GO threshold of 200 bp. 64% probability of exceeding GO threshold — insufficient for a confident GO verdict."

---

# 9. Automated Decision Support

The system does not make decisions. It evaluates metrics against thresholds and presents a recommended verdict with evidence. The human makes the final call.

## Decision Support Algorithm

The algorithm runs after each metrics import and produces a `recommended_verdict` for the Validation Report:

```
FUNCTION evaluate_experiment(experiment_id):

  1. COMPUTE cumulative metrics
  2. CHECK data quality
     IF any high-severity flag:
       RECOMMEND INVALID
       REASON: "Data quality issue: {flag_detail}"
       RETURN

  3. CHECK sample size
     IF total_conversions < min_conversions AND budget_remaining > 0:
       RECOMMEND "Continue — insufficient data for any verdict"
       RETURN
     IF total_conversions < min_conversions AND budget_exhausted:
       RECOMMEND INVALID
       REASON: "Budget exhausted with insufficient conversions ({actual} of {required} minimum)"
       RETURN

  4. CHECK hard kill criteria (strategy session)
     IF CTR < 40 bp after 1000+ impressions:
       RECOMMEND KILL (hard)
       REASON: "Hard kill: CTR below 0.4% after {impressions} impressions"
       RETURN
     IF zero conversions after full budget spend:
       RECOMMEND KILL (hard)
       REASON: "Hard kill: Zero conversions after full budget spend"
       RETURN

  5. EVALUATE primary metric against GO threshold
     IF primary_metric >= go_threshold:
       EVALUATE all 4 GO conditions:
         C1: primary metric >= threshold ✓
         C2: conversions >= minimum
         C3: no high-severity data quality flags
         C4: pain severity >= 3/5 (or peak >= 4)
       IF all 4 met:
         CALCULATE Bayesian confidence
         RECOMMEND GO with confidence
       ELSE:
         RECOMMEND "Metrics meet threshold but GO conditions not fully satisfied"
         LIST which conditions are not met

  6. CHECK soft kill criteria (archetype-specific)
     IF primary_metric < 50% of go_threshold:
       IF creative swap already attempted:
         RECOMMEND KILL (soft)
       ELSE:
         RECOMMEND "Soft kill territory — creative swap recommended before final verdict"
     IF CPL > 2x kill_threshold:
       RECOMMEND KILL (soft, cost)

  7. CHECK amber range
     IF primary_metric between kill_threshold and go_threshold:
       ANALYZE per-channel and per-variant performance
       IF any segment clears GO threshold:
         RECOMMEND PIVOT with segment data
         ROUTING: "Narrow ICP to {segment} — Step 3 re-entry"
       ELSE:
         RECOMMEND PIVOT
         USE Pivot Routing Table to determine re-entry point

  8. FALLBACK
     RECOMMEND "Insufficient information for automated recommendation — manual review required"
```

## Edge Cases

### Split Metrics (Some GO, Some KILL)

When primary metric is GO but secondary metrics are in KILL range (e.g., CVR meets threshold but CPL is 3x over limit):

- The system flags the conflict in the evidence table
- Recommended verdict: PIVOT — "Primary metric meets threshold but unit economics are unsustainable at current CPL. Recommend: test lower-cost channels or revise targeting to reduce CPL."
- The human may override to GO if they believe CPL will improve at scale

### Insufficient Sample Size with Strong Signal

When conversion rate looks excellent but total conversions are below minimum (e.g., 8 conversions at 4.0% CVR from a `fake_door` test requiring 20):

- Recommended verdict: INVALID — "Strong signal (CVR 400 bp, above GO threshold of 200 bp) but insufficient sample (8 of 20 required conversions). Recommend: extend budget or relaunch to reach minimum sample."
- This is not a GO. The sample size rule exists because small samples produce highly variable rates.

### Data Quality Questionable but Metrics Strong

When metrics exceed all thresholds but a medium-severity data quality flag is present (e.g., single day with 3x average traffic):

- Recommended verdict: GO with caveat — "All metrics exceed thresholds. Data quality flag: {detail}. Recommend: verify the flagged date's data before finalizing."
- The flag is noted in the Validation Report for the human reviewer to investigate.

---

# 10. INVALID Handling

An INVALID verdict means the test produced inconclusive results. It is neither a GO (validated) nor a KILL (invalidated) — it is a measurement failure. The venture's hypothesis is neither confirmed nor denied.

## Root Causes

| Root Cause                 | Detection                                                                         | Frequency                                                                            |
| -------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Insufficient traffic**   | Total sessions < 50% of archetype minimum                                         | Common — ad targeting too narrow, budget too small, or campaign not running properly |
| **Tracking failure**       | Days with ad spend but zero sessions in event_log                                 | Moderate — tracking code not deployed, UTM parameters misconfigured                  |
| **Bot contamination**      | CTR > 5x industry average with near-zero CVR; non-human session patterns          | Rare but devastating — invalidates all conversion data                               |
| **Platform anomaly**       | Metrics that are impossible (e.g., conversions > sessions) or obviously erroneous | Rare — ad platform reporting bugs                                                    |
| **Campaign not delivered** | Very low impressions relative to budget (platform rejected ads, account issues)   | Moderate — ad policy violations, payment failures                                    |

## Resolution Paths

| Root Cause             | Resolution                                                                                  | Cost Impact                                 |
| ---------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Insufficient traffic   | Extend budget by \$100-200 or broaden targeting                                             | Within \$1,500 cap                          |
| Tracking failure       | Fix tracking code, relaunch with same budget                                                | Wasted spend is lost; new budget within cap |
| Bot contamination      | Exclude bot traffic from metrics, re-evaluate; if insufficient clean data remains, relaunch | Relaunch cost within cap                    |
| Platform anomaly       | Contact platform support; manually correct metrics if source data is available              | No additional cost                          |
| Campaign not delivered | Fix the delivery issue (creative policy, payment, targeting), relaunch                      | Same budget                                 |

## INVALID Decision Memo

An INVALID verdict requires a Decision Memo, just like any other verdict. The memo documents:

- What went wrong (root cause from the table above)
- What data was collected (even if insufficient)
- The resolution path chosen
- Whether the experiment is being extended, relaunched, or redesigned

## Budget Accounting for INVALID Tests

INVALID test spend counts toward the \$1,500 cumulative cap from the strategy session. If a \$300 test produces an INVALID result and is relaunched for another \$300, the cumulative spend is \$600. This is by design — INVALID tests are a real cost.

---

# 11. Learning Memos & Continuous Improvement

The existing `learning_memos` table captures weekly observations during the test run. DD#6 specifies how these feed into methodology improvement.

## What Gets Captured During a Test

| Timing                  | Content                                                                   | Source                                           |
| ----------------------- | ------------------------------------------------------------------------- | ------------------------------------------------ |
| **Weekly (during run)** | Observations, hypotheses, actions taken, next week plan, metrics snapshot | Operator via learning_memos table                |
| **Daily (automated)**   | Metric imports, threshold evaluations, data quality checks                | metrics_daily + event_log                        |
| **Ad hoc**              | Creative swaps, targeting changes, budget adjustments, campaign pauses    | event_log with `experiment_status_change` events |

## What Gets Captured After a Test

| Timing                     | Content                                                                                             | Source                                      |
| -------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| **At decision**            | Validation Report (final), Decision Memo with structured evidence                                   | validation_report + decision_detail columns |
| **Post-mortem (optional)** | Reflections on what was learned beyond the metrics — methodology observations, process improvements | Free-text addendum to the Decision Memo     |

## Pattern Recognition Across Tests

Learning memos feed into cross-venture pattern recognition when queried in aggregate:

- **Messaging patterns:** Which headline structures (pain-led, solution-led, urgency-led) perform best across ventures? The Campaign Package's `ab_variants` with their performance data answer this.
- **Channel patterns:** Which channels consistently outperform for which customer segments? The `metrics_daily.source` breakdown answers this.
- **Timing patterns:** Do tests launched on specific days or during specific weeks perform differently? The date fields answer this.
- **Calibration patterns:** How often does the system's recommended verdict match the human's final decision? The `system_recommendation` vs. `human_override` fields in the Decision Memo answer this.

This pattern data feeds into Phase 2 and Phase 3 threshold calibration (Section 8) and into methodology refinement across the entire DD#1-DD#6 chain.

---

# 12. GO Handoff — From Validation to Product Development

The GO handoff is the most important transition in the validation workflow. It is where a validated hypothesis becomes a real business. This section specifies what happens when a venture receives a GO verdict.

## What Carries Forward

When a venture receives a GO verdict, the following artifacts carry forward from Silicon Crane validation into Ventracrane product development:

| Artifact                                | Source                                  | What It Provides                                                                                                          |
| --------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Hypothesis Card (Tier 2, validated)** | DD#1 — experiments.hypothesis_card      | Customer segment, validated problem, solution hypothesis, key assumptions (now evidence-backed), market sizing            |
| **Discovery Summary (final)**           | DD#3 — experiments.discovery_summary    | Customer pain evidence, feature priorities, WTP signal, price range, ICP refinements, discovery channels, customer quotes |
| **Test Blueprint**                      | DD#2 — experiments.test_blueprint       | Archetype sequence, budget history, threshold performance                                                                 |
| **Campaign Package**                    | DD#4 — experiments.campaign_package     | Messaging that worked, creative assets, channel performance, A/B variant results                                          |
| **Validation Report (final)**           | DD#6 — experiments.validation_report    | Complete metrics evidence, trend analysis, confidence assessment                                                          |
| **Decision Memo (GO)**                  | DD#6 — decision_memos + decision_detail | Verdict, confidence, structured evidence, GO conditions                                                                   |
| **Learning Memos**                      | learning_memos                          | Weekly observations from the test run                                                                                     |
| **Raw data: leads**                     | leads table                             | Actual captured leads — the venture's first potential customers                                                           |
| **Raw data: metrics**                   | metrics_daily                           | Full daily metrics history for forecasting                                                                                |
| **Raw data: events**                    | event_log                               | Behavioral data from landing page interactions                                                                            |

## The Handoff Document

The GO Handoff Document is a synthesized deliverable that packages the validation evidence for the product development team. It is generated from the artifacts above, not written from scratch.

### Handoff Document Structure

**1. Executive Summary**

- Venture name, one-liner (from Hypothesis Card)
- GO verdict with confidence percentage
- Total validation spend and duration
- Key metric: primary metric value vs. threshold

**2. Customer Evidence**

- Pain severity scores (from Discovery Summary)
- Top 5 customer quotes (from Discovery Summary)
- ICP definition (refined from discovery)
- Feature priorities (from Discovery Summary)

**3. Market Evidence**

- Campaign metrics (from Validation Report)
- Channel performance (best-performing channel, CPC, CPL)
- Conversion rate with confidence interval
- Audience size estimates (from ad platform reach data)

**4. Messaging That Worked**

- Winning headline and CTA (from Campaign Package A/B results)
- Pain dimension that resonated most (from Campaign Package tone)
- Channel-specific messaging insights

**5. Unit Economics (Preliminary)**

- Customer acquisition cost (from CPL)
- Projected LTV (from price point in test + industry retention benchmarks)
- LTV:CAC ratio estimate
- Break-even timeline estimate

**6. Risks & Open Questions**

- Key assumptions that remain untested (from Hypothesis Card)
- Data quality caveats (from Validation Report)
- Trend direction (improving/stable/declining from Validation Report)
- Competitive risks (from Hypothesis Card)

**7. Recommended Next Steps**

- Product scope recommendation (based on feature priorities from discovery)
- Launch channel recommendation (based on campaign performance)
- Target customer profile (based on ICP refinements)
- Suggested pricing (based on WTP data from discovery + validation)

**8. Raw Data Access**

- Links to all leads captured during validation
- Links to all metrics data
- Links to all event data
- Data retention notes (90-day PII window from strategy session)

## The Ventracrane Transition

The GO handoff transitions from Silicon Crane (validation) into the broader Ventracrane product development process.

### What Changes at Handoff

| Aspect             | During Validation (SC)              | After GO Handoff (Ventracrane)                                  |
| ------------------ | ----------------------------------- | --------------------------------------------------------------- |
| **Goal**           | Decide: GO or KILL                  | Build: ship the product                                         |
| **Budget**         | \$300-1,500 (test budget)           | Product development budget (TBD per venture)                    |
| **Team**           | Solo operator or small SC team      | Product development team                                        |
| **Metrics**        | Validation metrics (CVR, CPL, ROAS) | Product metrics (retention, engagement, revenue, churn)         |
| **Timeline**       | 1-10 weeks                          | Months to years                                                 |
| **Infrastructure** | SC Console (D1, Workers, Astro)     | Venture-grade stack (may use SC infrastructure or build custom) |

### Lead Nurturing Bridge

The leads captured during validation are the venture's first potential customers. During the handoff:

1. **Warm leads:** All leads from GO experiments are exported or API-accessible for the product team
2. **Communication:** A "we're building it" email sequence is triggered via Kit to keep leads warm
3. **Beta recruitment:** Leads from the validation test are the first beta invite candidates
4. **Retention:** The product team inherits the Kit email list and continues the relationship

### For VaaS: Client Deliverable

When SC operates as Validation-as-a-Service, the GO Handoff Document is the primary client deliverable. It is the product the client paid for — the validated evidence package.

**VaaS handoff includes:**

- Everything in the standard Handoff Document
- All raw data (leads, metrics, events) exported in a standard format (CSV + JSON)
- The Campaign Package (messaging and creative assets) with commercial usage rights
- A 30-minute handoff call to walk through the findings
- 30-day post-handoff support for questions about the data

**VaaS pricing consideration:** The Handoff Document is the high-value deliverable. The validation test is the process; the handoff is the product.

---

# 13. KILL Archival Protocol

When a venture is killed, everything is archived for learning. Killed ventures are not deleted — they are the most valuable source of pattern recognition data.

## Archive Process

1. **Decision Memo filed** with KILL verdict, structured evidence, and rationale
2. **Experiment status set to `archive`** in the experiments table
3. **All artifacts preserved:**
   - Hypothesis Card (what was believed)
   - Discovery Summary (what customers said)
   - Test Blueprint (how it was tested)
   - Campaign Package (what was said to the market)
   - Validation Report (what the market said back)
   - Learning Memos (what was observed)
   - Raw data (leads, metrics, events)
4. **PII retention clock starts:** 90 days from the archive date, PII in leads and event_log is purged per the strategy session's Kill Protocol

## 90-Day PII Retention

From the strategy session: "90-day PII retention policy on any collected contact data, then purge."

**What gets purged after 90 days:**

- `leads.email` — set to SHA-256 hash (retains uniqueness for count, loses recoverability)
- `leads.name` — set to NULL
- `leads.company` — set to NULL
- `leads.phone` — set to NULL
- `event_log.user_agent` — set to NULL (already covered by existing maintenance worker)

**What is preserved (anonymized):**

- `leads.custom_fields` — retained (archetype-specific data, typically not PII)
- `leads.utm_*` — retained (attribution data, not PII)
- `leads.ip_country` — retained (country-level, not PII)
- All `metrics_daily` data — retained (aggregate metrics, no PII)
- All `event_log` data except user_agent — retained (event types and behavioral data)
- All artifact columns on experiments — retained

**Implementation:** Extend the existing `sc-maintenance` worker's daily cron job to check for archived experiments past the 90-day retention window.

## The Kill Library

The kill library is a queryable archive of killed ventures, designed for pattern recognition across failed hypotheses.

### What the Kill Library Enables

- **Failure pattern detection:** Are ventures in certain industries consistently killed? At which step? For what reasons?
- **Messaging autopsies:** Which headline types and messaging approaches consistently fail?
- **ICP pattern recognition:** Are certain customer segments consistently unreachable or unresponsive?
- **Threshold validation:** Do killed ventures stay dead? (If a killed hypothesis is later validated by a competitor, the kill threshold may have been too aggressive.)
- **Cost of learning:** What is the average cost to learn that an idea does not work? This informs VaaS pricing.

### Kill Library Query Patterns

```sql
-- All kills by archetype
SELECT archetype, COUNT(*) as kill_count
FROM experiments e
JOIN decision_memos d ON e.id = d.experiment_id
WHERE d.decision = 'KILL'
GROUP BY archetype;

-- Average spend before kill
SELECT AVG(total_spend) FROM (
  SELECT e.id, SUM(m.spend_cents) as total_spend
  FROM experiments e
  JOIN metrics_daily m ON e.id = m.experiment_id
  JOIN decision_memos d ON e.id = d.experiment_id
  WHERE d.decision = 'KILL'
  GROUP BY e.id
);

-- Kill reasons (from structured decision_detail)
SELECT
  json_extract(d.decision_detail, '$.kill_criteria_triggered[0].criterion') as primary_kill_reason,
  COUNT(*) as count
FROM decision_memos d
WHERE d.decision = 'KILL'
  AND d.decision_detail IS NOT NULL
GROUP BY primary_kill_reason
ORDER BY count DESC;
```

---

# 14. Answering the Five Strategy Session Questions

The strategy session identified five questions for Deep Dive #6. Here are the definitive answers:

**1. How should initial thresholds be calibrated before we have historical data?**

Phase 1 thresholds (Section 8) use industry benchmarks from Meta/Google ad platform data, Unbounce landing page benchmarks, and Lean Startup literature. They are deliberately conservative — GO thresholds above industry average, KILL thresholds below industry worst-case — because false positives (premature GO) cost more than false negatives (premature KILL) when SC has no portfolio data. The Bayesian confidence calculation uses a uniform Beta(1, 1) prior, letting the observed data speak for itself. Phase 2 (after 10+ tests) replaces defaults with percentile-based thresholds from SC's own portfolio distribution, and Phase 3 (after 50+ tests) adds per-category and per-industry adjustments with Bayesian threshold updating.

**2. What measurement infrastructure is needed (analytics, event tracking, data pipelines)?**

The existing infrastructure covers 80% of what is needed (Section 3). Real-time event tracking exists via `event_log` and `POST /events`. Daily batch metrics exist via `metrics_daily` and `POST /metrics`. What is new: cumulative metric aggregation (Section 5), threshold evaluation logic triggered on each metrics import, Validation Report auto-generation, Bayesian confidence calculation, and data quality flag detection. Phase 1 uses manual ad platform metric import; Phase 2 adds semi-automated import via platform APIs. The infrastructure runs entirely on the existing Cloudflare Workers + D1 stack with no new external dependencies.

**3. How does the Decision Framework evolve as we accumulate validation data across ventures?**

Through the 3-phase calibration system (Section 8). Phase 1: static industry defaults. Phase 2: dynamic percentile-based thresholds (GO at p75, KILL at p25) derived from SC's own portfolio, with portfolio-derived Bayesian priors. Phase 3: Bayesian updating of thresholds after each completed test, per-category and per-industry adjustments, confidence intervals on verdicts. The `threshold_registry` and `venture_benchmarks` tables store calibration data. Every test makes the system smarter — completed experiments feed back into threshold recalculation and prior updates. The system also tracks human overrides of automated recommendations, using the delta between system and human confidence as calibration data for improving the recommendation engine.

**4. What artifacts from validation carry forward when a venture receives a GO verdict?**

Everything (Section 12). The Hypothesis Card (validated), Discovery Summary (customer evidence), Test Blueprint (test design history), Campaign Package (messaging that worked), Validation Report (market evidence), Decision Memo (verdict and evidence), Learning Memos (observations), and all raw data (leads, metrics, events). These are packaged into a GO Handoff Document with 8 sections: Executive Summary, Customer Evidence, Market Evidence, Messaging That Worked, Unit Economics, Risks & Open Questions, Recommended Next Steps, and Raw Data Access. The leads captured during validation are the venture's first potential customers — they bridge directly into beta recruitment.

**5. How does the handoff work from Silicon Crane validation into Ventracrane product development?**

The GO Handoff Document (Section 12) is the transition mechanism. It synthesizes all validation artifacts into a product development brief. The handoff changes the goal (from "decide" to "build"), the budget (from \$300-1,500 test budgets to product development budgets), the team (from solo operator to product team), the metrics (from validation metrics like CVR/CPL to product metrics like retention/engagement/revenue), and the timeline (from weeks to months). Leads are exported and a "we're building it" email sequence keeps them warm. For VaaS clients, the Handoff Document is the primary deliverable — the product the client paid for — supplemented with raw data exports, creative assets with usage rights, a handoff call, and 30-day post-handoff support.

---

# 15. Recommendations for Functional Spec v2.0

## Schema Changes

1. **Add `validation_report` TEXT (JSON) column** to the experiments table — stores the complete Validation Report artifact (see Schema Sketch in Section 4.5)

2. **Add `decision_detail` TEXT (JSON) column** to the decision_memos table — stores structured evidence, confidence calculation, system recommendation, and human override data (see Schema Sketch in Section 6.5)

3. **Create `threshold_registry` table** for calibration data — archetype-specific threshold history with phase tracking, percentile data, and Bayesian priors (Section 8)

4. **Create `venture_benchmarks` table** for cross-venture learning — aggregated performance data by archetype, industry, price range, and channel (Section 8)

## API Endpoints

5. **Add `GET /experiments/:id/validation-report`** — returns the current Validation Report (draft or final)

6. **Add `POST /experiments/:id/validation-report/finalize`** — locks the Validation Report to "final" stage

7. **Add `GET /experiments/:id/cumulative-metrics`** — returns cumulative aggregated metrics across all days and sources

8. **Add `POST /experiments/:id/evaluate-thresholds`** — triggers threshold evaluation and returns the recommended verdict with evidence (can also be auto-triggered on metrics import)

9. **Add `GET /thresholds/:archetype`** — returns the current threshold set for an archetype (from threshold_registry)

10. **Add `GET /benchmarks`** — returns portfolio benchmark data (from venture_benchmarks), filterable by archetype, industry, etc.

## Automated Decision Support Logic

11. **Implement the decision support algorithm** (Section 9) as a function called after each `POST /metrics` import. The function computes cumulative metrics, evaluates thresholds, checks GO conditions, and updates the draft Validation Report.

12. **Implement Bayesian confidence calculation** (Section 6) using the Beta-Binomial model. Phase 1 uses Beta(1,1) prior. Phase 2+ uses portfolio-derived priors from `threshold_registry`.

## Data Pipeline

13. **Add cumulative metric aggregation** (Section 5) to the metrics import pipeline. After each daily metrics import, recompute cumulative metrics and store in the Validation Report.

14. **Add data quality flag detection** (Section 4) to the metrics import pipeline. Check for bot traffic patterns, tracking gaps, platform anomalies, and attribution mismatches.

## Maintenance

15. **Extend the `sc-maintenance` worker** to handle 90-day PII purge for archived experiments (Section 13). Check for experiments in `archive` status with `decided_at` older than 90 days and purge PII from leads and event_log.

16. **Add threshold recalculation** to a scheduled job (weekly or after each completed experiment). When the completed test count crosses the Phase 2 (10 tests) or Phase 3 (50 tests) thresholds, recalculate and update `threshold_registry`.

## Event Types

17. **Add measurement event types to `event_log`:**
    - `threshold_evaluation` — triggered after each metrics import
    - `validation_report_generated` — draft report created or updated
    - `validation_report_finalized` — report locked to final
    - `decision_support_recommendation` — system recommendation generated
    - `go_handoff_initiated` — GO handoff document generated
    - `experiment_archived` — experiment moved to archive status

---

# 16. Methodology Complete — Summary of All Deep Dives

This is the capstone document in the SC Validation Methodology series. The six deep dives, together with the strategy session, define a complete system for validating business hypotheses — from raw idea to GO/KILL decision.

## The Complete Artifact Chain

```
Raw Idea
    │
    ▼
DD#1: The Venture Narrative ──────────► Structured Hypothesis Card
    │                                    (5 narrative elements, 10 fields,
    │                                     confidence score, early kill)
    ▼
DD#3: The Discovery Engine ───────────► Discovery Summary
    │                                    (pain severity, customer quotes,
    │                                     WTP signal, ICP refinements)
    ▼
DD#2: The Validation Ladder ──────────► Test Blueprint
    │                                    (archetype, metrics, thresholds,
    │                                     kill criteria, decision rules)
    ▼
DD#4: The Campaign Factory ───────────► Campaign Package
    │                                    (copy, creative, targeting,
    │                                     budget, channel variants)
    ▼
DD#5: [Landing Page Automation] ──────► Live Experiment
    │                                    (deployed page, tracking verified,
    │                                     signals capturing)
    ▼
DD#6: The Verdict ────────────────────► Validation Report + Decision Memo
    │                                    (metrics vs. thresholds, evidence,
    │                                     Bayesian confidence, verdict)
    │
    ├──► GO ──────► Handoff Document ──► Product Development
    │
    ├──► KILL ────► Kill Archive ──────► Kill Library (learning)
    │
    ├──► PIVOT ───► Pivot Routing ─────► Re-entry at Step 1-5
    │
    └──► INVALID ─► Resolution ────────► Extend / Relaunch / Redesign
```

## Deep Dive Summary Table

| #   | Name                           | Branded Name          | Artifact Produced                 | Key Innovation                                                                                       |
| --- | ------------------------------ | --------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 1   | Story-Based Framework          | The Venture Narrative | Hypothesis Card                   | 5-element narrative with 3-dimensional pain taxonomy; confidence scoring for early kill              |
| 2   | Test Type Taxonomy             | The Validation Ladder | Test Blueprint                    | 7 archetypes in 3 categories; per-archetype metrics/thresholds/kill criteria; 3-rung sequencing      |
| 3   | AI-Scaled Customer Discovery   | The Discovery Engine  | Discovery Summary                 | 3 interview modes with mode-weighted counting; 4 protocols mapped to HC fields; pain severity rubric |
| 4   | AI-Generated Marketing Content | The Campaign Factory  | Campaign Package                  | 7-step async pipeline; Messaging Matrix; two-tier generation model; BrandProfile system              |
| 5   | Landing Page Automation        | [DD#5 name]           | Live Experiment                   | [Covered in DD#5]                                                                                    |
| 6   | Measurement & Decision System  | The Verdict           | Validation Report + Decision Memo | Bayesian confidence; 3-phase calibration; automated decision support; GO handoff; kill library       |

## What Comes Next: Functional Spec v2.0

The six deep dives collectively recommend significant changes to the functional spec:

| Source | Key Recommendations                                                                                                                                                                                                               |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DD#1   | Replace Distill Brief with Hypothesis Card; add `hypothesis_card` column                                                                                                                                                          |
| DD#2   | Restructure archetypes (remove `interview`, add `fake_door`); add `test_blueprint` column; add Discovery Gate                                                                                                                     |
| DD#3   | Add `discovery_summary` column; create `interviews` table; add `discovery` status to experiment lifecycle                                                                                                                         |
| DD#4   | Add `campaign_package` column; create `ventures` table; async generation pipeline via Cloudflare Queue                                                                                                                            |
| DD#5   | [Covered in DD#5]                                                                                                                                                                                                                 |
| DD#6   | Add `validation_report` column; add `decision_detail` column; create `threshold_registry` and `venture_benchmarks` tables; automated threshold evaluation; Bayesian confidence; GO handoff protocol; kill archival with PII purge |

The Functional Spec v2.0 synthesis will consolidate these recommendations into a coherent database migration plan, API specification update, and implementation roadmap. The six deep dives provide the "what" and "why" — the functional spec provides the "how" and "when."

**The SC Validation Methodology is now fully specified from idea to decision.**
