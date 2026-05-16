# Deep Dive #2: Test Type Taxonomy — The Validation Ladder

> **Source:** Notion page `318786f4e36581c89f22f7a6fe58d2cc`
> **Document Type:** Deep Dive Working Document
> **Series:** SC Validation Methodology
> **Date:** March 2, 2026
> **Status:** Complete — pending functional spec integration
> **Parent:** SC Validation Methodology — Strategy Session (March 2026)
> **Prior:** Deep Dive #1: Story-Based Framework — The Venture Narrative

---

# 1. Purpose & Scope

This deep dive defines the **Test Blueprint** — the third artifact in the SC validation workflow (Step 3 output). It answers the six questions identified in the strategy session for Deep Dive #2: Test Type Taxonomy.

**What this document covers:**

- A restructured archetype system (the "Validation Ladder") that replaces the functional spec v1.0 taxonomy
- Detailed per-archetype specifications with metrics, thresholds, kill criteria, and decision rules
- The mapping from Hypothesis Card assumptions to test type selection
- The Test Blueprint artifact specification and schema
- Test sequencing strategy for multi-rung validation
- Kill criteria defaults and calibration mechanics

**Relationship to the validation workflow:**

The Test Blueprint consumes the Hypothesis Card (Step 1) and the Discovery Summary (Step 2) to produce a fully specified experiment design. It feeds into Campaign Package generation (Step 4) and Landing Page construction (Step 5). The metrics and thresholds defined here are evaluated in Step 6 (Measurement) against the Decision Framework established in the strategy session.

**Relationship to Deep Dive #1:**

The Hypothesis Card's **Key Assumptions** are the primary input for test type selection. Each assumption's risk level and type (demand, willingness-to-pay, buildability) maps to a specific category on the Validation Ladder. The **confidence score** from DD#1 interacts with budget allocation — lower confidence warrants cheaper first-rung tests.

---

# 2. Archetype Restructuring — The Validation Ladder

## Changes from Functional Spec v1.0

The v1.0 spec defined 7 archetypes: `waitlist`, `priced_waitlist`, `presale`, `service_pilot`, `content_magnet`, `concierge`, and `interview`. This deep dive restructures the taxonomy based on what was learned in the strategy session and DD#1.

### Removing `interview`

Customer discovery interviews are no longer an archetype — they are a **foundational step** (Step 2) that precedes all test types. The strategy session elevated interviews from "one test among many" to "a required phase in every validation." The Discovery Summary artifact bridges interview outputs into test selection. Removing `interview` from the archetype list eliminates the confusion between a methodology step and a campaign-driven experiment.

### Adding `fake_door`

The `fake_door` archetype fills a critical gap: the **cheapest, fastest demand signal test**. A fake door presents a product concept (button, feature, pricing page) that does not yet exist and measures click-through or signup intent. It costs less than a waitlist, runs faster, and answers the most basic question: "Does anyone care enough to click?"

Fake doors are the default entry point for ventures with high-risk demand assumptions and no prior signal.

### Three Categories

The 7 archetypes are organized into three categories that map to the three validation pillars from the strategy session:

**Demand Signal** — Is the problem real and does anyone care?

- `fake_door`
- `waitlist`
- `content_magnet`

**Willingness to Pay (WTP)** — Will customers exchange money for a solution?

- `priced_waitlist`
- `presale`

**Solution Validation** — Can we deliver the solution and do customers value the actual experience?

- `concierge`
- `service_pilot`

### Summary of Changes

| Change                              | Rationale                                                                                      |
| ----------------------------------- | ---------------------------------------------------------------------------------------------- |
| Removed `interview`                 | Elevated to foundational Step 2; not a campaign-driven experiment                              |
| Added `fake_door`                   | Cheapest demand signal; fills the gap below `waitlist`                                         |
| Organized into 3 categories         | Maps to validation pillars; clarifies what each test actually proves                           |
| Category names use plain language   | "Demand Signal" / "Willingness to Pay" / "Solution Validation" instead of academic terminology |
| Buildability assessed per-archetype | Addresses the 3rd validation pillar identified in the strategy session                         |

### Updated CHECK Constraint

The `archetype` column CHECK constraint in the experiments table changes from:

```sql
-- v1.0
CHECK(archetype IN ('waitlist','priced_waitlist','presale','service_pilot','content_magnet','concierge','interview'))

-- v2.0
CHECK(archetype IN ('fake_door','waitlist','content_magnet','priced_waitlist','presale','concierge','service_pilot'))
```

Migration required: rename existing `interview` experiments to an archived status or migrate to the appropriate replacement archetype.

---

# 3. Per-Archetype Specifications

Each archetype is specified with the same structure: description, what it validates, signal capture mechanism, metrics and thresholds, kill criteria JSON, budget and duration, landing page spec, CopyPack requirements, buildability rating and checklist, decision criteria, usage guidance, and a worked example.

---

## 3.1 `fake_door` — Demand Signal

**Description:** A fake door test presents a product, feature, or offer that does not yet exist and measures whether potential customers take the action to learn more, sign up, or engage. The "door" leads to a capture page (email, waitlist, or "coming soon" acknowledgment) rather than an actual product. It is the lightest-weight demand signal available.

**What it validates:** Basic demand — do people in the target segment care enough about this problem/solution to take a micro-action (click, sign up)?

**Signal capture:** Email submission on a "coming soon" or "notify me" page. The visitor sees a compelling value proposition, clicks the CTA, and lands on a capture form. The conversion event is the form submission.

### Metrics & Thresholds

| Metric                   | Target (GO) | Amber (Investigate) | Kill           |
| ------------------------ | ----------- | ------------------- | -------------- |
| CVR (sessions to signup) | >= 2%       | 0.5% - 2%           | < 0.5%         |
| CPL (cost per lead)      | <= $8       | $8 - $20            | > $20          |
| CTR (ad click-through)   | >= 1%       | 0.4% - 1%           | < 0.4%         |
| Min. conversions         | >= 20       | 10 - 20             | < 10 (INVALID) |

### Kill Criteria JSON

```json
{
  "version": 1,
  "rules": [
    {
      "metric": "cvr_bp",
      "operator": "lt",
      "threshold": 50,
      "label": "Conversion rate below 0.5%"
    },
    {
      "metric": "cpl_cents",
      "operator": "gt",
      "threshold": 2000,
      "label": "Cost per lead exceeds $20"
    },
    {
      "metric": "total_spend_cents",
      "operator": "gte",
      "threshold": 30000,
      "label": "Total spend reaches $300 budget cap"
    },
    {
      "metric": "days_elapsed",
      "operator": "gt",
      "threshold": 7,
      "label": "Test duration exceeds 7 days"
    }
  ]
}
```

### Budget & Duration

| Parameter                         | Value       |
| --------------------------------- | ----------- |
| Budget range                      | $150 - $300 |
| Duration                          | 7 days      |
| Min. sample (sessions)            | 1,000       |
| Min. conversions for valid result | 20          |

### Landing Page Spec

- **Template:** Single-page, above-the-fold value proposition with CTA button
- **Sections:** Headline, subheadline, 3 value props (bullet or icon), single CTA button, minimal footer
- **CTA:** "Get Notified" / "Join the Waitlist" / "Notify Me When It Launches"
- **Post-CTA:** Thank-you message confirming interest was recorded. No product access, no timeline promise.
- **No pricing shown** — this tests demand, not WTP
- **Mobile-first** — majority of ad traffic arrives on mobile

### CopyPack Requirements

The CopyPack for a fake door test requires these fields from the standard schema:

- `headline` — must articulate the core value proposition in under 10 words
- `subheadline` — expands on the problem being solved
- `value_props` — 3 bullet points (functional benefit, emotional benefit, differentiation)
- `cta_primary` — the fake door CTA text
- `ad_headlines` — 3-5 variants for A/B testing in ad platform
- `ad_descriptions` — 3-5 variants
- `meta_title`, `meta_description`, `og_title`, `og_description`

Optional fields not required: `cta_secondary`, `social_proof` (no proof exists yet), `urgency_hook` (can be added but not required).

### Buildability Rating

**Buildability: 1/5** — Minimal technical requirements.

| Checklist Item                 | Required? |
| ------------------------------ | --------- |
| Landing page (single template) | Yes       |
| Email capture form             | Yes       |
| Ad account + campaign          | Yes       |
| Payment integration            | No        |
| Backend service / fulfillment  | No        |
| Custom development             | No        |

### Decision Criteria

- **GO:** CVR >= 2% AND CPL <= $8 AND min. 20 conversions AND no INVALID flags. Proceed to next rung on the Validation Ladder (typically `waitlist` or `priced_waitlist`).
- **KILL:** CVR < 0.5% after 1,000+ sessions OR CPL > $20 OR zero conversions after full budget spend. Issue Decision Memo with kill rationale. Archive experiment.
- **PIVOT:** CVR in amber range (0.5% - 2%) with 10+ conversions. Check if specific audience segments outperform. Options: swap messaging (Step 4 re-entry), narrow ICP (Step 3 re-entry), or test different problem angle (Step 1 re-entry).
- **INVALID:** Fewer than 10 conversions AND fewer than 500 sessions. Insufficient data — extend budget or relaunch with revised targeting.

### When to Use

- **Use when:** First test for a new venture hypothesis. No prior demand signal exists. Key Assumptions include high-risk demand assumptions. Budget is constrained. You want the cheapest possible signal before investing further.
- **Do not use when:** Demand has already been validated (skip to WTP tests). The hypothesis is about pricing, not demand. The product already exists and has users.

### Worked Example

> **Venture:** CompetitorPulse — automated competitor tracking for B2B marketers
>
> **Hypothesis Card excerpt:** "We believe marketing managers at B2B SaaS companies (50-200 employees) waste 5+ hours weekly tracking competitors manually."
>
> **Test setup:** Facebook/LinkedIn campaign targeting B2B marketing managers. Ad creative emphasizes the time-waste problem. Landing page headline: "Stop Wasting 5 Hours a Week on Competitor Research." CTA: "Get Notified When We Launch." Budget: $200 over 7 days.
>
> **Results:** 1,400 sessions, 42 signups. CVR = 3.0%. CPL = $4.76. CTR = 1.8%.
>
> **Decision:** GO — all metrics exceed thresholds. 42 conversions well above the 20 minimum. Proceed to `priced_waitlist` test to validate WTP at the $99/mo price point.

---

## 3.2 `waitlist` — Demand Signal

**Description:** A waitlist test captures email signups from people who want to be notified when a product or service becomes available. Unlike a fake door, a waitlist implies a more concrete product concept — the visitor understands what they would be getting, even if it does not exist yet. The commitment level is slightly higher: the visitor expects to hear from you again.

**What it validates:** Sustained demand signal — do people want this enough to give their email and expect follow-up? Higher-fidelity than a fake door because the implied social contract is stronger.

**Signal capture:** Email submission with optional additional fields (name, company, role). The visitor sees a more detailed value proposition, understands the product concept, and actively joins a waitlist.

### Metrics & Thresholds

| Metric                   | Target (GO) | Amber (Investigate) | Kill           |
| ------------------------ | ----------- | ------------------- | -------------- |
| CVR (sessions to signup) | >= 3%       | 1% - 3%             | < 1%           |
| CPL (cost per lead)      | <= $15      | $15 - $30           | > $30          |
| CTR (ad click-through)   | >= 1%       | 0.4% - 1%           | < 0.4%         |
| Min. conversions         | >= 25       | 15 - 25             | < 15 (INVALID) |

### Kill Criteria JSON

```json
{
  "version": 1,
  "rules": [
    {
      "metric": "cvr_bp",
      "operator": "lt",
      "threshold": 100,
      "label": "Conversion rate below 1%"
    },
    {
      "metric": "cpl_cents",
      "operator": "gt",
      "threshold": 3000,
      "label": "Cost per lead exceeds $30"
    },
    {
      "metric": "total_spend_cents",
      "operator": "gte",
      "threshold": 50000,
      "label": "Total spend reaches $500 budget cap"
    },
    {
      "metric": "days_elapsed",
      "operator": "gt",
      "threshold": 14,
      "label": "Test duration exceeds 14 days"
    }
  ]
}
```

### Budget & Duration

| Parameter                         | Value       |
| --------------------------------- | ----------- |
| Budget range                      | $300 - $500 |
| Duration                          | 14 days     |
| Min. sample (sessions)            | 1,500       |
| Min. conversions for valid result | 25          |

### Landing Page Spec

- **Template:** Single-page with expanded product description
- **Sections:** Headline, subheadline, problem statement, solution overview (3-5 features/benefits), social proof placeholder, CTA, FAQ (optional), footer
- **CTA:** "Join the Waitlist" / "Reserve Your Spot" / "Get Early Access"
- **Post-CTA:** Thank-you page with estimated timeline and option to share with colleagues
- **No pricing shown** — demand test, not WTP
- **Email sequence:** Welcome email via Kit with product concept overview

### CopyPack Requirements

All standard CopyPack fields required:

- `headline`, `subheadline`, `value_props` (3-5 bullets)
- `cta_primary` — waitlist CTA text
- `social_proof` — can be placeholder ("Join 100+ marketers on the waitlist") once initial signups arrive
- `ad_headlines`, `ad_descriptions` — 3-5 variants each
- `meta_title`, `meta_description`, `og_title`, `og_description`
- `urgency_hook` — optional ("Limited early-access spots")

### Buildability Rating

**Buildability: 1/5** — Minimal technical requirements, same as fake door.

| Checklist Item                    | Required? |
| --------------------------------- | --------- |
| Landing page (single template)    | Yes       |
| Email capture form (name + email) | Yes       |
| Email welcome sequence (Kit)      | Yes       |
| Ad account + campaign             | Yes       |
| Payment integration               | No        |
| Backend service / fulfillment     | No        |
| Custom development                | No        |

### Decision Criteria

- **GO:** CVR >= 3% AND CPL <= $15 AND min. 25 conversions AND no INVALID flags. Proceed to WTP test (`priced_waitlist` or `presale`) depending on the venture's pricing model.
- **KILL:** CVR < 1% after 1,500+ sessions OR CPL > $30 OR zero conversions after full budget spend.
- **PIVOT:** CVR in amber range (1% - 3%) with 15+ conversions. Investigate segment performance, messaging resonance, channel effectiveness. Options: revised messaging, narrower ICP, different channel.
- **INVALID:** Fewer than 15 conversions AND fewer than 800 sessions. Extend or relaunch.

### When to Use

- **Use when:** You want a higher-fidelity demand signal than a fake door. The product concept is concrete enough to describe features and benefits. You want to build an early audience for launch. Discovery interviews confirmed the problem but you need quantitative demand data.
- **Do not use when:** You have no prior demand signal (start with `fake_door`). You need to validate pricing (use `priced_waitlist`). The product already exists and has paying users.

### Worked Example

> **Venture:** MealPrepPro — AI-generated weekly meal plans for busy families
>
> **Hypothesis Card excerpt:** "We believe dual-income parents with children under 12 spend 3+ hours weekly planning meals and grocery shopping, and would use an AI tool to cut that to 15 minutes."
>
> **Discovery Summary:** 7/10 interviews confirmed the problem. Pain severity 4/5. All interviewees currently use a combination of Pinterest, spreadsheets, and memory.
>
> **Test setup:** Instagram/Facebook campaign targeting parents 28-45 with interests in meal planning, healthy eating. Landing page describes the AI meal planning concept with feature preview. CTA: "Join the Waitlist for Early Access." Budget: $400 over 14 days.
>
> **Results:** 2,100 sessions, 84 signups. CVR = 4.0%. CPL = $4.76. CTR = 2.1%.
>
> **Decision:** GO — strong demand signal. Proceed to `priced_waitlist` to validate WTP at $9.99/mo.

---

## 3.3 `content_magnet` — Demand Signal

**Description:** A content magnet test offers a free resource (guide, checklist, template, mini-course, tool) in exchange for an email signup. The content is directly related to the problem the venture solves, so capturing the lead validates both interest in the problem space and willingness to engage with content around it. The content itself is a lightweight deliverable — not the full product.

**What it validates:** Problem awareness and engagement intent. People who download a guide about a problem are likely experiencing that problem. Higher intent signal than a fake door (they want to consume content), but lower commitment than a waitlist (they get something immediately rather than waiting).

**Signal capture:** Email submission to receive the content resource. The visitor sees a description of the free resource, submits their email, and receives the resource via email or immediate download.

### Metrics & Thresholds

| Metric                     | Target (GO) | Amber (Investigate) | Kill           |
| -------------------------- | ----------- | ------------------- | -------------- |
| CVR (sessions to download) | >= 5%       | 2% - 5%             | < 2%           |
| CPL (cost per lead)        | <= $10      | $10 - $25           | > $25          |
| CTR (ad click-through)     | >= 1.5%     | 0.5% - 1.5%         | < 0.5%         |
| Min. conversions           | >= 25       | 15 - 25             | < 15 (INVALID) |

### Kill Criteria JSON

```json
{
  "version": 1,
  "rules": [
    {
      "metric": "cvr_bp",
      "operator": "lt",
      "threshold": 200,
      "label": "Conversion rate below 2%"
    },
    {
      "metric": "cpl_cents",
      "operator": "gt",
      "threshold": 2500,
      "label": "Cost per lead exceeds $25"
    },
    {
      "metric": "total_spend_cents",
      "operator": "gte",
      "threshold": 40000,
      "label": "Total spend reaches $400 budget cap"
    },
    {
      "metric": "days_elapsed",
      "operator": "gt",
      "threshold": 14,
      "label": "Test duration exceeds 14 days"
    }
  ]
}
```

### Budget & Duration

| Parameter                         | Value       |
| --------------------------------- | ----------- |
| Budget range                      | $200 - $400 |
| Duration                          | 14 days     |
| Min. sample (sessions)            | 1,000       |
| Min. conversions for valid result | 25          |

### Landing Page Spec

- **Template:** Content-focused landing page with resource preview
- **Sections:** Headline (what the resource teaches), resource preview (table of contents, sample page, or key takeaways), 3 bullet points on what the reader will learn, author/brand credibility blurb, CTA, footer
- **CTA:** "Download Free Guide" / "Get the Checklist" / "Access the Template"
- **Post-CTA:** Immediate delivery — either inline download link or email with attachment/link
- **Resource format:** PDF, Google Doc, or hosted web page — must be ready before launch
- **Email sequence:** Delivery email + 1-2 follow-up emails gauging problem severity

### CopyPack Requirements

- `headline` — focused on the resource value, not the product
- `subheadline` — what the reader will learn or gain
- `value_props` — 3 learning outcomes or takeaways from the resource
- `cta_primary` — download/access CTA
- `ad_headlines`, `ad_descriptions` — 3-5 variants emphasizing the free resource
- `meta_title`, `meta_description`, `og_title`, `og_description`
- `urgency_hook` — optional ("Free for a limited time" or "Updated for 2026")

**Additional requirement:** The content resource itself must be created before launch. Budget 2-4 hours of content creation time. AI agents can draft the resource from Hypothesis Card fields.

### Buildability Rating

**Buildability: 2/5** — Requires content creation beyond just a landing page.

| Checklist Item                          | Required? |
| --------------------------------------- | --------- |
| Landing page (content-focused template) | Yes       |
| Email capture form                      | Yes       |
| Content resource (PDF/guide/template)   | Yes       |
| Email delivery sequence (Kit)           | Yes       |
| Ad account + campaign                   | Yes       |
| Payment integration                     | No        |
| Backend service / fulfillment           | No        |
| Custom development                      | No        |

### Decision Criteria

- **GO:** CVR >= 5% AND CPL <= $10 AND min. 25 conversions AND no INVALID flags. Problem awareness confirmed. Proceed to WTP test or deeper demand test depending on Discovery Summary signals.
- **KILL:** CVR < 2% after 1,000+ sessions OR CPL > $25.
- **PIVOT:** CVR in amber range (2% - 5%) with 15+ conversions. The problem resonates but the content offer may not match. Options: different resource format, revised targeting, different problem angle.
- **INVALID:** Fewer than 15 conversions AND fewer than 500 sessions.

### When to Use

- **Use when:** The problem space lends itself to educational content. You want to validate problem awareness while building an engaged audience. Discovery interviews revealed that the target audience actively seeks information about the problem. You can produce a quality resource quickly.
- **Do not use when:** The problem is not information-oriented (e.g., pure convenience plays). You cannot create a quality resource before launch. You need to validate pricing, not demand.

### Worked Example

> **Venture:** TaxNav — AI-powered tax optimization for freelancers
>
> **Hypothesis Card excerpt:** "We believe freelancers earning $50K-$200K annually overpay taxes by $3K-$12K because they don't know which deductions apply to their situation."
>
> **Test setup:** Facebook/Instagram campaign targeting freelancers and self-employed individuals. Content magnet: "The Freelancer's Tax Deduction Checklist: 47 Deductions You're Probably Missing." Landing page previews 5 of the 47 deductions with estimated savings. CTA: "Download the Full Checklist." Budget: $300 over 14 days.
>
> **Results:** 1,800 sessions, 126 downloads. CVR = 7.0%. CPL = $2.38. CTR = 2.4%.
>
> **Decision:** GO — exceptional demand signal. Problem resonance is strong. Proceed to `priced_waitlist` to validate WTP for the full AI tax optimization service.

---

## 3.4 `priced_waitlist` — Willingness to Pay

**Description:** A priced waitlist test shows the product's intended price point alongside the value proposition and asks visitors to join a waitlist knowing the price they will pay. Unlike a standard waitlist, the visitor sees the price before committing — so the signup signal includes implicit price acceptance. No payment is collected at this stage.

**What it validates:** Willingness to pay at a specific price point. The visitor knows the price and still signs up, which is a stronger signal than demand alone. Does not validate actual purchase behavior (that requires `presale`).

**Signal capture:** Email submission on a page that prominently displays pricing. The visitor sees the product, sees the price, and still chooses to join the waitlist. Optional: pricing tier selection to gauge price sensitivity across segments.

### Metrics & Thresholds

| Metric                   | Target (GO) | Amber (Investigate) | Kill           |
| ------------------------ | ----------- | ------------------- | -------------- |
| CVR (sessions to signup) | >= 1.5%     | 0.5% - 1.5%         | < 0.5%         |
| CPL (cost per lead)      | <= $30      | $30 - $50           | > $50          |
| CTR (ad click-through)   | >= 0.8%     | 0.4% - 0.8%         | < 0.4%         |
| Min. conversions         | >= 20       | 10 - 20             | < 10 (INVALID) |

### Kill Criteria JSON

```json
{
  "version": 1,
  "rules": [
    {
      "metric": "cvr_bp",
      "operator": "lt",
      "threshold": 50,
      "label": "Conversion rate below 0.5%"
    },
    {
      "metric": "cpl_cents",
      "operator": "gt",
      "threshold": 5000,
      "label": "Cost per lead exceeds $50"
    },
    {
      "metric": "total_spend_cents",
      "operator": "gte",
      "threshold": 50000,
      "label": "Total spend reaches $500 budget cap"
    },
    {
      "metric": "days_elapsed",
      "operator": "gt",
      "threshold": 14,
      "label": "Test duration exceeds 14 days"
    }
  ]
}
```

### Budget & Duration

| Parameter                         | Value       |
| --------------------------------- | ----------- |
| Budget range                      | $300 - $500 |
| Duration                          | 14 days     |
| Min. sample (sessions)            | 1,500       |
| Min. conversions for valid result | 20          |

### Landing Page Spec

- **Template:** Product page with pricing section
- **Sections:** Headline, subheadline, problem/solution overview, feature list (3-5 items), **pricing section** (prominently displayed), social proof (if available from prior tests), CTA, FAQ (especially pricing-related), footer
- **CTA:** "Join the Waitlist — $X/mo" / "Reserve Your Spot at $X" / "Get Early Access at Launch Price"
- **Pricing display:** Clear, unambiguous. If testing tiers, show all tiers. The price must be visible before the CTA.
- **Post-CTA:** Thank-you page confirming the price they will pay and estimated launch timeline
- **Email sequence:** Welcome email reiterating price, 1-2 follow-ups with product development updates

### CopyPack Requirements

All standard CopyPack fields required, plus:

- `headline` — must reference the transformation, not just the product
- `value_props` — 3-5 bullets that justify the price point
- `cta_primary` — must include or reference the price
- `social_proof` — leverage waitlist numbers from prior demand tests if available
- `urgency_hook` — "Early-bird pricing" or "Founding member rate" to anchor the price
- `ad_headlines`, `ad_descriptions` — variants should mention price or value-for-money
- Price-specific ad variant: at least 1 ad headline that includes the dollar amount

### Buildability Rating

**Buildability: 2/5** — Same as waitlist, plus pricing design.

| Checklist Item                          | Required? |
| --------------------------------------- | --------- |
| Landing page (pricing-focused template) | Yes       |
| Email capture form                      | Yes       |
| Pricing page design / tier layout       | Yes       |
| Email welcome sequence (Kit)            | Yes       |
| Ad account + campaign                   | Yes       |
| Payment integration                     | No        |
| Backend service / fulfillment           | No        |
| Custom development                      | No        |

### Decision Criteria

- **GO:** CVR >= 1.5% AND CPL <= $30 AND min. 20 conversions AND no INVALID flags. WTP validated at the tested price point. Proceed to `presale` for actual payment validation, or skip directly to build if confidence is high.
- **KILL:** CVR < 0.5% after 1,500+ sessions OR CPL > $50. Price point is wrong or demand does not survive price exposure.
- **PIVOT:** CVR in amber range (0.5% - 1.5%) with 10+ conversions. Options: test a lower price point, reframe value proposition to justify price, test different audience segment with higher WTP.
- **INVALID:** Fewer than 10 conversions AND fewer than 800 sessions.

### When to Use

- **Use when:** Demand has been validated (via `fake_door`, `waitlist`, or `content_magnet`). You have a specific price point to test. You want to filter demand signal by price sensitivity before collecting actual payments.
- **Do not use when:** Demand has not been validated (run a Demand Signal test first). You want to collect actual revenue (use `presale`). The pricing model is complex (usage-based, custom quotes) and cannot be displayed simply.

### Worked Example

> **Venture:** CompetitorPulse — automated competitor tracking for B2B marketers
>
> **Prior test:** `fake_door` returned GO (CVR 3.0%, CPL $4.76, 42 signups).
>
> **Test setup:** LinkedIn campaign targeting the same B2B marketing manager segment. Landing page now includes full feature overview and pricing: "$99/mo for up to 10 competitor profiles, $199/mo for unlimited." CTA: "Join the Waitlist — Starting at $99/mo." Budget: $500 over 14 days.
>
> **Results:** 1,800 sessions, 34 signups. CVR = 1.9%. CPL = $14.71. 28 chose the $99 tier, 6 chose $199.
>
> **Decision:** GO — CVR and CPL both exceed thresholds. Strong signal that $99/mo is acceptable. The 18% selection rate for the $199 tier suggests upsell potential. Proceed to `presale` or directly to build.

---

## 3.5 `presale` — Willingness to Pay

**Description:** A presale test collects actual payment (or binding payment commitment) for a product that does not yet exist. This is the strongest WTP signal possible without building the product. Visitors see the product concept, see the price, and pay real money. Refund policy must be clear and generous — this is a validation test, not a revenue play.

**What it validates:** Actual purchase behavior — the highest-fidelity WTP signal. People part with money, which eliminates the "I would buy it" vs. "I did buy it" gap. Also validates that the payment flow and pricing presentation work.

**Signal capture:** Stripe payment completion. The visitor submits payment through Stripe Checkout. The conversion event is a successful charge. Refund rate is tracked as a secondary metric.

### Metrics & Thresholds

| Metric                     | Target (GO) | Amber (Investigate) | Kill          |
| -------------------------- | ----------- | ------------------- | ------------- |
| CVR (sessions to purchase) | >= 1%       | 0.3% - 1%           | < 0.3%        |
| ROAS (return on ad spend)  | >= 100%     | 30% - 100%          | < 30%         |
| Refund rate                | < 10%       | 10% - 25%           | > 25%         |
| CTR (ad click-through)     | >= 0.8%     | 0.4% - 0.8%         | < 0.4%        |
| Min. conversions           | >= 15       | 8 - 15              | < 8 (INVALID) |

### Kill Criteria JSON

```json
{
  "version": 1,
  "rules": [
    {
      "metric": "cvr_bp",
      "operator": "lt",
      "threshold": 30,
      "label": "Conversion rate below 0.3%"
    },
    {
      "metric": "roas_bp",
      "operator": "lt",
      "threshold": 3000,
      "label": "ROAS below 30%"
    },
    {
      "metric": "total_spend_cents",
      "operator": "gte",
      "threshold": 50000,
      "label": "Total spend reaches $500 budget cap"
    },
    {
      "metric": "days_elapsed",
      "operator": "gt",
      "threshold": 21,
      "label": "Test duration exceeds 21 days"
    }
  ]
}
```

### Budget & Duration

| Parameter                         | Value        |
| --------------------------------- | ------------ |
| Budget range                      | $300 - $500  |
| Duration                          | 14 - 21 days |
| Min. sample (sessions)            | 1,500        |
| Min. conversions for valid result | 15           |

### Landing Page Spec

- **Template:** Sales page with Stripe Checkout integration
- **Sections:** Headline, subheadline, problem/solution narrative (longer-form), feature list with benefit descriptions, pricing with Stripe Buy button, social proof, testimonials or waitlist count (from prior tests), guarantee/refund policy, FAQ, footer
- **CTA:** "Buy Now — $X" / "Pre-Order for $X" / "Get Lifetime Access for $X"
- **Payment:** Stripe Checkout session. Requires `stripe_price_id` and `stripe_product_id` configured on the experiment.
- **Refund policy:** Prominently displayed. "Full refund within 30 days, no questions asked." This is validation, not a trap.
- **Post-purchase:** Confirmation page with receipt, expected delivery timeline, and "what happens next" explanation
- **Email sequence:** Purchase confirmation, onboarding preview, periodic updates on build progress

### CopyPack Requirements

All standard CopyPack fields required, plus:

- `headline` — transformation-focused, high urgency
- `value_props` — 5 bullets that justify parting with money
- `cta_primary` — must include the price
- `social_proof` — leverage prior test numbers ("500+ people on the waitlist, now accepting pre-orders")
- `urgency_hook` — required ("Pre-launch pricing ends March 31" / "First 100 customers get founding member rate")
- `ad_headlines`, `ad_descriptions` — purchase-oriented variants
- Price justification copy needed in ad descriptions

### Buildability Rating

**Buildability: 3/5** — Requires Stripe integration and payment handling.

| Checklist Item                       | Required?                                     |
| ------------------------------------ | --------------------------------------------- |
| Landing page (sales page template)   | Yes                                           |
| Stripe product + price configuration | Yes                                           |
| Stripe Checkout integration          | Yes                                           |
| Payment webhook handling (sc-api)    | Yes                                           |
| Refund policy page                   | Yes                                           |
| Email confirmation sequence (Kit)    | Yes                                           |
| Ad account + campaign                | Yes                                           |
| Backend service / fulfillment        | No (product not built yet)                    |
| Custom development                   | Minimal (Stripe integration exists in sc-api) |

### Decision Criteria

- **GO:** CVR >= 1% AND ROAS >= 100% AND refund rate < 10% AND min. 15 purchases AND no INVALID flags. People are paying real money. Strongest possible validation signal. Proceed to build.
- **KILL:** CVR < 0.3% after 1,500+ sessions OR ROAS < 30% OR refund rate > 25%.
- **PIVOT:** CVR in amber range (0.3% - 1%) with 8+ purchases. Options: lower price point, different value framing, add guarantee to reduce purchase friction. High refund rate (10-25%) suggests expectation mismatch — revisit product description.
- **INVALID:** Fewer than 8 purchases AND fewer than 800 sessions.

### When to Use

- **Use when:** WTP has been validated via `priced_waitlist` and you want to confirm with actual payment behavior. You have Stripe integration ready. You have a clear refund policy. You want revenue data, not just intent data.
- **Do not use when:** Demand has not been validated. You have not tested price sensitivity. Legal/regulatory constraints prevent pre-selling an unbuilt product. The product requires significant upfront build before any payment is ethical.

### Worked Example

> **Venture:** MealPrepPro — AI-generated weekly meal plans for busy families
>
> **Prior tests:** `waitlist` GO (CVR 4.0%, 84 signups), `priced_waitlist` GO (CVR 2.1%, 31 signups at $9.99/mo).
>
> **Test setup:** Facebook/Instagram campaign retargeting waitlist audience + lookalike audience. Sales page with detailed feature descriptions, sample meal plan screenshot, and Stripe Checkout for "$9.99/mo — Cancel Anytime, Full Refund in First 30 Days." Budget: $400 over 14 days.
>
> **Results:** 1,600 sessions, 22 purchases. CVR = 1.4%. ROAS = 55% (during test — recurring revenue improves this over time). Revenue: $219.78. Refund rate: 4.5% (1 refund). CPL = $18.18.
>
> **Decision:** GO — CVR exceeds threshold, refund rate is low. ROAS is below 100% but this is a subscription product — LTV will exceed CAC within 2 months at current churn estimates. Proceed to build with confidence.

---

## 3.6 `concierge` — Solution Validation

**Description:** A concierge test delivers the promised solution manually to a small number of customers. Instead of building automated software or a scalable product, the founder (or a small team) delivers the service by hand — using existing tools, spreadsheets, personal expertise, or manual processes. The customer receives the outcome they were promised; they just do not know (or care) that it is being delivered manually.

**What it validates:** Solution-market fit — does the actual delivered solution solve the customer's problem? Does the customer value the outcome enough to continue paying? Reveals the operational reality of the service before investing in automation.

**Signal capture:** Lead capture + manual service delivery. The visitor signs up (with or without payment), receives the service manually, and their satisfaction/retention is measured. Conversion event is the signup; secondary metrics are satisfaction score and retention.

### Metrics & Thresholds

| Metric                             | Target (GO) | Amber (Investigate) | Kill          |
| ---------------------------------- | ----------- | ------------------- | ------------- |
| CVR (sessions to signup)           | >= 2%       | 0.5% - 2%           | < 0.5%        |
| CPL (cost per lead)                | <= $50      | $50 - $100          | > $100        |
| Customer satisfaction (NPS or 1-5) | >= 4/5      | 3 - 4/5             | < 3/5         |
| Retention (week 2 engagement)      | >= 60%      | 30% - 60%           | < 30%         |
| Min. conversions                   | >= 10       | 5 - 10              | < 5 (INVALID) |

### Kill Criteria JSON

```json
{
  "version": 1,
  "rules": [
    {
      "metric": "cvr_bp",
      "operator": "lt",
      "threshold": 50,
      "label": "Conversion rate below 0.5%"
    },
    {
      "metric": "cpl_cents",
      "operator": "gt",
      "threshold": 10000,
      "label": "Cost per lead exceeds $100"
    },
    {
      "metric": "total_spend_cents",
      "operator": "gte",
      "threshold": 50000,
      "label": "Total spend reaches $500 budget cap"
    },
    {
      "metric": "days_elapsed",
      "operator": "gt",
      "threshold": 21,
      "label": "Test duration exceeds 21 days"
    }
  ]
}
```

### Budget & Duration

| Parameter                         | Value                      |
| --------------------------------- | -------------------------- |
| Budget range (ad spend)           | $300 - $500                |
| Duration                          | 21 days                    |
| Min. sample (sessions)            | 1,000                      |
| Min. conversions for valid result | 10                         |
| Operational time per customer     | 2-5 hours (founder's time) |

### Landing Page Spec

- **Template:** Service-focused landing page with application/signup flow
- **Sections:** Headline (outcome-focused), problem narrative, how it works (3-step process), what the customer gets (deliverables list), pricing (if charged), social proof, CTA, FAQ, footer
- **CTA:** "Apply Now" / "Get Started" / "Book Your Spot" — can include qualification questions
- **Qualification:** Optional intake form to screen for ICP fit (role, company size, specific need)
- **Post-signup:** Personal welcome email from the founder. Onboarding call or questionnaire to begin service delivery.
- **Service delivery:** Via email, Loom video, shared Google Doc, or whatever is simplest. No custom tooling.

### CopyPack Requirements

- `headline` — outcome-focused ("Get X Without Doing Y")
- `subheadline` — how the service works at a high level
- `value_props` — 3-5 deliverables the customer receives
- `cta_primary` — application/signup CTA
- `social_proof` — prior test numbers or personal credibility
- `ad_headlines`, `ad_descriptions` — service-oriented, emphasizing done-for-you value
- `meta_title`, `meta_description`, `og_title`, `og_description`

**Additional requirement:** A documented service delivery playbook — even if informal. The founder must know what they will deliver, how, and the time commitment per customer.

### Buildability Rating

**Buildability: 4/5** — Requires significant founder time for manual delivery.

| Checklist Item                                         | Required?                                  |
| ------------------------------------------------------ | ------------------------------------------ |
| Landing page (service-focused template)                | Yes                                        |
| Email capture / application form                       | Yes                                        |
| Service delivery playbook                              | Yes                                        |
| Manual delivery tools (email, Loom, Google Docs, etc.) | Yes                                        |
| Founder time commitment (2-5 hrs/customer)             | Yes                                        |
| Email sequence (Kit)                                   | Yes                                        |
| Ad account + campaign                                  | Yes                                        |
| Payment integration                                    | Optional (can be free for first customers) |
| Satisfaction survey / feedback mechanism               | Yes                                        |
| Custom development                                     | No                                         |

### Decision Criteria

- **GO:** CVR >= 2% AND CPL <= $50 AND customer satisfaction >= 4/5 AND week-2 retention >= 60% AND min. 10 customers served. Solution works. Customer values the outcome. Proceed to `service_pilot` for scalability testing or directly to build.
- **KILL:** CVR < 0.5% OR CPL > $100 OR satisfaction < 3/5 OR retention < 30%.
- **PIVOT:** Metrics in amber range. Options: adjust the deliverable, change the delivery format, narrow the ICP to the highest-satisfaction segment, adjust pricing.
- **INVALID:** Fewer than 5 customers served.

### When to Use

- **Use when:** You have validated demand and WTP but are unsure if the solution actually works. The service can be delivered manually by the founder. You want to learn what customers actually need before building automation. Discovery interviews surfaced uncertainty about the right solution approach.
- **Do not use when:** Demand has not been validated (run Demand Signal tests first). The solution cannot be delivered manually (requires software/hardware from day one). You do not have the operational capacity to serve 10-15 customers by hand.

### Worked Example

> **Venture:** CompetitorPulse — automated competitor tracking for B2B marketers
>
> **Prior tests:** `fake_door` GO, `priced_waitlist` GO (34 signups at $99/mo).
>
> **Test setup:** LinkedIn campaign targeting the same segment. Landing page describes: "We track your top 5 competitors weekly and deliver a concise report every Monday." Price: $99/mo with first month free. Application form asks: company name, top 5 competitors, what decisions they make based on competitive intel. Budget: $400 over 21 days.
>
> **Results:** 1,200 sessions, 18 applications. CVR = 1.5% (below target but within amber). 12 qualified and onboarded. Founder spent ~3 hours per customer per week using manual Google Alerts + LinkedIn monitoring + a custom spreadsheet. Satisfaction: 4.3/5. Week-2 retention: 83%.
>
> **Decision:** PIVOT — CVR in amber range, but satisfaction and retention are excellent. The customers who sign up love it. Pivot approach: narrower targeting to the exact ICP that converts, and test whether the application form is creating unnecessary friction. Re-run with simplified signup.

---

## 3.7 `service_pilot` — Solution Validation

**Description:** A service pilot is a small-scale, time-limited delivery of the actual service to a cohort of customers. Unlike a concierge test (which delivers manually), a service pilot uses early versions of actual tooling, processes, or automation. It operates as a "beta" — the customer knows they are an early adopter and provides feedback in exchange for a discounted rate or enhanced support.

**What it validates:** Operational viability — can the solution be delivered at reasonable cost and quality as it begins to scale beyond pure manual effort? Validates the transition from concierge to product.

**Signal capture:** Lead capture + onboarding + service delivery over a defined pilot period. Conversion is signup; secondary metrics are satisfaction, retention, operational cost per customer, and NPS.

### Metrics & Thresholds

| Metric                             | Target (GO) | Amber (Investigate) | Kill          |
| ---------------------------------- | ----------- | ------------------- | ------------- |
| CVR (sessions to signup)           | >= 1.5%     | 0.5% - 1.5%         | < 0.5%        |
| CPL (cost per lead)                | <= $50      | $50 - $100          | > $100        |
| Customer satisfaction (NPS or 1-5) | >= 4/5      | 3 - 4/5             | < 3/5         |
| Retention (end of pilot)           | >= 50%      | 25% - 50%           | < 25%         |
| Operational cost per customer      | Sustainable | Marginal            | Unsustainable |
| Min. conversions                   | >= 10       | 5 - 10              | < 5 (INVALID) |

### Kill Criteria JSON

```json
{
  "version": 1,
  "rules": [
    {
      "metric": "cvr_bp",
      "operator": "lt",
      "threshold": 50,
      "label": "Conversion rate below 0.5%"
    },
    {
      "metric": "cpl_cents",
      "operator": "gt",
      "threshold": 10000,
      "label": "Cost per lead exceeds $100"
    },
    {
      "metric": "total_spend_cents",
      "operator": "gte",
      "threshold": 50000,
      "label": "Total spend reaches $500 budget cap"
    },
    {
      "metric": "days_elapsed",
      "operator": "gt",
      "threshold": 30,
      "label": "Test duration exceeds 30 days"
    }
  ]
}
```

### Budget & Duration

| Parameter                         | Value                           |
| --------------------------------- | ------------------------------- |
| Budget range (ad spend)           | $300 - $500                     |
| Duration                          | 21 - 30 days                    |
| Min. sample (sessions)            | 1,000                           |
| Min. conversions for valid result | 10                              |
| Operational commitment            | Pilot cohort of 10-15 customers |

### Landing Page Spec

- **Template:** Beta/pilot program landing page
- **Sections:** Headline (beta program framing), what the pilot includes, pilot timeline and commitment, what the customer gets (deliverables + pricing), what we ask in return (feedback, survey participation), application form, FAQ, footer
- **CTA:** "Apply for the Beta" / "Join the Pilot Program" / "Become a Founding Member"
- **Qualification:** Application form with screening questions. Pilot capacity is limited — communicate scarcity honestly.
- **Post-signup:** Personal outreach, onboarding call, pilot agreement (informal or formal depending on price point)
- **Service delivery:** Using early tooling, semi-automated processes, or hybrid manual/automated approach

### CopyPack Requirements

- `headline` — beta/pilot program framing with value emphasis
- `subheadline` — what makes the pilot special (early access, discounted rate, direct founder access)
- `value_props` — 3-5 pilot deliverables
- `cta_primary` — application CTA with scarcity signal
- `social_proof` — prior validation numbers, concierge customer testimonials if available
- `urgency_hook` — required ("Limited to 15 pilot members" / "Applications close March 31")
- `ad_headlines`, `ad_descriptions` — beta/early-access oriented variants
- `meta_title`, `meta_description`, `og_title`, `og_description`

### Buildability Rating

**Buildability: 5/5** — Highest buildability requirement. Requires early tooling and operational infrastructure.

| Checklist Item                                                 | Required?                   |
| -------------------------------------------------------------- | --------------------------- |
| Landing page (pilot program template)                          | Yes                         |
| Application / screening form                                   | Yes                         |
| Early-version tooling or semi-automated delivery               | Yes                         |
| Onboarding process / documentation                             | Yes                         |
| Feedback collection mechanism (survey, interviews)             | Yes                         |
| Operational playbook (who does what, when)                     | Yes                         |
| Email sequences (Kit) — onboarding, updates, feedback requests | Yes                         |
| Ad account + campaign                                          | Yes                         |
| Payment integration (Stripe)                                   | Recommended                 |
| Customer support channel (email, Slack, etc.)                  | Yes                         |
| Custom development                                             | Yes (early product version) |

### Decision Criteria

- **GO:** CVR >= 1.5% AND CPL <= $50 AND satisfaction >= 4/5 AND pilot retention >= 50% AND operational cost is sustainable AND min. 10 pilot customers. The venture works. Proceed to full product build and launch.
- **KILL:** CVR < 0.5% OR CPL > $100 OR satisfaction < 3/5 OR retention < 25% OR operational cost is unsustainable (cannot serve customers without losing money even at scale pricing).
- **PIVOT:** Metrics in amber range. Options: adjust the product scope, change the delivery model, narrow to the highest-value segment, revise pricing to cover operational cost.
- **INVALID:** Fewer than 5 pilot customers completing the full pilot period.

### When to Use

- **Use when:** Concierge test validated solution-market fit and you need to test operational viability at slightly larger scale. You have early tooling or automation to reduce per-customer effort. You want to validate the transition from manual to product before investing in full build.
- **Do not use when:** You have not validated the solution manually (run `concierge` first). You do not have any tooling or automation ready. The product is purely digital and can be built directly (skip to build after `presale` or `concierge`).

### Worked Example

> **Venture:** CompetitorPulse — automated competitor tracking for B2B marketers
>
> **Prior tests:** `fake_door` GO, `priced_waitlist` GO, `concierge` PIVOT (narrowed ICP, improved signup flow).
>
> **Test setup:** LinkedIn campaign targeting VP Marketing and Head of Marketing at B2B SaaS companies (100-500 employees) — the narrowed ICP from the concierge pivot. Landing page: "Join the CompetitorPulse Beta — 15 Spots Available." Pilot terms: $49/mo for 3 months (50% off launch price), weekly competitor report, direct Slack channel with founder, monthly strategy call. Application form asks about team size, number of competitors tracked, current process.
>
> **Results:** 900 sessions, 22 applications, 14 accepted into pilot. CVR = 2.4%. CPL = $28.57. After 30-day pilot: satisfaction 4.6/5, retention 86% (12 of 14 still active), NPS 72. Operational cost: ~1.5 hours per customer per week using a combination of custom scripts and manual review. At scale pricing ($99/mo) with 50% automation, unit economics work.
>
> **Decision:** GO — all metrics exceed thresholds. Strong satisfaction and retention. Operational cost is sustainable with planned automation. Proceed to full product build.

---

# 4. Hypothesis Card to Test Type Selection

The Hypothesis Card's **Key Assumptions** are the primary driver for test type selection. Each assumption is categorized by what it needs to validate, which maps to a category on the Validation Ladder.

## Assumption Type Mapping

| Assumption Type       | Question Being Asked                                     | Validation Ladder Category | Starting Archetype                    |
| --------------------- | -------------------------------------------------------- | -------------------------- | ------------------------------------- |
| Demand                | "Do people have this problem and care about solving it?" | Demand Signal              | `fake_door`                           |
| Problem awareness     | "Do people know they have this problem?"                 | Demand Signal              | `content_magnet`                      |
| Willingness to pay    | "Will people pay $X for this solution?"                  | Willingness to Pay         | `priced_waitlist`                     |
| Price sensitivity     | "What price point maximizes conversion?"                 | Willingness to Pay         | `priced_waitlist` (with tier testing) |
| Solution fit          | "Does our solution actually solve the problem?"          | Solution Validation        | `concierge`                           |
| Operational viability | "Can we deliver this at reasonable cost?"                | Solution Validation        | `service_pilot`                       |

## Within-Category Selection Criteria

When the assumption type maps to a category with multiple archetypes, use these criteria to select the starting archetype:

### Demand Signal: `fake_door` vs. `waitlist` vs. `content_magnet`

| Criterion                  | `fake_door`             | `waitlist`                         | `content_magnet`                |
| -------------------------- | ----------------------- | ---------------------------------- | ------------------------------- |
| Prior demand signal exists | No                      | No or some                         | Any                             |
| Product concept clarity    | Vague                   | Clear                              | Problem-clear, solution-vague   |
| Budget available           | < $300                  | $300-500                           | $200-400                        |
| Time to launch             | 1-2 days                | 3-5 days                           | 5-7 days (content creation)     |
| Best when                  | First test, zero signal | Concept is concrete, want audience | Problem is information-oriented |

### Willingness to Pay: `priced_waitlist` vs. `presale`

| Criterion                      | `priced_waitlist` | `presale`                                        |
| ------------------------------ | ----------------- | ------------------------------------------------ |
| Stripe integration ready       | Not required      | Required                                         |
| Price point confidence         | Testing price     | Price validated or strong hypothesis             |
| Legal comfort with pre-selling | N/A               | Must be comfortable collecting payment pre-build |
| Refund infrastructure          | N/A               | Required                                         |
| Best when                      | First WTP test    | Strong WTP signal, want actual payment data      |

### Solution Validation: `concierge` vs. `service_pilot`

| Criterion                 | `concierge`                                 | `service_pilot`                           |
| ------------------------- | ------------------------------------------- | ----------------------------------------- |
| Early tooling exists      | No                                          | Yes                                       |
| Founder time available    | 2-5 hrs/customer                            | 1-2 hrs/customer (tooling reduces effort) |
| Prior solution validation | None                                        | Concierge confirmed solution fit          |
| Best when                 | First solution test, want to learn by doing | Transitioning from manual to product      |

## Decision Tree Walkthrough

1. **Read the Hypothesis Card's Key Assumptions.** Identify the highest-risk assumption.
2. **Categorize the assumption** using the Assumption Type Mapping table.
3. **Select the category** on the Validation Ladder (Demand Signal, WTP, Solution Validation).
4. **Within the category**, use the selection criteria to pick the starting archetype.
5. **Check the Discovery Gate** (see below).
6. **Generate the Test Blueprint** with the selected archetype's defaults.

## Discovery Gate Check

Before entering any test, verify the Discovery Summary meets minimum requirements:

| Gate Criterion       | Requirement                     | If Not Met                                |
| -------------------- | ------------------------------- | ----------------------------------------- |
| Interviews completed | >= 5                            | Return to Step 2                          |
| Problem confirmed    | >= 3/5 interviewees confirm     | Return to Step 2 or Step 1                |
| Pain severity        | >= 3/5 average                  | Return to Step 2 or reconsider venture    |
| ICP specificity      | Can find 5 real people matching | Return to Step 1, refine Customer Segment |

Exception: A `fake_door` test can run with fewer than 5 interviews if the Hypothesis Card confidence is "Proceed" and the venture is in rapid screening mode. This exception must be explicitly noted in the Test Blueprint.

---

# 5. The Test Blueprint — Artifact Specification

The Test Blueprint is the Step 3 output artifact. It fully specifies the experiment design, metrics, thresholds, and decision criteria for a single validation test.

## Field Specification

| Field                      | Description                                 | Source                                 |
| -------------------------- | ------------------------------------------- | -------------------------------------- |
| `experiment_id`            | SC experiment ID (format: SC-YYYY-NNN)      | System-generated                       |
| `hypothesis_card_ref`      | Reference to the source Hypothesis Card     | From Step 1                            |
| `discovery_summary_ref`    | Reference to the Discovery Summary          | From Step 2                            |
| `archetype`                | Selected test archetype                     | Test type selection (Section 4)        |
| `category`                 | Validation Ladder category                  | Derived from archetype                 |
| `assumption_under_test`    | The specific Key Assumption being tested    | From Hypothesis Card                   |
| `primary_metric`           | The metric used for GO/KILL decision        | Archetype default                      |
| `target_threshold`         | GO threshold for primary metric             | Archetype default (overridable)        |
| `kill_threshold`           | KILL threshold for primary metric           | Archetype default (overridable)        |
| `secondary_metrics`        | Additional metrics tracked                  | Archetype default                      |
| `kill_criteria`            | Full kill criteria JSON                     | Archetype default (overridable)        |
| `budget_cents`             | Ad spend budget in cents                    | Archetype range, specific value chosen |
| `duration_days`            | Test duration                               | Archetype default                      |
| `min_conversions`          | Minimum conversions for valid result        | Archetype default                      |
| `landing_page_template`    | Which landing page template to use          | Archetype default                      |
| `copy_pack_requirements`   | Required CopyPack fields for this archetype | Archetype default                      |
| `buildability_rating`      | 1-5 buildability score                      | Archetype default                      |
| `buildability_checklist`   | Items needed before launch                  | Archetype default                      |
| `build_cost_estimate`      | Estimated cost/time to prepare the test     | Assessed per-experiment                |
| `technical_risks`          | Known technical risks or dependencies       | Assessed per-experiment                |
| `decision_criteria`        | GO/KILL/PIVOT/INVALID rules                 | Archetype default (overridable)        |
| `discovery_gate_exception` | Whether Discovery Gate was waived (and why) | Assessed per-experiment                |
| `sequence_position`        | Which rung on the Validation Ladder         | Derived from test history              |
| `prior_test_ref`           | Reference to prior test in the sequence     | From test history                      |

## Two Completion Stages

### Stage 1: Draft Blueprint

Generated automatically when archetype is selected. All archetype defaults are populated. Fields requiring human input are flagged as incomplete.

**Auto-populated from archetype defaults:**

- `archetype`, `category`, `primary_metric`, `target_threshold`, `kill_threshold`, `secondary_metrics`, `kill_criteria`, `duration_days`, `min_conversions`, `landing_page_template`, `copy_pack_requirements`, `buildability_rating`, `buildability_checklist`, `decision_criteria`

**Require human input:**

- `assumption_under_test`, `budget_cents` (within archetype range), `build_cost_estimate`, `technical_risks`, `discovery_gate_exception` (if applicable)

### Stage 2: Final Blueprint

Reviewed and approved by the founder. All fields complete. Threshold overrides documented with rationale. Build checklist items verified. Ready to hand off to Step 4 (Campaign Package).

**Approval checklist:**

- All fields populated
- Budget within archetype range (or override documented)
- Threshold overrides justified (if any)
- Discovery Gate met (or exception documented)
- Buildability checklist items available or scheduled
- Technical risks acknowledged

---

# 5.5. Test Blueprint Schema Sketch

Field specification for the `test_blueprint` JSONB column, to minimize interpretation during implementation:

```json
{
  "experiment_id": { "type": "string", "required": true, "pattern": "^SC-\\d{4}-\\d{3}[a-z]?$" },
  "hypothesis_card_ref": { "type": "string", "required": true },
  "discovery_summary_ref": { "type": "string", "required": false },
  "archetype": {
    "type": "string",
    "required": true,
    "enum": [
      "fake_door",
      "waitlist",
      "content_magnet",
      "priced_waitlist",
      "presale",
      "concierge",
      "service_pilot"
    ]
  },
  "category": {
    "type": "string",
    "required": true,
    "enum": ["demand_signal", "willingness_to_pay", "solution_validation"]
  },
  "assumption_under_test": {
    "type": "object",
    "required": true,
    "properties": {
      "claim": { "type": "string", "required": true },
      "evidence": { "type": "string" },
      "risk": { "type": "string", "enum": ["high", "medium", "low"] },
      "basis": { "type": "string" }
    }
  },
  "metrics": {
    "type": "object",
    "required": true,
    "properties": {
      "primary_metric": { "type": "string", "enum": ["cvr_bp", "cpl_cents", "roas_bp"] },
      "target_threshold": { "type": "integer", "required": true },
      "kill_threshold": { "type": "integer", "required": true },
      "secondary_metrics": {
        "type": "array",
        "items": {
          "metric": "string",
          "target": "integer",
          "kill": "integer"
        }
      }
    }
  },
  "kill_criteria": {
    "type": "object",
    "required": true,
    "description": "KillCriteriaSchema from tech spec Section 3.4"
  },
  "budget_cents": { "type": "integer", "required": true, "min": 10000, "max": 100000 },
  "duration_days": { "type": "integer", "required": true, "min": 7, "max": 30 },
  "min_conversions": { "type": "integer", "required": true, "min": 5 },
  "landing_page": {
    "type": "object",
    "required": true,
    "properties": {
      "template": { "type": "string", "required": true },
      "sections": { "type": "array", "items": { "type": "string" } },
      "cta_text": { "type": "string" },
      "post_cta_behavior": { "type": "string" }
    }
  },
  "copy_pack_requirements": {
    "type": "object",
    "required": true,
    "properties": {
      "required_fields": { "type": "array", "items": { "type": "string" } },
      "optional_fields": { "type": "array", "items": { "type": "string" } },
      "additional_requirements": { "type": "array", "items": { "type": "string" } }
    }
  },
  "buildability": {
    "type": "object",
    "required": true,
    "properties": {
      "rating": { "type": "integer", "min": 1, "max": 5 },
      "checklist": {
        "type": "array",
        "items": {
          "item": "string",
          "required": "boolean",
          "status": { "type": "string", "enum": ["ready", "pending", "not_needed"] }
        }
      }
    }
  },
  "build_cost_estimate": { "type": "string", "required": false, "maxLength": 500 },
  "technical_risks": {
    "type": "array",
    "required": false,
    "items": { "type": "string" },
    "maxItems": 5
  },
  "decision_criteria": {
    "type": "object",
    "required": true,
    "properties": {
      "go": { "type": "string", "required": true },
      "kill": { "type": "string", "required": true },
      "pivot": { "type": "string", "required": true },
      "invalid": { "type": "string", "required": true }
    }
  },
  "discovery_gate": {
    "type": "object",
    "required": true,
    "properties": {
      "met": { "type": "boolean", "required": true },
      "exception": { "type": "boolean", "default": false },
      "exception_rationale": { "type": "string" }
    }
  },
  "sequence": {
    "type": "object",
    "required": false,
    "properties": {
      "position": { "type": "integer", "min": 1 },
      "prior_test_ref": { "type": "string" },
      "prior_test_outcome": { "type": "string", "enum": ["go", "pivot"] }
    }
  },
  "threshold_overrides": {
    "type": "array",
    "required": false,
    "items": {
      "metric": "string",
      "default_value": "integer",
      "override_value": "integer",
      "rationale": "string"
    }
  },
  "stage": { "type": "string", "enum": ["draft", "final"], "required": true }
}
```

---

# 6. Test Sequencing — The Validation Ladder in Practice

The Validation Ladder is not just a taxonomy — it is a **sequence**. Ventures climb the ladder rung by rung, with each test building on the signal from the previous one. Each rung requires a GO verdict (or a justified skip) before proceeding to the next.

## Standard Sequence (3 Rungs)

The default validation sequence for a new venture hypothesis:

**Rung 1: Demand Signal** — Does anyone care?

- Start with `fake_door` (cheapest, fastest) or `content_magnet` (if problem is information-oriented)
- Requires: Hypothesis Card (Tier 1) + Discovery Summary
- Budget: $150-$400
- Duration: 7-14 days

**Rung 2: Willingness to Pay** — Will they pay?

- `priced_waitlist` (if testing price) or `presale` (if collecting payment)
- Requires: Rung 1 GO + Hypothesis Card (Tier 2)
- Budget: $300-$500
- Duration: 14-21 days

**Rung 3: Solution Validation** — Does it work?

- `concierge` (manual delivery) then `service_pilot` (early tooling)
- Requires: Rung 2 GO
- Budget: $300-$500 + operational time
- Duration: 21-30 days

**Total standard sequence:** $750-$1,400 in ad spend, 6-10 weeks, 3-4 tests.

## Accelerated Sequence

For ventures with strong prior signal (e.g., founder domain expertise, existing audience, competitor validation):

**Skip Rung 1** if the Discovery Summary shows pain severity >= 4/5 AND the founder has direct domain experience AND the Hypothesis Card confidence is "Proceed." Enter directly at Rung 2.

**Combine Rungs 2 + 3** if the service can be delivered immediately after purchase. Run a `presale` that transitions into `concierge` delivery for buyers. One test validates both WTP and solution fit.

**Accelerated total:** $300-$500 in ad spend, 3-4 weeks, 1-2 tests.

## Entry Point Determination

| Signal Available                                   | Recommended Entry                         |
| -------------------------------------------------- | ----------------------------------------- |
| Zero — new idea, no validation                     | Rung 1: `fake_door`                       |
| Problem confirmed in interviews only               | Rung 1: `waitlist` or `content_magnet`    |
| Demand validated (prior test or existing audience) | Rung 2: `priced_waitlist`                 |
| Demand + WTP validated                             | Rung 3: `concierge`                       |
| Demand + WTP + solution validated (concierge)      | Rung 3: `service_pilot`                   |
| All validated                                      | Exit Validation Ladder — proceed to build |

## Budget Allocation Across the Ladder

The strategy session established a $1,500 total spend cap across pivots. Here is the recommended allocation for a standard 3-rung sequence:

| Rung    | Test(s)                         | Budget Allocation | Cumulative  |
| ------- | ------------------------------- | ----------------- | ----------- |
| 1       | `fake_door` or `content_magnet` | $150-$300         | $150-$300   |
| 2       | `priced_waitlist`               | $300-$500         | $450-$800   |
| 3       | `concierge` + `service_pilot`   | $300-$500         | $750-$1,300 |
| Reserve | Pivot budget (1 retry)          | $200-$300         | $950-$1,500 |

If a venture reaches $1,500 cumulative spend without a clear GO at Rung 2 or above, a forced kill-or-park decision is required per the strategy session's Pivot Rules.

## Confidence Score Interaction

The Hypothesis Card's confidence score affects budget allocation:

| Confidence    | Effect on Budget                                          |
| ------------- | --------------------------------------------------------- |
| **Proceed**   | Standard budget allocation per archetype                  |
| **Uncertain** | Minimum budget per archetype; save more for pivot reserve |
| **Abandon**   | No test. Kill at Step 1.                                  |

"Uncertain" ventures get the minimum end of each archetype's budget range, preserving more of the $1,500 cap for potential pivots. "Proceed" ventures get standard allocation.

---

# 7. Kill Criteria Defaults & Calibration

## Summary Table — All Archetypes

| Archetype         | Primary Metric | GO      | Kill   | CPL Target   | CPL Kill   | Budget   | Duration   |
| ----------------- | -------------- | ------- | ------ | ------------ | ---------- | -------- | ---------- |
| `fake_door`       | CVR            | >= 2%   | < 0.5% | <= $8        | > $20      | $150-300 | 7 days     |
| `waitlist`        | CVR            | >= 3%   | < 1%   | <= $15       | > $30      | $300-500 | 14 days    |
| `content_magnet`  | CVR            | >= 5%   | < 2%   | <= $10       | > $25      | $200-400 | 14 days    |
| `priced_waitlist` | CVR            | >= 1.5% | < 0.5% | <= $30       | > $50      | $300-500 | 14 days    |
| `presale`         | CVR            | >= 1%   | < 0.3% | ROAS >= 100% | ROAS < 30% | $300-500 | 14-21 days |
| `concierge`       | CVR            | >= 2%   | < 0.5% | <= $50       | > $100     | $300-500 | 21 days    |
| `service_pilot`   | CVR            | >= 1.5% | < 0.5% | <= $50       | > $100     | $300-500 | 21-30 days |

## Override Mechanics

Archetype defaults are starting points. Threshold overrides are permitted with documented rationale in the Test Blueprint. Common override scenarios:

| Scenario                      | Override                    | Rationale                                                                 |
| ----------------------------- | --------------------------- | ------------------------------------------------------------------------- |
| B2B with high ACV             | Increase CPL kill threshold | Higher customer lifetime value justifies higher acquisition cost          |
| Low-price consumer product    | Decrease CPL target         | Unit economics require cheap leads                                        |
| Niche market with small TAM   | Decrease min. conversions   | Total addressable traffic is limited                                      |
| Seasonal product              | Extend duration             | Need to account for day-of-week and seasonal traffic patterns             |
| Platform with network effects | Decrease CVR threshold      | Initial conversion is expected to be low; value comes from network growth |

**Override rules:**

1. Every override must include a written rationale in the `threshold_overrides` array
2. Overrides cannot weaken a kill threshold by more than 50% (e.g., CVR kill of 0.5% cannot be lowered below 0.25%)
3. Budget overrides above the archetype range require explicit founder approval
4. Duration overrides beyond 30 days are not permitted — long-running tests indicate a different archetype is needed

## Hard Kill vs. Soft Kill

The strategy session defined Hard Kill and Soft Kill criteria. Here is how they interact with archetype-specific thresholds:

### Hard Kill (Immediate — No Second Chance)

These criteria apply universally across all archetypes:

- CTR < 0.4% after 1,000+ impressions — the ad is not compelling enough to click
- Zero conversions after full budget spend — complete failure to convert
- 0 out of 5+ interviews confirming the problem exists — the problem is not real

A Hard Kill triggers an immediate Decision Memo with KILL verdict. No messaging swap, no budget extension, no second chance.

### Soft Kill (After One Creative/Messaging Swap)

These criteria trigger a "last chance" creative rotation before final kill:

- Primary metric below 50% of target threshold — signals are weak but not zero
- CPL exceeds 2x the kill threshold — costs are out of control
- All viable audience segments tested with no segment clearing threshold

After a creative swap, if metrics do not improve above the kill threshold within 50% of the remaining budget, the test is killed.

## Calibration Plan

The current thresholds are based on industry benchmarks and Lean Startup literature. They will be calibrated over time as SC accumulates validation data.

### Phase 1: Industry Defaults (Now)

Use the thresholds defined in this document. They are deliberately conservative — it is better to kill ventures that might have worked than to invest further in ventures that probably will not.

### Phase 2: Internal Benchmarking (After 10+ Tests)

After 10 completed tests across the portfolio:

- Calculate actual median CVR, CPL, and ROAS per archetype
- Adjust thresholds to reflect SC's actual performance distribution
- Set GO threshold at p75 (top quartile performance) and KILL at p25 (bottom quartile)

### Phase 3: Dynamic Calibration (After 50+ Tests)

After 50 completed tests:

- Category-specific and industry-specific thresholds
- Bayesian updating of thresholds based on new test results
- Confidence intervals on GO/KILL decisions
- This is Deep Dive #6 territory — covered there in detail

## Relationship to Decision Framework

The kill criteria defined here plug directly into the strategy session's Decision Framework:

- **Archetype kill thresholds** map to the "Soft Kill" criteria in the Decision Framework
- **Hard Kill criteria** are universal and override archetype-specific thresholds
- **Amber ranges** (between GO and KILL thresholds) map to the PIVOT routing logic
- **INVALID** outcomes trigger re-run or redesign, not a kill decision
- **Pivot Routing Table** uses the signal pattern (which metrics failed) to determine re-entry point

---

# 8. Answering the Six Questions

The strategy session identified six questions for this deep dive. Here are the answers:

**1. What are the standard test types Silicon Crane should offer?**

Seven archetypes organized into three categories: **Demand Signal** (`fake_door`, `waitlist`, `content_magnet`), **Willingness to Pay** (`priced_waitlist`, `presale`), and **Solution Validation** (`concierge`, `service_pilot`). The `interview` archetype is removed — customer discovery is now a foundational step, not a test type.

**2. How do you map from a story framework output to the right test type?**

The Hypothesis Card's **Key Assumptions** drive test type selection. Each assumption is categorized by type (demand, WTP, solution fit, operational viability), which maps to a Validation Ladder category. Within-category selection uses criteria including prior signal, budget, product concept clarity, and time to launch. See Section 4.

**3. What metrics and thresholds define pass/pivot/kill for each type?**

Each archetype has a full metrics table with GO, Amber, and Kill thresholds for primary and secondary metrics. The primary metric for all demand tests is CVR; for presale it is CVR + ROAS; for solution validation it adds satisfaction and retention. See Section 3 for per-archetype details and Section 7 for the summary table.

**4. How does this relate to the 7 archetypes already defined in the functional spec?**

Six of the seven original archetypes are retained with enhanced specifications. `interview` is removed (elevated to Step 2). `fake_door` is added. The archetypes are organized into three categories with explicit sequencing. The archetype CHECK constraint in the database schema requires a migration.

**5. Should we simplify, expand, or restructure the existing archetype system?**

Restructure. The count changed from 7 to 7 (one removed, one added), but the organization is fundamentally different. The three-category structure (Demand Signal / WTP / Solution Validation) and the ladder sequencing concept are new. The archetype definitions are significantly more detailed — each now has full metrics, kill criteria JSON, landing page spec, CopyPack requirements, buildability rating, and decision criteria.

**6. How are buildability fields (feasibility, cost, technical risks) assessed per archetype?**

Each archetype has a **buildability rating** (1/5 to 5/5) and a **buildability checklist** of items needed before launch. Ratings range from 1/5 for `fake_door` and `waitlist` (just a landing page and ad campaign) to 5/5 for `service_pilot` (early tooling, operational playbook, customer support channel). Build cost estimate and technical risks are assessed per-experiment in the Test Blueprint, not per-archetype. See the buildability sections in each archetype specification.

---

# 8.5. Answering DD#1's Open Questions

Deep Dive #1 concluded with four open questions for DD#2. Here are the answers:

**1. How do Key Assumptions map to specific test archetypes?**

Through the **Assumption Type Mapping** in Section 4. Each Key Assumption is categorized by type (demand, problem awareness, WTP, price sensitivity, solution fit, operational viability), which maps to a Validation Ladder category and a starting archetype. High-risk demand assumptions start at `fake_door`. High-risk WTP assumptions start at `priced_waitlist`. High-risk solution assumptions start at `concierge`.

**2. Does each archetype have a recommended Hypothesis Card template?**

No — the Hypothesis Card is archetype-agnostic by design. The card captures the hypothesis; the archetype captures the test design. However, certain Hypothesis Card fields are more relevant for certain archetypes. The **assumption_under_test** field in the Test Blueprint creates the explicit link between a specific Key Assumption and the archetype selected to test it.

**3. How does Competitive Landscape inform channel selection?**

Competitive Landscape (a Tier 2 Hypothesis Card field) informs channel selection through the Campaign Package (Step 4, Deep Dive #4), not through test type selection. However, if the Competitive Landscape reveals that competitors are already saturating a specific channel (e.g., Facebook ads for meal prep), the Test Blueprint can note this as a technical risk and recommend alternative channels.

**4. How does the confidence score interact with test budget allocation?**

Directly. See Section 6 (Confidence Score Interaction). "Proceed" ventures get standard budget allocation per archetype. "Uncertain" ventures get minimum budget per archetype, preserving more of the $1,500 total cap for potential pivots. "Abandon" triggers a Step 1 kill — no test budget is allocated.

---

# 9. Recommendations for Functional Spec v2.0

1. **Update the archetype CHECK constraint** to replace `interview` with `fake_door` and reorder to match the Validation Ladder sequence: `('fake_door','waitlist','content_magnet','priced_waitlist','presale','concierge','service_pilot')`.

2. **Add a `test_blueprint` JSONB column** to the experiments table, using the schema sketch in Section 5.5. This column stores the full Test Blueprint artifact.

3. **Add a `category` column** to the experiments table: `CHECK(category IN ('demand_signal','willingness_to_pay','solution_validation'))`. Derived from archetype but stored explicitly for query performance.

4. **Add a `sequence_position` INTEGER column** to track which rung of the Validation Ladder this experiment occupies. Combined with `prior_test_ref`, this enables sequencing queries.

5. **Add a `prior_test_ref` TEXT column** (nullable foreign key to experiments.id) to link sequential tests on the same venture hypothesis.

6. **Migrate existing `interview` experiments** to an archived status. Provide a migration script that sets `archetype = 'fake_door'` for any interview experiments that were actually demand tests, or archives them if they were true discovery exercises.

7. **Update the KillCriteria schema** to include Hard Kill vs. Soft Kill classification. Add a `severity` field (`hard` | `soft`) to each rule in the `rules` array.

8. **Add archetype defaults to the API** — when creating an experiment with a specified archetype, the API should auto-populate the `kill_criteria`, `max_duration_days`, and `max_spend_cents` fields from the archetype defaults defined in this document. Overrides are permitted but must include rationale.

9. **Define the Discovery Gate** as a pre-launch validation in the experiment lifecycle. Before an experiment can transition from `preflight` to `build` status, the system should verify that the Discovery Summary reference exists and meets minimum criteria (or that a gate exception is documented).

---

# 10. Open Questions for Deep Dive #3

1. How does the Discovery Summary artifact get populated from AI-conducted interview data? What is the schema?

2. What is the minimum viable interview process for a solopreneur — how many interviews, what structure, what tools?

3. Can AI agents conduct preliminary discovery interviews, and how does that data feed into the Discovery Summary?

4. How does interview data quality compare between AI-conducted and human-conducted interviews?

5. What screening criteria ensure interview candidates match the Hypothesis Card's Customer Segment?

6. How does the Discovery Gate (Section 4) interact with the Discovery Summary schema — what specific fields must be populated to pass the gate?
