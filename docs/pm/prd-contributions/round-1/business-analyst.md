# Business Analyst Contribution - PRD Review Round 1

**Author:** Business Analyst
**Date:** 2026-03-02
**Scope:** MVP / Phase 0 only (Milestone A: Phases 1-3 per Functional Spec v2.0, Section 8)

---

## MVP User Stories

The following user stories cover the Milestone A scope: Schema Foundation (Phase 1), Hypothesis Card (Phase 2), and Discovery Engine (Phase 3). This corresponds to the "v2.0-alpha" milestone defined in the functional spec as "First user-facing value" targeting approximately 2-3 weeks.

**Personas referenced:**

- **SC Operator**: The Silicon Crane team member running validation sprints for ventures (internal Ventracrane ventures or external VaaS clients).
- **VaaS Client**: An external entrepreneur who has engaged Silicon Crane for a validation sprint.

---

### US-001: Run v2.0 Schema Migration

**As an** SC Operator,
**I want** the database schema to be extended with all v2.0 columns and tables,
**so that** the application can store Hypothesis Cards, Discovery Summaries, interview records, and supporting metadata without breaking existing experiments.

**Acceptance Criteria:**

- [ ] Given the current v1.2 schema is deployed, when Migration 0002 is executed, then 6 new artifact columns are added to `experiments`: `hypothesis_card`, `test_blueprint`, `discovery_summary`, `campaign_package`, `page_config`, `validation_report`
- [ ] Given the current v1.2 schema is deployed, when Migration 0002 is executed, then 4 new supporting columns are added to `experiments`: `venture_id`, `category`, `sequence_position`, `prior_test_ref`
- [ ] Given the current v1.2 schema is deployed, when Migration 0002 is executed, then 1 new column `decision_detail` is added to `decision_memos`
- [ ] Given the current v1.2 schema is deployed, when Migration 0002 is executed, then 4 new tables are created: `interviews`, `ventures`, `threshold_registry`, `venture_benchmarks`
- [ ] Given existing experiments with archetype `interview`, when Migration 0002 runs Step 2, then draft/preflight experiments are migrated to `fake_door` and active experiments are archived
- [ ] Given the migration completes Step 3 (table recreation), when I query for experiments, then the `archetype` CHECK constraint accepts `fake_door` and rejects `interview`
- [ ] Given the migration completes Step 3, when I query for experiments, then the `status` CHECK constraint accepts `discovery` as a valid status
- [ ] Given the migration is complete, when I query `SELECT COUNT(*) FROM experiments WHERE archetype = 'interview'`, then the result is 0
- [ ] Given the migration is complete, when I compare row counts to pre-migration, then the count is preserved (no data loss)
- [ ] Given the migration is complete, when I update any experiment's name, then the `updated_at` trigger fires and updates the timestamp
- [ ] Given all new columns are nullable, when I query existing experiments that lack v2.0 data, then all new columns return NULL and existing behavior is unchanged

**Business Rules:** BR-001, BR-002, BR-003, BR-004

**Out of Scope:** Populating the `threshold_registry` with default values (deferred to Phase 7). Ventures CRUD API (deferred to Phase 5). Enforcing `venture_id` as a foreign key (D1 does not enforce FKs by default; deferred to Phase 5).

---

### US-002: Write a Hypothesis Card for an Experiment

**As an** SC Operator,
**I want** to write a Structured Hypothesis Card to an experiment,
**so that** I can capture the venture narrative fields and move the experiment through the validation workflow.

**Acceptance Criteria:**

- [ ] Given an experiment exists, when I send `PATCH /experiments/:id` with a valid `hypothesis_card` JSON body, then the `hypothesis_card` column is updated
- [ ] Given a Tier 1 (draft) Hypothesis Card, when I write it to an experiment, then the 6 required Tier 1 fields are present: `customer_segment`, `problem_statement`, `stakes_failure`, `stakes_success`, `solution_hypothesis`, `why_now`
- [ ] Given a Tier 2 (full) Hypothesis Card, when I write it to an experiment, then the 4 additional fields are accepted: `current_alternatives`, `market_sizing`, `competitive_landscape`, `key_assumptions`
- [ ] Given a Hypothesis Card with `confidence` set to `proceed`, `uncertain`, or `abandon`, when I write it, then the value is accepted
- [ ] Given a Hypothesis Card with an invalid `confidence` value (e.g., "maybe"), when I write it, then the API returns a 400 error
- [ ] Given a Hypothesis Card, when `confidence` is provided, then `confidence_rationale` must also be provided or the API returns a 400 error
- [ ] Given a Hypothesis Card with `key_assumptions`, when I write it, then each assumption has `claim`, `evidence`, `risk` (high/medium/low), and `basis` fields
- [ ] Given a Hypothesis Card with `key_assumptions`, when fewer than 3 or more than 5 assumptions are provided, then the API returns a 400 error
- [ ] Given a Hypothesis Card with a `tier` field, when the value is anything other than `draft` or `full`, then the API returns a 400 error
- [ ] Given a Hypothesis Card with an `one_liner` field, when the value exceeds 200 characters, then the API returns a 400 error
- [ ] Given an experiment that already has a `hypothesis_card`, when I send a new `hypothesis_card` via PATCH, then the old card is overwritten with the new one

**Business Rules:** BR-005, BR-006, BR-007, BR-008

**Out of Scope:** AI agent auto-generation of Hypothesis Cards (methodology concern, not MVP platform scope). Variant generation (2-3 alternative framings). Auto-archival triggered by `abandon` confidence (advisory only in Phase 2 per functional spec).

---

### US-003: Enforce Distill Brief Write Invariant

**As an** SC Operator,
**I want** the legacy Distill Brief fields to be auto-populated from the Hypothesis Card and protected from direct editing,
**so that** data remains consistent between the card and the legacy columns.

**Acceptance Criteria:**

- [ ] Given an experiment with a non-null `hypothesis_card`, when I send `PATCH /experiments/:id` with `hypothesis_card` containing `customer_segment`, then `target_audience` is auto-updated to match `hypothesis_card.customer_segment`
- [ ] Given an experiment with a non-null `hypothesis_card`, when I send `PATCH /experiments/:id` with `hypothesis_card` containing `problem_statement`, then `problem_statement` column is auto-updated to match `hypothesis_card.problem_statement`
- [ ] Given an experiment with a non-null `hypothesis_card`, when I send `PATCH /experiments/:id` with `hypothesis_card` containing `solution_hypothesis`, then `value_proposition` is auto-updated to match `hypothesis_card.solution_hypothesis`
- [ ] Given an experiment with a non-null `hypothesis_card`, when I send `PATCH /experiments/:id` with `hypothesis_card` containing `market_sizing`, then `market_size_estimate` is auto-updated to match `hypothesis_card.market_sizing`
- [ ] Given an experiment with a non-null `hypothesis_card`, when I send `PATCH /experiments/:id` with a direct update to `target_audience`, then the API returns a 400 error with message indicating the field is read-only when `hypothesis_card` is present
- [ ] Given an experiment with a non-null `hypothesis_card`, when I send `PATCH /experiments/:id` with a direct update to `problem_statement`, then the API returns a 400 error
- [ ] Given an experiment with a non-null `hypothesis_card`, when I send `PATCH /experiments/:id` with a direct update to `value_proposition`, then the API returns a 400 error
- [ ] Given an experiment with a non-null `hypothesis_card`, when I send `PATCH /experiments/:id` with a direct update to `market_size_estimate`, then the API returns a 400 error
- [ ] Given an experiment with a null `hypothesis_card`, when I send `PATCH /experiments/:id` with a direct update to `target_audience`, then the update succeeds (backward compatibility)
- [ ] Given an experiment with a non-null `hypothesis_card`, when I send `PATCH /experiments/:id` with an updated `hypothesis_card` that changes `customer_segment`, then `target_audience` is also updated to reflect the new value

**Business Rules:** BR-009, BR-010

**Out of Scope:** Bulk migration of existing Distill Brief data into Hypothesis Card format. Reverse projection (populating Hypothesis Card from Distill Brief columns).

---

### US-004: Read a Hypothesis Card from an Experiment

**As an** SC Operator,
**I want** to retrieve the Hypothesis Card for an experiment,
**so that** I can review the structured hypothesis and use it as input for discovery and test selection.

**Acceptance Criteria:**

- [ ] Given an experiment with a non-null `hypothesis_card`, when I send `GET /experiments/:id`, then the response includes the full `hypothesis_card` JSON object
- [ ] Given an experiment with a null `hypothesis_card`, when I send `GET /experiments/:id`, then the `hypothesis_card` field is null in the response
- [ ] Given an experiment with a non-null `hypothesis_card` and the `tier` field is `draft`, when I read the experiment, then Tier 2 fields (`current_alternatives`, `market_sizing`, `competitive_landscape`, `key_assumptions`) may be null
- [ ] Given an experiment with a non-null `hypothesis_card` and the `tier` field is `full`, when I read the experiment, then all 10 fields plus `confidence`, `confidence_rationale`, and `tier` are present

**Business Rules:** BR-006

**Out of Scope:** Hypothesis Card comparison between experiments. Card versioning or history tracking.

---

### US-005: Transition an Experiment to Discovery Status

**As an** SC Operator,
**I want** to transition an experiment from `preflight` to `discovery` status,
**so that** I can begin recording discovery interviews against the experiment.

**Acceptance Criteria:**

- [ ] Given an experiment in `preflight` status, when I send `PATCH /experiments/:id` with `status: "discovery"`, then the status is updated to `discovery`
- [ ] Given an experiment in `draft` status, when I send `PATCH /experiments/:id` with `status: "discovery"`, then the API returns a 400 error (invalid transition)
- [ ] Given an experiment in `discovery` status, when I send `PATCH /experiments/:id` with `status: "build"`, then the transition is allowed (Discovery Gate enforcement is deferred to Phase 4)
- [ ] Given an experiment in `discovery` status, when I send `PATCH /experiments/:id` with `status: "archive"`, then the transition is allowed (archive is always allowed)
- [ ] Given an experiment in `preflight` status, when I send `PATCH /experiments/:id` with `status: "build"`, then the transition is allowed (Discovery Gate exception path; enforcement deferred to Phase 4)
- [ ] Given the updated status transitions map, when I attempt any transition not listed in the valid transitions table, then the API returns a 400 error

**Business Rules:** BR-011, BR-012, BR-013

**Out of Scope:** Discovery Gate enforcement on `discovery -> build` and `preflight -> build` transitions (Phase 4). Requiring `discovery_gate_exception` flag for `preflight -> build` (Phase 4).

---

### US-006: Start a Discovery Sprint

**As an** SC Operator,
**I want** to initialize a discovery sprint for an experiment,
**so that** I can formally begin the discovery process and log the sprint initiation.

**Acceptance Criteria:**

- [ ] Given an experiment in `preflight` or `discovery` status, when I send `POST /experiments/:id/discovery/start`, then the experiment status transitions to `discovery` (if not already)
- [ ] Given an experiment in `draft` status, when I send `POST /experiments/:id/discovery/start`, then the API returns a 400 error
- [ ] Given a successful discovery start, when the sprint is initialized, then a `discovery_sprint_started` event is logged to `event_log` with `event_data` containing `{ mode: string, target_count: number, protocols: string[] }`
- [ ] Given an experiment already in `discovery` status, when I send `POST /experiments/:id/discovery/start` again, then the API returns a 409 Conflict error (sprint already active)

**Business Rules:** BR-011, BR-014

**Out of Scope:** Auto-generating interview protocols from the Hypothesis Card (AI agent capability, not platform API). Candidate sourcing assistance.

---

### US-007: Record a Completed Interview

**As an** SC Operator,
**I want** to record a completed interview against an experiment,
**so that** the interview data is captured in a structured format and contributes to the Discovery Summary.

**Acceptance Criteria:**

- [ ] Given an experiment in `discovery` status, when I send `POST /experiments/:id/interviews` with valid interview data, then a new row is inserted into the `interviews` table
- [ ] Given an experiment NOT in `discovery` status, when I send `POST /experiments/:id/interviews`, then the API returns a 400 error
- [ ] Given valid interview data, when the `mode` field is `ai`, `hybrid`, or `human`, then the interview is accepted
- [ ] Given valid interview data, when the `mode` field is an invalid value (e.g., "phone"), then the API returns a 400 error
- [ ] Given valid interview data, when `protocols_covered` contains valid protocol names (`problem_discovery`, `solution_fit`, `willingness_to_pay`, `icp_validation`), then the interview is accepted
- [ ] Given valid interview data, when `protocols_covered` is an empty array, then the API returns a 400 error (at least one protocol required)
- [ ] Given valid interview data, when `participant_id` is provided, then it is stored as-is (opaque identifier)
- [ ] Given valid interview data, when `pain_scores` is provided as a JSON object with `functional`, `emotional`, and `opportunity` numeric fields (1-5), then the scores are stored
- [ ] Given valid interview data, when `pain_scores` has a value outside the 1-5 range, then the API returns a 400 error
- [ ] Given valid interview data, when `signal_extraction` is provided as a JSON object, then it is stored as-is (flexible schema for extraction reports)
- [ ] Given valid interview data, when `transcript_ref` is provided, then it is stored as an R2 key reference
- [ ] Given valid interview data, when `duration_minutes` is provided, then it is stored as a positive integer
- [ ] Given a successful interview creation, when the response is returned, then it includes the auto-generated `id` and `created_at` timestamp
- [ ] Given a successful interview creation, when an `interview_completed` event is logged to `event_log`, then the event data includes `participant_id`, `mode`, `duration_minutes`, and `protocols_covered`

**Business Rules:** BR-015, BR-016, BR-017, BR-018

**Out of Scope:** Transcript upload to R2 (infrastructure concern, not API). Real-time AI co-pilot during interviews (Phase 2+ capability). AI-conducted interviews (Phase 3+ capability). Transcript-to-signal extraction automation (AI agent workflow, not API endpoint).

---

### US-008: Retrieve Discovery Summary

**As an** SC Operator,
**I want** to retrieve the current Discovery Summary for an experiment,
**so that** I can review the aggregated interview findings, pain severity scores, and gate status.

**Acceptance Criteria:**

- [ ] Given an experiment with a non-null `discovery_summary`, when I send `GET /experiments/:id/discovery/summary`, then the response includes the full Discovery Summary JSON
- [ ] Given an experiment with a null `discovery_summary`, when I send `GET /experiments/:id/discovery/summary`, then the API returns a 404 with message "No discovery summary exists for this experiment"
- [ ] Given a Discovery Summary in `draft` stage, when I retrieve it, then the `stage` field reads `draft`
- [ ] Given a Discovery Summary in `final` stage, when I retrieve it, then the `stage` field reads `final`
- [ ] Given a valid Discovery Summary, when I read it, then required fields are present: `experiment_id`, `hypothesis_card_version`, `interview_count`, `interview_count_weighted`, `mode_breakdown`, `problem_confirmed`, `pain_severity`, `current_alternatives_observed`, `top_quotes`, `assumption_updates`, `gate_status`, `saturation_reached`, `stage`

**Business Rules:** BR-019

**Out of Scope:** Auto-generating the Discovery Summary from interview records (AI agent workflow). Real-time incremental updates to the summary after each interview (Phase 2+ enhancement).

---

### US-009: Write a Discovery Summary

**As an** SC Operator,
**I want** to write or update the Discovery Summary for an experiment,
**so that** I can record aggregated interview findings after analysis.

**Acceptance Criteria:**

- [ ] Given an experiment in `discovery` status, when I send `PATCH /experiments/:id` with a valid `discovery_summary` JSON body, then the `discovery_summary` column is updated
- [ ] Given a Discovery Summary JSON, when required fields are missing (`experiment_id`, `interview_count`, `problem_confirmed`, `pain_severity`, `gate_status`, `stage`), then the API returns a 400 error
- [ ] Given a Discovery Summary with `interview_count_weighted`, when the value is provided, then it is accepted as a decimal number
- [ ] Given a Discovery Summary with `pain_severity`, when it includes `functional`, `emotional`, `opportunity` scores, then each must be between 1.0 and 5.0
- [ ] Given a Discovery Summary with `pain_severity`, when `composite` is provided, then it must equal the average of the three dimension scores (within rounding tolerance of 0.1)
- [ ] Given a Discovery Summary with `pain_severity`, when `peak_dimension` is provided, then it must be one of `functional`, `emotional`, or `opportunity`
- [ ] Given a Discovery Summary with `top_quotes`, when provided, then the array must not exceed 10 items
- [ ] Given a Discovery Summary with `gate_status`, when provided, then it must include the `passed` boolean and `checks` object
- [ ] Given a Discovery Summary with `stage` set to `final`, when the summary already has `stage: final`, then the API returns a 400 error (final summaries are immutable; see US-010)
- [ ] Given a Discovery Summary with `stage` set to `draft`, when the summary is updated, then subsequent updates are allowed

**Business Rules:** BR-019, BR-020, BR-021

**Out of Scope:** Server-side computation of `composite` score from dimension scores (client is expected to compute and provide). Server-side computation of `interview_count_weighted` from `mode_breakdown` (client computes). Polarization flag calculation.

---

### US-010: Finalize a Discovery Summary

**As an** SC Operator,
**I want** to lock a Discovery Summary to "final" stage,
**so that** the summary becomes immutable and serves as a formal input to Test Blueprint creation.

**Acceptance Criteria:**

- [ ] Given an experiment with a `discovery_summary` in `draft` stage, when I send `POST /experiments/:id/discovery/finalize`, then the `stage` field is updated to `final`
- [ ] Given an experiment with a `discovery_summary` already in `final` stage, when I send `POST /experiments/:id/discovery/finalize`, then the API returns a 400 error with message "Discovery summary is already finalized"
- [ ] Given an experiment with no `discovery_summary`, when I send `POST /experiments/:id/discovery/finalize`, then the API returns a 400 error with message "No discovery summary to finalize"
- [ ] Given a successful finalization, when I subsequently send `PATCH /experiments/:id` with changes to `discovery_summary`, then the API returns a 400 error with message "Cannot modify a finalized discovery summary"
- [ ] Given a successful finalization, when a `discovery_summary_finalized` event is logged to `event_log`, then the event data includes `interview_count`, `weighted_count`, and `gate_passed`

**Business Rules:** BR-022, BR-023

**Out of Scope:** Reverting a finalized summary back to draft. Auto-finalizing based on saturation detection.

---

### US-011: Evaluate the Discovery Gate

**As an** SC Operator,
**I want** to evaluate the Discovery Gate for an experiment,
**so that** I can determine whether the experiment has met the minimum discovery criteria to proceed to test design.

**Acceptance Criteria:**

- [ ] Given an experiment with a non-null `discovery_summary`, when I send `GET /experiments/:id/discovery/gate`, then the response includes the evaluation of all 6 gate checks
- [ ] Given the experiment's interviews, when the mode-weighted count is calculated as `(ai_count * 0.5) + (hybrid_count * 0.75) + (human_count * 1.0)`, then check #1 (minimum interviews) passes if the weighted count >= 5.0
- [ ] Given the Discovery Summary's `pain_severity.composite`, when the composite >= 3.0, then check #2 (pain severity) passes
- [ ] Given the Discovery Summary's `pain_severity`, when any single dimension (functional, emotional, opportunity) >= 4.0, then check #3 (peak dimension) passes regardless of composite score
- [ ] Given checks #2 and #3, when either one passes, then the combined pain threshold is satisfied (OR logic)
- [ ] Given the Discovery Summary's `problem_confirmed`, when it is `true`, then check #4 passes
- [ ] Given the Discovery Summary's `assumption_updates`, when at least 1 assumption has been updated with evidence, then check #5 (assumption evidence) passes
- [ ] Given the Discovery Summary's `saturation_reached`, when it is `true`, then check #6 passes
- [ ] Given all 6 checks, when checks 1, 4, and 5 are required, and checks 2/3 are OR'd, and check 6 is recommended but not blocking, then `gate_status.passed` reflects the correct evaluation
- [ ] Given an experiment with no `discovery_summary`, when I send `GET /experiments/:id/discovery/gate`, then the API returns a 400 error with message "No discovery summary available for gate evaluation"
- [ ] Given the gate evaluation result, when the response is returned, then it includes the full `checks` object with `passed`, `value`, and `threshold` for each check

**Business Rules:** BR-024, BR-025, BR-026, BR-027, BR-028

**Out of Scope:** Gate override recording (allowed in the Discovery Summary but not enforced by the gate endpoint). Blocking experiment status transitions based on gate result (Phase 4). Per-category minimum interview counts (Demand Signal: 5.0, WTP: 8.0, Solution Validation: 10.0 -- deferred to Phase 4 when Test Blueprint is implemented).

---

### US-012: Query Interviews for an Experiment

**As an** SC Operator,
**I want** to list all interviews recorded for an experiment,
**so that** I can review individual interview records and track discovery progress.

**Acceptance Criteria:**

- [ ] Given an experiment with recorded interviews, when I send `GET /experiments/:id/interviews` (implied by standard REST pattern), then the response includes an array of interview records
- [ ] Given each interview record in the response, when I read it, then it includes `id`, `experiment_id`, `participant_id`, `mode`, `protocols_covered`, `duration_minutes`, `pain_scores`, `signal_extraction`, `transcript_ref`, `new_themes_detected`, `created_at`
- [ ] Given an experiment with no interviews, when I query interviews, then the response is an empty array
- [ ] Given multiple interviews exist, when I query them, then they are ordered by `created_at` ascending (chronological order)

**Business Rules:** BR-016

**Out of Scope:** Filtering interviews by mode or protocol. Pagination (not needed for MVP volumes -- typical discovery sprint has 5-30 interviews).

---

### US-013: Log Discovery Events to Event Log

**As an** SC Operator,
**I want** discovery activities to be automatically logged to the event log,
**so that** there is a complete audit trail of the discovery process.

**Acceptance Criteria:**

- [ ] Given a discovery sprint is started, when the API call succeeds, then a `discovery_sprint_started` event is logged with experiment_id
- [ ] Given an interview is recorded, when the API call succeeds, then an `interview_completed` event is logged with participant_id, mode, duration_minutes, and protocols_covered
- [ ] Given an interview's AI analysis is completed (if signal_extraction is provided), when the interview is saved, then an `interview_analyzed` event is logged with new_themes count and pain_scores
- [ ] Given a discovery summary is finalized, when the API call succeeds, then a `discovery_summary_finalized` event is logged with interview_count, weighted_count, and gate_passed
- [ ] Given a discovery gate is evaluated, when the API call succeeds, then a `discovery_gate_evaluated` event is logged with the checks object and passed boolean
- [ ] Given any discovery event is logged, when I query the event log for the experiment, then the events appear in chronological order with correct timestamps

**Business Rules:** BR-029

**Out of Scope:** `interview_scheduled` events (scheduling is out of platform scope for MVP). `saturation_detected` events (saturation is a client-side or AI-agent concern in Phase 1). Real-time event streaming.

---

## Business Rules

| ID     | Rule                                                                                                                                                                                                      | Source                                             |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| BR-001 | All new columns added by Migration 0002 are nullable. Existing experiments continue to work without modification.                                                                                         | Functional Spec v2.0, Section 7                    |
| BR-002 | The archetype `interview` is replaced by `fake_door`. Migration Step 2 converts draft/preflight interview experiments to `fake_door` and archives active ones.                                            | Functional Spec v2.0, Section 2.3; DD#2, Section 2 |
| BR-003 | D1 does not enforce foreign keys by default. The `venture_id` column on experiments is advisory, not enforced at the database level until Phase 5.                                                        | Functional Spec v2.0, Section 2.1                  |
| BR-004 | SQLite/D1 cannot ALTER CHECK constraints. Modifying archetype and status constraints requires the create-copy-drop-rename migration pattern.                                                              | Functional Spec v2.0, Section 2.3                  |
| BR-005 | The Hypothesis Card has two tiers: Draft (Tier 1, 6 fields) and Full (Tier 2, 10 fields). Tier 1 is sufficient to enter discovery.                                                                        | DD#1, Section 3                                    |
| BR-006 | The Hypothesis Card schema specifies `confidence` as an enum of `proceed`, `uncertain`, `abandon` with a required `confidence_rationale` string.                                                          | DD#1, Section 3.5; Schema Sketch Section 3.7       |
| BR-007 | `key_assumptions` must have between 3 and 5 items when provided. Each assumption follows the structured format: claim, evidence, risk (high/medium/low), basis.                                           | DD#1, Section 3; Schema Sketch Section 3.7         |
| BR-008 | The `one_liner` field has a maximum length of 200 characters. It is AI-generated, not template-interpolated.                                                                                              | DD#1, Section 4                                    |
| BR-009 | When `hypothesis_card` is non-null on an experiment, the 4 Distill Brief columns (`target_audience`, `problem_statement`, `value_proposition`, `market_size_estimate`) become read-only projections.      | Functional Spec v2.0, Section 2.4                  |
| BR-010 | Projection mapping: `target_audience` from `customer_segment`, `problem_statement` from `problem_statement`, `value_proposition` from `solution_hypothesis`, `market_size_estimate` from `market_sizing`. | Functional Spec v2.0, Section 2.4                  |
| BR-011 | The status lifecycle gains a `discovery` state: `draft -> preflight -> discovery -> build -> launch -> run -> decide -> archive`.                                                                         | Functional Spec v2.0, Section 2.2                  |
| BR-012 | Valid status transitions include `preflight -> discovery`, `preflight -> build` (with exception), `discovery -> build`, `discovery -> archive`. Any status except archive can transition to archive.      | Functional Spec v2.0, Section 2.2                  |
| BR-013 | In Phase 3, `discovery` is added to valid transitions but Discovery Gate enforcement is not active. Gate enforcement is added in Phase 4.                                                                 | Functional Spec v2.0, Section 2.2, Phase 3 notes   |
| BR-014 | A discovery sprint can only be started for experiments in `preflight` or `discovery` status.                                                                                                              | Functional Spec v2.0, Section 3.3                  |
| BR-015 | Interview `mode` must be one of `ai`, `hybrid`, `human`. This is enforced by the CHECK constraint on the `interviews` table.                                                                              | Functional Spec v2.0, Section 2.7; DD#3, Section 3 |
| BR-016 | Each interview is linked to exactly one experiment via `experiment_id`. Interviews cannot exist without a parent experiment.                                                                              | Functional Spec v2.0, Section 2.7                  |
| BR-017 | `protocols_covered` is stored as a JSON array. Valid protocol names are: `problem_discovery`, `solution_fit`, `willingness_to_pay`, `icp_validation`.                                                     | DD#3, Section 4                                    |
| BR-018 | `pain_scores` stores three dimensions: `functional`, `emotional`, `opportunity`. Each scored 1-5 per the rubric defined in DD#3, Section 5.                                                               | DD#3, Section 5                                    |
| BR-019 | The Discovery Summary has two stages: `draft` (living document during sprint) and `final` (locked after sprint completes).                                                                                | DD#3, Section 6                                    |
| BR-020 | Pain severity composite score is the unweighted average of `functional`, `emotional`, and `opportunity`, rounded to one decimal place. Range: 1.0 to 5.0.                                                 | DD#3, Section 5                                    |
| BR-021 | Top quotes are capped at 10 items in the Discovery Summary. Each quote includes `quote`, `participant_id`, `dimension`, and `protocol` fields.                                                            | DD#3, Section 6                                    |
| BR-022 | Once a Discovery Summary is finalized (stage = `final`), it is immutable. No further updates are accepted.                                                                                                | DD#3, Section 6                                    |
| BR-023 | Finalization logs a `discovery_summary_finalized` event with interview_count, weighted_count, and gate_passed.                                                                                            | Functional Spec v2.0, Section 4                    |
| BR-024 | Mode-weighted interview counting: AI = 0.5x, Hybrid = 0.75x, Human = 1.0x. Formula: `(ai_count * 0.5) + (hybrid_count * 0.75) + (human_count * 1.0)`.                                                     | DD#3, Section 7                                    |
| BR-025 | Discovery Gate check #1: Minimum weighted interview count >= 5.0.                                                                                                                                         | DD#3, Section 7                                    |
| BR-026 | Discovery Gate checks #2 and #3 are OR'd: Either composite pain severity >= 3.0 OR any peak dimension >= 4.0 satisfies the pain threshold.                                                                | DD#3, Section 7                                    |
| BR-027 | Discovery Gate checks #1 (minimum interviews), #4 (problem confirmed), and #5 (assumption evidence) are required. Check #6 (saturation) is recommended but not blocking.                                  | DD#3, Section 7                                    |
| BR-028 | The peak dimension rule: Any single dimension averaging >= 4.0 across interviews meets the Discovery Gate pain threshold, regardless of the composite score.                                              | DD#3, Section 5                                    |
| BR-029 | All discovery activities must be logged to `event_log` with experiment_id, event_type, and structured event_data.                                                                                         | Functional Spec v2.0, Section 4                    |

---

## Edge Cases

### EC-001: Migration with No Existing Interview Experiments

If no experiments have `archetype = 'interview'` when Migration 0002 runs, the UPDATE statements in Step 2 affect zero rows. The migration proceeds without error. The verification query in Step 4 returns 0, which is the expected result.

### EC-002: Hypothesis Card Written Before Discovery Summary

An experiment can have a `hypothesis_card` and no `discovery_summary`. This is the normal flow -- the card is written at Step 1, discovery happens at Step 2. The gate evaluation endpoint should return a clear error ("No discovery summary available") rather than evaluating against empty data.

### EC-003: Discovery Summary Without Hypothesis Card

While the methodology expects a Hypothesis Card before discovery, the platform does not enforce this ordering in Phase 3. An operator could write a `discovery_summary` to an experiment that lacks a `hypothesis_card`. The API should accept this (backward compatibility with manual workflows) but the `hypothesis_card_version` field in the summary should be set to `draft` or `full` by the client based on the actual card state.

### EC-004: Concurrent Writes to Discovery Summary

If two API clients simultaneously PATCH an experiment's `discovery_summary`, D1's last-write-wins behavior means the second write overwrites the first. For MVP, this is acceptable because discovery sprints are operated by a single SC Operator per experiment. The risk is noted but not mitigated.

### EC-005: Pain Score with Insufficient Data in a Dimension

Per DD#3 Section 5 (AI Scoring Method), if fewer than 2 quotes exist for any pain dimension, that dimension should be scored as "insufficient data" rather than defaulting to 1. At the API level, the `pain_scores` JSON can represent insufficient data by omitting the dimension or setting it to `null`. The gate evaluation endpoint must handle null dimension scores: a null dimension does not count toward composite calculation and does not count as a peak dimension.

### EC-006: Finalized Discovery Summary Prevents Experiment Status Rollback

Once a Discovery Summary is finalized, it cannot be modified. However, the platform does not prevent the experiment from transitioning backward (e.g., `discovery -> preflight`). In Phase 3, status rollbacks are not blocked. If the experiment returns to an earlier status, the finalized summary remains attached but may be stale. This edge case will be addressed in Phase 4 with stricter lifecycle enforcement.

### EC-007: Interview Recorded for Archived Experiment

An experiment in `archive` status cannot accept new interviews (the experiment is not in `discovery` status). The API should return a 400 error. However, an experiment that transitions to `archive` after interviews have been recorded retains all historical interview data.

### EC-008: Gate Evaluation with Zero Interviews

If an experiment has a Discovery Summary with `interview_count: 0`, the gate evaluation should fail all checks and return `passed: false`. The weighted count is 0.0, composite pain severity cannot be computed (no data), problem_confirmed defaults to false, and no assumption evidence exists.

### EC-009: Distill Brief Write Invariant with Null Hypothesis Card Fields

If a `hypothesis_card` is written but `market_sizing` is null (because it is a Tier 2 field and the card is Tier 1), then `market_size_estimate` should be set to null via projection. If `market_size_estimate` previously had a value from direct population, the projection from a Tier 1 card overwrites it with null. The operator should be aware that writing a Tier 1 card clears the `market_size_estimate` column.

### EC-010: Migration Preserves Existing Triggers and Indexes

The create-copy-drop-rename migration pattern in Step 3 drops the original `experiments` table, which also drops associated triggers and indexes. Step 3 must explicitly recreate `idx_experiments_status`, `idx_experiments_slug`, and the `update_experiments_timestamp` trigger. If any trigger or index is missed, experiment updates may fail silently (no timestamp update) or query performance may degrade.

### EC-011: Interview Mode Weighting with All-AI Interviews

If all interviews are AI-moderated, the weighted count is halved relative to the raw count. For example, 8 AI interviews produce a weighted count of 4.0, which fails the minimum threshold of 5.0. The operator must run at least 10 AI-only interviews to pass the gate. This is by design -- the weighting creates an incentive to include human-led or hybrid interviews.

### EC-012: Discovery Summary with Empty Assumption Updates

The `assumption_updates` array is required per the schema, but it may be empty (`[]`). If it is empty, gate check #5 (assumption evidence) fails because no assumption has been updated with evidence. The operator must update at least one assumption with evidence for the gate to pass.

---

## Traceability Matrix

This matrix maps user stories to functional spec sections, deep dive recommendations, and success metrics.

| Story  | Feature Area                   | Functional Spec Sections | Deep Dive Recs                             | Success Metrics                                                                                               |
| ------ | ------------------------------ | ------------------------ | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| US-001 | Schema Migration               | 2.1, 2.3, 2.7, 7         | DD#1 R1-R3, DD#2 R1-R6, DD#3 R1-R2, R6, R8 | Migration completes without data loss; all verification queries pass                                          |
| US-002 | Hypothesis Card Write          | 2.1, 3.1                 | DD#1 R1, R2                                | Hypothesis Cards can be persisted and retrieved; validation rejects malformed data                            |
| US-003 | Distill Brief Write Invariant  | 2.4, 3.1                 | DD#1 R3                                    | Legacy Distill Brief columns stay consistent with Hypothesis Card; direct edits rejected when card is present |
| US-004 | Hypothesis Card Read           | 2.1, 3.1                 | DD#1 R2                                    | Hypothesis Cards are returned correctly via experiment GET                                                    |
| US-005 | Status Transition: Discovery   | 2.2, 3.1                 | DD#3 R6                                    | Experiments can transition to `discovery` status; invalid transitions are rejected                            |
| US-006 | Discovery Sprint Start         | 3.3, 4                   | DD#3 R3                                    | Discovery sprints can be initialized; events are logged                                                       |
| US-007 | Interview Recording            | 2.7, 3.3, 4              | DD#3 R2, R3                                | Interviews are persisted with all metadata; mode validation enforced                                          |
| US-008 | Discovery Summary Read         | 3.3                      | DD#3 R1, R3                                | Discovery Summary is retrievable; null handling is correct                                                    |
| US-009 | Discovery Summary Write        | 2.1, 3.1                 | DD#3 R1                                    | Discovery Summary JSON can be persisted; validation rejects malformed data                                    |
| US-010 | Discovery Summary Finalization | 3.3, 4                   | DD#3 R3                                    | Finalization locks the summary; subsequent modifications are rejected                                         |
| US-011 | Discovery Gate Evaluation      | 3.3                      | DD#3 R3, R4                                | Gate evaluates all 6 checks correctly; mode-weighted counting produces correct results                        |
| US-012 | Interview Query                | 3.3                      | DD#3 R2, R3                                | Interview records are retrievable per experiment; ordering is chronological                                   |
| US-013 | Discovery Event Logging        | 4                        | DD#3 R5                                    | Discovery events are logged to event_log with correct event_types and event_data                              |

---

## Open Questions

| ID     | Question                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Impact                                                                                                                                                                                         | Recommended Resolution                                                                                                                                                                                                                                                                                                                               |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OQ-001 | Should the gate evaluation endpoint (`GET /discovery/gate`) compute the weighted interview count from the `interviews` table directly, or read the pre-computed value from `discovery_summary.interview_count_weighted`? The functional spec says "computed server-side when the gate is evaluated, not stored as a static value" (DD#3 Rec 4), which implies querying the interviews table. But the Discovery Summary also stores this value. Which is authoritative? | Gate evaluation accuracy; potential for stale data if summary is not updated after each interview.                                                                                             | Compute from the `interviews` table rows (count by mode, apply weights) for the gate endpoint. The Discovery Summary's `interview_count_weighted` is a snapshot, not the source of truth for gate evaluation.                                                                                                                                        |
| OQ-002 | What happens to a Discovery Summary when a new interview is recorded after the summary has been written? Is the operator expected to re-write the summary with updated aggregations, or should the API auto-update draft summaries?                                                                                                                                                                                                                                    | Operator workflow complexity. If manual: risk of stale summaries. If auto: requires server-side aggregation logic in Phase 3.                                                                  | Phase 3 keeps it manual: the operator (or AI agent) writes an updated Discovery Summary after processing new interviews. Auto-aggregation is a Phase 4+ enhancement.                                                                                                                                                                                 |
| OQ-003 | The `discovery_summary.pain_severity.composite` field is described as a simple average, but EC-005 (insufficient data in a dimension) means the composite may need to be computed from fewer than 3 dimensions. Should the composite be the average of available dimensions only, or should it require all 3 dimensions?                                                                                                                                               | Handling of incomplete pain data; affects gate check #2 accuracy.                                                                                                                              | Composite requires all 3 dimensions. If any dimension is insufficient, the composite is null, and the pain threshold can only be met via check #3 (peak dimension in a dimension that has sufficient data).                                                                                                                                          |
| OQ-004 | Should the `POST /experiments/:id/interviews` endpoint accept `pain_scores` with individual dimension values of `null` to represent "insufficient data"? The DD#3 AI scoring method says score as "insufficient data" rather than defaulting to 1, but the schema sketch shows `minimum: 1, maximum: 5` for each score.                                                                                                                                                | API validation rules; affects EC-005 handling.                                                                                                                                                 | Accept `null` per dimension in `pain_scores` to represent insufficient data. Update the schema sketch to allow null per dimension while keeping the 1-5 range for non-null values.                                                                                                                                                                   |
| OQ-005 | The functional spec says `PATCH /experiments/:id` should accept `discovery_summary` as an updatable field (Section 3.1), but also defines dedicated endpoints for discovery operations (Section 3.3). Which is the canonical write path for the Discovery Summary? Is it PATCH or a dedicated endpoint?                                                                                                                                                                | API design consistency; potential for conflicting write paths.                                                                                                                                 | Use `PATCH /experiments/:id` with `discovery_summary` as the primary write path, consistent with how `hypothesis_card` works. The `/discovery/summary` GET endpoint is read-only. The `/discovery/finalize` POST endpoint is the only endpoint that modifies the summary's stage field. This avoids creating a separate write API for each artifact. |
| OQ-006 | Should Hypothesis Card validation be strict (reject cards missing required Tier 1 fields) or lenient (accept partial cards and leave completeness to the client)? The schema sketch marks 6 Tier 1 fields as `required: true`, but enforcing this in the API prevents incremental card building.                                                                                                                                                                       | Developer experience vs. data quality. Strict validation prevents partial cards. Lenient validation allows incremental workflow but may result in incomplete cards passing through the system. | Enforce required fields per tier. If `tier: draft`, require all 6 Tier 1 fields. If `tier: full`, require all 10 fields plus confidence and confidence_rationale. Reject cards with missing required fields. This matches the methodology: a Tier 1 card takes ~30 minutes and should be complete when submitted.                                    |
| OQ-007 | The functional spec mentions CampaignPackage write invariant (Section 2.5) where `copy_pack` and `creative_brief` become read-only when `campaign_package` is non-null. Should this invariant be implemented in Phase 2 alongside the Distill Brief write invariant, or deferred to Phase 5 with the Campaign Factory?                                                                                                                                                 | Implementation scoping. Implementing the invariant early is cheaper (same code pattern as Distill Brief invariant) but the `campaign_package` column will not be populated until Phase 5.      | Defer to Phase 5. The invariant only matters when `campaign_package` is populated, which requires the Campaign Factory. Implementing it now would add unused code.                                                                                                                                                                                   |
