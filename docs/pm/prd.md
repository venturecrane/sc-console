# Silicon Crane -- Product Requirements Document

> Synthesized from 1-round, 6-role PRD review process. Generated 2026-03-02.

## Table of Contents

1. Executive Summary
2. Product Vision & Identity
3. Target Users & Personas
4. Core Problem
5. Product Principles
6. Competitive Positioning
7. MVP User Journey
8. MVP Feature Specifications
9. Information Architecture
10. Architecture & Technical Design
11. Proposed Data Model
12. API Surface
13. Non-Functional Requirements
14. Platform-Specific Design Constraints
15. Success Metrics & Kill Criteria
16. Risks & Mitigations
17. Open Decisions / ADRs
18. Phased Development Plan
19. Glossary
    Appendix: Unresolved Issues

---

## 1. Executive Summary

Entrepreneurs burn months of runway and tens of thousands of dollars building products before discovering their ideas do not work. There is no productized, evidence-based service that provides a fast, structured validation outcome a founder can act on.

Silicon Crane (SC) is a Validation-as-a-Service (VaaS) offering that runs structured sprints -- Preflight, Build-to-Launch, Run + Decide, and Scale Readiness -- to produce a clear GO/NO-GO signal backed by real market data. SC Console is the internal platform that powers these sprints: it manages experiments end-to-end from hypothesis definition through market testing to evidence-based verdicts.

Founders get a defensible validation outcome in 2-3 weeks for a fraction of the cost of building blindly. SC gets a repeatable, methodology-driven delivery model that scales across ventures and clients. The console codifies the entire validation artifact chain -- Hypothesis Card through Validation Report -- so that every sprint is traceable, every decision is evidence-backed, and every learning compounds into better calibration over time.

The MVP scope is Phase 0 (business foundation: pricing, services page, intake form, contract template, payment mechanism, DFG case study) plus Milestone A (Phases 1-3: schema foundation, Hypothesis Card, Discovery Engine). Phase 0 contains zero platform development -- it is pure business infrastructure required to accept the first paying client.

---

## 2. Product Vision & Identity

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

> **Target Customer Validation:** "Is SC Console a product I log into? Or is it the internal tooling the SC team uses to run my sprint?" The answer must be unambiguous in all client-facing materials: SC Console is internal tooling. Clients receive deliverables -- weekly updates, validation reports, decision memos -- not platform access. This aligns with the sanitized delivery model (Option B) where clients see deliverable documents, not GitHub issues or the Command Center.

---

## 3. Target Users & Personas

### Persona 1: Marcus Chen -- The Technical Founder with Too Many Ideas

Marcus is a 34-year-old senior software engineer at a mid-size fintech company. He has been building side projects for six years, shipping three to production, and watching all three flatline after launch. His GitHub is full of well-architected codebases that nobody uses.

**Frustration:** Marcus builds first and validates never. He spent four months and $3,200 on AWS costs building a full product for his last idea before discovering that his target customers already had a "good enough" spreadsheet workflow. He knows he should validate before building but does not have a framework, the marketing skills, or the patience to run a proper demand test.

**Goal:** Someone to tell him, with evidence, whether his current idea is worth building. A GO/NO-GO signal he can trust, delivered fast enough that he does not lose momentum. He is willing to pay $2,500 if it saves him from burning another $10K+ and six months on the wrong idea.

**Relationship to SC:** Prototypical Preflight + Build-to-Launch client. Arrives with a specific idea, can articulate the problem, is ready to define kill criteria. He is the "Good Fit" profile: has a specific idea, willing to define kill criteria upfront, can make decisions quickly, budget aligned.

**Landing page behavior:** Reads the entire page. Cares about the process ("How does this work?"), not the emotional pitch. Wants to see a case study with real metrics. Converts on `waitlist` or `priced_waitlist` archetypes after 2-3 minutes of reading.

### Persona 2: Priya Kapoor -- The Non-Technical Domain Expert

Priya is a 41-year-old operations director at a regional healthcare staffing agency. She has spent 15 years watching her industry solve scheduling, credentialing, and compliance problems with Excel spreadsheets and phone calls. She believes a purpose-built tool could save agencies like hers 20+ hours per week, but she does not know how to build software.

**Frustration:** Two dev shops have quoted her $80K and 4-6 months for an MVP. She does not know if the problem is big enough to justify that investment, or if the nurses and schedulers she imagines as users would actually adopt a new tool.

**Goal:** Know if her idea has legs before she risks her savings or seeks outside investment. She wants someone who will do the validation work -- run the interviews, build the test page, measure the demand -- because she does not have the technical skills or the time to learn growth hacking while running a full-time job.

**Relationship to SC:** Ideal full-stack engagement client: Preflight through Run + Decide. Needs the most hand-holding during intake and scoping, but once the sprint starts, she is a responsive decision-maker. Maps to the "Non-technical people with domain expertise + idea" target segment.

**Landing page behavior:** Scans, does not read. Needs the headline and subheadline to immediately tell her this is for people like her (domain experts, not developers). Will not tolerate jargon ("archetypes," "kill criteria," "conversion rate"). Converts on `concierge` or `service_pilot` archetypes after confirming SC does the work, not just advises.

### Persona 3: Jordan Reeves -- The Repeat Founder Validating a Pivot

Jordan is a 29-year-old founder who shut down their first startup (a D2C subscription box) after 18 months and $140K burned. They are now sitting on two new ideas and dwindling personal savings. They have founder scars: they know what it feels like to build the wrong thing.

**Frustration:** Jordan knows how to validate -- they have read The Mom Test, run Facebook ads, built landing pages on Carrd. But they are exhausted and do not trust their own judgment anymore. They want external objectivity and a structured process with predefined kill criteria so that their emotional attachment cannot override the data.

**Goal:** Run two cheap, fast validation tests on two ideas and kill the loser within two weeks. They want evidence they can show a potential co-founder or angel investor. They value speed above all else.

**Relationship to SC:** Most sophisticated buyer. Understands the methodology and will evaluate SC on execution speed, data quality, and the rigor of the decision framework. Likely a Preflight + Build-to-Launch client who may run two experiments in parallel.

**Landing page behavior:** Skips the hero section and scrolls directly to the case study, pricing, and process details. Evaluates the kill criteria methodology and wants to see real numbers. Converts fast on `presale` archetypes if the price is right.

---

## 4. Core Problem

> "I think about this idea every single day. I daydream about quitting my job to build it. And then I remember the [last] disaster and I do nothing. I've been stuck in this loop for eight months. I'm not making progress because I'm afraid of making the wrong kind of progress."

Entrepreneurs with viable business ideas are stuck between two bad options:

1. **Build blind.** Spend months and tens of thousands of dollars building a product before discovering whether anyone wants it. The average startup spends $250K and 18 months before realizing they built the wrong thing.

2. **Validate alone.** Attempt to validate using free tools, blog posts, and fragmented lean startup advice. Founders without marketing expertise get overwhelmed by the combination of decisions: What should the headline say? What is the right audience targeting? How much should I spend? What conversion rate means the idea is worth pursuing? Without frameworks for any of this, "just winging it" is how they end up thousands of dollars poorer with nothing to show for it.

The gap is that no productized service exists at an accessible price point that provides:

- **Structured hypothesis framing** (not just "tell me your idea")
- **Real market testing** (not AI-generated analysis reports)
- **Predefined kill criteria** (not post-hoc rationalization)
- **An evidence-backed GO/NO-GO verdict** (not "here's what you should do next")
- **Done-for-you execution** (not "here's a toolkit, good luck")

> **Target Customer Validation:** "I've looked at hiring a marketing agency to run some test campaigns, but the ones I've talked to want $5,000-10,000/month retainers and a 3-month commitment. They want to 'build my brand.' I don't have a brand. I have a hypothesis. They don't understand the difference."

---

## 5. Product Principles

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

## 6. Competitive Positioning

### Market Map

Silicon Crane operates at the intersection of three established markets: AI idea validation tools, design/innovation sprint agencies, and venture studios. No single competitor occupies the exact same niche -- "productized, done-for-you validation sprints with structured GO/NO-GO methodology at sub-$5K price points" -- but the adjacent categories exert real competitive pressure because they address the same buyer pain.

| Category                      | What They Sell                                                | Price Range               | SC Overlap |
| ----------------------------- | ------------------------------------------------------------- | ------------------------- | ---------- |
| AI Idea Validators            | Instant AI-generated reports on idea viability                | $0 - $59/report           | Low-medium |
| Lean Startup Platforms        | Software to manage experiments, canvases, customer interviews | $0 - $49/mo SaaS          | Low        |
| Market Experiment Platforms   | AI-assisted in-market testing (ad-based experiments)          | $2K - $18K/experiment set | High       |
| Design Sprint Agencies        | Facilitated 5-day to 8-week sprints for product/brand         | $15K - $250K+             | Medium     |
| MVP Dev Shops                 | Build prototype/MVP to spec                                   | $20K - $140K+             | Medium     |
| Venture Studios               | Build companies from scratch, take equity                     | $25K-$50K + equity        | Low-medium |
| Startup Consultants / Coaches | Advisory, mentorship, strategy                                | $150-$500/hr or retainers | Low        |

### Key Competitors

**Heatseeker.ai (HIGH threat):** AI-powered market experiment platform. Users define hypotheses, Heatseeker generates ad creatives and runs real paid experiments. At $16K-$18K for 6-8 experiments, they directly automate SC's "Run + Decide" phase. Heatseeker's weakness: it is a tool, not a partner -- no hypothesis sharpening, no kill criteria, no holistic GO/NO-GO call. SC's methodology chain is genuinely more comprehensive.

**DimeADozen.ai (MEDIUM threat):** AI-generated 40+ page validation reports for $59. Addresses the same initial impulse at a fraction of SC's cost. The threat is not quality -- it is price anchoring. A founder who pays $59 for a positive AI report may feel "validated enough" to skip SC entirely.

**IdeaProof.io (MEDIUM threat):** AI-powered validator with market intelligence from 50+ sources, including brand strategy and ad creative generation, for $9-$24/mo. Overlaps with SC's Campaign Factory but without real market testing or validated messaging.

**Design Sprint Agencies (MEDIUM threat):** Closest analog to SC's sprint model at 5-30x the price ($15K-$250K). The real threat is perceptual: founders searching for "validation sprint" will find design sprint agencies and may assume SC is a cheaper, lower-quality version.

### Where SC Genuinely Differs

1. **End-to-end methodology with decision framework.** No competitor in this price range offers a complete chain from hypothesis through evidence-based GO/NO-GO verdict. AI tools stop at analysis. Design sprint agencies stop at prototype testing. Heatseeker stops at experiment data.

2. **Kill criteria as a first-class concept.** SC is the only offering that makes kill criteria mandatory and structural. Every other tool or service is incentivized to keep the founder optimistic. SC's explicit "kill bad ideas fast" positioning is counter-positioned against the market.

3. **Price point for done-for-you service.** At the founding rate, SC undercuts design sprint agencies by 6-30x while offering comparable or greater depth.

4. **Practitioner credibility.** SC uses its own methodology for its own ventures (DFG case study). This is a legitimate differentiator that most AI tools and agencies cannot claim.

### Pricing Position

SC's founding client rate of $2,500 sits in a pricing gap: 50x more expensive than AI validation tools ($25-$59), 6-7x cheaper than Heatseeker or design sprint agencies ($15K-$18K). The sweet spot buyer segment is the "serious first-time founder" willing to spend $1K-$5K for a structured answer.

**Recommended positioning:** The $2,500 founding rate is a limited-time, named-client program with explicit conditions (case study rights, testimonial, feedback), not "the price." Future pricing should be visible as the standard rate to anchor expectations. Position SC's Preflight sprint explicitly against AI validation tools: "You got the AI report. Now let's find out if it's actually true."

### Uncomfortable Truths

These competitive weaknesses must be addressed, not ignored:

- **The AI tools are "good enough" for most buyers.** The total addressable market for SC is not "everyone with a startup idea" -- it is the smaller subset who understand that AI analysis is not real validation, have $2,500+, and are willing to accept a NO-GO answer.
- **The founding client rate creates a credibility trap.** $2,500 for a done-for-you sprint is extraordinarily cheap. Sophisticated buyers will ask how it is possible. The answer -- "solo operator subsidizing early clients for case studies" -- is honest but fragile.
- **Heatseeker is automating SC's highest-value phase.** As Heatseeker matures and drops in price, the technology layer of SC's offering becomes a commodity. SC's remaining moat is the human judgment layer.
- **No case studies, no social proof, no track record.** Every competitor has user counts, testimonials, or case studies. SC has zero completed client engagements. Prioritize the DFG case study above all other content work.
- **"Kill bad ideas fast" is a hard sell.** Founders want to hear "yes." Services that tell founders "no" do not get referrals from those founders.

---

## 7. MVP User Journey

This journey traces a new prospect from first encountering SC to receiving a GO/NO-GO decision. MVP scope only -- no client portal, no automated campaign generation, no discovery engine UI.

### Step 1: Discovery (External)

- **Trigger:** Prospect sees a LinkedIn post about SC's DFG case study, or receives a cold outreach email with the value prop: "Kill bad ideas in 2 weeks instead of 6 months."
- **Action:** Clicks link to siliconcrane.com.
- **Screen:** Homepage (`index.astro`).
- **Content consumed:** Hero headline, problem statement, service overview, "Why Silicon Crane" proof points.
- **Decision point:** "Is this for me?"

### Step 2: Services Exploration

- **Action:** Navigates to services page or "How It Works" section.
- **Screen:** `services.astro` or `#how-it-works` section.
- **Content consumed:** Sprint types (Preflight, Build-to-Launch, Run + Decide), deliverables, timeline, pricing.
- **Blocker (Tier 1):** Pricing must be locked. Services page must have specific prices and clear CTAs.
- **Decision point:** "What would I buy, and what does it cost?"

### Step 3: Trust Building

- **Action:** Prospect looks for proof that SC has done this before.
- **Screen:** Case study page.
- **Content consumed:** DFG case study: hypothesis, test, data, decision, current state.
- **Blocker (Tier 2):** DFG case study must be drafted with real metrics.
- **Decision point:** "Do they have the track record to execute?"

> **Target Customer Validation:** "A real case study with real numbers is the single most important piece of content for converting me. Show me you actually practice what you preach."

### Step 4: Intake

- **Action:** Clicks "Start Your Sprint" CTA or navigates to intake form.
- **Screen:** Intake form (Typeform/Tally).
- **Form fields:** Idea description, current stage, budget range, timeline preference, name, email, company.
- **Post-submission:** Confirmation with expected response time (24-48 hours).
- **Signal captured:** `POST /leads` with `custom_fields`.

### Step 5: Qualification (Internal)

- **Action:** SC operator reviews intake against qualification criteria.
- **Evaluation:** Has a specific idea? Can articulate the problem? Budget aligned? Can make decisions quickly?
- **Output:** GO (schedule scoping call) or NO-GO (decline with alternative resources).

### Step 6: Scoping Call

- **Action:** 30-minute call between prospect and SC operator.
- **Discussion:** Align on sprint type, define preliminary kill criteria, agree on timeline.
- **Output:** Draft SOW with sprint type, deliverables, timeline, price, kill criteria.

> **Target Customer Validation:** "I need a human conversation before I commit. If the qualification call is genuinely diagnostic -- 'here's why your idea is or isn't a good candidate for our sprints' -- that's incredibly valuable and builds trust."

### Step 7: Contract + Payment

- **Action:** Prospect reviews SOW, pays via Stripe.
- **Screen:** Stripe Checkout (hosted).
- **Post-payment:** Confirmation email and kickoff scheduling.

### Step 8: Sprint Execution (Opaque to Client)

- **Delivery model:** Option B (Sanitized) -- weekly email updates with progress summary. No client access to console.
- **Output:** Experiment landing page deployed, ad campaign live, data collecting.

### Step 9: Landing Page Live

- **Screen:** `/e/[slug]` -- experiment landing page rendered per archetype.
- **Visitors:** Target audience arrives from ads, interacts with form or payment CTA.
- **Signals captured:** `page_view`, `form_start`, `form_submit`, `payment_complete`.
- **Client role:** Passive. Receives weekly updates.

### Step 10: Decision Delivery

- **Deliverable:** GO/NO-GO recommendation document containing hypothesis tested, test methodology, data collected (conversion rate, cost per lead, total spend, time elapsed), decision recommendation, evidence, and next steps.
- **Format:** Clean, jargon-free report. The Bayesian confidence calculations and threshold registries power the recommendation but are not exposed to the client.

> **Target Customer Validation:** "I don't want to see 'Beta-Binomial model with Beta(1,1) prior.' I want to see: 'Here's what happened. Here's what it means. Here's our recommendation and the evidence behind it.'"

---

## 8. MVP Feature Specifications

### User Stories (Milestone A: Phases 1-3)

#### US-001: Run v2.0 Schema Migration

**As an** SC Operator, **I want** the database schema to be extended with all v2.0 columns and tables, **so that** the application can store Hypothesis Cards, Discovery Summaries, interview records, and supporting metadata without breaking existing experiments.

**Acceptance Criteria:**

- Given the current v1.2 schema is deployed, when Migration 0002 is executed, then 6 new artifact columns are added to `experiments`: `hypothesis_card`, `test_blueprint`, `discovery_summary`, `campaign_package`, `page_config`, `validation_report`
- Given the current v1.2 schema is deployed, when Migration 0002 is executed, then 4 new supporting columns are added to `experiments`: `venture_id`, `category`, `sequence_position`, `prior_test_ref`
- Given the current v1.2 schema is deployed, when Migration 0002 is executed, then 1 new column `decision_detail` is added to `decision_memos`
- Given the current v1.2 schema is deployed, when Migration 0002 is executed, then 4 new tables are created: `interviews`, `ventures`, `threshold_registry`, `venture_benchmarks`
- Given existing experiments with archetype `interview`, when Migration 0002 runs Step 2, then draft/preflight experiments are migrated to `fake_door` and active experiments are archived
- Given the migration completes Step 3 (table recreation), when I query for experiments, then the `archetype` CHECK constraint accepts `fake_door` and rejects `interview`
- Given the migration completes Step 3, when I query for experiments, then the `status` CHECK constraint accepts `discovery` as a valid status
- Given the migration is complete, when I query `SELECT COUNT(*) FROM experiments WHERE archetype = 'interview'`, then the result is 0
- Given the migration is complete, when I compare row counts to pre-migration, then the count is preserved (no data loss)
- Given the migration is complete, when I update any experiment's name, then the `updated_at` trigger fires and updates the timestamp
- Given all new columns are nullable, when I query existing experiments that lack v2.0 data, then all new columns return NULL and existing behavior is unchanged

**Business Rules:** All new columns are nullable; `interview` archetype replaced by `fake_door`; D1 does not enforce FKs by default; CHECK constraints require create-copy-drop-rename pattern.

---

#### US-002: Write a Hypothesis Card for an Experiment

**As an** SC Operator, **I want** to write a Structured Hypothesis Card to an experiment, **so that** I can capture the venture narrative fields and move the experiment through the validation workflow.

**Acceptance Criteria:**

- Given an experiment exists, when I send `PATCH /experiments/:id` with a valid `hypothesis_card` JSON body, then the `hypothesis_card` column is updated
- Given a Tier 1 (draft) Hypothesis Card, when I write it, then 6 required Tier 1 fields are present: `customer_segment`, `problem_statement`, `stakes_failure`, `stakes_success`, `solution_hypothesis`, `why_now`
- Given a Tier 2 (full) Hypothesis Card, when I write it, then 4 additional fields are accepted: `current_alternatives`, `market_sizing`, `competitive_landscape`, `key_assumptions`
- Given a Hypothesis Card with `confidence` set to `proceed`, `uncertain`, or `abandon`, then the value is accepted
- Given a Hypothesis Card with an invalid `confidence` value, then the API returns a 400 error
- Given a Hypothesis Card with `confidence` provided, then `confidence_rationale` must also be provided or the API returns a 400 error
- Given a Hypothesis Card with `key_assumptions`, then each assumption has `claim`, `evidence`, `risk` (high/medium/low), and `basis` fields; between 3 and 5 assumptions required
- Given a Hypothesis Card with `one_liner` exceeding 200 characters, then the API returns a 400 error

---

#### US-003: Enforce Distill Brief Write Invariant

**As an** SC Operator, **I want** the legacy Distill Brief fields to be auto-populated from the Hypothesis Card and protected from direct editing, **so that** data remains consistent between the card and the legacy columns.

**Acceptance Criteria:**

- When `hypothesis_card` is non-null, writing to it auto-populates: `target_audience` from `customer_segment`, `problem_statement` from `problem_statement`, `value_proposition` from `solution_hypothesis`, `market_size_estimate` from `market_sizing`
- When `hypothesis_card` is non-null, direct `PATCH` updates to any of the 4 Distill Brief columns return a 409 Conflict error with message: "Cannot update [field] directly when hypothesis_card is set. Update hypothesis_card instead."
- When `hypothesis_card` is null, direct updates to Distill Brief columns succeed (backward compatibility)
- When a Tier 1 card is written and `market_sizing` is null, `market_size_estimate` is set to null via projection

---

#### US-004: Read a Hypothesis Card from an Experiment

**As an** SC Operator, **I want** to retrieve the Hypothesis Card for an experiment, **so that** I can review the structured hypothesis and use it as input for discovery and test selection.

**Acceptance Criteria:**

- `GET /experiments/:id` returns the full `hypothesis_card` JSON object when present, or null when absent
- Tier 1 cards may have null Tier 2 fields; Tier 2 cards include all 10 fields plus `confidence`, `confidence_rationale`, and `tier`

---

#### US-005: Transition an Experiment to Discovery Status

**As an** SC Operator, **I want** to transition an experiment from `preflight` to `discovery` status, **so that** I can begin recording discovery interviews.

**Acceptance Criteria:**

- `preflight -> discovery` succeeds
- `draft -> discovery` returns 400 (invalid transition)
- `discovery -> build` allowed (gate enforcement deferred to Phase 4)
- `discovery -> archive` allowed (archive always allowed)
- `preflight -> build` allowed (gate exception path; enforcement deferred to Phase 4)
- Any transition not in the valid transitions table returns 400

---

#### US-006: Start a Discovery Sprint

**As an** SC Operator, **I want** to initialize a discovery sprint for an experiment, **so that** I can formally begin the discovery process.

**Acceptance Criteria:**

- `POST /experiments/:id/discovery/start` transitions experiment to `discovery` from `preflight`
- Returns 400 if experiment is in `draft` status
- Logs `discovery_sprint_started` event to `event_log`
- Returns 409 if sprint is already active

---

#### US-007: Record a Completed Interview

**As an** SC Operator, **I want** to record a completed interview against an experiment, **so that** the interview data contributes to the Discovery Summary.

**Acceptance Criteria:**

- `POST /experiments/:id/interviews` inserts a row into `interviews` when experiment is in `discovery` status
- Returns 400 if experiment is not in `discovery` status
- Validates `mode` (ai/hybrid/human), `protocols_covered` (non-empty array), `pain_scores` (1-5 per dimension, null allowed for insufficient data), `participant_id` (required, non-empty)
- Logs `interview_completed` event with structured event data
- Returns auto-generated `id` and `created_at`

---

#### US-008: Retrieve Discovery Summary

**As an** SC Operator, **I want** to retrieve the current Discovery Summary for an experiment, **so that** I can review aggregated interview findings and gate status.

**Acceptance Criteria:**

- `GET /experiments/:id/discovery/summary` returns the full Discovery Summary JSON, including `interview_count`, `weighted_interview_count` (computed from interviews table), and `stage` (draft/final)
- Returns 404 if no summary exists
- Mode-weighted count: ai _ 0.5, hybrid _ 0.75, human \* 1.0

---

#### US-009: Write a Discovery Summary

**As an** SC Operator, **I want** to write or update the Discovery Summary, **so that** I can record aggregated interview findings after analysis.

**Acceptance Criteria:**

- `PATCH /experiments/:id` with `discovery_summary` JSON updates the column
- Required fields: `experiment_id`, `interview_count`, `problem_confirmed`, `pain_severity`, `gate_status`, `stage`
- Pain severity dimensions must be between 1.0 and 5.0; composite requires all 3 dimensions
- Top quotes capped at 10 items
- Rejects updates to a summary with `stage: final`

---

#### US-010: Finalize a Discovery Summary

**As an** SC Operator, **I want** to lock a Discovery Summary to "final" stage, **so that** it becomes immutable input for test design.

**Acceptance Criteria:**

- `POST /experiments/:id/discovery/finalize` sets `stage` to `final`
- Returns 400 if already finalized or no summary exists
- Subsequent PATCH updates to `discovery_summary` are rejected
- Logs `discovery_summary_finalized` event

---

#### US-011: Evaluate the Discovery Gate

**As an** SC Operator, **I want** to evaluate the Discovery Gate, **so that** I can determine whether the experiment meets minimum discovery criteria.

**Acceptance Criteria:**

- `GET /experiments/:id/discovery/gate` evaluates 6 checks:
  1. **Minimum interviews:** Weighted count >= 5.0 (computed from interviews table)
  2. **Pain severity:** Composite >= 3.0
  3. **Peak dimension:** Any single dimension >= 4.0
  4. **Problem confirmed:** `discovery_summary.problem_confirmed` is true
  5. **Assumption evidence:** At least 1 assumption updated with evidence
  6. **Saturation:** `discovery_summary.saturation_reached` is true
- Checks 1, 4, and 5 are required. Checks 2 and 3 are OR'd. Check 6 is recommended but not blocking.
- Returns 400 if no discovery summary exists
- Logs `discovery_gate_evaluated` event
- Gate is advisory only in Phase 3; enforcement added in Phase 4

---

#### US-012: Query Interviews for an Experiment

**As an** SC Operator, **I want** to list all interviews recorded for an experiment.

**Acceptance Criteria:**

- Returns array of interview records ordered by `created_at` ascending
- Empty array for experiments with no interviews
- Each record includes all interview fields

---

#### US-013: Log Discovery Events to Event Log

**As an** SC Operator, **I want** discovery activities automatically logged for audit trail.

**Acceptance Criteria:**

- `discovery_sprint_started`, `interview_completed`, `interview_analyzed`, `discovery_summary_finalized`, `discovery_gate_evaluated` events logged with structured event data
- Events include experiment_id, correct timestamps, and relevant metadata

---

### Business Rules Summary

| ID     | Rule                                                                                                                                                                                                      |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-001 | All new v2.0 columns are nullable. Existing experiments unchanged.                                                                                                                                        |
| BR-002 | Archetype `interview` replaced by `fake_door`. Migration converts or archives existing records.                                                                                                           |
| BR-003 | `venture_id` is advisory, not enforced as FK until Phase 5.                                                                                                                                               |
| BR-004 | CHECK constraint changes require create-copy-drop-rename migration pattern.                                                                                                                               |
| BR-005 | Hypothesis Card has two tiers: Draft (6 fields) and Full (10 fields).                                                                                                                                     |
| BR-006 | Confidence enum: `proceed`, `uncertain`, `abandon` with required `confidence_rationale`.                                                                                                                  |
| BR-007 | `key_assumptions`: 3-5 items, each with claim, evidence, risk, basis.                                                                                                                                     |
| BR-008 | `one_liner` max 200 characters.                                                                                                                                                                           |
| BR-009 | When `hypothesis_card` is non-null, Distill Brief columns are read-only projections.                                                                                                                      |
| BR-010 | Projection mapping: `target_audience` from `customer_segment`, `problem_statement` from `problem_statement`, `value_proposition` from `solution_hypothesis`, `market_size_estimate` from `market_sizing`. |
| BR-011 | Status lifecycle: `draft -> preflight -> discovery -> build -> launch -> run -> decide -> archive`.                                                                                                       |
| BR-012 | Valid transitions include rollbacks and archive-from-anywhere.                                                                                                                                            |
| BR-013 | Phase 3: `discovery` status without gate enforcement. Phase 4: gate enforcement on `-> build`.                                                                                                            |
| BR-014 | Discovery sprint start requires `preflight` or `discovery` status.                                                                                                                                        |
| BR-015 | Interview `mode`: `ai`, `hybrid`, `human` (DB CHECK constraint).                                                                                                                                          |
| BR-016 | Each interview linked to exactly one experiment.                                                                                                                                                          |
| BR-017 | Valid protocols: `problem_discovery`, `solution_fit`, `willingness_to_pay`, `icp_validation`.                                                                                                             |
| BR-018 | Pain scores: functional, emotional, opportunity; each 1-5.                                                                                                                                                |
| BR-019 | Discovery Summary stages: `draft` (mutable) and `final` (immutable).                                                                                                                                      |
| BR-020 | Composite pain score: unweighted average of 3 dimensions, rounded to 1 decimal.                                                                                                                           |
| BR-021 | Top quotes capped at 10 items.                                                                                                                                                                            |
| BR-022 | Finalized summaries are immutable.                                                                                                                                                                        |
| BR-023 | Finalization logs event with interview_count, weighted_count, gate_passed.                                                                                                                                |
| BR-024 | Mode-weighted counting: ai=0.5x, hybrid=0.75x, human=1.0x.                                                                                                                                                |
| BR-025 | Minimum weighted interview count threshold: 5.0.                                                                                                                                                          |
| BR-026 | Pain threshold: composite >= 3.0 OR any peak dimension >= 4.0 (OR logic).                                                                                                                                 |
| BR-027 | Required gate checks: #1 (interviews), #4 (problem confirmed), #5 (assumption evidence).                                                                                                                  |
| BR-028 | Peak dimension rule: any dimension >= 4.0 meets pain threshold regardless of composite.                                                                                                                   |
| BR-029 | All discovery activities logged to `event_log`.                                                                                                                                                           |

### Edge Cases

| ID     | Description                                      | Resolution                                                                                                                                            |
| ------ | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| EC-001 | Migration with no `interview` experiments        | UPDATE affects zero rows; migration proceeds. Verification returns 0 as expected.                                                                     |
| EC-002 | Hypothesis Card without Discovery Summary        | Normal flow. Gate endpoint returns clear error.                                                                                                       |
| EC-003 | Discovery Summary without Hypothesis Card        | Accepted (backward compatibility). `hypothesis_card_version` set by client.                                                                           |
| EC-004 | Concurrent writes to Discovery Summary           | Last-write-wins (D1 default). Acceptable for single-operator MVP.                                                                                     |
| EC-005 | Pain score with insufficient data in a dimension | Dimension set to null. Composite requires all 3 dimensions; null dimension = null composite. Peak dimension check only evaluates non-null dimensions. |
| EC-006 | Finalized summary with status rollback           | Summary remains attached but may be stale. Addressed in Phase 4.                                                                                      |
| EC-007 | Interview recorded for archived experiment       | 400 error. Historical interviews retained.                                                                                                            |
| EC-008 | Gate evaluation with zero interviews             | All checks fail. `passed: false`.                                                                                                                     |
| EC-009 | Tier 1 card clears `market_size_estimate`        | Projection from null `market_sizing` overwrites existing value with null.                                                                             |
| EC-010 | Migration drops triggers and indexes             | Step 3 explicitly recreates them. Verified in Step 4.                                                                                                 |
| EC-011 | All-AI interviews                                | 10 AI interviews needed to reach 5.0 weighted count. By design.                                                                                       |
| EC-012 | Empty `assumption_updates`                       | Gate check #5 fails. At least 1 update with evidence required.                                                                                        |

---

## 9. Information Architecture

### Screen Inventory

#### Public Marketing Site (siliconcrane.com)

| Screen      | Path        | Status                        | Key Content                                                                         |
| ----------- | ----------- | ----------------------------- | ----------------------------------------------------------------------------------- |
| Homepage    | `/`         | Exists                        | Hero, problem statement, services grid, "Why SC" proof points, contact form, footer |
| Services    | `/services` | Exists (needs Tier 1 pricing) | Sprint type breakdown, per-sprint details, founding client offer, CTA to intake     |
| About       | `/about`    | Exists                        | Company background, methodology overview, team                                      |
| Case Study  | TBD         | Does not exist (Tier 2)       | DFG case study: hypothesis, test, data, decision, current state                     |
| Intake Form | TBD         | Does not exist (Tier 1)       | Structured form: idea, stage, budget, timeline, contact info                        |

#### Experiment Landing Pages (siliconcrane.com/e/[slug])

| Screen       | Path                  | Status                   | Key Content                                                  |
| ------------ | --------------------- | ------------------------ | ------------------------------------------------------------ |
| Landing Page | `/e/[slug]`           | Exists (single template) | Headline, subheadline, value props, lead form or payment CTA |
| Thank You    | `/e/[slug]/thank-you` | Exists                   | Confirmation, "what happens next"                            |
| Payment      | `/e/[slug]/payment`   | Exists                   | Stripe Checkout redirect                                     |

#### Admin Interface

| Screen     | Path     | Status                        | Key Content                                                                          |
| ---------- | -------- | ----------------------------- | ------------------------------------------------------------------------------------ |
| Coda Admin | External | Phase 1 (tech spec Section 9) | Experiment list, status controls, metrics import, lead list, decision/learning memos |

### Navigation Structure

**Primary navigation** (marketing pages): Homepage, Services, About, Case Study (Tier 2), Contact.

**Landing page navigation:** None. Experiment landing pages are standalone with no site navigation, no header links, no distractions. This is intentional: landing pages minimize exit paths to maximize conversion signal quality. The only navigation is the form CTA and the post-submission thank-you page.

**Footer navigation:** Privacy Policy, Venture Crane.

---

## 10. Architecture & Technical Design

### System Boundaries

```
                           siliconcrane.com
                         (Cloudflare Pages)
  +------------------------------------------------------+
  |                                                      |
  |  Static SSG Pages    SSR Landing Pages    Lead Forms |
  |  (marketing)         [slug].astro         (HTML+JS)  |
  |                                                      |
  +----------------------+-------------------------------+
                         | HTTPS (public + internal)
                         v
  +------------------------------------------------------+
  |                     sc-api                           |
  |               (Cloudflare Worker / Hono)             |
  |                                                      |
  |  Public:             Internal (X-SC-Key):            |
  |  POST /leads         GET/POST/PATCH /experiments     |
  |  POST /events        GET /experiments/:id/leads      |
  |  POST /contact       POST /metrics                   |
  |  GET /exp/by-slug/*  */decision_memos                |
  |  POST /pay/webhook   */learning_memos                |
  |                                                      |
  |  v2.0 MVP additions (Phase 3):                       |
  |  POST /experiments/:id/discovery/start               |
  |  POST /experiments/:id/interviews                    |
  |  GET  /experiments/:id/discovery/summary             |
  |  POST /experiments/:id/discovery/finalize            |
  |  GET  /experiments/:id/discovery/gate                |
  |                                                      |
  +-------+------------------+---------------------------+
          |                  |
          v                  v
    +----------+       +----------+
    |  sc-db   |       | sc-assets|
    |   (D1)   |       |   (R2)   |
    +----------+       +----------+

  +------------------------------------------------------+
  |                sc-maintenance                        |
  |          (Cloudflare Worker, cron 2AM UTC)           |
  |  - event_log.user_agent 90-day purge (existing)     |
  +------------------------------------------------------+
```

### Technology Stack

| Layer          | Technology                 | Responsibility                              |
| -------------- | -------------------------- | ------------------------------------------- |
| Frontend       | Astro 5 SSR + Tailwind CSS | Landing pages, lead forms, marketing        |
| API            | Cloudflare Worker (Hono)   | All business logic, validation, persistence |
| Database       | Cloudflare D1 (SQLite)     | Structured data, schema enforcement         |
| Object Storage | Cloudflare R2              | Creative assets, interview transcripts      |
| Scheduled Jobs | sc-maintenance Worker      | Data retention, PII anonymization           |

### Key Design Decisions

**Decision 1: All v2.0 artifact columns are TEXT (JSON), nullable.**
D1/SQLite does not support native JSON columns. Storing JSON as TEXT with application-layer validation follows the established v1.2 pattern (`copy_pack`, `creative_brief`, `kill_criteria`). Nullable columns ensure zero-downtime migration.

**Decision 2: Write invariant pattern over column deprecation.**
The Distill Brief columns are not dropped. When `hypothesis_card` is non-null, those 4 columns become read-only projections. This preserves backward compatibility with the existing Coda admin pack and any scripts that read Distill Brief fields directly.

**Decision 3: CHECK constraint migration via create-copy-drop-rename.**
SQLite/D1 cannot ALTER CHECK constraints. The `archetype` and `status` constraint changes require recreating the `experiments` table. This is the only supported approach in D1.

**Decision 4: No Cloudflare Queue in MVP.**
Campaign generation (Phase 5) and threshold recalculation (Phase 7) require Cloudflare Queue. These are explicitly out of MVP scope.

**Decision 5: `interviews` table uses R2 for transcript storage.**
Interview transcripts contain PII and can be large. The `transcript_ref` column stores an R2 key, not the transcript body.

---

## 11. Proposed Data Model

### New Columns on `experiments` Table

All new columns are TEXT (JSON) and nullable, added via D1 ALTER TABLE migration.

**Artifact Columns:**

| Column              | Type        | Source | Description                                                                     |
| ------------------- | ----------- | ------ | ------------------------------------------------------------------------------- |
| `hypothesis_card`   | TEXT (JSON) | DD#1   | Structured Hypothesis Card: 10 fields, confidence score, one-liner              |
| `test_blueprint`    | TEXT (JSON) | DD#2   | Test Blueprint: archetype, metrics/thresholds, kill criteria, decision criteria |
| `discovery_summary` | TEXT (JSON) | DD#3   | Discovery Summary: pain severity, interview data, gate status                   |
| `campaign_package`  | TEXT (JSON) | DD#4   | Campaign Package: copy, creative, targeting, budget, variants                   |
| `page_config`       | TEXT (JSON) | DD#5   | Landing page config overrides per archetype                                     |
| `validation_report` | TEXT (JSON) | DD#6   | Validation Report: metrics, evidence, confidence, verdict                       |

**Supporting Columns:**

| Column              | Type    | Description                                                         |
| ------------------- | ------- | ------------------------------------------------------------------- |
| `venture_id`        | TEXT    | FK to `ventures` table (advisory, not enforced until Phase 5)       |
| `category`          | TEXT    | CHECK: `demand_signal`, `willingness_to_pay`, `solution_validation` |
| `sequence_position` | INTEGER | Validation Ladder rung number (1-based)                             |
| `prior_test_ref`    | TEXT    | Self-reference to `experiments.id` for sequential tests             |

### New Column on `decision_memos` Table

```sql
ALTER TABLE decision_memos ADD COLUMN decision_detail TEXT;
```

### New Table: `interviews`

```sql
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
```

### New Table: `ventures`

```sql
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
```

Created in Phase 1 but CRUD API deferred to Phase 5.

### New Table: `threshold_registry`

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

Created in Phase 1 but not populated until Phase 7.

### New Table: `venture_benchmarks`

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

Created in Phase 1 but not populated until Phase 7.

### CHECK Constraint Recreation

The `experiments` table must be recreated via create-copy-drop-rename to update constraints:

**archetype:** `CHECK(archetype IN ('fake_door','waitlist','content_magnet','priced_waitlist','presale','concierge','service_pilot'))`

**status:** `CHECK(status IN ('draft','preflight','discovery','build','launch','run','decide','archive'))`

**category:** `CHECK(category IS NULL OR category IN ('demand_signal','willingness_to_pay','solution_validation'))`

Data migration runs before table recreation: draft/preflight `interview` experiments become `fake_door`; active `interview` experiments are archived.

### Status Transition Map v2.0

```
draft --> preflight --> discovery --> build --> launch --> run --> decide --> archive
                    \                 ^
                     \-> build ------/  (requires discovery_gate_exception in Phase 4)
```

| From      | To        | Condition                                                             |
| --------- | --------- | --------------------------------------------------------------------- |
| draft     | preflight | None                                                                  |
| draft     | archive   | None                                                                  |
| preflight | discovery | None                                                                  |
| preflight | build     | Phase 4: requires `discovery_gate_exception`. Phase 3: unconditional. |
| preflight | draft     | None (rollback)                                                       |
| preflight | archive   | None                                                                  |
| discovery | build     | Phase 4: requires gate pass. Phase 3: unconditional.                  |
| discovery | archive   | None                                                                  |
| build     | launch    | None                                                                  |
| build     | preflight | None (rollback)                                                       |
| build     | archive   | None                                                                  |
| launch    | run       | None                                                                  |
| launch    | archive   | None                                                                  |
| run       | decide    | None                                                                  |
| run       | archive   | None                                                                  |
| decide    | archive   | None                                                                  |

### Distill Brief Write Invariant

When `hypothesis_card` is non-null:

| Distill Brief Column   | Projected From                        | Behavior             |
| ---------------------- | ------------------------------------- | -------------------- |
| `target_audience`      | `hypothesis_card.customer_segment`    | Read-only projection |
| `problem_statement`    | `hypothesis_card.problem_statement`   | Read-only projection |
| `value_proposition`    | `hypothesis_card.solution_hypothesis` | Read-only projection |
| `market_size_estimate` | `hypothesis_card.market_sizing`       | Read-only projection |

Direct updates return `409 Conflict` with error code `WRITE_INVARIANT_VIOLATION`.

---

## 12. API Surface

All endpoints use the established v1.2 patterns: Hono router, JSON request/response, `X-Request-Id` header on all responses, consistent `ErrorResponse` / `SuccessResponse` shapes.

### Modified Endpoints (MVP)

#### POST /experiments

- Validate archetype against v2.0 enum: `fake_door | waitlist | content_magnet | priced_waitlist | presale | concierge | service_pilot`
- Accept optional `hypothesis_card`; auto-extract Distill Brief projections when provided
- Error codes: `INVALID_REQUEST` (400), `DUPLICATE_SLUG` (409)

#### PATCH /experiments/:id

- New updatable fields: `hypothesis_card`, `test_blueprint`, `discovery_summary`, `campaign_package`, `page_config`, `validation_report`, `venture_id`, `category`, `sequence_position`, `prior_test_ref`
- Enforce Distill Brief write invariant
- Add `discovery` to valid status transitions
- Error codes: `INVALID_STATUS_TRANSITION` (400), `EXPERIMENT_NOT_FOUND` (404), `WRITE_INVARIANT_VIOLATION` (409)

#### GET /experiments/by-slug/:slug (Public)

- Include `page_config` in sanitized response when non-null
- `hypothesis_card`, `discovery_summary`, `test_blueprint`, `campaign_package`, `validation_report` are NOT included (internal artifacts)

### New Discovery Endpoints (Phase 3)

| Method | Path                                  | Auth     | Description                                            |
| ------ | ------------------------------------- | -------- | ------------------------------------------------------ |
| POST   | `/experiments/:id/discovery/start`    | X-SC-Key | Initialize discovery sprint; transition to `discovery` |
| POST   | `/experiments/:id/interviews`         | X-SC-Key | Record completed interview                             |
| GET    | `/experiments/:id/discovery/summary`  | X-SC-Key | Retrieve Discovery Summary with weighted counts        |
| POST   | `/experiments/:id/discovery/finalize` | X-SC-Key | Lock summary to `final` stage                          |
| GET    | `/experiments/:id/discovery/gate`     | X-SC-Key | Evaluate 6 gate checks (advisory, not enforcing)       |

All new endpoints are internal (require `X-SC-Key`). No new public endpoints in MVP.

### API Response Patterns

**Discovery Start:**

```json
{
  "success": true,
  "data": {
    "experiment_id": "SC-2026-001",
    "status": "discovery",
    "discovery_summary": null
  }
}
```

**Interview Creation (201):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "experiment_id": "SC-2026-001",
    "participant_id": "P-001",
    "mode": "human",
    "protocols_covered": ["problem_discovery", "solution_fit"],
    "pain_scores": { "functional": 8, "emotional": 6, "opportunity": 7 },
    "new_themes_detected": 2,
    "created_at": 1740000000000
  }
}
```

**Gate Evaluation:**

```json
{
  "success": true,
  "data": {
    "experiment_id": "SC-2026-001",
    "gate_status": "pass",
    "checks": [
      {
        "name": "minimum_interviews",
        "status": "pass",
        "detail": "5 weighted interviews (threshold: 3)"
      },
      { "name": "pain_severity", "status": "pass", "detail": "Mean pain score 7.2 (threshold: 5)" },
      { "name": "peak_dimension", "status": "pass", "detail": "Functional pain is peak at 8.1" },
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
```

**Write Invariant Violation (409):**

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

---

## 13. Non-Functional Requirements

### Performance Budgets

| Metric                          | Target  | Measurement                 |
| ------------------------------- | ------- | --------------------------- |
| API response time (p50)         | < 50ms  | Cloudflare Worker analytics |
| API response time (p99)         | < 200ms | Cloudflare Worker analytics |
| D1 query time (single row)      | < 10ms  | D1 analytics dashboard      |
| D1 query time (list, paginated) | < 30ms  | D1 analytics dashboard      |
| Discovery gate evaluation       | < 100ms | Application-level timing    |
| Migration 0002 execution time   | < 30s   | Manual timing               |
| Landing page TTFB               | < 200ms | Cloudflare Speed analytics  |
| Landing page LCP                | < 2.5s  | Core Web Vitals             |

### Data Size Budgets

| Column                         | Max Payload Size | Enforcement                       |
| ------------------------------ | ---------------- | --------------------------------- |
| `hypothesis_card`              | 50 KB            | Application-layer JSON size check |
| `discovery_summary`            | 100 KB           | Application-layer JSON size check |
| `test_blueprint`               | 50 KB            | Application-layer JSON size check |
| `campaign_package`             | 200 KB           | Application-layer JSON size check |
| `page_config`                  | 100 KB           | Application-layer JSON size check |
| `validation_report`            | 200 KB           | Application-layer JSON size check |
| `interviews.signal_extraction` | 50 KB            | Application-layer JSON size check |

D1 has a 1 MB row size limit. Worst case with all JSON columns populated: ~750 KB per experiment row.

### Security Requirements

| Requirement                            | Implementation                                            | Status   |
| -------------------------------------- | --------------------------------------------------------- | -------- |
| All new endpoints behind X-SC-Key auth | Auth middleware allowlist (no additions to PUBLIC_ROUTES) | MVP      |
| Parameterized queries only             | `.bind()` on all D1 queries                               | MVP      |
| No PII in JSON artifact columns        | `participant_id` uses pseudonyms                          | MVP      |
| Interview transcript PII retention     | R2 objects, 90-day TTL                                    | MVP      |
| JSON payload validation                | Validate structure before INSERT/UPDATE                   | MVP      |
| No secrets in experiment data          | Stripe keys, API keys never in experiment columns         | Existing |
| CORS unchanged                         | Only `siliconcrane.com` in production                     | Existing |

### Scalability Targets (MVP)

| Metric                    | Target   | Rationale                      |
| ------------------------- | -------- | ------------------------------ |
| Concurrent experiments    | 50       | Far exceeds near-term need     |
| Interviews per experiment | 100      | Discovery typically needs 5-20 |
| Events per day            | 10,000   | Covers moderate ad traffic     |
| D1 database size          | < 500 MB | Within D1 free tier (5 GB)     |
| R2 storage                | < 1 GB   | Transcripts + creative assets  |

### Reliability

| Requirement         | Target                                 |
| ------------------- | -------------------------------------- |
| Worker uptime       | 99.9% (Cloudflare SLA)                 |
| Migration rollback  | Manual restore from D1 backup snapshot |
| Data loss tolerance | Zero                                   |

---

## 14. Platform-Specific Design Constraints

### Primary Platform: Mobile Web

Landing pages receive traffic primarily from paid social ads (Facebook, Instagram, TikTok, LinkedIn) where the majority of users are on mobile devices.

**Constraints:**

1. **Viewport:** All landing page content must be legible and interactive at 320px minimum width.
2. **Touch targets:** All interactive elements must meet 44x44px minimum (Apple HIG / WCAG 2.5.5). Form inputs at `py-2` may fall below minimum -- audit required.
3. **Form input sizing:** All form inputs must use `text-base` (16px) or larger to prevent iOS Safari auto-zoom.
4. **Scroll performance:** `scroll_depth` event listener must use `{ passive: true }`.
5. **Connection reliability:** `navigator.sendBeacon` for event tracking (survives page navigation). Form submissions via `fetch` with appropriate error messaging.
6. **Page weight:** Landing pages must load within 3 seconds on 3G. Astro's zero-JS-by-default architecture helps. Only client-side JS: form handling, signal capture, A/B variant assignment.
7. **Above the fold:** On mobile (375x667px), headline, subheadline, and primary CTA must be visible without scrolling. For `fake_door`, the entire conversion path (headline + email field + submit button) should be above the fold.

### Secondary Platform: Desktop Web

- Two-column layouts via `md:` Tailwind breakpoints where appropriate
- Maximum content width: `max-w-2xl` (current) appropriate for readability; consider `max-w-3xl` or `max-w-4xl` for pages with more sections
- Desktop users more likely to read long-form content; prioritize scannable formatting

### Accessibility (WCAG 2.1 Level AA)

| Requirement         | Standard                                                   | Current Status                                            |
| ------------------- | ---------------------------------------------------------- | --------------------------------------------------------- |
| Color contrast      | 4.5:1 normal text, 3:1 large text                          | Passes (verified)                                         |
| Keyboard navigation | All elements reachable via Tab/Enter/Escape                | Standard HTML forms -- passes                             |
| Form labels         | `<label>` with `for`/`id`, `required` attribute            | Correct                                                   |
| Semantic HTML       | One `<h1>`, proper hierarchy                               | Correct                                                   |
| Alt text            | Meaningful alt on images, `aria-hidden` on decorative SVGs | Needs fix: decorative SVG icons lack `aria-hidden="true"` |
| Screen reader       | `aria-live="polite"` on form messages                      | Needs fix: `#form-message` lacks `aria-live`              |
| Motion              | Respect `prefers-reduced-motion`                           | Implement with A/B variant transitions (Phase 6)          |
| Touch targets       | 44x44px minimum                                            | Submit button passes; form inputs need audit              |

**Immediate accessibility fixes (next PR touching templates):**

- Add `aria-hidden="true"` to decorative SVG checkmark icons
- Add `aria-live="polite"` to `#form-message` div
- Add `aria-busy="true"` and `aria-label="Submitting, please wait"` to submit button during loading

---

## 15. Success Metrics & Kill Criteria

### MVP Success Metrics (Phase 0 / Tier 1)

The MVP goal: **accept first paying client.**

| Metric                          | Target                      | Measurement             | Timeline                      |
| ------------------------------- | --------------------------- | ----------------------- | ----------------------------- |
| First paying client acquired    | 1 client                    | Stripe payment received | Within 4 weeks of site launch |
| Intake form submissions         | >= 5                        | Tally/Typeform count    | Within 4 weeks of site launch |
| Warm network outreach completed | 20 contacts reached         | Manual tracking         | Week 1 post-launch            |
| Services page live with pricing | Deployed                    | URL reachable           | End of Tier 1 sprint          |
| Payment mechanism functional    | Working                     | Test transaction        | End of Tier 1 sprint          |
| Contract/SOW template complete  | Signed template exists      | Document review         | End of Tier 1 sprint          |
| DFG case study drafted          | Published with real metrics | Content review          | End of Tier 1 sprint          |

### Platform Success Metrics (v2.0-alpha / Milestone A)

| Metric                                   | Target                                 | Measurement                         |
| ---------------------------------------- | -------------------------------------- | ----------------------------------- |
| Experiments progressed through lifecycle | >= 1 reaches `run`                     | D1 query                            |
| Hypothesis Cards populated               | 100% of new experiments                | `WHERE hypothesis_card IS NOT NULL` |
| Discovery interviews recorded            | >= 3 per experiment entering discovery | `interviews` count                  |
| Landing pages rendering per archetype    | All 7 render correctly                 | Manual QA                           |
| Signal capture operational               | `event_log` receiving events           | D1 query                            |
| Leads captured                           | >= 1 per launched experiment           | `leads` count                       |

### Kill Criteria for the SC Venture

| Kill Criterion                              | Threshold                                      | Evaluation Point        |
| ------------------------------------------- | ---------------------------------------------- | ----------------------- |
| Zero paying clients after warm outreach     | 0 conversions from 20 contacts                 | 6 weeks post-launch     |
| Zero qualified leads from intake            | 0 qualified from 10+ submissions               | 8 weeks post-launch     |
| Founding rate generates zero interest       | 0 expressions of interest                      | 6 weeks post-launch     |
| Capacity conflict kills delivery quality    | Missed client deadlines more than once         | First client engagement |
| Sprint delivery takes 2x estimated duration | Preflight > 10 days, Build-to-Launch > 20 days | First 2 engagements     |

---

## 16. Risks & Mitigations

### Business Risks

| Risk                                                                                              | Likelihood | Impact | Mitigation                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------- | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pricing not validated.** All sprint prices are TBD. Founding rate of $2,500 is a guess.         | High       | High   | Lock pricing before launch. Start with founding rate for first 3-5 clients. Use those engagements to calibrate real pricing. Do not launch without specific numbers.        |
| **Capacity conflict with DFG.** If DFG needs urgent work AND a client needs attention, what wins? | High       | High   | Define priority arbitration rules before first client. Recommendation: client-facing deadlines always win. Limit to 1 concurrent engagement until DFG reaches steady state. |
| **No case study at launch.** DFG case study may not have compelling metrics.                      | Medium     | Medium | Ship it even if modest. Frame as "Experiment #1" with transparency. Honesty about methodology is more compelling than inflated numbers.                                     |
| **Market positioning confusion.** Prospects confuse SC with agencies, accelerators, consultants.  | Medium     | Medium | Bake "What SC Is Not" into services page, FAQ, outreach. Lead with: "We use kill criteria, you get evidence."                                                               |
| **Single-operator dependency.** One-person operation with no redundancy.                          | High       | High   | Accept for MVP. Do not oversell capacity. Limit to 1 concurrent engagement until process is proven.                                                                         |

### Technical Risks

| Risk                                                                                                                                  | Severity | Likelihood | Mitigation                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Table recreation loses data during Migration 0002.** Create-copy-drop-rename could fail mid-execution.                              | Critical | Low        | Run on local D1 first. Backup before remote. Verify row counts. D1 batch execution provides rollback on partial failure.                              |
| **Existing `interview` archetype experiments in active states get archived.** Could interrupt live experiments.                       | High     | Low        | Query production for active `interview` experiments BEFORE migration. Coordinate with stakeholder if any exist in `launch` or `run`.                  |
| **JSON schema drift.** Hypothesis Card schema evolves but old records have stale versions.                                            | Medium   | Medium     | Include `version` field in all JSON schemas. Application code handles version migration on read.                                                      |
| **D1 row size limit (1 MB).** All JSON columns populated could approach limit.                                                        | Medium   | Low        | Enforce per-column size budgets. Log warnings at 80% threshold. Long term: move large payloads to R2.                                                 |
| **Mode-weighted counting produces non-intuitive results.** 6 AI interviews = 3.0 weighted, which may not represent genuine discovery. | Medium   | Medium     | Gate response includes both raw and weighted counts. Documentation clarifies AI-only is acceptable but lower confidence.                              |
| **Trigger cascade on table recreation.** Dropping `experiments` drops the trigger.                                                    | High     | Low        | Migration Step 3 includes trigger recreation. Verify in Step 4: `SELECT name FROM sqlite_master WHERE type = 'trigger' AND tbl_name = 'experiments'`. |
| **FK references break during recreation.** If `PRAGMA foreign_keys` is ON, dropping experiments would fail.                           | Medium   | Very Low   | Verify `PRAGMA foreign_keys` returns 0 before migration.                                                                                              |

### Execution Risks

| Risk                                                                                                                  | Likelihood | Impact | Mitigation                                                                                                                                            |
| --------------------------------------------------------------------------------------------------------------------- | ---------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **7-phase plan is too long.** Real value delivery delayed to late phases.                                             | High       | High   | Milestone A (Phases 1-3) is the checkpoint. If > 4 weeks, re-evaluate Phases 4-7. Phase 1 enables manual workflows even without UI.                   |
| **Scope creep from 61 recommendations.** Temptation to implement everything in each phase.                            | High       | Medium | Each phase has explicit boundaries. Feature in one phase, not "partially." Discover additional work mid-task -- finish current scope, file new issue. |
| **Console engineering is premature infrastructure.** Building $100K+ of tooling to support a service at zero clients. | Medium     | Medium | Phase 0 validates the service with manual processes. Console automation only proceeds after first paying client proves market demand.                 |

---

## 17. Open Decisions / ADRs

### ADR-001: Sprint Pricing

- **Status:** OPEN
- **Decision needed:** Specific dollar amounts for each sprint type
- **Deadline:** Before first outreach
- **Options:** (a) Fixed per-sprint, (b) Time-and-materials with cap, (c) Value-based
- **Recommendation:** Fixed per-sprint pricing for simplicity. Founding rate of $2,500 for any sprint type for first 3-5 clients. Consider packaging sprints as a bundle rather than forcing the client to choose.

> **Target Customer Validation:** "I don't want to choose between Preflight, Build-to-Launch, and Run + Decide. I want to say 'here's my idea, tell me if it's worth building' and have someone tell me which sprints I need. Package it for me. I'll pay more for simplicity."

### ADR-002: Capacity and Priority Arbitration

- **Status:** OPEN
- **Decision needed:** How many engagements can run in parallel with DFG work?
- **Deadline:** Before signing first client contract
- **Recommendation:** Client-facing deadlines always win. Cap at 1 concurrent engagement until DFG reaches steady state.

### ADR-003: Client Tooling Access

- **Status:** OPEN
- **Decision needed:** Do clients see the factory? (Option A: Transparent, B: Sanitized, C: Graduated)
- **Deadline:** Before first client kickoff
- **Recommendation:** Start with Option B (sanitized). Weekly updates and deliverable docs only. Revisit after 3 completed engagements.

### ADR-004: Equity Option

- **Status:** OPEN
- **Decision needed:** Does SC ever take equity?
- **Deadline:** Before 5th client outreach
- **Recommendation:** No equity for MVP. Cash only. Equity introduces legal complexity and misaligns incentives with "kill fast."

### ADR-005: Discovery Gate Enforcement Timing

- **Status:** DECIDED
- **Decision:** Phase 3 adds `discovery` status and gate evaluation. Phase 4 adds enforcement on `-> build` transitions. The `discovery_gate_exception` flag allows bypassing.
- **Rationale:** Decoupling evaluation from enforcement allows validating gate logic against real data before it becomes a hard blocker.

### ADR-006: Archetype Migration for Existing Data

- **Status:** OPEN
- **Decision needed:** How to handle active experiments with `interview` archetype
- **Deadline:** Before Migration 0002 executes
- **Current plan:** Draft/preflight migrate to `fake_door`; active experiments archived.
- **Action required:** Audit all experiments before migration. If any active `interview` experiments exist, coordinate before migrating.

### ADR-007: JSON Schema Validation Location (Technical)

- **Status:** PROPOSED
- **Options:** (A) Full JSON Schema validation (ajv), (B) Lightweight structural checks, (C) No validation
- **Recommendation:** Option B for MVP. Validate `version` field and top-level structure. All endpoints are internal (X-SC-Key), so callers are controlled.

### ADR-008: Discovery Summary Computation Strategy (Technical)

- **Status:** PROPOSED
- **Options:** (A) Compute on read, (B) Compute on write, (C) Explicit command
- **Recommendation:** Option B (compute on write). Interview volume is low. Recomputing after each insert ensures the summary is current and GET is a simple read.

### ADR-009: Interview Transcript R2 Key Convention (Technical)

- **Status:** PROPOSED
- **Recommendation:** `interviews/{experiment_id}/{participant_id}-{ISO_DATE}.txt`
- **Rationale:** Groups by experiment for easy bulk operations (90-day purge).

### ADR-010: Pre-Migration Backup Protocol (Technical)

- **Status:** PROPOSED
- **Recommendation:** Export via `wrangler d1 export` before each remote migration. Local first, then preview, then production. Keep export 7 days.

---

## 18. Phased Development Plan

### Phase 0: Business Foundation (Tier 1)

**Goal:** Everything needed to accept money from the first client. No platform development.

**In scope:**

- Lock pricing for all 4 sprint types
- Services page on siliconcrane.com (copy + layout + prices)
- Intake form (Typeform/Tally with notification setup)
- Contract/SOW template
- Payment mechanism (Stripe product + checkout/invoice)
- DFG case study draft
- Warm network outreach (first 20 targets)

**Not in scope:** Any console development, schema migrations, or API changes.

**Exit criteria:** Services page live with prices, intake form captures submissions, Stripe processes payment, SOW template ready, DFG case study published.

**Dependencies:** None.

---

### Phase 1: Schema Foundation

**Goal:** Run Migration 0002. No application code changes.

**In scope:**

- Execute all 4 migration steps
- 10 new columns on `experiments` (6 artifact, 4 supporting)
- 1 new column on `decision_memos`
- 4 new tables (`interviews`, `ventures`, `threshold_registry`, `venture_benchmarks`)
- Updated CHECK constraints
- Verification in local, preview, production

**Exit criteria:** All verification queries pass in all environments. Zero `interview` rows. Row counts preserved. Triggers fire.

**Dependencies:** ADR-006 resolved.

---

### Phase 2: Hypothesis Card

**Goal:** Experiments gain structured hypothesis definition.

**In scope:**

- `hypothesis_card` read/write via PATCH
- Distill Brief write invariant
- Auto-extraction of projections
- Confidence score validation
- `abandon` confidence -> archive recommendation (advisory)

**Exit criteria:** Creating experiment with `hypothesis_card` auto-populates Distill Brief. Direct Distill Brief updates on experiments with cards return 400. Experiments without cards work as before.

**Dependencies:** Phase 1 complete.

---

### Phase 3: Discovery Engine

**Goal:** Experiments can enter `discovery` with interviews and gate evaluation.

**In scope:**

- `interviews` CRUD
- `discovery_summary` read/write
- Discovery API endpoints (start, summary, finalize, gate)
- `discovery` status transitions
- Gate logic (6 checks, advisory only)
- Mode-weighted counting
- Discovery event types

**Exit criteria:** Experiment transitions `preflight -> discovery`. Interviews recorded. Gate returns structured evaluation. Summary finalizable.

**Dependencies:** Phase 1 complete. Phase 2 recommended.

---

### Phases 4-7: Post-MVP (Roadmap Visibility)

| Phase | Name                               | Key Deliverables                                                                                                    | Dependency |
| ----- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------- |
| 4     | Test Blueprint + Validation Ladder | `test_blueprint`, archetype defaults, gate enforcement, Hard/Soft Kill                                              | Phase 3    |
| 5     | Campaign Factory                   | `campaign_package`, CampaignPackage write invariant, Ventures CRUD, Cloudflare Queue, R2 assets                     | Phase 4    |
| 6     | The Launchpad                      | `page_config`, archetype-aware templates, SignalCapture, A/B variants, preview mode                                 | Phase 5    |
| 7     | The Verdict                        | `validation_report`, `decision_detail`, measurement endpoints, Bayesian confidence, threshold population, PII purge | Phase 6    |

**Milestone A (v2.0-alpha):** Phases 1-3 complete. Target: 2-3 weeks after Phase 0.
**Milestone B (v2.0-beta):** Phases 4-7 complete. Target: incremental after Milestone A.

### Scope Boundary Rules

1. A feature lives in exactly one phase. No "partially in Phase 2, completed in Phase 3."
2. Phase 0 has no platform development.
3. Discover additional work mid-task -- finish current scope, file a new issue.
4. All changes through PRs. Never push directly to main.
5. MVP scope is Phase 0 plus Milestone A. Phases 4-7 require a separate planning cycle.

---

## 19. Glossary

| Term                    | Definition                                                                                                                                                                                                                                |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Archetype**           | One of 7 experiment types: `fake_door`, `waitlist`, `content_magnet`, `priced_waitlist`, `presale`, `concierge`, `service_pilot`. Each archetype determines the landing page structure, signal capture events, and default kill criteria. |
| **Artifact Chain**      | The sequence of structured documents produced during a validation sprint: Hypothesis Card -> Discovery Summary -> Test Blueprint -> Campaign Package -> Live Experiment -> Validation Report.                                             |
| **CampaignPackage**     | JSON artifact containing generated campaign copy, creative brief, targeting parameters, budget allocation, channel variants, and A/B variants for an experiment.                                                                          |
| **D1**                  | Cloudflare's serverless SQLite database service. The persistence layer for SC Console.                                                                                                                                                    |
| **Decision Memo**       | A structured record of the GO/KILL/PIVOT decision for an experiment, including rationale, confidence, key metrics, and next steps.                                                                                                        |
| **Discovery Gate**      | A 6-check evaluation that determines whether an experiment has completed sufficient customer discovery to proceed to test design. Advisory in Phase 3, enforced in Phase 4.                                                               |
| **Discovery Summary**   | JSON artifact aggregating interview findings: pain severity, problem confirmation, ICP refinements, top quotes, assumption updates, and gate status.                                                                                      |
| **Distill Brief**       | The v1.2 experiment description fields: `target_audience`, `problem_statement`, `value_proposition`, `market_size_estimate`. Superseded by Hypothesis Card but retained as read-only projections for backward compatibility.              |
| **Fake Door**           | An experiment archetype that tests demand by presenting a product concept without a real product behind it. Replaced the `interview` archetype in v2.0.                                                                                   |
| **GO/NO-GO**            | The binary outcome of a validation sprint: proceed (GO), kill (NO-GO), or pivot. Every engagement must produce this signal with evidence.                                                                                                 |
| **Hono**                | Lightweight web framework used for the sc-api Cloudflare Worker.                                                                                                                                                                          |
| **Hypothesis Card**     | JSON artifact capturing the structured venture narrative: customer segment, problem, stakes, solution, why-now, confidence, and key assumptions. Two tiers: Draft (6 fields) and Full (10 fields).                                        |
| **Kill Criteria**       | Predefined thresholds that, if breached, trigger a KILL recommendation. Defined before launch, not after. Hard kills are non-negotiable; soft kills are advisory.                                                                         |
| **Learning Memo**       | A structured record of lessons learned during or after an experiment, regardless of outcome.                                                                                                                                              |
| **Mode-Weighted Count** | The adjusted interview count where AI interviews count as 0.5, hybrid as 0.75, and human as 1.0. Used for Discovery Gate minimum threshold.                                                                                               |
| **R2**                  | Cloudflare's object storage service (S3-compatible). Used for creative assets and interview transcripts.                                                                                                                                  |
| **SignalCapture**       | Client-side Astro component for tracking visitor behavior on landing pages. Uses `navigator.sendBeacon` for reliability.                                                                                                                  |
| **Sprint**              | A time-boxed validation engagement: Preflight (3-5 days), Build-to-Launch (7-10 days), Run + Decide (14-21 days), Scale Readiness (follow-on).                                                                                            |
| **Test Blueprint**      | JSON artifact specifying the experiment design: archetype selection, metrics, thresholds, kill criteria, buildability assessment, and decision criteria.                                                                                  |
| **Validation Report**   | JSON artifact produced at experiment conclusion: metrics summary, evidence table, data quality assessment, trend analysis, confidence calculation, and recommended verdict.                                                               |
| **VaaS**                | Validation-as-a-Service. Silicon Crane's service model.                                                                                                                                                                                   |
| **Venture**             | A business idea or project being validated through SC. Each venture has experiments, a brand profile, and a position in the artifact chain.                                                                                               |
| **Write Invariant**     | A data consistency rule where, when a newer artifact column is populated, older columns that overlap with it become read-only projections auto-extracted from the newer column.                                                           |
| **X-SC-Key**            | The API authentication header used for all internal (non-public) sc-api endpoints.                                                                                                                                                        |

---

## Appendix: Unresolved Issues

Issues collected from all 6 role contributions. Since only 1 review round was conducted, most items are first-pass observations rather than cross-round disputes.

| ID     | Source             | Issue                                                                                                                                                     | Recommended Resolution                                                                                                                                                |
| ------ | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI-001 | Business Analyst   | Should the gate evaluation endpoint compute weighted interview count from the `interviews` table or read the pre-computed value from `discovery_summary`? | Compute from interviews table. The summary's count is a snapshot, not authoritative for gate evaluation.                                                              |
| UI-002 | Business Analyst   | What happens to a Discovery Summary when a new interview is recorded after the summary has been written?                                                  | Phase 3: manual re-write by operator or AI agent. Auto-aggregation is Phase 4+.                                                                                       |
| UI-003 | Business Analyst   | Should composite pain score require all 3 dimensions or average available dimensions?                                                                     | Require all 3. If any dimension is null, composite is null. Pain threshold met only via peak dimension check.                                                         |
| UI-004 | Business Analyst   | Should `POST /interviews` accept null pain score dimensions for "insufficient data"?                                                                      | Yes. Accept null per dimension. Keep 1-5 range for non-null values.                                                                                                   |
| UI-005 | Business Analyst   | Which is the canonical write path for Discovery Summary: PATCH or dedicated endpoint?                                                                     | Use `PATCH /experiments/:id` with `discovery_summary`. The `/discovery/finalize` POST is the only endpoint modifying stage.                                           |
| UI-006 | Business Analyst   | Should Hypothesis Card validation be strict or lenient for partial cards?                                                                                 | Strict per tier. Draft requires all 6 Tier 1 fields. Full requires all 10 plus confidence.                                                                            |
| UI-007 | Business Analyst   | Should CampaignPackage write invariant be implemented in Phase 2 or Phase 5?                                                                              | Phase 5. The invariant only matters when `campaign_package` is populated.                                                                                             |
| UI-008 | Target Customer    | AI-conducted discovery interviews may produce misleading data for non-tech-savvy target markets.                                                          | Interview mode selection must match target customer comfort. For non-digital demographics, human or hybrid mode should be required. Document mode selection guidance. |
| UI-009 | Target Customer    | Client needs lead data exported before 90-day PII purge on archived experiments.                                                                          | Make lead export an explicit step in the decision delivery process. Include lead list in GO verdict deliverables.                                                     |
| UI-010 | Target Customer    | Sprint types are confusing as separate products; clients want packaged recommendations.                                                                   | Consider a guided intake that recommends sprint type(s) based on idea stage and budget. Package bundles for simplicity.                                               |
| UI-011 | Target Customer    | "Build-to-Launch" sprint description blurs line with dev shop. Clients need clarity on what "build" means in validation context.                          | Clarify: "build" means landing page + tracking + signal capture, not a functional product. Update services page copy.                                                 |
| UI-012 | Target Customer    | Sample deliverable (Validation Report / Decision Memo) needed for trust building.                                                                         | Create anonymized sample from DFG engagement. Publish alongside case study.                                                                                           |
| UI-013 | UX Lead            | No signal capture on current landing pages. `event_log` receives zero landing-page-side events.                                                           | Prioritize SignalCapture component ahead of archetype-specific templates.                                                                                             |
| UI-014 | UX Lead            | Thank-you page is generic across all archetypes.                                                                                                          | Ship archetype-specific variants alongside template router (Phase 6).                                                                                                 |
| UI-015 | UX Lead            | No intake form exists (Tier 1 blocker).                                                                                                                   | Build before any func spec v2.0 implementation.                                                                                                                       |
| UI-016 | UX Lead            | Accessibility debt: decorative SVGs lack `aria-hidden`, form messages lack `aria-live`, loading states not announced to screen readers.                   | Fix in next PR touching templates.                                                                                                                                    |
| UI-017 | Competitor Analyst | SC Console engineering may be premature for zero-client stage.                                                                                            | Phase 0 validates service manually. Console work proceeds only after service demand is proven.                                                                        |
| UI-018 | Competitor Analyst | "Kill bad ideas fast" is commercially difficult positioning. Founders want "yes."                                                                         | Balance messaging: lead with "find out what works" rather than "find out what doesn't." Kill criteria framing should emphasize capital protection, not negativity.    |

<!-- Synthesis: 19 sections, 11520 words, 18 unresolved issues, 1 rounds -->
