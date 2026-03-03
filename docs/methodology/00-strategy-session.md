# SC Validation Methodology — Strategy Session (March 2026)

> **Source:** Notion page `316786f4-e365-811a-8de3-cc396c256a72`
> **Document Type:** Strategy Session Summary
> **Date:** March 1, 2026
> **Participants:** Captain + Advisor
> **Status:** Active — Deep dives pending

---

## Context

Silicon Crane is being rethought from first principles. The existing functional spec (v1.0) was built on assumptions that haven't been tested with real campaigns. As Ventracrane migrates off WordPress onto the venture-grade stack (Cloudflare Workers, D1, Astro), this is the right moment to revisit the validation methodology itself before rebuilding the tooling.

The core question: **What does it actually mean to validate a business idea in a meaningful way?**

Silicon Crane serves two purposes: first, as Ventracrane's own internal validation engine for portfolio ventures; second, as a potential public product (Validation-as-a-Service) offered to other entrepreneurs. Everything built internally should be architected with eventual productization in mind.

## Methodology Foundation

The Lean Startup methodology remains the north star. The three validation pillars are:

1. **Problem is real** — Do customers actually have this problem and care about solving it?
2. **Customers will pay** — Is there willingness to exchange money for a solution?
3. **Buildability** — Can we create a sustainable solution at reasonable cost?

Customer interviews should come first because they validate the problem space before money is spent on campaigns. However, in practice, lightweight customer discovery and messaging tests can run in parallel — ads tell you _what_ resonates, interviews tell you _why_ it resonates.

## Validation Workflow (End-to-End)

The complete validation cycle from idea to kill/pivot/accelerate decision:

### Step 1: Idea Capture

Someone at Ventracrane has a raw idea — a problem they've noticed, a market opportunity, something they think customers need. At this stage it's messy and half-baked. The idea gets captured and fed into the story-based framework (see Deep Dive #1) which articulates the customer problem, the stakes, and a potential solution. AI agents can automate the evolution of a raw idea into structured hypothesis components.

**Output:** Structured Hypothesis Card — see Artifact Map

### Step 2: Customer Discovery Interviews

The story-structured hypothesis gets tested against real potential customers. The goal is to validate whether the problem is actually real and whether people care about solving it. This is a known bottleneck for a solopreneur — scaling interviews without losing signal quality is critical (see Deep Dive #3).

**Output:** Discovery Summary — see Artifact Map

### Step 3: Test Type Selection

Before running campaigns, determine which type of test applies to the hypothesis. Different ideas need different test types: problem awareness, solution fit, pricing sensitivity, market size. The test type definition includes the landing page template, signal capture mechanism, success metrics, and pass/pivot/kill thresholds — the complete test blueprint (see Deep Dive #2).

**Output:** Test Blueprint — see Artifact Map

### Step 4: Marketing Content & Campaign Production

Using what was learned from interviews, craft messaging around the validated problem using the story framework. Generate creative assets (images, copy, video) and launch lightweight social media campaigns in the $300-500 range to measure intent signals (see Deep Dive #4).

**Output:** Campaign Package — see Artifact Map

### Step 5: Landing Page & Signal Capture

Campaigns drive traffic to landing pages that match the test type. Landing pages offer various engagement levels: join a waitlist, view pricing, commit to purchase, etc. The landing pages must align with test types and leverage marketing assets from the campaigns (see Deep Dive #5).

**Output:** Live Experiment — see Artifact Map

### Step 6: Measurement & Decision

Results are measured against the metrics defined in the test type. The test definition itself includes pass/pivot/kill thresholds. A report is generated — internally for Ventracrane use, or delivered to the customer if offered as VaaS (see Deep Dive #6).

**Output:** Validation Report — see Artifact Map

### Step 7: Decision Outcomes

The validation data is evaluated against the Decision Framework (see below) to reach one of four verdicts:

- **Kill** — No viable demand. Archive and move on. The venture dies.
- **Pivot** — Partial signal. Route through the Pivot Routing Table to the appropriate re-entry point.
- **Accelerate (GO)** — Validated demand. Move into actual product development and go-to-market.
- **Invalid** — Inconclusive data (insufficient sample size, data quality issues). Re-run or redesign the test.

**Output:** Decision Memo — see Artifact Map

---

## Artifact Map

Each step in the validation workflow produces a defined artifact that feeds the next step.

| Step                   | Input                                            | Output Artifact                                                                                                                                                                        |
| ---------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Idea Capture        | Raw Idea Brief                                   | **Structured Hypothesis Card** — customer, problem, stakes, solution, why-now, market sizing / competitive context (via story framework)                                               |
| 2. Customer Discovery  | Hypothesis Card                                  | **Discovery Summary** — problem confirmed Y/N, pain severity 1-5, WTP signal, ICP refinements, top quotes, interview count                                                             |
| 3. Test Type Selection | Discovery Summary + Hypothesis Card              | **Test Blueprint** — archetype, metrics + thresholds, landing page template, signal capture mechanism, budget, kill criteria, feasibility rating, build cost estimate, technical risks |
| 4. Marketing Content   | Test Blueprint + Hypothesis Card                 | **Campaign Package** — ad copy variants, creative assets, targeting spec, channel selection                                                                                            |
| 5. Landing Page        | Test Blueprint + Campaign Package                | **Live Experiment** — deployed page, tracking verified, signals capturing                                                                                                              |
| 6. Measurement         | Live Experiment data + Test Blueprint thresholds | **Validation Report** — metrics vs thresholds, evidence table, sample size verification                                                                                                |
| 7. Decision            | Validation Report                                | **Decision Memo** — GO / KILL / PIVOT / INVALID verdict + rationale                                                                                                                    |

**Design notes:**

- **Discovery Summary** is the bridging artifact that solves the Step 2 → Step 3 gap — it gives test selection concrete data to work from rather than relying on the original hypothesis alone.
- **Hypothesis Card** persists as a reference through Steps 2-4 (not consumed and discarded at Step 1).
- **INVALID** is added as a 4th decision outcome, matching FR-1502 in the functional spec.
- **Buildability** is addressed as fields in the Test Blueprint (feasibility rating, build cost estimate, technical risks) rather than adding a separate step.
- **Market sizing and competitive context** are addressed as fields in the Hypothesis Card, captured during idea structuring.

---

## Decision Framework

### Accelerate (GO) Criteria

All of the following must be met to issue a GO verdict:

1. Primary metric meets or exceeds the threshold defined in the Test Blueprint
2. Sample size rule satisfied — not just time-box expired (minimum 20 conversions or per-archetype minimum)
3. Data quality verified — no INVALID flags (bot traffic, tracking failures, platform anomalies)
4. Discovery Summary showed pain severity ≥ 3/5

### Kill Criteria

#### Hard Kill (immediate, no second chance)

- CTR < 0.4% after 1,000+ impressions
- Zero conversions after full budget spend
- 0 out of 5+ interviews confirming the problem exists

#### Soft Kill (after one creative/messaging swap)

- Primary metric below 50% of threshold
- CPL exceeds 2× the cap defined in Test Blueprint
- All viable audience segments tested with no segment clearing threshold

#### Kill Protocol

- Decision Memo is required even for kills — document what was learned
- Archive the full experiment pack (Hypothesis Card through Validation Report)
- 90-day PII retention policy on any collected contact data, then purge

### Pivot Routing Table

When the verdict is PIVOT, use the signal pattern to determine re-entry point:

| Signal Pattern                                                   | Pivot To | What Changes                                                     |
| ---------------------------------------------------------------- | -------- | ---------------------------------------------------------------- |
| Problem not confirmed in interviews                              | Step 1   | New Hypothesis Card with different ICP or problem angle          |
| Problem confirmed, campaign metrics poor across variants         | Step 4   | New Campaign Package — revised messaging/channel                 |
| Good CTR, poor landing page CVR                                  | Step 5   | Revised page CTA/offer; possibly revisit Test Blueprint (Step 3) |
| Mixed metrics — some segments convert, others don't              | Step 3   | Narrow ICP in Test Blueprint, possibly different archetype       |
| Inconclusive discovery (too few interviews, conflicting signals) | Step 2   | More interviews with tighter screening criteria                  |
| Metrics meet threshold but unit economics fail                   | Step 3   | Revise budget model, test lower-cost channels                    |

#### Pivot Rules

- **Maximum 2 pivots** before a forced kill-or-park decision
- Each pivot receives a new Experiment ID suffix (e.g., EXP-042a, EXP-042b)
- **Total spend cap across pivots:** $1,500

#### Budget Rationale

$300-500 per test buys 150-600 clicks at typical $0.50-$2.00 CPCs. At a 10% CVR baseline, that yields 15-60 conversions — clearing the 20-conversion sample size minimum. The $500 upper range provides headroom for higher-CPC B2B tests where clicks may cost $3-5.

---

## Deep Dive List

Six topics identified for detailed exploration, sequenced by dependency (each deep dive builds on the outputs of the ones before it). Each will become its own working document.

| #   | Deep Dive                               | Rationale for Position                                                                                 |
| --- | --------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 1   | Story-Based Framework (was #3)          | Foundational — the Hypothesis Card is the first artifact in the chain                                  |
| 2   | Test Type Taxonomy (was #4)             | Core abstraction — metrics, thresholds, and templates all depend on this                               |
| 3   | AI-Scaled Customer Discovery (was #1)   | Now references story framework outputs and feeds into test selection                                   |
| 4   | AI-Generated Marketing Content (was #2) | Depends on story framework for messaging + test types for strategy                                     |
| 5   | Landing Page Automation (was #5)        | Consumes test types + content pipeline outputs                                                         |
| 6   | Measurement & Decision System (was #6)  | Renamed from "Accelerate" — calibration of thresholds, metric collection, decision framework evolution |

### Deep Dive #1: Story-Based Framework for Ideas

**The inspiration:** Donald Miller's StoryBrand framework — positioning the customer as the hero, the brand as the guide, with clear problem-solution-stakes narrative.

**Questions to answer:**

- How do we build our own branded framework inspired by StoryBrand principles without licensing issues?
- Can AI agents take a raw idea and automatically scaffold it through the story framework?
- What are the specific outputs of the framework that feed into test design?
- How does this integrate with the existing Distill Brief concept in the functional spec?
- What fields capture market sizing and competitive context within the Hypothesis Card?

### Deep Dive #2: Test Type Taxonomy

**The foundation:** This is the most critical piece. The test type determines everything downstream — metrics, campaign strategy, landing page design, success criteria.

**Questions to answer:**

- What are the standard test types Silicon Crane should offer?
- How do you map from a story framework output to the right test type?
- What metrics and thresholds define pass/pivot/kill for each type?
- How does this relate to the 7 archetypes already defined in the functional spec?
- Should we simplify, expand, or restructure the existing archetype system?
- How are buildability fields (feasibility, cost, technical risks) assessed per archetype?

### Deep Dive #3: AI-Scaled Customer Discovery Interviews

**The bottleneck:** Customer discovery doesn't scale if it's just the founder doing interviews manually. LinkedIn contacts and cold calls based on web searches don't feel scalable.

**Questions to answer:**

- Can AI agents help source and screen interview candidates?
- Can AI conduct preliminary discovery interviews?
- What's the trade-off between AI interviews and human intuition for catching real pain points?
- If offered as VaaS, do customers trust AI-conducted interviews?
- What technology exists today to enable this?
- How does the Discovery Summary artifact get populated from interview data?

### Deep Dive #4: AI-Generated Marketing Content at Scale

**The bottleneck:** Producing campaign content (images, infographics, videos, ad copy) is manual and doesn't scale for a solopreneur, let alone as a service offering.

**Questions to answer:**

- What AI tools can produce campaign-quality creative assets today?
- How do we maintain brand consistency across AI-generated content?
- What's the quality bar for social media campaign creative?
- Can we build a content pipeline that generates complete campaign packages from a hypothesis?
- What are the ethical considerations around AI-generated marketing content?
- How does the story framework output inform messaging and creative direction?

### Deep Dive #5: Landing Page Automation & Generation

**The need:** Landing pages must match test types, pull in marketing creative, and capture the right signals.

**Questions to answer:**

- How do we automate landing page generation aligned to test types?
- How do landing pages leverage the marketing assets produced for campaigns?
- What's the minimum viable landing page system for validation?
- How does this integrate with the existing pattern library concept in the functional spec?

### Deep Dive #6: Measurement & Decision System

**The scope:** Calibration and evolution of the measurement infrastructure and decision framework — how thresholds are set, how metrics are collected, and how the Decision Framework improves over time with data.

**Questions to answer:**

- How should initial thresholds be calibrated before we have historical data?
- What measurement infrastructure is needed (analytics, event tracking, data pipelines)?
- How does the Decision Framework evolve as we accumulate validation data across ventures?
- What artifacts from validation carry forward when a venture receives a GO verdict?
- How does the handoff work from Silicon Crane validation into Ventracrane product development?

## Relationship to Existing Functional Spec

The functional spec (v1.0) already covers much of this ground in detail — particularly the 7 archetypes, the 9-stage lifecycle, gates, and the decision framework. This strategy session is stepping back to question whether those assumptions are correct before rebuilding the tooling. The deep dives may confirm, modify, or replace elements of the existing spec.

Key areas of overlap and potential revision:

- The 7 archetypes may map to or be restructured as test types
- The StoryBrand framework support (FR-203) needs to be fleshed out into a complete methodology
- Customer interviews (Problem Interview Sprint archetype) may need to be elevated from one archetype to a foundational step in every validation
- The AI-assisted generation capabilities need to be evaluated against current AI tooling capabilities

### Strategy → Functional Spec Mapping

| Strategy Concept                             | FR Reference                         | Status                                    |
| -------------------------------------------- | ------------------------------------ | ----------------------------------------- |
| Structured Hypothesis Card (story framework) | FR-203 (StoryBrand support)          | Confirmed — expanding scope               |
| Discovery Summary artifact                   | —                                    | New — not in v1.0 spec                    |
| Test Blueprint / archetype selection         | FR-301 through FR-307 (7 archetypes) | Under review — may restructure            |
| Campaign Package generation                  | FR-401 (AI content generation)       | Confirmed — scope TBD in Deep Dive #4     |
| Landing page automation                      | FR-501 (pattern library)             | Confirmed — scope TBD in Deep Dive #5     |
| Validation Report                            | FR-601 (analytics dashboard)         | Under review — may need richer artifact   |
| INVALID as 4th outcome                       | FR-1502 (inconclusive handling)      | Confirmed — aligns with spec              |
| Pivot Routing Table                          | FR-701 (pivot recommendations)       | New structure — replaces simple loop-back |
| Kill protocol / archival                     | FR-702 (kill archival)               | Confirmed — adding PII retention rule     |
| Buildability in Test Blueprint               | —                                    | New — addresses 3rd validation pillar     |

## Next Steps

1. Begin deep dives sequentially, starting with **Deep Dive #1: Story-Based Framework**
2. Deep Dive #1 defines the Hypothesis Card structure, which unlocks Deep Dives #2-4
3. Each deep dive produces a working document with recommendations
4. Recommendations feed back into an updated functional spec (v2.0)
5. Updated spec drives the technical rebuild on the venture-grade stack
