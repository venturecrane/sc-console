# Deep Dive #4: AI-Generated Marketing Content at Scale — The Campaign Factory

> **Source:** New document (DD#4)
> **Document Type:** Deep Dive Working Document
> **Series:** SC Validation Methodology
> **Date:** March 2, 2026
> **Status:** Complete — pending functional spec integration
> **Parent:** SC Validation Methodology — Strategy Session (March 2026)
> **Prior:** Deep Dive #3: AI-Scaled Customer Discovery — The Discovery Engine

---

## 1. Purpose & Scope

This deep dive defines the **Campaign Package** — the Step 4 output artifact in the SC validation workflow — and establishes SC's framework for generating marketing content at scale using AI while maintaining brand consistency and ethical compliance. The framework is branded **The Campaign Factory**.

**What this document covers:**

- The Campaign Factory — SC's branded content generation framework with a 7-step async pipeline
- The Messaging Matrix mapping Venture Narrative elements to ad copy
- Two-tier generation model: Tier 1 (Hypothesis Card only) vs. Tier 2 (+ Discovery Summary)
- Per-archetype content specifications for all 7 test archetypes
- AI image generation tool assessment and recommended API stack
- BrandProfile specification with multi-venture VaaS support and versioning
- Ethical framework addressing FTC, copyright, platform policies, and truthfulness
- The Campaign Package artifact specification and schema sketch
- Quality gates with structured consistency checklists
- Budget allocation model for $300–500 test ranges
- Channel selection logic integrating with `metrics_daily.source`

**Relationship to DD#1 (The Venture Narrative):**

The Hypothesis Card is the primary input to content generation. DD#1's five narrative elements (Hero, Struggle, Stakes, Breakthrough, Moment) map directly to specific ad copy elements through the Messaging Matrix (Section 4). DD#1 Section 5 explicitly noted that CopyPack is generated FROM the Hypothesis Card — Stakes feed urgency_hook, Solution Hypothesis feeds value_props, Customer Segment feeds targeting. This document operationalizes that mapping.

**Relationship to DD#2 (The Validation Ladder):**

The Test Blueprint determines which archetype the campaign serves, and each archetype has different content requirements. Demand Signal tests need short-form ads and simple landing pages. Willingness to Pay tests need long-form copy with pricing. Solution Validation tests need relationship-building content. Section 7 defines per-archetype content specifications.

**Relationship to DD#3 (The Discovery Engine):**

The Discovery Summary enriches campaign content — when available. DD#3's pain severity scoring calibrates emotional tone, top quotes become social proof, ICP refinements sharpen targeting, and signal patterns inform messaging themes. Section 5 defines the two-tier generation model that handles both the presence and absence of discovery data.

**The 11 questions this document answers:**

From the Strategy Session (6):

1. What AI tools can produce campaign-quality creative assets today?
2. How do we maintain brand consistency across AI-generated content?
3. What's the quality bar for social media campaign creative?
4. Can we build a content pipeline that generates complete campaign packages from a hypothesis?
5. What are the ethical considerations around AI-generated marketing content?
6. How does the story framework output inform messaging and creative direction?

From DD#3 (5):

7. How does the Venture Narrative (DD#1) inform campaign messaging and creative direction?
8. Which interview insights feed directly into ad copy generation?
9. How are customer quotes from discovery interviews used as social proof on landing pages?
10. What content formats work best for each test category?
11. How does the Discovery Summary's pain severity scoring inform emotional tone in campaign creative?

---

## 2. The Content Bottleneck — Why AI is Necessary

### The Solopreneur Creative Production Problem

Producing marketing content is the second major bottleneck in the validation workflow (after customer discovery, addressed in DD#3). A solo founder running a validation test faces creative production costs that dwarf the test budget itself:

- **Traditional agency creative:** $5,000–50,000 per campaign (strategy, copywriting, design, revisions)
- **Freelance creative:** $500–2,000 for basic ad set + landing page copy
- **DIY with design tools:** 10–20 hours of founder time per campaign (Canva, Figma, manual copywriting)

For a $300–500 validation test, even freelance creative costs exceed the ad spend. This creates a perverse incentive: founders either skip professional creative (hobbling the test) or overspend on production (defeating the point of cheap validation).

### The VaaS Scaling Dimension

For SC as a Validation-as-a-Service platform, the bottleneck is existential. Manual content production per venture doesn't scale from one to many. If each campaign requires 5–10 hours of human creative work, SC's unit economics collapse at portfolio scale.

### The AI Content Generation Opportunity

> **The critical insight:** Unlike DD#3's interview space (where no platform offers developer-grade APIs for custom integration), the AI content generation space HAS mature, production-ready APIs. Text generation (Claude, GPT-4o), image generation (GPT Image 1, Ideogram, Stability AI), and soon video generation (Runway, Sora) are all accessible programmatically. This means SC can build a fully automated content pipeline from Day 1.

### AI Content Generation Cost Model

At current API pricing, generating a complete campaign package costs approximately $1–4:

| Content Type                                     | Volume per Campaign | Per-Unit Cost    | Total          |
| ------------------------------------------------ | ------------------- | ---------------- | -------------- |
| Ad copy variants (headlines, descriptions, CTAs) | 50 variants         | $0.01–0.05 each  | $0.50–2.50     |
| Static images (ads, hero images, social)         | 30 images           | $0.005–0.07 each | $0.70–2.00     |
| Landing page copy                                | 1 set               | $0.10–0.30       | $0.10–0.30     |
| **Total per campaign**                           |                     |                  | **$1.30–4.80** |

Compare this to the $300–500 test budget: content generation is **less than 1%** of total spend. The economics are transformative — creative production is no longer a meaningful cost center.

### The Quality-Speed Tradeoff

Validation content has a specific quality bar: **"good enough that the creative itself is not the reason people don't convert."** This is deliberately lower than agency-grade creative. The goal is to test demand, not win design awards.

- **Below the bar:** Obvious AI artifacts, mismatched messaging, broken layouts, unprofessional appearance that signals "scam" or "hobby project"
- **At the bar:** Professional, clear, credible — the kind of content a competent marketing team would produce. Not award-winning, but not embarrassing.
- **Above the bar (unnecessary):** Award-winning creative, custom photography, motion graphics — these are post-validation investments

---

## 3. The Campaign Factory — SC's Content Framework

The **Campaign Factory** is SC's branded approach to marketing content generation — the fourth element of the SC validation methodology alongside The Venture Narrative (DD#1), The Validation Ladder (DD#2), and The Discovery Engine (DD#3).

The naming progression conveys the methodology's arc: **Narrative** (story) → **Ladder** (testing) → **Engine** (discovery) → **Factory** (production).

### Pipeline Architecture

The Campaign Factory takes structured inputs (Hypothesis Card, Discovery Summary, Test Blueprint, BrandProfile) and produces a complete Campaign Package through a 7-step async pipeline:

> **The Campaign Factory Pipeline**
>
> **Step 1:** Context Assembly — gather all input artifacts
> **Step 2:** Copy Generation — Claude API produces all text content
> **Step 3:** Creative Brief Generation — structured spec for visual assets
> **Step 4:** Asset Generation — image APIs produce visual content
> **Step 5:** Campaign Assembly — combine into CampaignPackage with channel variants
> **Step 6:** Structured Consistency Check — automated quality validation
> **Step 7:** Human Review Gate — operator approval before launch

### Technology Stack

| Layer            | Primary             | Secondary                                    | Purpose                                                            |
| ---------------- | ------------------- | -------------------------------------------- | ------------------------------------------------------------------ |
| Text Generation  | Claude API          | OpenAI GPT-4o                                | All ad copy, landing page copy, email sequences                    |
| Image Generation | OpenAI GPT Image 1  | Ideogram (text-heavy), Stability AI (volume) | Ad images, hero images, social media graphics                      |
| Video Generation | Deferred to Phase 2 | Runway Gen-4, Synthesia                      | Video ads, explainers ($0.10–0.50/sec — too expensive for Phase 1) |
| Optimization     | Deferred to Phase 2 | Anyword API, AdCreative.ai                   | Performance prediction, variant scoring                            |

**No third-party marketing AI platforms** (Jasper, Writer, Copy.ai, etc.). They add cost ($125/mo+ minimum), vendor lock-in, and API dependencies for capabilities Claude handles natively at a fraction of the cost.

### Phase 1 vs. Phase 2 Scope

> **Phase 1 (scope of this deep dive):**
> Text generation (Claude API) + static image generation (GPT Image 1 / Ideogram / Stability AI). Complete campaign packages for all 7 archetypes. Async pipeline via Cloudflare Queue. Human review gate before launch.
>
> **Phase 2 (deferred):**
> Video generation (Runway Gen-4, Synthesia for avatar-based content). Performance prediction (Anyword API — 82% accuracy on predictive scoring). A/B variant auto-optimization. At $0.10–0.50 per second of video, a 30-second ad costs $3–15 per variant — this doesn't fit the $300–500 test budget.

### Relationship to Existing CopyPack and CreativeBrief

The existing codebase has `copy_pack` TEXT (JSON) and `creative_brief` TEXT (JSON) columns on the experiments table. The Campaign Package does **not** replace these — it wraps and extends them.

> ⚠️ **Additive, not replacement.** When a CampaignPackage is generated, it populates all three columns:
>
> - `campaign_package` gets the full artifact (10–20KB estimated)
> - `copy_pack` gets a backward-compatible subset extracted from it
> - `creative_brief` gets a backward-compatible subset extracted from it
>
> The existing landing page template at `/e/[slug].astro` continues to work without modification — it reads from `copy_pack`, which is still populated.
>
> **Write invariant:** When `campaign_package` is present, `copy_pack` and `creative_brief` become read-only projections. The PATCH `/experiments/:id` endpoint must reject direct `copy_pack`/`creative_brief` updates when `campaign_package` is non-null. Edits go through the CampaignPackage, which re-extracts the projections. This prevents data drift between the three columns.

---

## 4. Messaging Architecture — The Messaging Matrix

The Messaging Matrix is the bridge between DD#1's Venture Narrative and the Campaign Package's ad copy. It maps each of the five narrative elements to specific content outputs.

### The Five-Element Mapping

| Narrative Element    | Hypothesis Card Fields                               | CampaignPackage Target                                          |
| -------------------- | ---------------------------------------------------- | --------------------------------------------------------------- |
| **The Hero**         | Customer Segment                                     | Targeting spec, audience description, platform selection        |
| **The Struggle**     | Problem Statement (functional/emotional/opportunity) | Pain-point headlines, problem-aware ad copy                     |
| **The Stakes**       | Stakes: Failure, Stakes: Success                     | urgency_hook, fear-of-missing-out elements, transformation copy |
| **The Breakthrough** | Solution Hypothesis                                  | value_props, headline, subheadline, benefit messaging           |
| **The Moment**       | Why Now                                              | CTA framing, timeliness hooks, trend references                 |

### Full Messaging Matrix: Narrative Elements × Archetypes

Each archetype emphasizes different narrative elements. The matrix shows which elements are primary, secondary, or unused for each archetype:

| Archetype         | Hero              | Struggle                        | Stakes                         | Breakthrough                        | Moment                        |
| ----------------- | ----------------- | ------------------------------- | ------------------------------ | ----------------------------------- | ----------------------------- |
| `fake_door`       | Targeting only    | **Primary** — headline          | Secondary — CTA urgency        | Implied only                        | Optional                      |
| `waitlist`        | Targeting + copy  | **Primary** — problem narrative | **Primary** — urgency hook     | Secondary — solution tease          | Secondary                     |
| `content_magnet`  | Targeting + copy  | **Primary** — problem framing   | Secondary                      | Embedded in content                 | Optional                      |
| `priced_waitlist` | Targeting + copy  | **Primary** — pain point        | **Primary** — cost of inaction | **Primary** — value justifies price | **Primary** — why act now     |
| `presale`         | Targeting + copy  | Secondary — assumed known       | **Primary** — transformation   | **Primary** — full product pitch    | **Primary** — scarcity/timing |
| `concierge`       | Targeting + trust | **Primary** — empathy           | Secondary                      | **Primary** — service description   | Secondary                     |
| `service_pilot`   | Targeting + trust | Secondary                       | Secondary                      | **Primary** — product capabilities  | **Primary** — early access    |

### Worked Example: Hypothesis Card → Ad Copy

> 💡 **Hypothesis Card (Tier 1) — Accessibility Auditor Venture:**
>
> - **Customer Segment (Hero):** Marketing managers at mid-size e-commerce companies (100–500 employees)
> - **Problem Statement (Struggle):** Functional: manual accessibility audits take 40+ hours per site. Emotional: fear of ADA lawsuits. Opportunity: inaccessible sites lose 15–20% of potential customers.
> - **Stakes: Failure:** ADA lawsuit (average settlement $25K), customer loss, brand damage
> - **Stakes: Success:** Full compliance, expanded customer base, legal protection
> - **Solution Hypothesis (Breakthrough):** AI-powered continuous accessibility monitoring with one-click remediation
> - **Why Now (Moment):** DOJ issued final ADA web accessibility rules in 2025, enforcement ramping up
>
> **Generated Ad Copy (waitlist archetype):**
>
> - **Headline** (from Struggle): "Your Website Is Losing 20% of Customers — and Risking a Lawsuit"
> - **Subheadline** (from Breakthrough): "AI-powered accessibility monitoring catches issues before regulators do"
> - **Urgency Hook** (from Stakes): "ADA enforcement is ramping up. Average settlement: $25K."
> - **CTA** (from Moment): "Get compliant before the new rules hit — join the waitlist"
> - **Targeting** (from Hero): Marketing managers, e-commerce, 100–500 employees, Meta + Google

This answers **Questions 6 and 7** — how the story framework and Venture Narrative inform messaging and creative direction.

---

## 5. Discovery-to-Copy Translation — Two-Tier Generation Model

Early-stage ventures often run their first campaign (e.g., a `waitlist` Demand Signal test) before or in parallel with discovery interviews. The pipeline must produce usable output either way.

### Tier 1 Generation (Hypothesis Card Only — Always Available)

The Hypothesis Card is always present (it's the Step 1 output). When no Discovery Summary exists:

- `social_proof` section is **omitted** (not fabricated)
- `pain_severity` defaults to **3** (empathetic middle ground)
- `pain_dimensions` are **derived from Problem Statement** on the Hypothesis Card (which articulates functional/emotional/opportunity cost per DD#1)
- `icp_refinements` uses `customer_segment` verbatim
- `wtp_signal` defaults to **"free/low-commitment"** CTA language (conservative)
- `signal_patterns` is empty — no messaging themes from interviews

### Tier 2 Generation (Hypothesis Card + Discovery Summary — Richer Output)

When Discovery Summary is available, all fields feed directly:

| Discovery Summary Field            | CampaignPackage Target                                                |
| ---------------------------------- | --------------------------------------------------------------------- |
| `top_quotes` (3–5 verbatim)        | Social proof quotes, testimonial ad variants                          |
| `pain_dimensions.functional`       | Rational ad copy — feature-focused, time/money savings                |
| `pain_dimensions.emotional`        | Emotional ad copy — frustration hooks, anxiety resolution             |
| `pain_dimensions.opportunity_cost` | Urgency hooks — "what you're missing" messaging                       |
| `pain_severity` (composite)        | Emotional intensity dial: 1–2 rational, 3–4 empathetic, 5 urgent/fear |
| `icp_refinements`                  | Targeting spec adjustments, audience narrowing                        |
| `signal_patterns`                  | Messaging theme selection, keyword targeting                          |
| `wtp_signal`                       | Price anchoring language, CTA specificity (free vs. paid)             |

### Pain Severity → Emotional Register Mapping

- **Score 1–2:** Rational tone. Feature benefits, time savings, efficiency. "Save 10 hours a week on manual audits."
- **Score 3–4:** Empathetic tone. "We know this is frustrating" + solution positioning. "You shouldn't have to spend your weekends on spreadsheets."
- **Score 5:** Urgent/fear tone. "You can't afford to keep doing this" + immediate CTA. "Every day you wait costs you $X."

### Interview Quotes as Social Proof

Customer quotes from `discovery_summary.top_quotes` are used as social proof on landing pages and in ad variants. Rules:

- **Verbatim only** — no paraphrasing, no synthesis, no AI-generated quotes
- **Anonymized attribution** — "Marketing Manager, B2B SaaS (50–200 employees)" not "Jane Smith, Acme Corp"
- **Pain dimension tagged** — each quote is tagged with which pain dimension it primarily illustrates (functional, emotional, opportunity cost) so the pipeline can place it in the right context
- **Consent-tracked** — the Discovery Summary records whether interview participants consented to quote usage

### Worked Example: Tier 1 vs. Tier 2 CampaignPackage

> 💡 **Venture: AI-Powered Competitor Intelligence for B2B Marketers**
>
> **Tier 1 (Hypothesis Card only):**
>
> - Headline: "Stop Guessing What Your Competitors Are Doing"
> - Subheadline: "Automated competitor tracking for B2B marketing teams"
> - Social proof: _omitted_ (no discovery data)
> - Tone: Empathetic (pain_severity default 3)
> - CTA: "Join the waitlist" (conservative, free commitment)
>
> **Tier 2 (+ Discovery Summary, pain severity 4.2):**
>
> - Headline: "You Spent 3 Hours Last Tuesday on a Spreadsheet That Was Already Stale"
> - Subheadline: "Automated competitor intelligence that's always current — so you don't scramble before board meetings"
> - Social proof: "I spent 3 hours last Tuesday updating a competitive spreadsheet that was 2 months stale." — Marketing Manager, B2B SaaS
> - Tone: Urgent (pain_severity 4.2 → empathetic-to-urgent register)
> - CTA: "Get real-time competitor intel — join the waitlist" (specific, benefit-driven)

The CampaignPackage records its generation tier in `provenance.generation_tier: 1 | 2`. When a Discovery Summary becomes available after a Tier 1 generation, the operator can regenerate to upgrade to Tier 2.

This answers **Questions 7, 8, 9, and 11** — how the Venture Narrative and Discovery Summary inform campaign content.

---

## 6. The Campaign Package — Artifact Specification

The **Campaign Package** is the Step 4 output artifact. It contains everything needed to launch a test campaign: ad copy variants, creative assets, targeting specification, channel selection, budget allocation, and provenance metadata.

### What the Campaign Package Contains

| Field              | Type                         | Source                                                                       |
| ------------------ | ---------------------------- | ---------------------------------------------------------------------------- |
| `copy_pack`        | object (CopyPackSchema)      | Generated by Claude API from Hypothesis Card + Discovery Summary             |
| `creative_brief`   | object (CreativeBriefSchema) | Generated — visual asset specifications                                      |
| `social_proof`     | object                       | From Discovery Summary `top_quotes` (Tier 2 only)                            |
| `tone`             | object                       | Derived from `pain_severity` → emotional register mapping                    |
| `channel_variants` | array of objects             | Per-channel ad copy/creative formatted to platform specs                     |
| `ab_variants`      | array of objects             | A/B test variants with hypothesis for each                                   |
| `budget`           | object                       | Allocation: ad spend %, creative buffer %, generation cost %, reserve %      |
| `targeting`        | object                       | From Customer Segment + ICP refinements, per-channel targeting spec          |
| `provenance`       | object                       | Generation metadata: tier, model versions, brand_profile_version, timestamps |
| `asset_references` | array of strings             | R2 keys for generated images — NOT image data                                |
| `stage`            | enum: draft / approved       | Two stages, same pattern as prior artifacts                                  |

### Relationship to CopyPack (Backward Compatible)

The `copy_pack` field within the CampaignPackage is a full CopyPackSchema object — the same structure the existing landing page template consumes. When the CampaignPackage is saved, the `copy_pack` is also written to the experiments table's `copy_pack` column as a backward-compatible projection.

### Relationship to CreativeBrief (Backward Compatible)

The `creative_brief` field follows the same pattern — nested inside the CampaignPackage, projected to the experiments table's `creative_brief` column.

### New Fields Beyond CopyPack and CreativeBrief

- **`social_proof`**: Verbatim quotes from Discovery Summary, anonymized, pain-dimension tagged. Only present in Tier 2 generations.
- **`tone`**: `{ pain_severity: number, register: "rational" | "empathetic" | "urgent", voice_notes: string }` — calibrated from Discovery Summary pain scoring.
- **`channel_variants[]`**: Per-channel formatted content. Each entry: `{ channel: string, format: string, headline: string, description: string, cta: string, image_ref: string, specs: { char_limits, aspect_ratio } }`.
- **`ab_variants[]`**: A/B test structures. Each entry: `{ variant_id: string, hypothesis: string, changes: object, copy_pack_override: object }`.
- **`budget`**: `{ total_cents: number, ad_spend_pct: 75, creative_buffer_pct: 15, generation_pct: 5, reserve_pct: 5 }`.
- **`targeting`**: `{ primary_channel: string, secondary_channel: string, audience_spec: object, geo: string | null, age_range: string | null }`.
- **`provenance`**: `{ generation_tier: 1 | 2, brand_profile_version: number, text_model: string, image_model: string, generated_at: string, approved_at: string | null, approved_by: string | null }`.

### Two Completion Stages

#### Draft (Generated)

The CampaignPackage is created by the pipeline and enters `draft` stage. All fields are populated, but the package has not been reviewed by a human.

#### Approved (Human-Reviewed)

The operator reviews the draft, may request regeneration of specific components, and marks the package as `approved`. This updates `provenance.approved_at` and `provenance.approved_by`. Only approved packages should be used to launch campaigns.

### Write Invariant

> ⚠️ When a `campaign_package` is present on an experiment, the `copy_pack` and `creative_brief` columns become **read-only projections**. The PATCH `/experiments/:id` endpoint must reject direct `copy_pack`/`creative_brief` updates when `campaign_package` is non-null — edits must go through the CampaignPackage, which re-extracts the projections. This prevents data drift between the three columns.

### Worked Example: Fully Populated CampaignPackage

> 💡 **Venture: Accessibility Auditor (SC-2026-001) — waitlist archetype, Tier 2**
>
> ```json
> {
>   "copy_pack": {
>     "headline": "Your Website Is Losing 20% of Customers — and Risking a Lawsuit",
>     "subheadline": "AI-powered accessibility monitoring catches issues before regulators do",
>     "body_copy": "Manual accessibility audits take 40+ hours per site...",
>     "cta_text": "Join the Waitlist",
>     "urgency_hook": "ADA enforcement is ramping up. Average settlement: $25K.",
>     "value_props": ["Continuous monitoring", "One-click remediation", "Full compliance reports"],
>     "social_proof": "200+ e-commerce teams are waiting for launch"
>   },
>   "creative_brief": {
>     "visual_style": "Professional, clean, trust-building",
>     "color_palette": ["#1a365d", "#2b6cb0", "#e2e8f0"],
>     "image_requirements": [
>       "Hero: dashboard screenshot mockup",
>       "Ad: accessibility score visualization"
>     ],
>     "typography": "Sans-serif, modern, high readability"
>   },
>   "social_proof": {
>     "quotes": [
>       {
>         "text": "I spent 3 hours last Tuesday updating accessibility reports that were already outdated.",
>         "attribution": "Marketing Manager, E-commerce (200 employees)",
>         "pain_dimension": "functional",
>         "consent": true
>       }
>     ]
>   },
>   "tone": {
>     "pain_severity": 4.2,
>     "register": "urgent",
>     "voice_notes": "Lead with functional pain (time waste), escalate to stakes (legal risk)"
>   },
>   "channel_variants": [
>     {
>       "channel": "facebook",
>       "format": "single_image",
>       "headline": "Your Website Is Losing 20% of Customers",
>       "description": "AI-powered accessibility monitoring. Join 200+ teams on the waitlist.",
>       "cta": "Learn More",
>       "image_ref": "assets/sc-2026-001/fb-hero-v1.png",
>       "specs": { "headline_chars": 40, "description_chars": 125, "aspect_ratio": "1:1" }
>     },
>     {
>       "channel": "google",
>       "format": "responsive_search",
>       "headlines": [
>         "Accessibility Monitoring Tool",
>         "Stop ADA Lawsuit Risk",
>         "Automated Compliance"
>       ],
>       "descriptions": [
>         "AI catches accessibility issues before regulators do. Join the waitlist."
>       ],
>       "specs": { "headline_chars": 30, "description_chars": 90 }
>     }
>   ],
>   "ab_variants": [
>     {
>       "variant_id": "A",
>       "hypothesis": "Pain-led headline converts better than solution-led",
>       "changes": { "headline": "Your Website Is Losing 20% of Customers — and Risking a Lawsuit" }
>     },
>     {
>       "variant_id": "B",
>       "hypothesis": "Solution-led headline converts better for high-intent audience",
>       "changes": {
>         "headline": "AI-Powered Accessibility Monitoring — Full Compliance in Minutes"
>       }
>     }
>   ],
>   "budget": {
>     "total_cents": 40000,
>     "ad_spend_pct": 75,
>     "creative_buffer_pct": 15,
>     "generation_pct": 5,
>     "reserve_pct": 5
>   },
>   "targeting": {
>     "primary_channel": "facebook",
>     "secondary_channel": "google",
>     "audience_spec": {
>       "job_titles": ["Marketing Manager", "Digital Marketing Director", "E-commerce Manager"],
>       "company_size": "100-500",
>       "industries": ["E-commerce", "Retail"]
>     }
>   },
>   "provenance": {
>     "generation_tier": 2,
>     "brand_profile_version": 1,
>     "text_model": "claude-sonnet-4-5-20250929",
>     "image_model": "gpt-image-1",
>     "generated_at": "2026-03-02T10:30:00Z",
>     "approved_at": null,
>     "approved_by": null
>   },
>   "asset_references": [
>     "assets/sc-2026-001/fb-hero-v1.png",
>     "assets/sc-2026-001/google-display-v1.png",
>     "assets/sc-2026-001/lp-hero-v1.png"
>   ],
>   "stage": "draft"
> }
> ```

---

## 6.5. Campaign Package Schema Sketch

Field specification for the `campaign_package` TEXT (JSON) column:

```json
{
  "copy_pack": {
    "type": "object",
    "required": true,
    "description": "Full CopyPackSchema — backward compatible with existing column",
    "properties": {
      "headline": { "type": "string", "required": true, "maxLength": 200 },
      "subheadline": { "type": "string", "required": false, "maxLength": 300 },
      "body_copy": { "type": "string", "required": false, "maxLength": 5000 },
      "cta_text": { "type": "string", "required": true, "maxLength": 50 },
      "urgency_hook": { "type": "string", "required": false, "maxLength": 200 },
      "value_props": { "type": "array", "items": "string", "maxItems": 5 },
      "social_proof": { "type": "string", "required": false, "maxLength": 500 },
      "pricing_copy": { "type": "string", "required": false, "maxLength": 500 },
      "feature_list": { "type": "array", "items": "string", "maxItems": 10 },
      "refund_policy": { "type": "string", "required": false, "maxLength": 500 }
    }
  },
  "creative_brief": {
    "type": "object",
    "required": true,
    "description": "Full CreativeBriefSchema — backward compatible with existing column",
    "properties": {
      "visual_style": { "type": "string" },
      "color_palette": { "type": "array", "items": "string" },
      "image_requirements": { "type": "array", "items": "string" },
      "typography": { "type": "string" }
    }
  },
  "social_proof": {
    "type": "object",
    "required": false,
    "description": "Only present in Tier 2 generations",
    "properties": {
      "quotes": {
        "type": "array",
        "items": {
          "text": "string",
          "attribution": "string",
          "pain_dimension": {
            "type": "string",
            "enum": ["functional", "emotional", "opportunity_cost"]
          },
          "consent": "boolean"
        },
        "maxItems": 5
      }
    }
  },
  "tone": {
    "type": "object",
    "required": true,
    "properties": {
      "pain_severity": { "type": "number", "minimum": 1, "maximum": 5 },
      "register": { "type": "string", "enum": ["rational", "empathetic", "urgent"] },
      "voice_notes": { "type": "string", "maxLength": 500 }
    }
  },
  "channel_variants": {
    "type": "array",
    "required": true,
    "items": {
      "channel": {
        "type": "string",
        "enum": ["facebook", "google", "tiktok", "linkedin", "reddit", "twitter", "email"]
      },
      "format": "string",
      "headline": "string",
      "description": "string",
      "cta": "string",
      "image_ref": "string",
      "specs": {
        "headline_chars": "number",
        "description_chars": "number",
        "aspect_ratio": "string"
      }
    }
  },
  "ab_variants": {
    "type": "array",
    "required": false,
    "items": {
      "variant_id": "string",
      "hypothesis": "string",
      "changes": "object"
    },
    "maxItems": 5
  },
  "budget": {
    "type": "object",
    "required": true,
    "properties": {
      "total_cents": { "type": "number" },
      "ad_spend_pct": { "type": "number" },
      "creative_buffer_pct": { "type": "number" },
      "generation_pct": { "type": "number" },
      "reserve_pct": { "type": "number" }
    }
  },
  "targeting": {
    "type": "object",
    "required": true,
    "properties": {
      "primary_channel": "string",
      "secondary_channel": "string",
      "audience_spec": "object",
      "geo": { "type": ["string", "null"] },
      "age_range": { "type": ["string", "null"] }
    }
  },
  "provenance": {
    "type": "object",
    "required": true,
    "properties": {
      "generation_tier": { "type": "number", "enum": [1, 2] },
      "brand_profile_version": { "type": "number" },
      "text_model": "string",
      "image_model": "string",
      "generated_at": "string",
      "approved_at": { "type": ["string", "null"] },
      "approved_by": { "type": ["string", "null"] }
    }
  },
  "asset_references": {
    "type": "array",
    "required": false,
    "items": { "type": "string" },
    "description": "R2 keys for generated images — NOT image data"
  },
  "stage": {
    "type": "string",
    "enum": ["draft", "approved"],
    "required": true
  }
}
```

---

## 7. Per-Archetype Content Specifications

Each of the 7 archetypes requires different content. This section defines the content requirements, ad formats, CTA patterns, and creative focus for each.

### Content Requirements by Archetype

| Archetype         | Category     | Primary Content                               | CTA Type              | Creative Focus   | Ad Format                  |
| ----------------- | ------------ | --------------------------------------------- | --------------------- | ---------------- | -------------------------- |
| `fake_door`       | Demand       | Minimal LP — headline + CTA                   | "Get Early Access"    | Curiosity-driven | Single image               |
| `waitlist`        | Demand       | Email capture LP — problem/solution narrative | "Join the Waitlist"   | Aspirational     | Single image               |
| `content_magnet`  | Demand       | Lead magnet LP — asset preview                | "Download Free Guide" | Content preview  | Single image + carousel    |
| `priced_waitlist` | WTP          | LP with price anchor — feature breakdown      | "Reserve Spot ($X)"   | Value-focused    | Single image + carousel    |
| `presale`         | WTP          | Full sales LP — payment flow                  | "Buy Now ($X)"        | Product mock-ups | Carousel + video (Phase 2) |
| `service_pilot`   | Solution Val | Service description LP — process overview     | "Book a Call"         | Process/outcome  | Single image               |
| `concierge`       | Solution Val | Service LP — team/approach                    | "Schedule Intro"      | People/team      | Single image               |

### Content Formats by Test Category

**Demand Signal** (fake_door, waitlist, content_magnet):

- Short-form ads optimized for impressions and clicks
- Simple landing pages with clear problem → solution → CTA flow
- Email capture as the primary signal mechanism
- Meta/Google optimized for broad reach
- Copy emphasis: Problem awareness, curiosity, low-commitment CTA

**Willingness to Pay** (priced_waitlist, presale):

- Long-form landing pages with pricing section, trust signals, and (for presale) payment flow
- Feature breakdowns, comparison tables, FAQ sections
- Google Search for high-intent capture
- Copy emphasis: Value justification, price anchoring, transformation promise, risk reversal (refund policy)

**Solution Validation** (service_pilot, concierge):

- Relationship-building content emphasizing expertise, process, and outcomes
- Detailed service descriptions, case study templates, scheduling CTAs
- LinkedIn/email for professional audiences
- Copy emphasis: Credibility, process transparency, outcome specificity, personal connection

### CopyPack Field Requirements by Archetype

| Field           | fake_door    | waitlist     | content_magnet | priced_waitlist | presale      | concierge    | service_pilot |
| --------------- | ------------ | ------------ | -------------- | --------------- | ------------ | ------------ | ------------- |
| `headline`      | **Required** | **Required** | **Required**   | **Required**    | **Required** | **Required** | **Required**  |
| `subheadline`   | Optional     | **Required** | **Required**   | **Required**    | **Required** | **Required** | **Required**  |
| `body_copy`     | Not used     | **Required** | **Required**   | **Required**    | **Required** | **Required** | **Required**  |
| `cta_text`      | **Required** | **Required** | **Required**   | **Required**    | **Required** | **Required** | **Required**  |
| `urgency_hook`  | Not used     | Optional     | Not used       | Optional        | Optional     | Not used     | Not used      |
| `value_props`   | Not used     | Optional     | Optional       | Optional        | **Required** | Optional     | **Required**  |
| `social_proof`  | Not used     | Optional     | Optional       | Optional        | Optional     | Optional     | Optional      |
| `pricing_copy`  | Not used     | Not used     | Not used       | **Required**    | **Required** | Optional     | **Required**  |
| `feature_list`  | Not used     | Not used     | Optional       | Optional        | **Required** | Optional     | **Required**  |
| `refund_policy` | Not used     | Not used     | Not used       | Not used        | **Required** | Not used     | Not used      |

This answers **Question 10** — what content formats work best for each test category.

---

## 8. Visual Content Strategy

### AI Image Generation Tool Assessment

| Tool               | Quality     | API Maturity        | Cost per Image   | Commercial Safety                                          | Text Rendering           | Best For                                           |
| ------------------ | ----------- | ------------------- | ---------------- | ---------------------------------------------------------- | ------------------------ | -------------------------------------------------- |
| OpenAI GPT Image 1 | High        | Production-ready    | $0.005–0.25      | Good (OpenAI terms)                                        | Good                     | General purpose — primary tool                     |
| Ideogram           | High        | Available           | $0.02–0.08       | Good                                                       | **Best** (~90% accuracy) | Text-heavy assets (banners, ads with text overlay) |
| Stability AI       | Medium      | Self-hostable       | $0.002–0.006     | Good (open models)                                         | Moderate                 | High-volume, budget scenarios                      |
| Adobe Firefly      | High        | Enterprise-gated    | Premium          | **Best** (trained on licensed content, IP indemnification) | Good                     | Future — when API opens to SMBs                    |
| Midjourney         | **Highest** | **No official API** | $0.01–0.04 (web) | Moderate                                                   | Poor                     | **Not viable** for programmatic pipelines          |

### Recommended Image Stack

> 🔧 **Primary:** OpenAI GPT Image 1 — best balance of quality, API maturity, cost. Production-ready REST API with reliable output.
>
> **Text-heavy assets:** Ideogram API — when ad banners, social media graphics, or any image needs readable text, Ideogram's ~90% text rendering accuracy is critical. GPT Image 1's text rendering is improving but not yet reliable for production use.
>
> **Volume/budget:** Stability AI — at $0.002–0.006 per image, use for high-volume generation or when budgets are tight. Self-hostable option available.

### Why Midjourney is Excluded

Midjourney produces the highest aesthetic quality of any image generation tool. However, it has **no official API** — all interaction is through Discord or their web interface. This makes it unsuitable for SC's programmatic pipeline. If Midjourney launches an API, it should be re-evaluated.

### Why Video is Deferred to Phase 2

Video generation is 10–100× more expensive than image/text:

| Content                    | Cost per Unit  | Per-Campaign Cost |
| -------------------------- | -------------- | ----------------- |
| Text (50 ad copy variants) | $0.01–0.05     | $0.50–2.50        |
| Images (30 images)         | $0.005–0.07    | $0.70–2.00        |
| Video (one 30-sec ad)      | $0.10–0.50/sec | **$3.00–15.00**   |

A single video variant costs more than the entire text + image budget combined. At $300–500 test budgets, video generation is not economically viable.

**Phase 2 video stack (when budgets allow):**

- Runway Gen-4 API for ad clips ($0.01–0.50/second, best quality + API)
- Synthesia/HeyGen for avatar-based explainer content (API available)

### Platform-Specific Image Requirements

| Platform                  | Aspect Ratios                                       | Min Resolution | Format      |
| ------------------------- | --------------------------------------------------- | -------------- | ----------- |
| Meta (Facebook/Instagram) | 1:1 (feed), 9:16 (stories/reels), 1.91:1 (link ads) | 1080×1080      | JPG/PNG     |
| Google Display            | 1.91:1 (landscape), 1:1 (square), 4:5 (portrait)    | 1200×628       | JPG/PNG     |
| LinkedIn                  | 1.91:1 (sponsored), 1:1 (carousel)                  | 1200×627       | JPG/PNG     |
| TikTok                    | 9:16 (vertical)                                     | 1080×1920      | JPG/PNG/MP4 |

### Image Generation Prompt Templates

For consistency across campaigns, image generation uses structured prompt templates:

```
[STYLE: {brand_profile.image_style}]
[SUBJECT: {creative_brief.image_requirements[n]}]
[COLOR PALETTE: {brand_profile.color_palette}]
[ASPECT RATIO: {platform_spec.aspect_ratio}]
[TEXT OVERLAY: {headline or null}]
[MOOD: {tone.register} — {tone.voice_notes}]
[PROHIBITED: {brand_profile.prohibited_terms}]
```

This answers **Questions 1 and 3** — what AI tools produce campaign-quality creative today, and what the quality bar is.

---

## 9. Brand Consistency Model

### BrandProfile Specification

Each venture gets a BrandProfile that constrains all content generation. The profile is injected as system prompt constraints during Claude API calls for text, and as structured parameters for image generation.

**BrandProfile fields:**

| Field                  | Type                 | Description                                               |
| ---------------------- | -------------------- | --------------------------------------------------------- |
| `voice_tone`           | enum                 | professional / casual / technical / friendly / urgent     |
| `color_palette`        | array of hex strings | Primary, secondary, accent colors                         |
| `typography_style`     | string               | Sans-serif modern / Serif traditional / etc.              |
| `image_style`          | string               | Photography / Illustration / Abstract / Minimal           |
| `prohibited_terms`     | array of strings     | Words/phrases that must never appear in generated content |
| `required_disclosures` | array of strings     | Legal/compliance text that must appear on all content     |
| `competitor_names`     | array of strings     | Competitors to avoid mentioning by name                   |
| `brand_voice_examples` | array of strings     | 2–3 example sentences showing the desired voice           |

### Multi-Venture VaaS Brand Separation

For VaaS, SC maintains a "brand-neutral" default BrandProfile; each client venture overrides it. The `ventures` table ensures complete brand separation:

**`ventures` table schema:**

| Column                  | Type              | Description                |
| ----------------------- | ----------------- | -------------------------- |
| `id`                    | TEXT PRIMARY KEY  | Venture identifier         |
| `name`                  | TEXT NOT NULL     | Venture display name       |
| `brand_profile`         | TEXT (JSON)       | Full BrandProfile object   |
| `brand_profile_version` | INTEGER DEFAULT 1 | Auto-incremented on update |
| `created_at`            | TEXT NOT NULL     | ISO 8601 timestamp         |
| `updated_at`            | TEXT NOT NULL     | ISO 8601 timestamp         |

The experiments table gets `venture_id TEXT REFERENCES ventures(id)` to link each experiment to its venture's brand.

The CampaignPackage `provenance` field records `brand_profile_version` so content can be traced to the exact profile version that generated it.

### System Prompt Engineering for Voice Consistency

BrandProfile constraints are injected into Claude API calls as system prompt:

```
You are generating marketing copy for {venture.name}.

Voice tone: {brand_profile.voice_tone}
Brand voice examples:
- "{brand_profile.brand_voice_examples[0]}"
- "{brand_profile.brand_voice_examples[1]}"

NEVER use these terms: {brand_profile.prohibited_terms}
ALWAYS include: {brand_profile.required_disclosures}
NEVER mention competitor names: {brand_profile.competitor_names}
```

### Consistency Mitigation — 3-Variant Generation

Style consistency via prompting has known limits. The pipeline generates **3 variant sets**, scores each against a BrandProfile compliance checklist (specific yes/no checks, not a vague 0–1 score), and selects the best-matching one.

**BrandProfile compliance checklist:**

- [ ] Voice tone matches specified register?
- [ ] No prohibited terms present?
- [ ] All required disclosures included?
- [ ] No competitor names mentioned?
- [ ] Color palette referenced correctly in creative brief?
- [ ] Image style matches specification?

Cost impact: 3× text generation = ~$1.50 per campaign, still negligible.

### Quality Gates — Structured Consistency Check

Three-tier quality system:

**Tier 1 — Automated Validation (no human needed):**

- JSON schema validation (all required fields present, correct types)
- Character count checks per platform (headline within limits, description within limits)
- Profanity/sensitivity filter
- BrandProfile compliance check against prohibited terms and required disclosures

**Tier 2 — Structured Consistency Check (automated + logged):**
Claude answers specific yes/no questions against the Hypothesis Card — not a vague numeric score:

- "Does headline reference the problem statement?" (Y/N)
- "Are all value props traceable to Solution Hypothesis?" (Y/N)
- "Does CTA match archetype pattern?" (Y/N)
- "Are any claims made that aren't in source data?" (Y/N)
- "Does tone match pain severity register?" (Y/N)

Each check passes or fails. If any fail, **regenerate that specific component** (not the entire package) with the failure as a constraint. If it fails twice on the same check, flag for human review with the specific failure reason attached.

**Tier 3 — Human Approval Gate (required):**
Final CampaignPackage review before launch. The quality bar: "good enough that the creative itself is not the reason people don't convert." Not agency quality. Not award-winning. Credible.

### Feedback Loops

Track approved vs. rejected content to improve prompt engineering over time:

- Record which components were regenerated and why
- Track which BrandProfile compliance checks fail most often
- Adjust system prompts based on failure patterns
- Key stat: 95% of companies have brand guidelines, only 25–30% enforce them. Automation reduces violations by 78%.

This answers **Question 2** — how to maintain brand consistency across AI-generated content.

---

## 10. Technology Landscape & Build vs. Buy

### AI Content Generation Platform Landscape

The market for AI marketing content platforms is mature and well-funded:

| Platform      | Funding                 | Key Feature                                   | API Available? | Pricing            |
| ------------- | ----------------------- | --------------------------------------------- | -------------- | ------------------ |
| Jasper        | $131M                   | Full-stack marketing AI                       | Yes (limited)  | $125/mo+           |
| Writer        | $369M ($1.9B valuation) | Enterprise content AI                         | Yes            | Enterprise pricing |
| Copy.ai       | Undisclosed             | Workflow-based copy generation                | Yes            | $49/mo+            |
| Anyword       | $21M                    | Predictive performance scoring (82% accuracy) | Yes            | $49/mo+            |
| Typeface      | $206M                   | Brand-consistent content                      | Limited        | Enterprise         |
| AdCreative.ai | Undisclosed             | Ad creative generation + scoring              | Yes            | $29/mo+            |

### API Ecosystem Maturity Assessment

**Tier 1 — Production-Ready:**

- Claude API (text generation) — SC's primary, already in infrastructure
- OpenAI GPT-4o (text), GPT Image 1 (images) — mature REST APIs
- Stability AI (images) — self-hostable, REST API

**Tier 2 — Available but Limited:**

- Ideogram API (images with text) — newer but functional
- Runway Gen-4 API (video) — available, expensive
- Anyword API (performance prediction) — genuine differentiator worth integrating in Phase 2

**Tier 3 — Not Viable for Programmatic Pipelines:**

- Midjourney (no API)
- Adobe Firefly (enterprise-gated)
- Canva Magic (platform-locked)

### Why Build the Orchestration Layer, Buy API Calls

The recommendation: **build SC's own orchestration pipeline, consume raw APIs for generation.**

| Approach                | Monthly Cost    | Per-Campaign Cost  | Integration     | Flexibility           |
| ----------------------- | --------------- | ------------------ | --------------- | --------------------- |
| Jasper subscription     | $125/mo minimum | ~$2.50 (amortized) | Platform-locked | Low — their workflows |
| Writer enterprise       | $500/mo+        | ~$10+ (amortized)  | API available   | Medium                |
| Claude API + image APIs | Usage-based     | ~$1–4 (actual)     | Full control    | Full — SC's pipeline  |

The economics are clear: raw API calls cost $1–4 per campaign. Platform subscriptions cost $125–500/month regardless of volume. At SC's validation pace (a few campaigns per month), platforms are dramatically overpriced. At VaaS scale (many campaigns per month), raw APIs scale linearly while platforms hit tier limits.

**Build scope:**

- Prompt templates for each archetype × narrative element combination
- Pipeline orchestration (7-step workflow in Cloudflare Queue Consumer)
- BrandProfile injection into system prompts
- Structured consistency checking
- R2 asset storage and reference management

**Buy (API consumption):**

- Claude API for all text generation
- OpenAI GPT Image 1 for image generation
- Ideogram for text-heavy images
- Stability AI for volume scenarios

This answers **Question 4** — yes, we can build a content pipeline that generates complete campaign packages from a hypothesis. The APIs are mature; what's needed is the orchestration layer.

---

## 11. Content Generation Pipeline — Detailed Workflow

### Async Architecture

> ⚠️ **Critical constraint:** Cloudflare Workers have a 30-second CPU time limit. Image generation calls alone can take 10–30 seconds each. The pipeline CANNOT run synchronously in a single Worker invocation.
>
> **Architecture:** The `POST /experiments/:id/generate-campaign-package` endpoint enqueues a job to a Cloudflare Queue, returns `202 Accepted` with a job ID. The pipeline executes in a Queue Consumer worker (15-minute execution limit). A `GET /experiments/:id/campaign-package/status` endpoint allows polling for completion.

### 7-Step Pipeline

#### Step 1: Context Assembly

**Input:** experiment_id
**Process:**

1. Fetch Hypothesis Card from `hypothesis_card` column
2. Fetch Discovery Summary from `discovery_summary` column (if present)
3. Fetch Test Blueprint from `test_blueprint` column
4. Fetch BrandProfile from `ventures` table via `venture_id`
5. Determine generation tier (1 if no Discovery Summary, 2 if present)

**Output:** Assembled context object
**API calls:** 0 (database reads only)
**Event logged:** `campaign_gen_started`

#### Step 2: Copy Generation

**Input:** Assembled context
**Process:**

1. Select prompt template based on archetype
2. Inject BrandProfile constraints as system prompt
3. Inject Hypothesis Card fields as context (Messaging Matrix mapping)
4. If Tier 2: inject Discovery Summary fields (pain severity, top quotes, signal patterns)
5. Generate 3 variant sets (for brand consistency scoring)
6. Run BrandProfile compliance checklist on each variant
7. Select best-matching variant

**Output:** CopyPack object (headline, subheadline, body_copy, cta_text, etc.)
**API calls:** 3 Claude API calls (one per variant set)
**Estimated cost:** $0.30–1.50
**Estimated time:** 10–30 seconds

#### Step 3: Creative Brief Generation

**Input:** CopyPack + BrandProfile + archetype
**Process:**

1. Generate creative brief from CopyPack content and BrandProfile visual specs
2. Determine image requirements based on archetype (see Section 7 table)
3. Specify aspect ratios per target platform (from channel_variants)
4. Generate image prompt templates from brief

**Output:** CreativeBrief object + image generation prompts
**API calls:** 1 Claude API call
**Estimated cost:** $0.05–0.20
**Estimated time:** 5–10 seconds

#### Step 4: Asset Generation

**Input:** Image prompts + CreativeBrief specs
**Process:**

1. For each required image (typically 3–10 per campaign):
   - Select image API based on content type (GPT Image 1 default, Ideogram for text-heavy)
   - Generate image at required aspect ratio
   - Store in R2 using existing `generateAssetKey()` pattern
   - Record R2 key in asset_references array
2. Parallel generation where possible (multiple images simultaneously)

**Output:** R2 keys for all generated images
**API calls:** 3–10 image API calls
**Estimated cost:** $0.15–2.50
**Estimated time:** 30–120 seconds (API latency bound)
**Event logged:** `campaign_gen_step_completed` (after each image)

#### Step 5: Campaign Assembly

**Input:** CopyPack + CreativeBrief + asset references + context
**Process:**

1. Generate channel_variants by formatting copy for each target platform (character limits, etc.)
2. Generate ab_variants (typically 2 — one pain-led, one solution-led)
3. Assemble budget allocation from archetype defaults + test blueprint
4. Assemble targeting spec from Hypothesis Card Customer Segment + ICP refinements
5. Build provenance metadata (generation tier, model versions, brand profile version)
6. Compose the full CampaignPackage object

**Output:** Complete CampaignPackage (draft stage)
**API calls:** 1 Claude API call (for channel variant formatting)
**Estimated cost:** $0.05–0.20
**Estimated time:** 5–15 seconds

#### Step 6: Structured Consistency Check

**Input:** CampaignPackage + Hypothesis Card
**Process:**

1. Run automated validation (JSON schema, character counts, profanity filter)
2. Run BrandProfile compliance check (prohibited terms, required disclosures)
3. Run structured consistency checklist via Claude:
   - Does headline reference the problem statement?
   - Are all value props traceable to Solution Hypothesis?
   - Does CTA match archetype pattern?
   - Are any claims made that aren't in source data?
   - Does tone match pain severity register?
4. If any check fails: regenerate the specific failing component (not full package)
5. If same check fails twice: flag for human review with specific failure reason

**Output:** CampaignPackage with consistency_check results attached
**API calls:** 1 Claude API call (for checklist evaluation)
**Estimated cost:** $0.05–0.15
**Estimated time:** 5–10 seconds

#### Step 7: Human Review Gate

**Input:** CampaignPackage (draft)
**Process:**

1. Save CampaignPackage to `campaign_package` column (stage: "draft")
2. Extract and save backward-compatible `copy_pack` and `creative_brief` projections
3. Notify operator that package is ready for review
4. Operator reviews, may request specific component regeneration
5. Operator marks as approved → stage changes to "approved"

**Output:** Approved CampaignPackage
**API calls:** 0 (human process)
**Event logged:** `campaign_gen_completed` (on save), `campaign_package_approved` (on approval)

### Pipeline Timing Summary

| Step                  | Duration         | Bottleneck           |
| --------------------- | ---------------- | -------------------- |
| 1. Context Assembly   | <1 sec           | Database reads       |
| 2. Copy Generation    | 10–30 sec        | Claude API latency   |
| 3. Creative Brief     | 5–10 sec         | Claude API latency   |
| 4. Asset Generation   | 30–120 sec       | Image API latency    |
| 5. Campaign Assembly  | 5–15 sec         | Claude API latency   |
| 6. Consistency Check  | 5–10 sec         | Claude API latency   |
| 7. Human Review       | Minutes to hours | Human availability   |
| **Total (automated)** | **~1–3 minutes** | **Image generation** |

### Error Handling

If the pipeline fails at any step:

- `campaign_gen_failed` event logged with step number and error details
- Partial results are preserved (e.g., if copy was generated but images failed, keep the copy)
- Operator can retry from the failed step, not from scratch
- Maximum 3 automatic retries per API call before failing the step

### Integration with event_log

| Event Type                    | Trigger            | event_data (JSON)                                       |
| ----------------------------- | ------------------ | ------------------------------------------------------- |
| `campaign_gen_started`        | Pipeline begins    | experiment_id, generation_tier, archetype               |
| `campaign_gen_step_completed` | Each step finishes | step_number, step_name, duration_ms                     |
| `campaign_gen_completed`      | Pipeline succeeds  | experiment_id, total_duration_ms, generation_cost_cents |
| `campaign_gen_failed`         | Pipeline fails     | step_number, error_message, partial_results             |
| `campaign_package_approved`   | Human approves     | experiment_id, approved_by, modifications_made          |

---

## 12. Ethical Framework — Four Pillars

### Pillar 1: Disclosure

AI generation is recorded in CampaignPackage provenance metadata. External disclosure follows platform-specific requirements:

- **Meta:** Auto-labels AI-generated ads (no additional action needed)
- **TikTok:** Bans deepfake endorsements; requires synthetic content labels
- **YouTube:** Requires synthetic content labels for AI-generated material
- **Google:** Requires disclosure for materially AI-generated ad creative
- **LinkedIn:** Emerging requirements — monitor and comply

**SC policy:** All CampaignPackages include `provenance` metadata recording the AI models used for generation. VaaS deliverables explicitly note AI involvement in content creation.

### Pillar 2: Commercial Safety

- **Prefer commercially safe image sources.** GPT Image 1 and Stability AI have clear commercial use terms. Ideogram allows commercial use. Adobe Firefly offers full IP indemnification but is enterprise-gated.
- **All generated assets stored in R2 with provenance tracking.** Each asset records the model that generated it, the prompt used, and the generation timestamp.
- **No unlicensed stock imagery.** All images are either AI-generated with commercial licenses or explicitly licensed stock.

### Pillar 3: Truthfulness

- All ad copy claims must be verifiable against Hypothesis Card and Discovery Summary data
- No fabricated statistics — if a stat appears in copy, it must trace to a source field
- Customer quotes ONLY from actual `top_quotes` in Discovery Summary, with anonymized attribution
- No synthetic testimonials — social proof is either real (from discovery) or omitted (Tier 1)
- The structured consistency check (Section 9) specifically validates: "Are any claims made that aren't in source data?"

### Pillar 4: Copyright — Honest Assessment

> ⚠️ **Purely AI-generated marketing content likely has no copyright protection under current law.** The Supreme Court declined to hear _Thaler v. Perlmutter_ (March 2, 2026), leaving in place the Copyright Office's position that works created by AI without human authorship are not copyrightable.

**For validation content, this is acceptable:**

- Validation campaigns are **disposable by design** — the content's purpose is to test demand, not build brand equity
- Competitors copying ad creative from a validation test is a negligible risk — the ads run for 7–21 days to small audiences
- The cost of regeneration is $1–4 — even if content were copied, replacing it is trivial

**For Phase 2 / VaaS client-facing content:**

- Add a mandatory human editing step where the reviewer makes substantive modifications to at least the primary headline, hero image, and CTA
- Track `modification_percentage` in provenance metadata
- This adds a human authorship element that strengthens copyright claims — though the legal landscape is still evolving

**Don't overstate copyright protection.** Acknowledge the gap and explain why it's acceptable at validation stage.

### Legal Compliance Summary

| Jurisdiction/Law                        | Requirement                                               | SC Compliance                                      |
| --------------------------------------- | --------------------------------------------------------- | -------------------------------------------------- |
| FTC Section 5                           | Clear, conspicuous AI disclosure                          | Provenance metadata + platform-specific labels     |
| California AI Transparency Act (SB 942) | AI content labeling, effective Jan 1, 2026, $5K/violation | Platform auto-labels + provenance metadata         |
| New York Synthetic Performer Law        | Consent for AI-generated likenesses                       | No synthetic performers used in validation content |
| EU AI Act                               | Transparency for AI-generated content                     | Provenance tracking meets requirements             |
| Platform policies                       | Varies — see disclosure section above                     | Per-platform compliance                            |

This answers **Question 5** — ethical considerations around AI-generated marketing content.

---

## 13. Budget Allocation Model

### Budget Breakdown by Test Level

**$300 test:**

| Category                        | %   | Amount |
| ------------------------------- | --- | ------ |
| Ad spend (Meta/Google/LinkedIn) | 75% | $225   |
| Creative iteration buffer       | 15% | $45    |
| Content generation (API costs)  | 5%  | $15    |
| Reserve                         | 5%  | $15    |

**$400 test:**

| Category                        | %   | Amount |
| ------------------------------- | --- | ------ |
| Ad spend (Meta/Google/LinkedIn) | 75% | $300   |
| Creative iteration buffer       | 15% | $60    |
| Content generation (API costs)  | 5%  | $20    |
| Reserve                         | 5%  | $20    |

**$500 test:**

| Category                        | %   | Amount |
| ------------------------------- | --- | ------ |
| Ad spend (Meta/Google/LinkedIn) | 75% | $375   |
| Creative iteration buffer       | 15% | $75    |
| Content generation (API costs)  | 5%  | $25    |
| Reserve                         | 5%  | $25    |

### Content Generation Costs Are Negligible

At ~$1–4 per full campaign package, the $15–25 content generation allocation covers 4–25 complete regeneration cycles. Content generation is not a meaningful cost center — **ad spend drives the budget.**

### Channel-Specific Minimum Viable Spend

| Channel                   | Minimum Viable Daily Spend | Rationale                                  |
| ------------------------- | -------------------------- | ------------------------------------------ |
| Meta (Facebook/Instagram) | $10–20/day                 | Sufficient for algorithm optimization      |
| Google Search             | $15–30/day                 | Higher CPCs, need enough clicks for signal |
| Google Display            | $10–20/day                 | Lower CPCs, broader reach                  |
| LinkedIn                  | $25–50/day                 | Highest CPCs ($5–15), B2B premium          |
| TikTok                    | $10–20/day                 | Low CPCs but requires video (Phase 2)      |
| Reddit                    | $5–10/day                  | Low CPCs, niche targeting                  |

### Why 75% Goes to Ad Spend

The test budget exists to buy signal — impressions, clicks, conversions. At $300–500 total, every dollar diverted from ad spend reduces sample size. The 75/15/5/5 split ensures:

- Enough ad spend for statistically meaningful results (150–600 clicks)
- A creative iteration buffer for one messaging pivot (soft kill scenario)
- Content generation costs covered with generous headroom
- A reserve for unexpected costs

---

## 14. Channel Selection Logic

### Decision Tree: Customer Segment + Archetype → Channel

| Customer Signal            | Primary Channel             | Secondary              |
| -------------------------- | --------------------------- | ---------------------- |
| B2B SaaS, professional     | LinkedIn Ads, Google Search | Meta (retargeting)     |
| B2C consumer, broad        | Meta (Facebook/Instagram)   | TikTok, Google Display |
| B2B services, niche        | LinkedIn Ads                | Google Search          |
| Technical/developer        | Google Search, Reddit       | Twitter/X              |
| Local/geographic           | Meta (geo-targeted)         | Google Local           |
| Content/thought leadership | LinkedIn organic + ads      | Meta                   |

### Platform-Specific Creative Specifications

| Platform         | Headline Chars     | Description Chars    | Image Aspect Ratios | Max File Size |
| ---------------- | ------------------ | -------------------- | ------------------- | ------------- |
| Meta (Facebook)  | 40                 | 125                  | 1:1, 1.91:1, 9:16   | 30MB          |
| Meta (Instagram) | 40                 | 125                  | 1:1, 4:5, 9:16      | 30MB          |
| Google Search    | 30 (×15 headlines) | 90 (×4 descriptions) | N/A                 | N/A           |
| Google Display   | 30                 | 90                   | 1.91:1, 1:1, 4:5    | 5.12MB        |
| LinkedIn         | 70                 | 150                  | 1.91:1, 1:1         | 5MB           |
| TikTok           | 100                | N/A                  | 9:16                | 500MB (video) |
| Reddit           | 300                | N/A                  | 1:1, 4:3            | 5MB           |
| Twitter/X        | 70                 | N/A                  | 1.91:1, 1:1         | 5MB           |

### Integration with metrics_daily.source

The existing `metrics_daily` table tracks traffic sources. The current codebase documents `facebook|google|tiktok|manual` as expected source values. The Channel Selection Logic recommends additional channels. The standardized source enum should be:

`facebook`, `google`, `tiktok`, `linkedin`, `reddit`, `twitter`, `email`, `manual`

Per-channel ad format recommendations are encoded in `channel_variants[]` within the CampaignPackage.

### Platform-Native Optimization

Modern ad platforms do significant optimization internally:

- **Meta Advantage+:** Auto-tests creative combinations, reported +22% ROAS with AI features. SC's job is to generate high-quality variants to feed it.
- **Google Performance Max:** Asset-based, auto-optimizes across all Google properties. Provide multiple headlines, descriptions, and images — the platform does the testing.

SC generates the variants; platforms optimize the delivery. This is complementary, not competitive.

---

## 15. Answering the Six Strategy Session Questions

**1. What AI tools can produce campaign-quality creative assets today?**

**Text:** Claude API (primary) and GPT-4o (secondary) handle all copy generation — ad headlines, descriptions, value props, CTAs, social proof integration, email sequences. The market has mature platforms (Jasper $131M, Writer $369M), but raw LLM APIs replicate most features at a fraction of the cost. Per-campaign text generation: ~$0.50–2.50 for 50 variants.

**Images:** OpenAI GPT Image 1 ($0.005–0.25/image) as primary — best balance of quality, API maturity, cost. Ideogram for text-heavy assets (~90% text rendering accuracy). Stability AI for volume ($0.002–0.006/image). Midjourney has highest aesthetic quality but NO API — not viable. Per-campaign images: ~$0.70–2.00 for 30 images.

**Video:** Runway Gen-4 (top quality + API, $0.01–0.50/second), Sora 2 (API available, $0.10–0.50/second). Video is deferred to Phase 2 — at $3–15 per 30-second variant, it doesn't fit $300–500 test budgets.

**2. How do we maintain brand consistency across AI-generated content?**

BrandProfile per venture — voice tone, color palette, typography, image style, prohibited terms, required disclosures. System prompt constraints inject brand rules into every Claude API call. The pipeline generates 3 variant sets, scores each against a BrandProfile compliance checklist (specific yes/no checks), and selects the best match. Automated post-generation validation catches violations. Human review gate catches the rest. Key stat: automation reduces brand violations by 78%.

**3. What's the quality bar for social media campaign creative?**

"Credible enough that creative isn't the conversion bottleneck." Professional, correct, clear — not agency-grade. Below the bar: obvious AI artifacts, mismatched messaging, unprofessional appearance. At the bar: the kind of content a competent marketing team would produce. Above the bar (unnecessary for validation): award-winning creative, custom photography. The creative iteration buffer (15% of budget) allows one messaging swap if the first version underperforms.

**4. Can we build a content pipeline that generates complete campaign packages from a hypothesis?**

**Yes.** The Campaign Factory is a 7-step async pipeline: Context Assembly → Copy Generation → Creative Brief → Asset Generation → Campaign Assembly → Consistency Check → Human Review. Unlike DD#3's interview space (no developer APIs), content generation APIs are production-ready. Total generation time: 1–3 minutes. Total cost: ~$1–4. The pipeline runs in a Cloudflare Queue Consumer (15-minute execution limit), avoiding the 30-second Worker CPU limit.

**5. What are the ethical considerations around AI-generated marketing content?**

Four pillars: (1) **Disclosure** — AI generation recorded in provenance, platform-specific labels honored. (2) **Commercial safety** — prefer commercially safe image sources, all assets in R2 with provenance. (3) **Truthfulness** — all claims traceable to Hypothesis Card/Discovery Summary, no fabricated stats or quotes. (4) **Copyright** — honestly: purely AI-generated content likely has no copyright protection under current law. For disposable validation campaigns, this is acceptable. Phase 2 adds mandatory human editing. FTC Section 5, California AI Transparency Act (SB 942), and platform policies are all addressed.

**6. How does the story framework output inform messaging and creative direction?**

The Messaging Matrix maps all 5 Venture Narrative elements to specific CampaignPackage outputs: Hero → targeting, Struggle → pain headlines, Stakes → urgency hooks, Breakthrough → value props, Moment → CTA framing. Each archetype emphasizes different elements (e.g., `priced_waitlist` uses all 5 as Primary; `fake_door` uses only Struggle as Primary). The mapping is deterministic and produces archetype-appropriate copy automatically.

---

## 15.5. Answering DD#3's Open Questions

DD#3 Section 15 identified 5 open questions for this deep dive:

**7. How does the Venture Narrative (DD#1) inform campaign messaging and creative direction?**

Through the **Messaging Matrix** (Section 4). Hero → targeting spec and audience description. Struggle (functional/emotional/opportunity pain) → pain-point headlines and problem-aware ad copy. Stakes (failure + success) → urgency hooks and transformation messaging. Breakthrough → value propositions, headline, subheadline. Moment → CTA framing and timeliness hooks. The matrix also varies emphasis by archetype — `fake_door` only uses Struggle as primary, while `priced_waitlist` uses all five.

**8. Which interview insights feed directly into ad copy generation?**

`top_quotes` → social proof quotes and testimonial ad variants. `pain_dimensions` → calibrated copy by dimension (functional → rational, emotional → empathetic, opportunity → urgency). `signal_patterns` → messaging theme selection and keyword targeting. `wtp_signal` → price anchoring language and CTA specificity. `icp_refinements` → targeting spec adjustments. All mapped in the Tier 2 generation model (Section 5).

**9. How are customer quotes from discovery interviews used as social proof on landing pages?**

**Verbatim only** from `discovery_summary.top_quotes`. Anonymized attribution ("Marketing Manager, B2B SaaS" not "Jane Smith, Acme Corp"). Each quote is tagged with its pain dimension (functional/emotional/opportunity cost) so the pipeline places it in the right context. Consent is tracked. In Tier 1 (no Discovery Summary), social proof is **omitted** rather than fabricated.

**10. What content formats work best for each test category?**

**Demand Signal** (fake_door, waitlist, content_magnet): Short-form ads, simple landing pages, email capture focus. Meta/Google optimized for impressions and clicks. **Willingness to Pay** (priced_waitlist, presale): Long-form LP with pricing, trust signals, payment flow. Google Search for intent. **Solution Validation** (service_pilot, concierge): Relationship-building content, detailed service descriptions, scheduling CTAs. LinkedIn/email for professional audiences. Full per-archetype specifications in Section 7.

**11. How does the Discovery Summary's pain severity scoring inform emotional tone in campaign creative?**

Direct mapping via the **emotional register** (Section 5): Score 1–2 → rational tone (feature benefits, time savings). Score 3–4 → empathetic tone ("we know this is frustrating" + solution positioning). Score 5 → urgent/fear tone ("you can't afford to keep doing this" + immediate CTA). The CampaignPackage `tone` object records the pain severity and register, and the pipeline uses this to calibrate all copy generation. Default for Tier 1 (no Discovery Summary): pain_severity = 3, empathetic register.

---

## 16. Recommendations for Functional Spec v2.0

1. **Add `campaign_package` TEXT column** to experiments table — stores the full CampaignPackage artifact (see Schema Sketch in Section 6.5)

2. **Add `ventures` table:** `id`, `name`, `brand_profile` (JSON), `brand_profile_version` (integer, auto-incremented on update), `created_at`, `updated_at`. Add `venture_id TEXT REFERENCES ventures(id)` to experiments table.

3. **Add `campaign_package` to PATCH /experiments/:id updatable fields.** Enforce write invariant: reject direct `copy_pack`/`creative_brief` updates when `campaign_package` is non-null.

4. **Add async campaign generation:** `POST /experiments/:id/generate-campaign-package` enqueues to Cloudflare Queue, returns `202 Accepted`. Queue Consumer executes the 7-step pipeline. `GET /experiments/:id/campaign-package/status` for polling.

5. **Extend landing page template** to consume `social_proof` and `tone` fields from CampaignPackage.

6. **Store generated creative assets in R2** using existing `generateAssetKey()` pattern — CampaignPackage stores R2 keys, not image data.

7. **Add content generation event types to event_log:** `campaign_gen_started`, `campaign_gen_step_completed`, `campaign_gen_completed`, `campaign_gen_failed`, `campaign_package_approved`.

8. **Add platform-specific creative spec validation** (character counts, aspect ratios) to the consistency check step.

9. **Expand `metrics_daily.source` documentation and any reporting code** to recognize: `facebook`, `google`, `tiktok`, `linkedin`, `reddit`, `twitter`, `email`, `manual`.

10. **Add `provenance.generation_tier` (1 or 2) and `provenance.brand_profile_version`** to CampaignPackage schema for reproducibility and audit trail.

---

## 17. Open Questions for Deep Dive #5

Deep Dive #5 covers **Landing Page Automation** — the Step 5 deployment. Questions the Campaign Factory raises for DD#5:

- How does the CampaignPackage inform landing page template selection and generation?
- What A/B test structure does the landing page implement from `campaign_package.ab_variants`?
- How do landing page signal capture mechanisms differ by archetype?
- What is the automation boundary between CampaignPackage and actual landing page deployment?
- How does the landing page consume `channel_variants` for consistent messaging?
- When a campaign PIVOTs, does the landing page auto-update from the regenerated CampaignPackage?
