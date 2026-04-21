# Product Manager Contribution - PRD Review Round 1

**Author:** Product Manager
**Date:** 2026-03-02
**Scope:** MVP / Phase 0 only
**Source Documents:** `docs/process/sc-project-instructions.md`, `docs/technical/sc-functional-spec-v2.md`

---

## Executive Summary

**Problem:** Entrepreneurs burn months of runway and tens of thousands of dollars building products before discovering their idea does not work. There is no productized, evidence-based service that provides a fast, structured validation outcome a founder can act on.

**Solution:** Silicon Crane (SC) is a Validation-as-a-Service (VaaS) offering that runs structured sprints -- Preflight, Build-to-Launch, Run + Decide, and Scale Readiness -- to produce a clear GO/NO-GO signal backed by real market data. SC Console is the internal platform that powers these sprints: it manages experiments end-to-end from hypothesis definition through market testing to evidence-based verdicts.

**Value:** Founders get a defensible validation outcome in 2-3 weeks for a fraction of the cost of building blindly. SC gets a repeatable, methodology-driven delivery model that scales across ventures and clients. The console codifies the entire validation artifact chain -- Hypothesis Card through Validation Report -- so that every sprint is traceable, every decision is evidence-backed, and every learning compounds into better calibration over time.

---

## Product Vision & Identity

### Name & Tagline

- **Product Name:** SC Console
- **Service Brand:** Silicon Crane
- **Tagline:** "Kill bad ideas in 2 weeks instead of 6 months."

### Positioning

SC Console is the internal operating system for Silicon Crane's validation sprints. It is not a customer-facing SaaS product. It is the engine that lets SC run structured experiments, capture market signals, and produce evidence-based verdicts for clients and internal ventures.

SC Console sits in the Venture Crane ecosystem alongside DFG and other ventures. It shares the Cloudflare-native infrastructure pattern (Workers, D1, R2, Pages) but intentionally diverges on frontend framework (Astro instead of Next.js) because SC is a content-heavy marketing and landing page system, not a data-heavy dashboard.

### What This Is

- An internal experiment management platform for running validation sprints
- A structured artifact pipeline from raw idea through market verdict
- A landing page generation and signal capture system for experiment archetypes
- A measurement and decision support system that produces evidence-backed GO/NO-GO recommendations

### What This Is NOT

- Not a customer-facing SaaS product (clients see deliverables, not the console)
- Not a dev shop tool (we validate hypotheses, not build to spec)
- Not a general-purpose CMS or website builder
- Not an ad platform (we integrate with ad platforms, not replace them)
- Not a CRM (we capture leads for experiments, not manage sales pipelines)

---

## Product Principles

These principles are ordered by priority. When two principles conflict, the higher-ranked one wins.

### 1. Evidence Over Opinion

Every experiment must produce measurable data. Every decision must reference that data. The system must never allow a GO/KILL/PIVOT decision without a metrics snapshot. If we cannot measure it, we do not ship it.

### 2. Kill Fast, Kill Cheap

The entire system is optimized to surface failure signals as early and inexpensively as possible. Kill criteria are defined before launch, not after. Hard kill triggers are non-negotiable. The system biases toward protecting the client's capital over protecting the hypothesis.

### 3. Backward Compatibility Is Non-Negotiable

All schema changes are additive (nullable columns). Existing experiments continue to work without modification. Write invariants only activate when new columns are populated. The functional spec v2.0 is additive to tech spec v1.2, not a replacement. No migration may break existing data.

### 4. Methodology Is the Product

The artifact chain (Hypothesis Card -> Discovery Summary -> Test Blueprint -> Campaign Package -> Live Experiment -> Validation Report) is the core intellectual property. Every feature must reinforce the methodology. Features that bypass the chain (e.g., launching without kill criteria) are bugs, not shortcuts.

### 5. Internal-First, Client-Sanitized

The console is an internal tool. Client visibility follows Option B (sanitized): clients see weekly updates and deliverable documents, not GitHub issues or the Command Center. The system must produce clean, portable deliverables (case studies, validation reports, decision memos) without exposing internal tooling.

### 6. Operational Simplicity Over Feature Richness

Cloudflare-native stack was chosen for lowest operational complexity. No recurring infrastructure costs at low traffic. Single deployment target. Every infrastructure addition (Queues, R2 buckets, cron triggers) must justify its operational overhead. Defer complexity to later phases when it is proven necessary.

### 7. Compound Learning

Every completed experiment calibrates the system. Threshold registries improve with data. Venture benchmarks accumulate. The system gets better at predicting outcomes as the portfolio grows. Design for learning accumulation from day one, even if Phase 1 uses hardcoded defaults.

---

## Success Metrics & Kill Criteria

### MVP Success Metrics (Phase 0 / Tier 1 Buildout)

The MVP goal defined in the project instructions is: **accept first paying client.**

| Metric                          | Target                            | Measurement Method              | Timeline                      |
| ------------------------------- | --------------------------------- | ------------------------------- | ----------------------------- |
| First paying client acquired    | 1 client                          | Stripe payment received         | Within 4 weeks of site launch |
| Intake form submissions         | >= 5                              | Tally/Typeform submission count | Within 4 weeks of site launch |
| Warm network outreach completed | 20 contacts reached               | Manual tracking                 | Week 1 post-launch            |
| Services page live              | Deployed at siliconcrane.com      | URL reachable, content reviewed | End of Tier 1 sprint          |
| Payment mechanism functional    | Stripe checkout/invoice working   | Test transaction                | End of Tier 1 sprint          |
| Contract/SOW template complete  | Signed template exists            | Document review                 | End of Tier 1 sprint          |
| DFG case study drafted          | Published draft with real metrics | Content review                  | End of Tier 1 sprint          |

### Platform Success Metrics (v2.0-alpha / Milestone A)

These measure whether the console platform is functioning after Phases 1-3:

| Metric                                                      | Target                                                     | Measurement Method                            |
| ----------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------- |
| Experiments created and progressed through status lifecycle | >= 1 experiment reaches `run` status                       | D1 query                                      |
| Hypothesis Cards populated                                  | 100% of new experiments have `hypothesis_card`             | D1 query: `WHERE hypothesis_card IS NOT NULL` |
| Discovery interviews recorded                               | >= 3 interviews per experiment entering discovery          | `interviews` table count per experiment       |
| Landing pages rendering per archetype                       | All 7 archetypes render correctly                          | Manual QA per archetype                       |
| Signal capture operational                                  | `event_log` receiving `page_view` and `form_submit` events | D1 query on `event_log`                       |
| Leads captured via landing pages                            | >= 1 lead per launched experiment                          | `leads` table count                           |

### Kill Criteria for the SC Venture Itself

These determine whether Silicon Crane as a business is viable. They come directly from the project instructions' emphasis on GO/NO-GO signals with evidence.

| Kill Criterion                                          | Threshold                                                              | Evaluation Point           |
| ------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------- |
| Zero paying clients after outreach to 20+ warm contacts | 0 conversions from 20 contacts                                         | 6 weeks post-launch        |
| Intake form submissions with zero qualified leads       | 0 leads pass qualification criteria after 10+ submissions              | 8 weeks post-launch        |
| Founding client rate ($2,500) generates zero interest   | 0 expressions of interest at founding rate                             | 6 weeks post-launch        |
| Capacity conflict kills delivery quality                | DFG priority arbitration causes missed client deadlines more than once | First client engagement    |
| Sprint delivery takes 2x or more the estimated duration | Preflight exceeds 10 days, Build-to-Launch exceeds 20 days             | First 2 client engagements |

---

## Risks & Mitigations

### Business Risks

| Risk                                                                                                                                                  | Likelihood | Impact | Mitigation                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pricing not validated.** All sprint prices are TBD. Founding rate of $2,500 is a guess.                                                             | High       | High   | Lock pricing before launch (Tier 1, Day 1). Start with founding rate for first 3-5 clients. Use those engagements to calibrate real pricing. Do not launch without specific numbers.                                                            |
| **Capacity conflict with DFG.** Project instructions flag this as an open question: if DFG needs urgent work AND a client needs attention, what wins? | High       | High   | Define priority arbitration rules before accepting first client. Recommendation: client-facing deadlines always win over internal venture work. If this is untenable, limit to 1 concurrent client engagement until DFG reaches a steady state. |
| **No case study at launch.** DFG case study is drafted in Tier 1 but may not have compelling enough metrics.                                          | Medium     | Medium | Ship DFG case study even if metrics are modest -- frame it as "Experiment #1" with transparency about what was learned. Honesty about methodology is more compelling than inflated numbers.                                                     |
| **Market positioning confusion.** Prospects may confuse SC with agencies, accelerators, or consultants.                                               | Medium     | Medium | The "What SC Is Not" section is already well-defined. Bake it into the services page, FAQ, and outreach messaging. Lead with methodology differentiation: "We use kill criteria, you get evidence."                                             |

### Technical Risks

| Risk                                                                                                                                                                            | Likelihood | Impact   | Mitigation                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **D1 CHECK constraint migration is destructive.** The create-copy-drop-rename pattern for updating CHECK constraints risks data loss if executed incorrectly.                   | Medium     | Critical | Run full migration in local D1 first. Verify row counts before and after. Run in preview environment second. Production last. Step 4 verification queries are mandatory in every environment. Never skip verification.                                                                                                                   |
| **Async pipeline complexity.** Cloudflare Queue for campaign generation adds operational surface area.                                                                          | Medium     | Medium   | Deferred to Phase 5. Not an MVP concern. When implemented, start with synchronous fallback and add Queue only after proving the pipeline works end-to-end.                                                                                                                                                                               |
| **Write invariant enforcement creates API surface complexity.** Two write invariant patterns (Distill Brief, CampaignPackage) mean PATCH behavior varies based on column state. | Medium     | Medium   | Document invariant behavior exhaustively in API docs. Add clear error messages when invariant rejects a write (e.g., "Cannot update target_audience directly when hypothesis_card is present. Update hypothesis_card.customer_segment instead."). Add comprehensive test coverage for both paths (invariant active, invariant inactive). |
| **Schema migration on production D1 with live data.** Migration 0002 modifies the experiments table structure.                                                                  | Low        | Critical | Migration is additive (new nullable columns) for Steps 1 and 2. Step 3 (table recreation) is the risk point. Schedule migration during low-traffic window. Take D1 export before migration. Verify foreign key PRAGMA state before deploying.                                                                                            |

### Execution Risks

| Risk                                                                                                                                                      | Likelihood | Impact | Mitigation                                                                                                                                                                                                                                                    |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **7-phase implementation plan is too long.** Phases 1-7 span the entire methodology. Real value delivery is delayed until late phases.                    | High       | High   | Milestone A (Phases 1-3) is the checkpoint. Target 2-3 weeks. If Milestone A takes more than 4 weeks, re-evaluate Phase 4-7 scope. Ship incremental value: Phase 1 (schema) enables manual workflows even without UI.                                         |
| **Scope creep from 61 recommendations.** The functional spec consolidates 61 deep-dive recommendations. Temptation to implement everything in each phase. | High       | Medium | Each phase has explicit scope boundaries (see Phased Development Plan below). A feature is in one phase, not "partially in Phase 0." Phase boundaries are enforced in PR review. Discover additional work mid-task -- finish current scope, file a new issue. |
| **Single-operator dependency.** SC is currently a one-person operation with no redundancy.                                                                | High       | High   | Accept this constraint for MVP. Founding client rate acknowledges early-stage limitations. Do not oversell capacity. Limit to 1 concurrent engagement until process is proven.                                                                                |

---

## Open Decisions / ADRs

These decisions must be resolved before or during development. Each is assigned a decision deadline relative to the phase that depends on it.

### ADR-001: Sprint Pricing

- **Decision needed:** Specific dollar amounts for each sprint type (Preflight, Build-to-Launch, Run + Decide, Scale Readiness)
- **Depends on:** Tier 1 launch (cannot launch without prices)
- **Deadline:** Before first outreach
- **Options:** (a) Fixed per-sprint pricing, (b) Time-and-materials with cap, (c) Value-based pricing tied to outcomes
- **Recommendation:** Fixed per-sprint pricing for simplicity. Founding rate of $2,500 for any sprint type for the first 3-5 clients.

### ADR-002: Capacity and Priority Arbitration

- **Decision needed:** How many engagements can run in parallel with DFG work? If DFG needs urgent work AND a client needs attention, what wins?
- **Depends on:** First client acceptance
- **Deadline:** Before signing first client contract
- **Options:** (a) Client always wins, (b) DFG always wins, (c) Case-by-case with SLA-based rules
- **Recommendation:** Client-facing deadlines always win. Cap at 1 concurrent client engagement until DFG reaches steady state.

### ADR-003: Client Tooling Access

- **Decision needed:** Do clients see the factory? (Option A: Transparent, B: Sanitized, C: Graduated)
- **Depends on:** First client kickoff
- **Deadline:** Before first client kickoff call
- **Recommendation:** Start with Option B (sanitized). Weekly updates and deliverable docs only. Revisit after 3 completed engagements.

### ADR-004: Equity Option

- **Decision needed:** Does SC ever take equity instead of or in addition to cash?
- **Depends on:** Not blocking for MVP, but must be decided before it comes up in a client conversation
- **Deadline:** Before 5th client outreach
- **Recommendation:** No equity for MVP. Cash only. Equity introduces legal complexity and misaligns incentives with the "kill fast" methodology.

### ADR-005: Discovery Gate Enforcement Timing

- **Decision needed:** When does the Discovery Gate become a hard gate vs. advisory?
- **Depends on:** Phase 3 (Discovery Engine) and Phase 4 (Gate enforcement)
- **Deadline:** Before Phase 4 development begins
- **Current plan:** Phase 3 adds `discovery` status with no gate logic. Phase 4 adds enforcement. The `discovery_gate_exception` flag allows bypassing.
- **Recommendation:** Keep the phased approach. Do not enforce gates until there is enough data (at least 3 completed experiments) to calibrate what "good" discovery looks like.

### ADR-006: Archetype Migration for Existing Data

- **Decision needed:** How to handle active experiments with `interview` archetype during migration
- **Depends on:** Phase 1 (Schema Foundation)
- **Deadline:** Before Migration 0002 executes
- **Current plan:** Draft/preflight `interview` experiments migrate to `fake_door`. Active `interview` experiments get archived.
- **Risk:** If any active experiment is mid-sprint with `interview` archetype, archiving it disrupts the engagement.
- **Recommendation:** Audit all experiments before migration. If any active `interview` experiments exist, coordinate with the engagement owner before migrating.

---

## Phased Development Plan

### Phase 0: Business Foundation (Tier 1 -- "Accept First Paying Client")

**Goal:** Everything needed to accept money from the first client. No platform development; this is business infrastructure.

**In scope:**

- Lock pricing for all 4 sprint types
- Services page on siliconcrane.com (copy + layout)
- Intake form (Typeform/Tally with notification setup)
- Contract/SOW template (legal-enough to start work)
- Payment mechanism (Stripe product + checkout/invoice link)
- DFG case study draft (Hypothesis -> Test -> Data -> Decision -> Current State)
- Warm network outreach (first 20 targets)

**Not in scope:**

- Any console platform development
- Any schema migrations
- Any API changes
- FAQ page, process explainer, cold outreach templates (Tier 2/3)

**Exit criteria:** siliconcrane.com has a services page with prices, intake form captures submissions, Stripe can process a payment, SOW template is ready to send, DFG case study is published.

**Dependencies:** None. This is the starting point.

---

### Phase 1: Schema Foundation

**Goal:** Run Migration 0002 to lay the data model groundwork for all subsequent phases. No application code changes.

**In scope:**

- Execute all 4 migration steps (add columns, data migration, CHECK constraint recreation, verification)
- 10 new columns on `experiments` table (6 artifact, 4 supporting)
- 1 new column on `decision_memos` table (`decision_detail`)
- 4 new tables (`interviews`, `ventures`, `threshold_registry`, `venture_benchmarks`)
- Updated CHECK constraints (`archetype`: replace `interview` with `fake_door`; `status`: add `discovery`)
- Verification queries in local, preview, and production

**Not in scope:**

- Any API endpoint changes
- Any frontend changes
- Any write invariant enforcement
- Ventures CRUD API (deferred to Phase 5)

**Exit criteria:** Migration 0002 passes all Step 4 verification queries in all 3 environments. Zero `interview` archetype rows remain. Row counts preserved. Triggers fire correctly. Existing experiments continue to work via existing API.

**Dependencies:** ADR-006 resolved (audit existing `interview` experiments before migration).

---

### Phase 2: Hypothesis Card

**Goal:** Experiments gain structured hypothesis definition via the Hypothesis Card artifact.

**In scope:**

- `hypothesis_card` column read/write via `PATCH /experiments/:id`
- Distill Brief write invariant: reject direct updates to `problem_statement`, `target_audience`, `value_proposition`, `market_size_estimate` when `hypothesis_card` is non-null
- Auto-extraction of projections on `hypothesis_card` write
- Confidence score validation (`proceed` / `uncertain` / `abandon`)
- `abandon` confidence triggers archive recommendation (advisory only, not enforced)

**Not in scope:**

- AI agent scaffolding for hypothesis generation (advisory mention in spec, not a Phase 2 deliverable)
- Key Assumptions bridge to kill_criteria (Phase 4)
- Ventures CRUD (Phase 5)

**Exit criteria:** Creating an experiment with a `hypothesis_card` auto-populates Distill Brief columns. Directly updating Distill Brief columns on an experiment with a `hypothesis_card` returns a 400 error with a clear message. Experiments without `hypothesis_card` continue to work as before.

**Dependencies:** Phase 1 complete.

---

### Phase 3: Discovery Engine

**Goal:** Experiments can enter a `discovery` phase with recorded interviews and a gate evaluation.

**In scope:**

- `interviews` table CRUD (`POST /experiments/:id/interviews`, query by experiment)
- `discovery_summary` column read/write
- Discovery API endpoints: `/discovery/start`, `/discovery/summary`, `/discovery/finalize`, `/discovery/gate`
- `discovery` added to `VALID_STATUS_TRANSITIONS`
- Basic Discovery Gate logic (6 checks: minimum interviews, pain severity, peak dimension, problem confirmed, assumption evidence, saturation)
- Mode-weighted counting (`ai * 0.5 + hybrid * 0.75 + human * 1.0`)
- Discovery event types in `event_log`

**Not in scope:**

- Discovery Gate enforcement on status transitions (Phase 4)
- R2 transcript storage (infrastructure addition deferred; use `transcript_ref` as placeholder)

**Exit criteria:** An experiment can transition `preflight -> discovery`. Interviews can be recorded against it. Discovery gate endpoint returns a structured evaluation with 6 checks. Discovery summary can be finalized.

**Dependencies:** Phase 1 complete (tables exist). Phase 2 recommended but not strictly required.

---

### Phases 4-7: Deferred (Post-MVP)

The following phases are defined in the functional spec but are explicitly out of MVP scope. They are listed here for roadmap visibility only.

| Phase | Name                               | Key Deliverables                                                                                                                                  | Dependency |
| ----- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 4     | Test Blueprint + Validation Ladder | `test_blueprint` read/write, archetype defaults, Discovery Gate enforcement, Hard/Soft Kill severity                                              | Phase 3    |
| 5     | Campaign Factory                   | `campaign_package` read/write, CampaignPackage write invariant, Ventures CRUD API, Cloudflare Queue async pipeline, R2 asset storage              | Phase 4    |
| 6     | The Launchpad                      | `page_config` read/write, archetype-aware template router, SignalCapture component, A/B variant support, preview mode                             | Phase 5    |
| 7     | The Verdict                        | `validation_report` read/write, `decision_detail`, measurement endpoints, Bayesian confidence, threshold registry population, PII purge extension | Phase 6    |

**Milestone A (v2.0-alpha):** Phases 1-3 complete. Target: 2-3 weeks after Phase 0.
**Milestone B (v2.0-beta):** Phases 4-7 complete. Target: incremental after Milestone A.

---

## Appendix: Scope Boundary Enforcement

To prevent scope creep, the following rules apply:

1. **A feature lives in exactly one phase.** No "partially in Phase 2, completed in Phase 3" allowances. If it spans phases, split it into discrete deliverables and assign each to one phase.

2. **Phase 0 has no platform development.** It is pure business infrastructure. The temptation to "just add one endpoint" is the enemy.

3. **Discover additional work mid-task -- finish current scope, file a new issue.** This is a project instruction and it is binding.

4. **All changes through PRs.** Never push directly to main. Branch, PR, CI, QA, merge. This applies to documentation, schema changes, and code equally.

5. **MVP scope is Phase 0 (business foundation) plus Milestone A (Phases 1-3).** Everything in Phases 4-7 is explicitly deferred and requires a separate planning cycle before development begins.
