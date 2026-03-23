# Document Storage Briefing: SC Console Planning Artifacts

> Written 2026-03-02 for the document-storage agent to assess alignment between what exists on disk and the proposed storage architecture.

## What Happened

A planning sprint on 2026-03-02 produced the full document chain from methodology deep dives through to a backlog of 24 GitHub issues. No platform code was written — only planning documents. This briefing describes every artifact produced, where it lives, how it was generated, and how the documents relate to each other.

## Artifact Inventory

### 1. Methodology Deep Dives (source of truth for the validation methodology)

**Location:** `docs/methodology/`

| File                                      | Title                       | Role                                                                          |
| ----------------------------------------- | --------------------------- | ----------------------------------------------------------------------------- |
| `00-strategy-session.md`                  | Strategy Session            | Framing document for the 6-deep-dive series                                   |
| `01-deep-dive-venture-narrative.md`       | DD#1: The Venture Narrative | Defines the Hypothesis Card schema                                            |
| `02-deep-dive-validation-ladder.md`       | DD#2: The Validation Ladder | Defines the Test Blueprint schema, archetype taxonomy, kill criteria          |
| `03-deep-dive-discovery-engine.md`        | DD#3: The Discovery Engine  | Defines the Discovery Summary schema, interview model, Discovery Gate         |
| `04-deep-dive-campaign-factory.md`        | DD#4: The Campaign Factory  | Defines the Campaign Package schema, brand profiles, async generation         |
| `05-deep-dive-landing-page-automation.md` | DD#5: The Launchpad         | Defines page_config schema, archetype-aware templates, A/B testing            |
| `06-deep-dive-measurement-decision.md`    | DD#6: The Verdict           | Defines the Validation Report schema, threshold registry, Bayesian confidence |

**Key facts:**

- These are the canonical schema definitions. JSON schemas live in each DD's `.5` section (e.g., DD#1 Section 3.7, DD#2 Section 5.5).
- Each DD ends with a "Recommendations for Functional Spec v2.0" section containing numbered recommendations (61 total across all 6 DDs).
- These were migrated from Notion in March 2026. Notion is being retired.
- These files are **authored documents**, not generated. They were written through iterative human-AI collaboration.

### 2. Functional Spec v2.0 (synthesis of all DD recommendations)

**Location:** `docs/technical/sc-functional-spec-v2.md`

**What it is:** An additive specification that defines all changes needed to evolve the platform from tech spec v1.2 to v2.0. It is NOT a replacement for the existing tech spec — it layers on top.

**How it was generated:** A single AI agent read all 6 deep dives, the existing tech spec (`docs/technical/sc-technical-spec.md`), the current schema (`workers/sc-api/migrations/0001_initial_schema.sql`), and the current API (`workers/sc-api/src/index.ts`), then consolidated 61 recommendations into a single document.

**What it contains:**

- 10 new columns on `experiments` table
- 4 new tables (interviews, ventures, threshold_registry, venture_benchmarks)
- Status transition map v2.0 (adds `discovery` state)
- CHECK constraint migration (create-copy-drop-rename pattern for SQLite/D1)
- Write invariant patterns (Hypothesis Card over Distill Brief, CampaignPackage over copy_pack/creative_brief)
- ~20 new API endpoints across Discovery, Campaign, Measurement domains
- 7 implementation phases in 2 milestones
- Full traceability appendix mapping all 61 DD recommendations to spec sections

**871 lines. Single file. References DD schemas by section number rather than duplicating them.**

### 3. PRD (synthesized from 6-agent review)

**Location:** `docs/pm/prd.md`

**What it is:** A unified Product Requirements Document synthesized from a structured 6-role review process.

**How it was generated:**

1. Six parallel AI agents (Product Manager, Technical Lead, Business Analyst, UX Lead, Target Customer, Competitor Analyst) independently analyzed the functional spec + project instructions
2. Each wrote a contribution file from their role's perspective
3. A synthesis agent read all 6 contributions and merged them into a single PRD

**What it contains (19 sections):**

- Executive Summary, Vision, Personas (3), Core Problem
- 13 user stories (US-001 through US-013) with Given/When/Then acceptance criteria
- 29 business rules, 12 edge cases
- Full data model and API surface (from Technical Lead)
- Competitive analysis (7 competitors analyzed)
- 10 ADRs, 18 unresolved issues
- Phased development plan (Phase 0 through Phase 3 for MVP)

**11,520 words. Overwrites any previous PRD.**

### 4. PRD Contributions (audit trail for how the PRD was built)

**Location:** `docs/pm/prd-contributions/`

```
docs/pm/prd-contributions/
  context.md                          # Review parameters and source doc paths
  round-1/
    product-manager.md                # PM contribution
    technical-lead.md                 # Tech Lead contribution
    business-analyst.md               # BA contribution (user stories, acceptance criteria)
    ux-lead.md                        # UX contribution (personas, journey, IA)
    target-customer.md                # First-person customer reaction
    competitor-analyst.md             # Competitive intelligence
```

**Key facts:**

- These are intermediate artifacts, not final deliverables. The PRD is the deliverable.
- They exist as an audit trail showing how each role's perspective fed into the synthesis.
- If the PRD review is re-run, previous contributions get archived to `docs/pm/prd-contributions-archive/{ISO-date}/`.

### 5. Backlog Proposal (issue extraction from PRD)

**Location:** `docs/pm/backlog-proposal.md`

**What it is:** A structured list of 24 proposed GitHub issues extracted from the PRD and functional spec, grouped by implementation phase.

**Current status:** This file exists locally but is NOT yet committed to the repo. The 24 issues have been created on GitHub (issues #61-#84).

### 6. Existing Technical Documents (pre-existing, not modified)

| File                                                | Role                                                                                     |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `docs/technical/sc-technical-spec.md`               | Tech spec v1.2 — defines what's currently built (8 tables, 17 endpoints, 3 JSON schemas) |
| `workers/sc-api/migrations/0001_initial_schema.sql` | Current production schema                                                                |
| `docs/process/sc-project-instructions.md`           | Project instructions (service offerings, pricing model, delivery)                        |

## Document Relationships

```
docs/methodology/01-06*.md          (6 deep dives — canonical schemas)
        │
        ▼
docs/technical/sc-functional-spec-v2.md   (synthesizes 61 recommendations)
        │
        ├──────────────────────────────┐
        ▼                              ▼
docs/pm/prd-contributions/round-1/   docs/technical/sc-technical-spec.md
  (6 role analyses)                    (existing v1.2 — reference only)
        │
        ▼
docs/pm/prd.md                       (synthesized PRD)
        │
        ▼
docs/pm/backlog-proposal.md          (24 extracted issues)
        │
        ▼
GitHub Issues #61-#84                (live backlog)
```

## Git Status

**PR #60** (`docs/v2-functional-spec-and-prd` branch) contains 16 files:

- All 7 methodology deep dives
- The functional spec v2.0
- The PRD
- All 6 round-1 contributions + context file

**Not yet committed:**

- `docs/pm/backlog-proposal.md`
- This briefing document (`docs/pm/document-storage-briefing.md`)

## Questions for Document Storage Assessment

The document-storage agent should evaluate:

1. **Directory structure**: Is the current `docs/` layout (methodology/, technical/, pm/, pm/prd-contributions/, process/) the right long-term structure? The methodology docs are authored reference material; the PRD contributions are generated audit trails; the spec and PRD are living documents.

2. **Generated vs authored**: Methodology deep dives are human-authored. The functional spec, PRD, contributions, and backlog proposal are AI-generated (with human review). Should generated documents be tagged, separated, or handled differently?

3. **Schema canonical location**: JSON schemas are defined inside the deep dives (each DD's `.5` section). The functional spec references them by DD section number rather than duplicating. The PRD's Technical Lead contribution has its own rendition of the schemas. Is this the right pattern, or should schemas be extracted to standalone files?

4. **Audit trail storage**: PRD contributions are archived to `prd-contributions-archive/{ISO-date}/` on re-runs. Is this sufficient? Should there be a retention policy?

5. **Backlog proposal lifecycle**: The backlog-proposal.md is a point-in-time extraction. Once issues exist on GitHub, is the file still needed? Should it be committed or treated as ephemeral?

6. **Cross-document references**: The functional spec references DD sections (e.g., "DD#1 Schema Section 3.7"). The PRD references the functional spec. Issues reference both. Are these cross-references stable enough, or should there be a more robust linking mechanism?

7. **Document versioning**: The functional spec is explicitly "v2.0" and the tech spec is "v1.2". The PRD has no version. The deep dives have no versions. What's the versioning strategy?

8. **Migration from Notion**: The methodology docs were migrated from Notion in March 2026. Are there any remaining Notion dependencies? (Legacy page IDs are recorded in MEMORY.md for reference but should not be needed going forward.)
