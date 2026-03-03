# Deep Dive #1: Story-Based Framework — The Venture Narrative

> **Source:** Notion page `318786f4e365811f8590c2e625c3b324`
> **Document Type:** Deep Dive Working Document
> **Series:** SC Validation Methodology
> **Date:** March 2, 2026
> **Status:** Complete — pending functional spec integration
> **Parent:** SC Validation Methodology — Strategy Session (March 2026)

---

# 1. Purpose & Scope

This deep dive defines the **Structured Hypothesis Card** — the first artifact in the SC validation workflow (Step 1 output). It answers the five questions identified in the strategy session for Deep Dive #1: Story-Based Framework for Ideas.

**What this document covers:**

- A branded story-based framework ("Venture Narrative") for structuring raw ideas into testable hypotheses
- The Structured Hypothesis Card field specification with two completion tiers
- An early-kill mechanism (confidence score + red flag patterns) to make Step 1 the cheapest kill point
- Integration path with the existing Distill Brief and functional spec
- AI agent automation workflow for card generation

**Relationship to the validation workflow:**

The Hypothesis Card is consumed by Steps 2–4 in the validation chain. It persists as a reference artifact — not consumed and discarded at Step 1. Customer Discovery (Step 2) enriches it, Test Type Selection (Step 3) reads from it, and Marketing Content (Step 4) uses it for messaging direction.

---

# 2. Framework Design — The Venture Narrative

The **Venture Narrative** is SC's branded story-based framework for structuring business hypotheses. It is inspired by the hero/guide narrative structure popularized in brand storytelling, adapted specifically for hypothesis validation.

## The Five Narrative Elements

### 1. The Hero

Who is the customer? A specific segment — not "everyone." Defined by demographics, psychographics, and behavioral characteristics. Specific enough to find 5 real people matching the description.

### 2. The Struggle

What problem do they face? Articulated across three dimensions:

- **Functional pain** — What doesn't work, or takes too long?
- **Emotional cost** — How does this problem make them feel? (frustrated, anxious, embarrassed)
- **Opportunity cost** — What can't they do because of this problem?

### 3. The Stakes

What happens if this stays unsolved? And what does success look like? Both sides of the coin — the cost of inaction and the desired transformation.

### 4. The Breakthrough

What's our proposed solution? The brand is positioned as the guide enabling the hero's success — not as the hero itself.

### 5. The Moment

Why now? What has changed — new technology, regulatory shift, cultural moment, market timing — that makes this problem solvable or urgent today?

## Design Rationale

**Five elements instead of seven.** Traditional story-based marketing frameworks include Guide, Plan, and Call-to-Action as separate elements. Those are marketing execution concerns addressed in Step 4 (Campaign Package), not hypothesis structuring. The Venture Narrative keeps the focus on what needs to be validated.

**Validation-native problem taxonomy.** The three-dimensional problem decomposition uses **Functional Pain / Emotional Cost / Opportunity Cost** rather than the external/internal/philosophical framing common in brand storytelling. This framing is oriented toward measuring pain severity in Step 2 (Customer Discovery) — each dimension maps to interview questions and can be scored on a severity scale.

---

# 3. The Structured Hypothesis Card — Field Specification

The Hypothesis Card has two completion tiers, reflecting the reality that some fields can't be well-informed until after customer discovery.

## Tier 1 — Draft Card

_Approximately 30 minutes to complete. Sufficient to enter Step 2 (Customer Discovery)._

| Field                   | Description                                                                                                                   | Narrative Element | Replaces (Distill Brief) |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------ |
| **Customer Segment**    | Specific ICP — demographics, psychographics, one segment per card. Must be specific enough to find 5 real people matching it. | The Hero          | `target_audience`        |
| **Problem Statement**   | The core friction — articulated across functional pain, emotional cost, and opportunity cost.                                 | The Struggle      | `problem_statement`      |
| **Stakes: Failure**     | What the customer loses if this stays unsolved — the cost of inaction.                                                        | The Stakes        | — (new)                  |
| **Stakes: Success**     | The transformation or outcome the customer desires.                                                                           | The Stakes        | — (new)                  |
| **Solution Hypothesis** | What we believe solves it — positioned as guide enabling the hero.                                                            | The Breakthrough  | `value_proposition`      |
| **Why Now**             | Market shift, new technology, regulatory change, or cultural moment that creates urgency.                                     | The Moment        | — (new)                  |

6 core fields. Enough narrative structure to run customer discovery interviews.

## Tier 2 — Full Card

_Enriched after Step 2 discovery, before Step 3 test selection._

| Field                     | Description                                                                                    | Narrative Element | Replaces (Distill Brief) |
| ------------------------- | ---------------------------------------------------------------------------------------------- | ----------------- | ------------------------ |
| **Current Alternatives**  | How the customer solves this today (including "do nothing"). Informed by discovery interviews. | The Struggle      | — (new)                  |
| **Market Sizing**         | TAM / SAM / SOM estimates with methodology notes.                                              | Context           | `market_size_estimate`   |
| **Competitive Landscape** | Direct competitors, adjacent solutions, positioning gaps.                                      | Context           | — (new)                  |
| **Key Assumptions**       | 3–5 riskiest things that must be true — structured format (see below).                         | Validation Bridge | — (new)                  |

10 fields total (Tier 1 + Tier 2). Strict superset of the 4 Distill Brief fields.

## Key Assumptions — Structured Format

Each assumption follows this template:

> **We believe** \[testable claim\] **because** \[evidence or reasoning\].
> **Risk:** High / Medium / Low — **Basis:** \[what we know or don't know\]

### Risk Rubric

- **High** — No evidence, business-critical. If wrong, the venture fails.
- **Medium** — Some indirect evidence, important but not fatal if wrong.
- **Low** — Reasonable evidence, worth confirming but unlikely to derail.

### Worked Examples

> **Good example:** "We believe marketing managers at B2B SaaS companies (50–200 employees) will pay \$99/mo for automated competitor tracking because 3/5 discovery interviewees mentioned doing this manually in spreadsheets. Risk: Medium — we have interview signal but no payment commitment."

> **Bad example:** "People will want this product." — Not testable, no evidence, no specificity.

---

# 3.5. Card Confidence Score & Early Kill

After completing the card (either tier), the founder or AI agent assigns a confidence rating.

**Confidence:** `Proceed` / `Uncertain` / `Abandon` — with a one-line justification.

## Red Flag Patterns

Any one of the following suggests **Abandon** or pivot before spending on Steps 2–4:

- Cannot articulate **Why Now** after honest attempt
- Customer Segment is "everyone" or "small businesses" (too broad to validate)
- No differentiation from Current Alternatives that the customer would notice
- All Key Assumptions are High-risk with zero supporting evidence
- Stakes: Failure produces a shrug, not urgency

This makes Step 1 the **cheapest kill point** in the validation workflow. Over time, tracking the kill rate at Step 1 vs. later steps provides methodology effectiveness data.

---

# 3.7. Schema Sketch

Field specification for the `hypothesis_card` JSONB column, to minimize interpretation during implementation:

```json
{
  "customer_segment": { "type": "string", "required": true, "maxLength": 500, "tier": 1 },
  "problem_statement": { "type": "string", "required": true, "maxLength": 1000, "tier": 1 },
  "stakes_failure": { "type": "string", "required": true, "maxLength": 500, "tier": 1 },
  "stakes_success": { "type": "string", "required": true, "maxLength": 500, "tier": 1 },
  "solution_hypothesis": { "type": "string", "required": true, "maxLength": 1000, "tier": 1 },
  "why_now": { "type": "string", "required": true, "maxLength": 500, "tier": 1 },
  "current_alternatives": { "type": "string", "required": false, "maxLength": 1000, "tier": 2 },
  "market_sizing": { "type": "string", "required": false, "maxLength": 1000, "tier": 2 },
  "competitive_landscape": { "type": "string", "required": false, "maxLength": 1000, "tier": 2 },
  "key_assumptions": {
    "type": "array",
    "required": false,
    "tier": 2,
    "items": {
      "claim": "string",
      "evidence": "string",
      "risk": "high | medium | low",
      "basis": "string"
    },
    "minItems": 3,
    "maxItems": 5
  },
  "confidence": { "type": "string", "enum": ["proceed", "uncertain", "abandon"], "required": true },
  "confidence_rationale": { "type": "string", "required": true, "maxLength": 500 },
  "one_liner": { "type": "string", "required": false, "maxLength": 200 },
  "tier": { "type": "string", "enum": ["draft", "full"], "required": true }
}
```

---

# 4. Venture Narrative One-Liner

The one-liner is an **AI-generated synthesis**, not a template interpolation. After all card fields are populated, the agent generates a single sentence that captures the essence of the hypothesis.

## Quality Criteria

- Under 30 words
- Readable aloud in one breath
- A stranger with no context would understand the business idea
- Editable by human reviewer

## Examples

> **Good:** "Time-pressed B2B marketers waste 5+ hours weekly tracking competitors manually — CompetitorPulse automates it for \$99/mo."

> **Bad:** "Our target segment of marketing managers at B2B SaaS companies with 50–200 employees struggles with the problem of tracking competitors which causes frustration and lost opportunity."

The bad example fails three criteria: over 30 words, not readable in one breath, reads like a database dump rather than a pitch.

---

# 5. Integration with Existing Spec

## Distill Brief Migration Path

- The Hypothesis Card **replaces** the Distill Brief as the pre-experiment structuring tool
- The 4 existing Distill Brief DB columns remain for backward compatibility, populated FROM card fields
- Field mapping:

| Distill Brief Column   | Populated From      |
| ---------------------- | ------------------- |
| `target_audience`      | Customer Segment    |
| `problem_statement`    | Problem Statement   |
| `value_proposition`    | Solution Hypothesis |
| `market_size_estimate` | Market Sizing       |

## Relationship to BVM 24-Step Framework

- **Draft Card (Tier 1)** is the minimum viable capture — enough to start validating
- **Full Card (Tier 2)** captures the output of a lightweight pass through BVM Steps 1–12
- For full BVM engagements (VaaS clients), the 24 steps produce a richer version of the same structure

## Relationship to CopyPack Schema

- CopyPack is generated FROM the Hypothesis Card in Step 4
- Stakes fields feed `urgency_hook`
- Solution Hypothesis feeds `value_props`
- Customer Segment feeds targeting parameters

---

# 6. AI Agent Automation

## Input

Raw idea brief (free text) from the founder or intake form.

## Agent Workflow

1. **Extract & Structure** — Parse the raw idea into Tier 1 draft card fields. Fill what's stated, flag what's missing.
2. **Research & Enrich** — For Tier 2 fields: web search for market sizing, identify competitors, assess why-now signals.
3. **Challenge & Stress-Test** — Generate structured Key Assumptions. Rate risk per rubric. Identify red flag patterns.
4. **Generate Variants** — 2–3 alternative framings: different customer segments, problem angles, solution approaches.
5. **Synthesize One-Liner** — Generate one-liner from completed card (AI synthesis, not template interpolation).
6. **Assign Confidence** — Evaluate red flag patterns, propose confidence score with rationale.
7. **Human Review Gate** — Present card(s) for human review. No auto-save to VCMS.

## Quality Criteria for AI-Generated Cards

- Every Tier 1 field populated (no blanks)
- Customer Segment passes the "find 5 real people" test
- Problem Statement articulates all three dimensions (functional, emotional, opportunity cost)
- At least 3 Key Assumptions with structured format
- Market Sizing includes methodology (not just a number)
- Confidence score with honest rationale

---

# 7. Answering the Five Questions

The strategy session identified five questions for this deep dive. Here are the answers:

**1. How do we build our own branded framework inspired by StoryBrand principles without licensing issues?**

The **Venture Narrative** — 5 elements (Hero, Struggle, Stakes, Breakthrough, Moment) with a validation-native problem taxonomy (Functional Pain / Emotional Cost / Opportunity Cost). No StoryBrand trademarked terminology or structure used. The problem decomposition creates real IP distance by orienting toward pain severity measurement rather than marketing philosophy.

**2. Can AI agents take a raw idea and automatically scaffold it through the story framework?**

Yes — a 7-step agent workflow takes a raw idea brief through extraction, research, stress-testing, variant generation, one-liner synthesis, and confidence scoring. Tier 1 draft cards can be generated in minutes. Tier 2 enrichment happens after discovery interviews.

**3. What are the specific outputs of the framework that feed into test design?**

The **Structured Hypothesis Card** — 10 fields across 2 tiers, plus an AI-generated one-liner and confidence score. The card persists through Steps 2–4 as a reference artifact. Key Assumptions bridge directly to kill criteria in Deep Dive #2.

**4. How does this integrate with the existing Distill Brief concept in the functional spec?**

The Hypothesis Card is a strict superset of the Distill Brief's 4 fields. The card replaces the Brief as the structuring tool; legacy DB columns are populated from card fields for backward compatibility.

**5. What fields capture market sizing and competitive context within the Hypothesis Card?**

**Market Sizing** (TAM/SAM/SOM with methodology notes) and **Competitive Landscape** (direct competitors, adjacent solutions, positioning gaps) are dedicated Tier 2 fields, enriched after customer discovery.

---

# 8. Recommendations for Functional Spec v2.0

1. **Replace Distill Brief** with Hypothesis Card schema (see Schema Sketch in Section 3.7)
2. **Add `hypothesis_card` JSONB column** to the experiments table
3. **Keep legacy Distill Brief columns** as computed views populated from card fields
4. **Add confidence score as a workflow gate** — Abandon triggers archive, Uncertain triggers flag for review
5. **Define AI agent scaffolding** as a system capability (7-step workflow)
6. **Key Assumptions bridge** directly to `kill_criteria` in Deep Dive #2 (Test Type Taxonomy)

---

# 9. Open Questions for Deep Dive #2

- How do Key Assumptions map to specific test archetypes?
- Does each archetype have a recommended Hypothesis Card template?
- How does Competitive Landscape inform channel selection?
- How does the confidence score interact with test budget allocation?
