# Deep Dive #5: Landing Page Automation & Generation — The Launchpad

> **Source:** New document (DD#5)
> **Document Type:** Deep Dive Working Document
> **Series:** SC Validation Methodology
> **Date:** March 2, 2026
> **Status:** Complete — pending functional spec integration
> **Parent:** SC Validation Methodology — Strategy Session (March 2026)
> **Prior:** Deep Dive #4: AI-Generated Marketing Content at Scale — The Campaign Factory

---

# 1. Purpose & Scope

This deep dive defines **The Launchpad** — the Step 5 system in the SC validation workflow that transforms a Campaign Package into a deployed, signal-capturing landing page. It specifies how landing pages are automatically generated from structured data, how per-archetype template architecture replaces the current single-template approach, and how A/B testing, channel-aware personalization, and signal capture integrate into the existing Astro + Cloudflare stack.

**What this document covers:**

- Why a single landing page template does not serve 7 archetypes with different signal capture needs
- A component-based template architecture for Astro 5 that maps each archetype to a template with shared layout + archetype-specific sections
- Per-archetype template specifications: required sections, form fields, CTA patterns, content blocks, and signal capture events
- How the CampaignPackage's `copy_pack`, `social_proof`, `tone`, `channel_variants`, and `ab_variants` fields flow into the landing page
- Client-side A/B testing via hash-based variant assignment — no third-party tools
- Channel-aware landing pages that customize the experience per traffic source using UTM parameters
- Signal capture architecture: event tracking per archetype, integration with `event_log`, and how signals feed `metrics_daily`
- Technology landscape assessment: why custom Astro templates are correct and landing page builders are wrong for SC
- The automation boundary: what is automated vs. what requires human input
- PIVOT handling: how landing pages respond to campaign pivots and CampaignPackage regeneration
- Schema changes and API endpoints needed for the functional spec v2.0
- Open questions for Deep Dive #6 (Measurement & Decision System)

**Relationship to DD#1 (The Venture Narrative):**

The Hypothesis Card's narrative elements reach the landing page through the CampaignPackage's CopyPack — headlines from The Struggle, urgency from The Stakes, value props from The Breakthrough, CTA framing from The Moment. The Launchpad consumes these through structured data, not by accessing the Hypothesis Card directly. The landing page is the last link in the chain: Hypothesis Card --> CampaignPackage --> Landing Page.

**Relationship to DD#2 (The Validation Ladder):**

DD#2 defines per-archetype landing page specs for all 7 archetypes — required sections, CTA patterns, form fields, and signal capture mechanisms. The current single template at `[slug].astro` handles only two modes: email capture (free) and Stripe redirect (priced). The Launchpad evolves this into a per-archetype template system that implements DD#2's specifications.

**Relationship to DD#3 (The Discovery Engine):**

The Discovery Summary's `top_quotes` appear on the landing page as social proof (via the CampaignPackage's `social_proof` field). The `pain_severity` score calibrates the page's emotional register through the CampaignPackage's `tone` field. Discovery data reaches the landing page indirectly, mediated by the Campaign Factory.

**Relationship to DD#4 (The Campaign Factory):**

The CampaignPackage is the Launchpad's primary input. DD#4 Section 17 raised six open questions about the CampaignPackage-to-landing-page boundary — this document answers all six. The CampaignPackage's `copy_pack` populates page content, `social_proof` populates testimonial sections, `tone` calibrates styling, `channel_variants` enable per-source customization, and `ab_variants` drive client-side A/B testing.

**The 10 questions this document answers:**

From the Strategy Session (4):

1. How do we automate landing page generation aligned to test types?
2. How do landing pages leverage the marketing assets produced for campaigns?
3. What is the minimum viable landing page system for validation?
4. How does this integrate with the existing pattern library concept in the functional spec?

From DD#4's Open Questions (6):

5. How does the CampaignPackage inform landing page template selection and generation?
6. What A/B test structure does the landing page implement from `campaign_package.ab_variants`?
7. How do landing page signal capture mechanisms differ by archetype?
8. What is the automation boundary between CampaignPackage and actual landing page deployment?
9. How does the landing page consume `channel_variants` for consistent messaging?
10. When a campaign PIVOTs, does the landing page auto-update from the regenerated CampaignPackage?

---

# 2. The Landing Page Problem

## Why a Single Template Does Not Work

The current landing page template (`apps/sc-web/src/pages/e/[slug].astro`) handles all experiments with one structure:

```
Headline --> Subheadline --> [Price badge if priced] --> Value Props --> [Payment CTA | Email Form]
```

This template serves two modes: email capture (for `waitlist`, `fake_door`, `content_magnet`) and Stripe redirect (for `priced_waitlist`, `presale`). It does not differentiate between archetypes. The problems:

1. **Missing sections.** DD#2 specifies archetype-specific sections: `content_magnet` needs a resource preview, `concierge` needs a service delivery process overview, `service_pilot` needs a pilot program description with scarcity signal. The current template has none of these.

2. **Missing form fields.** `concierge` and `service_pilot` need qualification/screening questions. `content_magnet` needs different post-submission behavior (immediate download vs. thank-you page). The current form is email + name + company for all archetypes.

3. **Missing signal capture.** The current template logs no events to `event_log`. There is no `page_view` tracking, no `form_start` tracking, no distinction between signal types per archetype. DD#2's metrics depend on these signals.

4. **No social proof section.** DD#4's CampaignPackage includes `social_proof` with verbatim quotes from discovery interviews. The current template has no mechanism to display these.

5. **No A/B testing.** DD#4's `ab_variants` specify variant-specific headlines, CTAs, and hero content. The current template renders one version for all visitors.

6. **No channel awareness.** DD#4's `channel_variants` provide per-channel copy optimized for each traffic source. The current template ignores UTM parameters for content customization.

## Why Custom Design Does Not Scale

At \$300-500 per test, custom landing page design is impossible:

| Approach                                  | Cost                            | Time                      | Per-Test Feasibility                             |
| ----------------------------------------- | ------------------------------- | ------------------------- | ------------------------------------------------ |
| Agency landing page design                | \$2,000-10,000                  | 1-3 weeks                 | No — exceeds entire test budget                  |
| Freelance landing page                    | \$500-1,500                     | 3-7 days                  | No — equals or exceeds test budget               |
| Landing page builder (Unbounce/Instapage) | \$99-199/month + setup time     | 2-4 hours per page        | Marginal — recurring cost, no data ownership     |
| Custom Astro templates (SC approach)      | \$0 incremental (already built) | Minutes (data population) | Yes — templates built once, reused per archetype |

The Launchpad's approach: **build 7 archetype templates once, populate them from CampaignPackage data automatically.** The incremental cost of each new landing page is zero — the template exists, the data comes from the Campaign Factory, and deployment is a database write + cache invalidation.

---

# 3. Template Architecture

## Design Principles

1. **Component-based.** Shared layout components (header, footer, form, social proof) + archetype-specific section components. DRY across archetypes.

2. **Data-driven.** Templates consume structured data from the CampaignPackage. No hardcoded copy. No per-experiment template editing.

3. **Progressive enhancement.** Base template works with just `copy_pack` (backward compatible with existing experiments). Enhanced features (social proof, A/B testing, channel awareness) activate when the corresponding CampaignPackage fields are present.

4. **Mobile-first.** DD#2 specifies mobile-first for all archetypes — the majority of ad traffic arrives on mobile. Templates use responsive Tailwind classes.

5. **Performance-oriented.** Astro's zero-JS-by-default architecture means landing pages ship minimal client-side JavaScript. Only the signal capture script, A/B variant logic, and form handling need JS — everything else is server-rendered HTML.

## File Structure

```
apps/sc-web/src/
  layouts/
    Base.astro                    -- Existing base layout (unchanged)
    LandingBase.astro             -- New: shared landing page layout (meta tags, tracking script, footer)
  components/
    landing/
      HeroSection.astro           -- Headline + subheadline + hero image
      ValueProps.astro            -- Value proposition list (3-5 bullets)
      SocialProof.astro           -- Discovery quotes section
      PricingSection.astro        -- Price display with tier options
      LeadCaptureForm.astro       -- Email + optional fields (name, company)
      QualificationForm.astro     -- Extended form with screening questions
      ContentPreview.astro        -- Resource preview for content_magnet
      ProcessSteps.astro          -- "How it works" 3-step process
      FaqSection.astro            -- Frequently asked questions
      RefundPolicy.astro          -- Refund policy display (presale)
      PilotDetails.astro          -- Pilot program specifics (service_pilot)
      PaymentCta.astro            -- Stripe checkout CTA
      SignalCapture.astro         -- Client-side event tracking script (island)
      AbVariantWrapper.astro      -- A/B variant assignment + rendering
  pages/
    e/
      [slug].astro                -- Existing: evolves to archetype-aware router
      [slug]/
        thank-you.astro           -- Existing: post-submission confirmation
        payment.astro             -- Existing: Stripe checkout redirect
```

## Archetype Router

The existing `[slug].astro` page evolves from a monolithic template into an archetype-aware router. It reads the experiment's archetype and delegates to the appropriate section composition:

```astro
---
// [slug].astro — Archetype Router
import LandingBase from '../../layouts/LandingBase.astro';
import { getExperimentBySlug } from '../../lib/api';
import { resolvePageConfig } from '../../lib/landing';

const { slug } = Astro.params;
if (!slug) return Astro.redirect('/404');

const experiment = await getExperimentBySlug(slug);
if (!experiment || !['launch', 'run'].includes(experiment.status)) {
  return Astro.redirect('/404');
}

// Parse structured data from experiment
const copyPack = experiment.copy_pack ? JSON.parse(experiment.copy_pack) : null;
const campaignPackage = experiment.campaign_package
  ? JSON.parse(experiment.campaign_package)
  : null;
const pageConfig = experiment.page_config
  ? JSON.parse(experiment.page_config)
  : null;

// Resolve page configuration: pageConfig overrides > archetype defaults
const config = resolvePageConfig(experiment.archetype, pageConfig, campaignPackage);
---

<LandingBase
  title={copyPack?.meta_title || experiment.name}
  description={copyPack?.meta_description || ''}
  ogTitle={copyPack?.og_title}
  ogDescription={copyPack?.og_description}
  experiment={experiment}
  config={config}
>
  <!-- Sections rendered based on config.sections array -->
  <!-- Each archetype has a default section order -->
  <!-- See Section 4 for per-archetype specifications -->
</LandingBase>
```

## The `resolvePageConfig` Function

This function merges archetype defaults with experiment-level overrides and CampaignPackage data. It is the central point where all landing page configuration converges.

```typescript
// lib/landing.ts

interface PageConfig {
  archetype: string
  sections: string[] // Ordered list of section component names
  formFields: string[] // Which form fields to display
  ctaStyle: 'email' | 'payment' | 'schedule' | 'download'
  showPricing: boolean
  showSocialProof: boolean
  showFaq: boolean
  showRefundPolicy: boolean
  showProcessSteps: boolean
  showContentPreview: boolean
  showPilotDetails: boolean
  signalEvents: string[] // Which events to track
  abEnabled: boolean
  channelAware: boolean
}

const ARCHETYPE_DEFAULTS: Record<string, PageConfig> = {
  fake_door: {
    archetype: 'fake_door',
    sections: ['hero', 'value_props', 'lead_capture'],
    formFields: ['email'],
    ctaStyle: 'email',
    showPricing: false,
    showSocialProof: false,
    showFaq: false,
    showRefundPolicy: false,
    showProcessSteps: false,
    showContentPreview: false,
    showPilotDetails: false,
    signalEvents: ['page_view', 'form_start', 'form_submit'],
    abEnabled: true,
    channelAware: true,
  },
  // ... defaults for all 7 archetypes (see Section 4)
}

function resolvePageConfig(
  archetype: string,
  overrides: Partial<PageConfig> | null,
  campaignPackage: CampaignPackage | null
): PageConfig {
  const defaults = ARCHETYPE_DEFAULTS[archetype]

  // Enable social proof only if CampaignPackage has quotes
  const hasSocialProof = campaignPackage?.social_proof?.quotes?.length > 0

  // Enable A/B testing only if CampaignPackage has variants
  const hasAbVariants = campaignPackage?.ab_variants?.length > 0

  return {
    ...defaults,
    showSocialProof: hasSocialProof,
    abEnabled: hasAbVariants,
    ...(overrides || {}),
  }
}
```

## Backward Compatibility

The architecture preserves backward compatibility with existing experiments:

- Experiments without a `campaign_package` continue to work — the template falls back to `copy_pack` data, matching current behavior.
- Experiments without a `page_config` use archetype defaults.
- The existing `copy_pack` column remains the primary content source for the landing page. When a CampaignPackage is present, `copy_pack` is a projection from it (per DD#4's write invariant).
- No migration is required for existing experiments. They render using the default section composition for their archetype, which for `waitlist` and `priced_waitlist` produces output functionally equivalent to the current template.

---

# 4. Per-Archetype Template Specifications

Each archetype maps to a section composition, form configuration, CTA pattern, and signal capture event list. These specifications implement DD#2's per-archetype landing page specs.

---

## 4.1 `fake_door` — Demand Signal

**Template goal:** Minimal page. Present the value proposition above the fold. Single CTA. Fastest possible load. Test whether anyone cares enough to leave their email.

**Sections (ordered):**

1. `HeroSection` — Headline + subheadline. No hero image required. Clean, focused.
2. `ValueProps` — 3 bullet points (functional benefit, emotional benefit, differentiation). Icon + text.
3. `LeadCaptureForm` — Email only. Single field. CTA button.

**Form fields:** `email` only.

**CTA pattern:** "Get Notified" / "Join the Waitlist" / "Notify Me When It Launches"

**Post-submission:** Redirect to thank-you page. Message: "Thanks! We'll notify you when we launch." No timeline promise. No product access.

**Signal capture events:**

| Event         | Trigger                            | Event Data                            |
| ------------- | ---------------------------------- | ------------------------------------- |
| `page_view`   | Page load                          | `{ archetype, variant_id, channel }`  |
| `form_start`  | First interaction with email field | `{ field: "email" }`                  |
| `form_submit` | Form submitted successfully        | `{ email_hash, variant_id, channel }` |

**Content from CampaignPackage:**

| CampaignPackage Field   | Landing Page Element    |
| ----------------------- | ----------------------- |
| `copy_pack.headline`    | HeroSection headline    |
| `copy_pack.subheadline` | HeroSection subheadline |
| `copy_pack.value_props` | ValueProps bullets      |
| `copy_pack.cta_text`    | Form submit button text |

**What is NOT shown:** Pricing, social proof, FAQ, process steps, content preview. This is the lightest-weight page.

---

## 4.2 `waitlist` — Demand Signal

**Template goal:** Expanded product description with email capture. More context than fake_door. Visitor understands the product concept and actively joins a waitlist.

**Sections (ordered):**

1. `HeroSection` — Headline + subheadline + optional hero image (from `asset_references`).
2. `ValueProps` — 3-5 features/benefits with descriptions.
3. `SocialProof` — Discovery quotes (if Tier 2 CampaignPackage). Omitted if Tier 1.
4. `LeadCaptureForm` — Email + name. Optional company (if `copy_pack.show_company !== false`).
5. `FaqSection` — Optional. 3-5 common questions.

**Form fields:** `email` (required), `name` (optional), `company` (optional, B2B only).

**CTA pattern:** "Join the Waitlist" / "Reserve Your Spot" / "Get Early Access"

**Post-submission:** Thank-you page with estimated timeline and option to share.

**Signal capture events:**

| Event          | Trigger                      | Event Data                            |
| -------------- | ---------------------------- | ------------------------------------- |
| `page_view`    | Page load                    | `{ archetype, variant_id, channel }`  |
| `scroll_depth` | 25%, 50%, 75%, 100% of page  | `{ depth_pct }`                       |
| `form_start`   | First form field interaction | `{ field }`                           |
| `form_submit`  | Form submitted               | `{ email_hash, variant_id, channel }` |

**Content from CampaignPackage:**

| CampaignPackage Field   | Landing Page Element                         |
| ----------------------- | -------------------------------------------- |
| `copy_pack.headline`    | HeroSection headline                         |
| `copy_pack.subheadline` | HeroSection subheadline                      |
| `copy_pack.body_copy`   | Problem/solution narrative below hero        |
| `copy_pack.value_props` | ValueProps bullets                           |
| `copy_pack.cta_text`    | Form submit button text                      |
| `social_proof.quotes`   | SocialProof section (anonymized attribution) |
| `tone.register`         | CSS class modifier for emotional styling     |

---

## 4.3 `content_magnet` — Demand Signal

**Template goal:** Content-focused page with resource preview. Visitor downloads a free resource in exchange for email.

**Sections (ordered):**

1. `HeroSection` — Headline focused on the resource value ("The Freelancer's Tax Deduction Checklist").
2. `ContentPreview` — Resource preview: table of contents, sample page image, or 3 key takeaways.
3. `ValueProps` — 3 learning outcomes or takeaways from the resource.
4. `LeadCaptureForm` — Email only. CTA: "Download Free Guide."
5. `FaqSection` — Optional.

**Form fields:** `email` (required).

**CTA pattern:** "Download Free Guide" / "Get the Checklist" / "Access the Template"

**Post-submission:** Immediate delivery — either inline download link on thank-you page or email with attachment/link.

**Signal capture events:**

| Event                  | Trigger                                   | Event Data                            |
| ---------------------- | ----------------------------------------- | ------------------------------------- |
| `page_view`            | Page load                                 | `{ archetype, variant_id, channel }`  |
| `content_preview_view` | ContentPreview section enters viewport    | `{}`                                  |
| `form_start`           | First form field interaction              | `{ field }`                           |
| `form_submit`          | Form submitted                            | `{ email_hash, variant_id, channel }` |
| `resource_downloaded`  | Download link clicked (on thank-you page) | `{ resource_id }`                     |

**Additional configuration:** The `page_config` must include a `resource_url` field pointing to the downloadable resource (R2 key or external URL). The thank-you page renders a download button linked to this URL.

---

## 4.4 `priced_waitlist` — Willingness to Pay

**Template goal:** Product page with prominent pricing. Visitor sees the price BEFORE the CTA. Signup implies price acceptance.

**Sections (ordered):**

1. `HeroSection` — Headline + subheadline. Transformation-focused.
2. `ValueProps` — 3-5 features that justify the price point.
3. `PricingSection` — Clear, unambiguous pricing. If testing tiers, show all tiers.
4. `SocialProof` — Prior test numbers or discovery quotes.
5. `LeadCaptureForm` — Email + name. CTA includes price reference.
6. `FaqSection` — Pricing-related questions (refund policy, what is included, billing frequency).

**Form fields:** `email` (required), `name` (optional), `pricing_tier` (optional — radio buttons if testing tiers).

**CTA pattern:** "Join the Waitlist - \$X/mo" / "Reserve Your Spot at \$X" / "Get Early Access at Launch Price"

**Post-submission:** Thank-you page confirming the price they will pay and estimated launch timeline.

**Signal capture events:**

| Event                 | Trigger                        | Event Data                                               |
| --------------------- | ------------------------------ | -------------------------------------------------------- |
| `page_view`           | Page load                      | `{ archetype, variant_id, channel }`                     |
| `pricing_view`        | PricingSection enters viewport | `{ price_cents, tier }`                                  |
| `pricing_tier_select` | User selects a pricing tier    | `{ tier, price_cents }`                                  |
| `scroll_depth`        | 25%, 50%, 75%, 100%            | `{ depth_pct }`                                          |
| `form_start`          | First form field interaction   | `{ field }`                                              |
| `form_submit`         | Form submitted                 | `{ email_hash, variant_id, channel, tier, price_cents }` |

**Content from CampaignPackage:**

| CampaignPackage Field    | Landing Page Element                     |
| ------------------------ | ---------------------------------------- |
| `copy_pack.pricing_copy` | PricingSection description               |
| `copy_pack.urgency_hook` | Urgency banner or badge                  |
| `copy_pack.value_props`  | ValueProps bullets (price-justifying)    |
| `copy_pack.cta_text`     | Form submit button text (includes price) |
| `social_proof.quotes`    | SocialProof section                      |

---

## 4.5 `presale` — Willingness to Pay

**Template goal:** Full sales page with Stripe Checkout integration. Longest-form page. Visitor reads, decides, pays.

**Sections (ordered):**

1. `HeroSection` — Headline + subheadline. Transformation-focused, high urgency.
2. `ValueProps` — 5 features with benefit descriptions.
3. `ProcessSteps` — "How it works" — 3-step visual process.
4. `PricingSection` — Price with Stripe Buy button.
5. `SocialProof` — Waitlist count from prior tests + discovery quotes.
6. `RefundPolicy` — "Full refund within 30 days, no questions asked."
7. `FaqSection` — Product, pricing, refund, delivery timeline questions.
8. `PaymentCta` — Stripe Checkout redirect. Requires `stripe_price_id` and `stripe_product_id`.

**Form fields:** None (payment form is Stripe-hosted).

**CTA pattern:** "Buy Now - \$X" / "Pre-Order for \$X" / "Get Lifetime Access for \$X"

**Post-submission:** Stripe success redirect to confirmation page with receipt, expected delivery timeline, and "what happens next."

**Signal capture events:**

| Event              | Trigger                            | Event Data                            |
| ------------------ | ---------------------------------- | ------------------------------------- |
| `page_view`        | Page load                          | `{ archetype, variant_id, channel }`  |
| `scroll_depth`     | 25%, 50%, 75%, 100%                | `{ depth_pct }`                       |
| `pricing_view`     | PricingSection enters viewport     | `{ price_cents }`                     |
| `payment_start`    | User clicks Stripe Checkout button | `{ price_cents, variant_id }`         |
| `payment_complete` | Stripe webhook confirms payment    | `{ stripe_payment_id, amount_cents }` |
| `payment_failed`   | Stripe reports failure             | `{ error_code }`                      |

---

## 4.6 `concierge` — Solution Validation

**Template goal:** Service-focused page with application/signup flow. Emphasizes the outcome and the founder's direct involvement.

**Sections (ordered):**

1. `HeroSection` — Outcome-focused headline ("Get X Without Doing Y").
2. `ProcessSteps` — "How it works" — 3 steps showing the service delivery process.
3. `ValueProps` — 3-5 deliverables the customer receives.
4. `SocialProof` — Credibility: prior validation numbers, founder bio, or discovery quotes.
5. `PricingSection` — Optional (can be free for first customers).
6. `QualificationForm` — Extended form with screening questions for ICP fit.
7. `FaqSection` — Service delivery, time commitment, what happens after signup.

**Form fields:** `email` (required), `name` (required), `company` (required for B2B), plus 2-3 screening questions from `page_config.screening_questions`.

**CTA pattern:** "Apply Now" / "Get Started" / "Book Your Spot"

**Post-submission:** Personal welcome — thank-you page promises personal founder outreach within 24 hours.

**Signal capture events:**

| Event                         | Trigger                           | Event Data                                               |
| ----------------------------- | --------------------------------- | -------------------------------------------------------- |
| `page_view`                   | Page load                         | `{ archetype, variant_id, channel }`                     |
| `scroll_depth`                | 25%, 50%, 75%, 100%               | `{ depth_pct }`                                          |
| `form_start`                  | First form field interaction      | `{ field }`                                              |
| `screening_question_answered` | Each screening question completed | `{ question_id, answer_hash }`                           |
| `form_submit`                 | Application submitted             | `{ email_hash, variant_id, channel, screening_answers }` |

**Additional configuration:** `page_config.screening_questions` is an array of `{ id, label, type, options? }` objects defining the qualification questions. These are rendered by the `QualificationForm` component.

---

## 4.7 `service_pilot` — Solution Validation

**Template goal:** Beta/pilot program page. Emphasizes early access, limited capacity, and the exchange of feedback for value.

**Sections (ordered):**

1. `HeroSection` — Beta program framing with value emphasis.
2. `PilotDetails` — Pilot timeline, what is included, what is expected (feedback commitment), capacity limit.
3. `ValueProps` — 3-5 pilot deliverables.
4. `ProcessSteps` — Pilot journey: apply --> onboard --> use --> feedback.
5. `PricingSection` — Pilot pricing (discounted from launch price).
6. `SocialProof` — Prior concierge customer testimonials if available, or prior validation numbers.
7. `QualificationForm` — Application form with screening questions. Communicate scarcity honestly.
8. `FaqSection` — Pilot program specifics.

**Form fields:** `email` (required), `name` (required), `company` (required for B2B), plus screening questions from `page_config.screening_questions`.

**CTA pattern:** "Apply for the Beta" / "Join the Pilot Program" / "Become a Founding Member"

**Post-submission:** Personal outreach — thank-you page mentions limited spots and promises personal contact.

**Signal capture events:**

| Event                         | Trigger                              | Event Data                                               |
| ----------------------------- | ------------------------------------ | -------------------------------------------------------- |
| `page_view`                   | Page load                            | `{ archetype, variant_id, channel }`                     |
| `scroll_depth`                | 25%, 50%, 75%, 100%                  | `{ depth_pct }`                                          |
| `pilot_details_view`          | PilotDetails section enters viewport | `{}`                                                     |
| `form_start`                  | First form field interaction         | `{ field }`                                              |
| `screening_question_answered` | Each screening question completed    | `{ question_id, answer_hash }`                           |
| `form_submit`                 | Application submitted                | `{ email_hash, variant_id, channel, screening_answers }` |

---

## 4.8 Summary Table — All Archetypes

| Archetype         | Sections                                                                                  | Form Fields                     | CTA Style          | Signal Events | Social Proof |
| ----------------- | ----------------------------------------------------------------------------------------- | ------------------------------- | ------------------ | ------------- | ------------ |
| `fake_door`       | hero, value_props, form                                                                   | email                           | email              | 3             | No           |
| `waitlist`        | hero, value_props, social_proof, form, faq                                                | email, name, company            | email              | 4             | If Tier 2    |
| `content_magnet`  | hero, content_preview, value_props, form                                                  | email                           | download           | 5             | No           |
| `priced_waitlist` | hero, value_props, pricing, social_proof, form, faq                                       | email, name, tier               | email (with price) | 6             | If Tier 2    |
| `presale`         | hero, value_props, process, pricing, social_proof, refund, faq, payment                   | (Stripe-hosted)                 | payment            | 6             | Yes          |
| `concierge`       | hero, process, value_props, social_proof, pricing, qualification_form, faq                | email, name, company, screening | application        | 5             | If available |
| `service_pilot`   | hero, pilot_details, value_props, process, pricing, social_proof, qualification_form, faq | email, name, company, screening | application        | 6             | If available |

---

# 5. CampaignPackage to Landing Page Data Flow

## Data Flow Diagram

```
CampaignPackage (experiment.campaign_package)
  |
  |-- copy_pack -----------------> Page content (headline, subheadline, value_props, CTA text)
  |-- creative_brief ------------> Hero image selection, visual style
  |-- social_proof.quotes[] -----> SocialProof component (verbatim, anonymized)
  |-- tone ----------------------> CSS class modifier (rational | empathetic | urgent)
  |-- channel_variants[] --------> Per-source content overrides (via UTM matching)
  |-- ab_variants[] -------------> Client-side variant assignment (headline/CTA swaps)
  |-- asset_references[] --------> Hero image, section images (R2 URLs)
  |-- targeting ------------------> (Not used by landing page — campaign-side only)
  |-- budget --------------------> (Not used by landing page — campaign-side only)
  |-- provenance ----------------> (Not used by landing page — audit trail only)
```

## Field-Level Mapping

### copy_pack --> Page Content

| CopyPack Field   | Component                                                | Element                       |
| ---------------- | -------------------------------------------------------- | ----------------------------- |
| `headline`       | `HeroSection`                                            | `<h1>`                        |
| `subheadline`    | `HeroSection`                                            | `<p>` subtitle                |
| `body_copy`      | Below hero (waitlist, presale, concierge, service_pilot) | Narrative paragraph(s)        |
| `cta_text`       | `LeadCaptureForm` / `PaymentCta`                         | Submit button text            |
| `urgency_hook`   | `HeroSection` or `PricingSection`                        | Urgency badge/banner          |
| `value_props[]`  | `ValueProps`                                             | Bullet list with check icons  |
| `social_proof`   | `SocialProof` (fallback — simple string)                 | Quote or count display        |
| `pricing_copy`   | `PricingSection`                                         | Price description and context |
| `feature_list[]` | `ValueProps` (extended mode)                             | Feature grid or list          |
| `refund_policy`  | `RefundPolicy`                                           | Policy text block             |

### social_proof --> SocialProof Component

When `campaign_package.social_proof` is present (Tier 2 only), the `SocialProof` component renders each quote with:

- Verbatim quote text (no modification)
- Anonymized attribution (e.g., "Marketing Manager, B2B SaaS (50-200 employees)")
- Pain dimension indicator (not shown to visitor, used for placement logic)

**Placement logic:** Quotes tagged with `functional` pain dimension appear near feature descriptions. Quotes tagged with `emotional` appear near the CTA. Quotes tagged with `opportunity_cost` appear near urgency hooks. If only one quote exists, it appears above the form.

### tone --> Visual Styling

The `tone.register` field controls CSS class modifiers applied to the page:

| Register     | CSS Class         | Visual Effect                                                              |
| ------------ | ----------------- | -------------------------------------------------------------------------- |
| `rational`   | `tone-rational`   | Clean blue/gray palette, professional typography, subdued CTAs             |
| `empathetic` | `tone-empathetic` | Warm palette, slightly larger type, supportive language framing            |
| `urgent`     | `tone-urgent`     | High-contrast palette, bold CTAs, urgency badges, countdown-style elements |

These classes modify Tailwind utility compositions at the layout level:

```css
/* Example: CTA button styling per register */
.tone-rational .cta-primary {
  @apply bg-blue-600 hover:bg-blue-700;
}
.tone-empathetic .cta-primary {
  @apply bg-teal-600 hover:bg-teal-700;
}
.tone-urgent .cta-primary {
  @apply bg-red-600 hover:bg-red-700 font-bold;
}
```

### asset_references --> Images

R2 keys in `asset_references` are resolved to public URLs at render time. The first image with a matching aspect ratio becomes the hero image. Additional images populate section illustrations.

```typescript
// lib/landing.ts
function resolveAssetUrl(r2Key: string): string {
  return `https://assets.siliconcrane.com/${r2Key}`
}
```

---

# 6. A/B Testing Implementation

## Design Constraints

- **No third-party tools.** No Optimizely, VWO, Google Optimize. These add cost, complexity, and external dependencies to a \$300-500 validation test.
- **Simple.** Two variants maximum per test. Hash-based assignment. No multi-armed bandits, no Bayesian optimization. Those are DD#6 territory when SC has 50+ tests of calibration data.
- **Deterministic.** Same visitor always sees same variant. No variant flipping between visits.
- **Stateless on server.** Variant assignment happens client-side. No server-side session state.

## Hash-Based Variant Assignment

When a visitor arrives, the landing page assigns them to a variant using a deterministic hash of their visitor ID and the experiment slug:

```javascript
// SignalCapture.astro (client-side script)

function assignVariant(visitorId, experimentSlug, variantCount) {
  // Create a deterministic hash from visitor ID + experiment slug
  const input = `${visitorId}:${experimentSlug}`
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  // Map hash to variant index (0 to variantCount-1)
  return Math.abs(hash) % variantCount
}

// Usage
const visitorId = getOrCreateId('sc_visitor_id')
const variantIndex = assignVariant(visitorId, experimentSlug, abVariants.length)
const activeVariant = abVariants[variantIndex]
```

**Why this works for validation testing:**

- At \$300-500 budgets generating 150-600 clicks, the sample sizes are small. A simple 50/50 split with a deterministic hash provides even distribution at these volumes.
- The hash function does not need cryptographic security — it needs consistent distribution. The djb2-style hash above provides adequate uniformity for two-variant splits.
- The visitor ID is stored in `localStorage`, ensuring the same visitor sees the same variant across page visits.

## What Variants Can Change

DD#4's `ab_variants` specify a `changes` object that overrides specific CopyPack fields. The landing page applies these overrides at render time:

```typescript
interface AbVariant {
  variant_id: string // "A" or "B"
  hypothesis: string // "Pain-led headline converts better than solution-led"
  changes: {
    headline?: string // Override copy_pack.headline
    subheadline?: string // Override copy_pack.subheadline
    cta_text?: string // Override copy_pack.cta_text
    urgency_hook?: string // Override copy_pack.urgency_hook
    hero_image?: string // Override primary asset_reference
  }
}
```

**Scope limits:** A/B variants can change headlines, subheadlines, CTAs, urgency hooks, and hero images. They cannot change page structure (sections), form fields, pricing, or archetype. Structural changes require a new experiment, not an A/B variant.

## Variant Tracking

Every signal event includes the `variant_id` in its `event_data`:

```javascript
logEvent('form_submit', {
  email_hash: hashEmail(email),
  variant_id: activeVariant.variant_id, // "A" or "B"
  channel: utmParams.utm_source || 'direct',
})
```

This allows the metrics pipeline to compute per-variant conversion rates, enabling the measurement system (DD#6) to determine which variant won.

## No Flicker Protocol

A/B variant assignment must happen before the page renders visible content to prevent "flicker" (showing variant A briefly before swapping to variant B):

1. The `AbVariantWrapper` component runs variant assignment in the Astro frontmatter (server-side) when possible.
2. For SSR pages, the variant is determined server-side using the visitor cookie value (if present in the request).
3. For first-time visitors (no cookie), the page renders with variant A by default, and client-side JS immediately assigns and applies the correct variant before the first paint completes.
4. A `<style>` block hides the hero section with `opacity: 0` until variant assignment completes, then reveals it with a CSS transition. Maximum hide duration: 100ms.

```html
<style>
  .ab-pending {
    opacity: 0;
    transition: opacity 0.1s;
  }
  .ab-resolved {
    opacity: 1;
  }
</style>
```

---

# 7. Channel-Aware Landing Pages

## The Problem

A visitor arriving from a Facebook ad has different context than a visitor arriving from Google Search. The Facebook visitor saw a specific ad with specific messaging. The Google visitor searched for specific keywords. The LinkedIn visitor is in a professional context. Showing all visitors the same landing page wastes the context established by the ad.

## How Channel Variants Work

DD#4's CampaignPackage includes `channel_variants[]` — per-channel formatted content with channel-specific headlines, descriptions, and CTAs. The landing page reads the visitor's UTM parameters and applies the matching channel variant's copy.

**Matching logic:**

```javascript
function resolveChannelVariant(utmSource, channelVariants) {
  if (!utmSource || !channelVariants || channelVariants.length === 0) {
    return null // Use default copy_pack
  }

  // Normalize source to channel name
  const sourceToChannel = {
    facebook: 'facebook',
    fb: 'facebook',
    instagram: 'facebook', // Same Meta platform
    ig: 'facebook',
    google: 'google',
    gclid: 'google', // Google auto-tagging
    linkedin: 'linkedin',
    li: 'linkedin',
    tiktok: 'tiktok',
    reddit: 'reddit',
    twitter: 'twitter',
    x: 'twitter',
  }

  const channel = sourceToChannel[utmSource.toLowerCase()]
  if (!channel) return null

  return channelVariants.find((v) => v.channel === channel) || null
}
```

**Override behavior:** When a channel variant is found, its fields override the default `copy_pack` values:

| Channel Variant Field | Overrides CopyPack Field |
| --------------------- | ------------------------ |
| `headline`            | `copy_pack.headline`     |
| `description`         | `copy_pack.subheadline`  |
| `cta`                 | `copy_pack.cta_text`     |

Fields not present in the channel variant fall through to the default `copy_pack`. This means channel variants only need to specify what differs — the rest comes from the base copy.

## UTM Parameter Handling

The existing `[slug].astro` template already extracts UTM parameters from the URL query string. The Launchpad extends this:

1. **Capture on arrival.** All 5 UTM parameters (`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`) are extracted from the URL and stored in `sessionStorage`.

2. **Persist across pages.** If the visitor navigates from the landing page to the thank-you page or payment page, UTM parameters are appended to internal links automatically.

3. **Include in form submissions.** All UTM parameters are sent with the lead capture API call (existing behavior — no change needed).

4. **Include in events.** The `utm_source` is included in every `event_log` entry (existing behavior — the `SignalCapture` component extends this to include all 5 parameters in `event_data`).

5. **Naming convention.** All UTM values are stored and transmitted in lowercase. This prevents data fragmentation from inconsistent casing (`Facebook` vs. `facebook` vs. `FACEBOOK`).

## Message Match

"Message match" is the principle that the landing page headline should closely match the ad copy the visitor clicked on. Channel variants implement this automatically: the same CampaignPackage that generates the Facebook ad headline also generates the Facebook channel variant's landing page headline. Because both originate from the same source data and generation pipeline, message match is structural, not accidental.

---

# 8. Signal Capture Architecture

## Event Tracking Overview

Every landing page emits events to the `event_log` table via `POST /events`. The Launchpad standardizes which events are tracked per archetype, what data is included, and how events flow into `metrics_daily` for threshold evaluation.

## Standard Event Types

| Event Type                    | Fired When                       | All Archetypes?          | Event Data                                     |
| ----------------------------- | -------------------------------- | ------------------------ | ---------------------------------------------- |
| `page_view`                   | Page loads                       | Yes                      | `{ archetype, variant_id, channel, referrer }` |
| `scroll_depth`                | Visitor scrolls to 25/50/75/100% | All except fake_door     | `{ depth_pct }`                                |
| `form_start`                  | First form field interaction     | All with forms           | `{ field }`                                    |
| `form_submit`                 | Form submitted successfully      | All with forms           | `{ email_hash, variant_id, channel }`          |
| `payment_start`               | Stripe Checkout button clicked   | presale only             | `{ price_cents, variant_id }`                  |
| `payment_complete`            | Stripe webhook confirms payment  | presale only             | `{ stripe_payment_id, amount_cents }`          |
| `payment_failed`              | Stripe reports failure           | presale only             | `{ error_code }`                               |
| `pricing_view`                | Pricing section enters viewport  | priced_waitlist, presale | `{ price_cents, tier }`                        |
| `pricing_tier_select`         | User selects a pricing tier      | priced_waitlist          | `{ tier, price_cents }`                        |
| `content_preview_view`        | Content preview section visible  | content_magnet only      | `{}`                                           |
| `resource_downloaded`         | Download link clicked            | content_magnet only      | `{ resource_id }`                              |
| `screening_question_answered` | Screening question completed     | concierge, service_pilot | `{ question_id }`                              |
| `pilot_details_view`          | Pilot details section visible    | service_pilot only       | `{}`                                           |

## The SignalCapture Component

The `SignalCapture` component is a client-side Astro island that handles all event tracking. It is included in every landing page via `LandingBase.astro`.

```astro
---
// components/landing/SignalCapture.astro
interface Props {
  experimentId: string;
  slug: string;
  archetype: string;
  variantId: string;
  apiUrl: string;
  signalEvents: string[];
}

const { experimentId, slug, archetype, variantId, apiUrl, signalEvents } = Astro.props;
---

<script is:inline define:vars={{ experimentId, slug, archetype, variantId, apiUrl, signalEvents }}>
  // Visitor and session management
  function getOrCreateId(key) {
    let id = localStorage.getItem(key);
    if (!id) {
      id = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem(key, id);
    }
    return id;
  }

  const visitorId = getOrCreateId('sc_visitor_id');
  const sessionId = getOrCreateId('sc_session_id');

  // UTM parameter extraction
  const urlParams = new URLSearchParams(window.location.search);
  const utmSource = (urlParams.get('utm_source') || '').toLowerCase() || null;

  // Event logging function
  function logEvent(eventType, eventData = {}) {
    if (!signalEvents.includes(eventType)) return;

    const payload = {
      experiment_id: experimentId,
      event_type: eventType,
      event_data: JSON.stringify({
        ...eventData,
        archetype,
        variant_id: variantId,
        channel: utmSource || 'direct',
      }),
      session_id: sessionId,
      visitor_id: visitorId,
      utm_source: utmSource,
      url: window.location.href,
      referrer: document.referrer || null,
    };

    // Use sendBeacon for reliability (survives page navigation)
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    navigator.sendBeacon(`${apiUrl}/events`, blob);
  }

  // Automatic page_view on load
  if (signalEvents.includes('page_view')) {
    logEvent('page_view', { referrer: document.referrer });
  }

  // Scroll depth tracking
  if (signalEvents.includes('scroll_depth')) {
    const thresholds = [25, 50, 75, 100];
    const fired = new Set();

    function checkScrollDepth() {
      const scrollPct = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );
      for (const threshold of thresholds) {
        if (scrollPct >= threshold && !fired.has(threshold)) {
          fired.add(threshold);
          logEvent('scroll_depth', { depth_pct: threshold });
        }
      }
    }

    window.addEventListener('scroll', checkScrollDepth, { passive: true });
  }

  // Section viewport tracking (IntersectionObserver)
  if (signalEvents.includes('pricing_view')
      || signalEvents.includes('content_preview_view')
      || signalEvents.includes('pilot_details_view')) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const eventType = entry.target.dataset.trackView;
          if (eventType) {
            logEvent(eventType, {});
            observer.unobserve(entry.target);
          }
        }
      });
    }, { threshold: 0.5 });

    document.querySelectorAll('[data-track-view]').forEach((el) => {
      observer.observe(el);
    });
  }

  // Form interaction tracking
  if (signalEvents.includes('form_start')) {
    let formStarted = false;
    document.querySelectorAll('form input, form select, form textarea').forEach((field) => {
      field.addEventListener('focus', () => {
        if (!formStarted) {
          formStarted = true;
          logEvent('form_start', { field: field.name || field.id });
        }
      }, { once: true });
    });
  }

  // Expose logEvent for form submit handlers
  window.__sc = { logEvent };
</script>
```

## How Signals Feed metrics_daily

The `event_log` table captures granular events. The `metrics_daily` table captures daily aggregates. The bridge between them:

| event_log Events                               | metrics_daily Column |
| ---------------------------------------------- | -------------------- |
| `page_view` count (deduplicated by session_id) | `sessions`           |
| `form_submit` + `payment_complete` count       | `conversions`        |
| `payment_complete` sum of `amount_cents`       | `revenue_cents`      |

The `impressions`, `clicks`, and `spend_cents` columns in `metrics_daily` come from ad platform data imports (external to the landing page). The landing page contributes `sessions`, `conversions`, and `revenue_cents`.

**Aggregation logic:** A scheduled job (or the metrics import endpoint) aggregates `event_log` entries into `metrics_daily` rows. The aggregation groups by `experiment_id`, `date` (from `created_at`), and `source` (from `utm_source`). Derived metrics (`cvr_bp`, `cpl_cents`, etc.) are recomputed using the formulas in tech spec Section 3.6.

## Per-Archetype Signal Summary

| Archetype         | Conversion Event   | Secondary Signals                                                                |
| ----------------- | ------------------ | -------------------------------------------------------------------------------- |
| `fake_door`       | `form_submit`      | `page_view`, `form_start`                                                        |
| `waitlist`        | `form_submit`      | `page_view`, `scroll_depth`, `form_start`                                        |
| `content_magnet`  | `form_submit`      | `page_view`, `content_preview_view`, `resource_downloaded`                       |
| `priced_waitlist` | `form_submit`      | `page_view`, `pricing_view`, `pricing_tier_select`, `scroll_depth`               |
| `presale`         | `payment_complete` | `page_view`, `pricing_view`, `payment_start`, `scroll_depth`                     |
| `concierge`       | `form_submit`      | `page_view`, `scroll_depth`, `screening_question_answered`                       |
| `service_pilot`   | `form_submit`      | `page_view`, `pilot_details_view`, `scroll_depth`, `screening_question_answered` |

---

# 9. Technology Landscape

## Landing Page Builder Assessment

The market for landing page builders is mature and well-funded. Key players in 2026:

| Platform  | Pricing     | AI Features                                             | API           | Data Ownership  | Custom Templates       |
| --------- | ----------- | ------------------------------------------------------- | ------------- | --------------- | ---------------------- |
| Unbounce  | \$99-625/mo | Smart Traffic AI (auto-routes visitors to best variant) | Limited       | Platform-hosted | Yes (drag-and-drop)    |
| Instapage | \$99-499/mo | AI content generation, heatmaps                         | Limited       | Platform-hosted | Yes (drag-and-drop)    |
| Leadpages | \$37-79/mo  | AI-assisted copy                                        | No public API | Platform-hosted | Yes (template library) |
| Carrd     | \$9-49/yr   | None                                                    | No API        | Platform-hosted | Minimal                |
| Framer    | \$5-30/mo   | AI site generation                                      | No API        | Platform-hosted | Full design control    |

## Why Custom Astro Templates are Correct for SC

### Arguments Against Third-Party Builders

1. **Data ownership.** Landing page builders host the pages on their infrastructure. Lead capture data, event tracking, and visitor behavior data live in their systems. SC needs this data in D1 and `event_log` for threshold evaluation, kill criteria checking, and the Decision Framework. Extracting data from a builder adds integration complexity and creates vendor dependency.

2. **Cost at scale.** Even at \$37/month (Leadpages), that is \$444/year — more than the budget for a single validation test. For VaaS operating multiple ventures simultaneously, builder costs compound. Custom templates cost \$0 per page after the initial build.

3. **Archetype specificity.** No builder knows about SC's 7 archetypes, the CampaignPackage schema, or the signal capture requirements. Every page would need manual customization, defeating the purpose of automation.

4. **A/B testing integration.** Builders offer their own A/B testing, but it does not integrate with SC's `ab_variants` structure, `event_log`, or `metrics_daily`. Using a builder's A/B testing means maintaining two measurement systems.

5. **UTM/channel awareness.** Builders do not support the dynamic content replacement based on `channel_variants` that SC requires. Some support basic UTM parameter capture, but none support swapping headlines and CTAs based on traffic source.

6. **Deployment control.** SC deploys via Cloudflare Pages with SSR. Landing pages must be served from the same domain (`siliconcrane.com/e/[slug]`) for analytics continuity and trust signals. Builder-hosted pages live on separate domains or subdomains, breaking the analytics chain.

### What Builders Do Well (That SC Does Not Need)

- **Visual drag-and-drop editing.** SC does not need this — templates are pre-built, content comes from structured data.
- **Conversion optimization for mature products.** Unbounce's Smart Traffic AI is impressive for optimizing existing high-traffic pages. SC's validation tests generate 150-600 clicks — not enough traffic for sophisticated optimization.
- **Template marketplaces.** SC has 7 specific archetypes with specific requirements. A generic template marketplace adds noise, not value.

### The Decision

**Build custom Astro templates. Consume data from the CampaignPackage. Track signals through event_log. Deploy via Cloudflare Pages.**

This is the same build-vs-buy conclusion DD#3 reached for interview platforms and DD#4 reached for content generation: build the orchestration layer (templates, data flow, tracking), consume APIs for generation (Claude for copy, image APIs for visuals). The templates are SC's proprietary IP — they encode the Validation Ladder's archetype requirements into reusable components.

---

# 10. Automation Boundary

## What is Automated

| Step                       | Automation Level | How It Works                                                                              |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| Template selection         | Fully automated  | Archetype on the experiment record determines which sections render                       |
| Content population         | Fully automated  | CopyPack fields from CampaignPackage populate template components                         |
| Social proof insertion     | Fully automated  | Discovery quotes from CampaignPackage `social_proof` render in SocialProof component      |
| Tone styling               | Fully automated  | `tone.register` applies CSS class modifier to page                                        |
| A/B variant assignment     | Fully automated  | Hash-based client-side assignment from `ab_variants`                                      |
| Channel variant resolution | Fully automated  | UTM parameter matching to `channel_variants`                                              |
| Signal capture             | Fully automated  | SignalCapture component tracks all configured events                                      |
| Image resolution           | Fully automated  | R2 keys from `asset_references` resolved to public URLs                                   |
| Deployment                 | Fully automated  | Page is live as soon as experiment status changes to `launch` — SSR serves it dynamically |

## What Requires Human Input

| Step                  | Human Role                                                                          | Why It Cannot Be Automated                                                                        |
| --------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Final page review     | Operator checks the rendered page before campaign launch                            | Content may have AI generation artifacts, image placement issues, or archetype-inappropriate copy |
| Screening questions   | Operator defines qualification questions for concierge and service_pilot archetypes | Questions are venture-specific and require domain knowledge                                       |
| Resource upload       | Operator creates and uploads the downloadable resource for content_magnet           | The resource itself is not generated by the pipeline (though AI can draft it)                     |
| Stripe configuration  | Operator sets up Stripe product and price for presale archetypes                    | Payment configuration requires Stripe dashboard access and pricing decisions                      |
| Custom sections       | Operator can add custom content blocks via `page_config.custom_sections`            | Venture-specific content that does not fit standard components                                    |
| Page config overrides | Operator can override archetype defaults via `page_config`                          | Edge cases where the default section composition does not fit                                     |

## The Deployment Pipeline

```
Step 1: CampaignPackage approved (DD#4 Step 7)
     |
Step 2: Archetype template auto-selected from experiment.archetype
     |
Step 3: CopyPack + social_proof + tone + channel_variants + ab_variants
         extracted from CampaignPackage
     |
Step 4: page_config checked for overrides (screening questions,
         resource_url, custom sections)
     |
Step 5: Preview URL generated: /e/[slug]?preview=true
         (renders page with status check bypassed for operator review)
     |
Step 6: Operator reviews preview
         - Checks content accuracy
         - Verifies form fields
         - Tests mobile rendering
         - Confirms signal capture (test event fired)
     |
Step 7: Operator transitions experiment status to "launch"
     |
Step 8: Landing page is live at /e/[slug]
         SSR serves it dynamically from experiment data
     |
Step 9: Campaign goes live, driving traffic to the page
```

**Time from CampaignPackage approval to live page:** Minutes, not hours or days. The bottleneck is human review (Step 6), not technical deployment.

## Preview Mode

A preview mode allows operators to review the landing page before launch:

```typescript
// [slug].astro — Preview mode check
const isPreview = Astro.url.searchParams.get('preview') === 'true'

if (!experiment || (!['launch', 'run'].includes(experiment.status) && !isPreview)) {
  return Astro.redirect('/404')
}
```

Preview mode bypasses the `launch`/`run` status check but otherwise renders the exact same page visitors will see. Preview URLs are not indexed (meta robots noindex) and not linked from anywhere public.

---

# 11. PIVOT Handling

## What Happens When a Campaign PIVOTs

The strategy session's Pivot Routing Table (Section: Decision Framework) defines pivot scenarios. When the verdict is PIVOT and the pivot routes to Step 4 (new Campaign Package) or Step 5 (revised landing page):

### Scenario: CampaignPackage Regenerated (Pivot to Step 4)

When the CampaignPackage is regenerated after a pivot:

1. **Landing page auto-updates.** Because the landing page reads from `experiment.campaign_package` and `experiment.copy_pack` at render time (SSR), the updated CampaignPackage content appears on the next page load. No redeployment is needed.

2. **URL preserved.** The experiment slug does not change. The same URL continues to work. This means existing bookmarks, cached links, and social shares still reach the updated page.

3. **A/B variant tracking resets.** The pivot event is logged to `event_log` with type `experiment_pivoted`. The measurement system (DD#6) uses this timestamp to segment pre-pivot and post-pivot conversion data. Pre-pivot variant performance is archived, not discarded — it is useful for understanding what did not work.

4. **Channel variants update.** If the regenerated CampaignPackage includes new `channel_variants`, the landing page immediately serves the updated per-channel copy.

5. **Social proof preserved or replaced.** If the Discovery Summary has not changed, the same `social_proof` quotes persist. If the pivot includes new discovery data, the regenerated CampaignPackage will include updated quotes.

### Scenario: Landing Page Revised (Pivot to Step 5)

When the pivot routes specifically to Step 5 (e.g., "Good CTR, poor landing page CVR"):

1. The operator modifies `page_config` to adjust sections, form fields, or CTA patterns.
2. Alternatively, the CampaignPackage is regenerated with revised copy (new headline, different value framing).
3. The experiment ID gains a pivot suffix (e.g., `SC-2026-042a` becomes `SC-2026-042b` per strategy session Pivot Rules).
4. A new experiment record may be created (preserving the original for comparison) OR the existing record is updated with the new CampaignPackage.

### PIVOT Event Logging

```json
{
  "event_type": "experiment_pivoted",
  "event_data": {
    "pivot_from": "SC-2026-042a",
    "pivot_to": "SC-2026-042b",
    "pivot_reason": "poor_landing_page_cvr",
    "pivot_routing": "step_5",
    "changes": ["headline", "cta_text", "value_props"],
    "pre_pivot_metrics": {
      "sessions": 1200,
      "conversions": 8,
      "cvr_bp": 67
    }
  }
}
```

### What Does NOT Auto-Update

- **Stripe configuration.** If the pivot changes the price (for `priced_waitlist` or `presale`), the Stripe product and price must be updated manually.
- **Screening questions.** If the pivot changes the ICP for `concierge` or `service_pilot`, the operator must update `page_config.screening_questions`.
- **Downloadable resource.** If the pivot changes the content magnet, the operator must upload a new resource and update `page_config.resource_url`.

---

# 12. Answering the Strategy Session Questions

The strategy session (Deep Dive #5 section) identified four questions. Here are the answers:

**1. How do we automate landing page generation aligned to test types?**

Through **per-archetype template composition** in the Astro component architecture (Section 3). Each of the 7 archetypes maps to a specific set of sections, form fields, CTA patterns, and signal capture events (Section 4). The archetype on the experiment record determines which template composition renders. Content comes from the CampaignPackage's `copy_pack` field, which is populated by the Campaign Factory (DD#4). The Launchpad adds no manual content creation — it consumes structured data and renders it through archetype-appropriate components.

**2. How do landing pages leverage the marketing assets produced for campaigns?**

Through the **CampaignPackage-to-landing-page data flow** (Section 5). The CampaignPackage's `copy_pack` provides all text content (headlines, subheadlines, value props, CTAs). The `social_proof` field provides discovery interview quotes. The `asset_references` array provides R2 keys for generated images (hero images, section illustrations). The `tone` field controls visual styling (rational, empathetic, or urgent register). The `channel_variants` provide per-traffic-source copy overrides. Every element of the landing page traces back to the Campaign Factory's output.

**3. What is the minimum viable landing page system for validation?**

The current single template (`[slug].astro`) plus the existing `copy_pack` data — which is already working. The minimum viable evolution is adding **signal capture** (the `SignalCapture` component) to track `page_view`, `form_start`, and `form_submit` events. Without event tracking, the landing page cannot feed `metrics_daily`, and the Decision Framework cannot evaluate thresholds. The archetype-specific templates, A/B testing, and channel awareness are Phase 2 enhancements that improve signal quality but are not strictly required for the first validation test.

**4. How does this integrate with the existing pattern library concept in the functional spec?**

The functional spec (FR-501) references a "pattern library" — a collection of reusable landing page patterns. The Launchpad **replaces** the pattern library concept with a **component library** — Astro components (`HeroSection`, `ValueProps`, `SocialProof`, `LeadCaptureForm`, etc.) that compose into per-archetype templates. The distinction: a pattern library implies visual design patterns chosen by a designer. A component library implies functional components selected by archetype. The archetype determines the composition; the CampaignPackage provides the content. No design decisions at deployment time.

---

# 12.5. Answering DD#4's Open Questions

DD#4 Section 17 identified 6 open questions for this deep dive:

**5. How does the CampaignPackage inform landing page template selection and generation?**

The CampaignPackage does not select the template — the **archetype** on the experiment record selects the template. The CampaignPackage populates the selected template with content. This is a deliberate separation: archetype determines structure (which sections, which form, which signals), CampaignPackage determines content (what the headline says, what the value props are, what the CTA text is). The `resolvePageConfig` function (Section 3) merges archetype defaults with CampaignPackage-driven overrides (e.g., enabling social proof only when quotes exist). See Section 5 for the full data flow mapping.

**6. What A/B test structure does the landing page implement from `campaign_package.ab_variants`?**

Hash-based client-side variant assignment (Section 6). The visitor's `localStorage` visitor ID is hashed with the experiment slug to produce a deterministic variant index. Each variant can override `headline`, `subheadline`, `cta_text`, `urgency_hook`, and `hero_image` from the default `copy_pack`. Every signal event includes the `variant_id`, enabling per-variant conversion rate calculation. Variant assignment is deterministic (same visitor always sees same variant), stateless on the server, and flicker-free (variant resolved before first paint).

**7. How do landing page signal capture mechanisms differ by archetype?**

Each archetype tracks a different set of events, reflecting its unique signal capture requirements (Section 8). All archetypes track `page_view` and `form_start`. Demand Signal archetypes add `scroll_depth`. WTP archetypes add `pricing_view` and `pricing_tier_select`. `presale` adds `payment_start`, `payment_complete`, and `payment_failed`. Solution Validation archetypes add `screening_question_answered`. `content_magnet` adds `content_preview_view` and `resource_downloaded`. The conversion event itself differs: `form_submit` for all non-payment archetypes, `payment_complete` for `presale`. See Section 4.8 for the per-archetype summary.

**8. What is the automation boundary between CampaignPackage and actual landing page deployment?**

Section 10 defines the boundary. Fully automated: template selection, content population, social proof insertion, tone styling, A/B variant assignment, channel variant resolution, signal capture, image resolution, and deployment. Requires human input: final page review, screening question definition, resource upload, Stripe configuration, custom sections, and page config overrides. The deployment pipeline (Section 10) takes the page from CampaignPackage approval to live URL in minutes — the bottleneck is human review, not technical work.

**9. How does the landing page consume `channel_variants` for consistent messaging?**

Through UTM parameter matching (Section 7). The landing page reads `utm_source` from the URL query string, normalizes it to a channel name (e.g., `fb` --> `facebook`), and looks up the matching entry in `campaign_package.channel_variants[]`. If found, the channel variant's `headline`, `description`, and `cta` override the default `copy_pack` values. This produces "message match" — the landing page headline mirrors the ad copy the visitor clicked. Channel variants are optional; pages without them render the default `copy_pack` for all traffic sources.

**10. When a campaign PIVOTs, does the landing page auto-update from the regenerated CampaignPackage?**

Yes — because the landing page is SSR (server-side rendered) and reads from `experiment.campaign_package` at request time (Section 11). When the CampaignPackage is regenerated after a pivot, the updated content appears on the next page load. No redeployment, no cache invalidation (Cloudflare's edge cache respects short TTLs for SSR pages), no URL change. A/B variant tracking is segmented by the pivot timestamp — pre-pivot and post-pivot conversion data are analyzed separately. The pivot event is logged for audit and analysis. Items that do NOT auto-update: Stripe configuration, screening questions, and downloadable resources — these require manual updates.

---

# 13. Landing Page Schema Sketch

## New `page_config` Column

Add a `page_config` TEXT (JSON) column to the experiments table. This stores per-experiment landing page configuration overrides.

```json
{
  "page_config": {
    "type": "object",
    "required": false,
    "description": "Per-experiment landing page configuration. Overrides archetype defaults.",
    "properties": {
      "sections": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Ordered list of section component names. Overrides archetype default."
      },
      "form_fields": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Form fields to display. Overrides archetype default."
      },
      "cta_style": {
        "type": "string",
        "enum": ["email", "payment", "schedule", "download"],
        "description": "CTA interaction pattern. Overrides archetype default."
      },
      "screening_questions": {
        "type": "array",
        "items": {
          "id": { "type": "string" },
          "label": { "type": "string" },
          "type": { "type": "string", "enum": ["text", "select", "radio", "textarea"] },
          "options": {
            "type": "array",
            "items": { "type": "string" },
            "description": "Options for select/radio types"
          },
          "required": { "type": "boolean", "default": false }
        },
        "maxItems": 5,
        "description": "Qualification questions for concierge and service_pilot archetypes."
      },
      "resource_url": {
        "type": "string",
        "description": "R2 key or external URL for downloadable resource (content_magnet)."
      },
      "pricing_tiers": {
        "type": "array",
        "items": {
          "name": { "type": "string" },
          "price_cents": { "type": "integer" },
          "description": { "type": "string" },
          "stripe_price_id": { "type": "string" }
        },
        "maxItems": 3,
        "description": "Pricing tier options for priced_waitlist with tier testing."
      },
      "faq_items": {
        "type": "array",
        "items": {
          "question": { "type": "string" },
          "answer": { "type": "string" }
        },
        "maxItems": 10,
        "description": "FAQ entries. If empty, FAQ section is hidden."
      },
      "custom_sections": {
        "type": "array",
        "items": {
          "position": { "type": "string", "enum": ["before_form", "after_hero", "before_faq"] },
          "content": { "type": "string", "maxLength": 5000 },
          "title": { "type": "string" }
        },
        "maxItems": 3,
        "description": "Custom content blocks inserted at specified positions."
      },
      "show_company_field": {
        "type": "boolean",
        "default": true,
        "description": "Whether to show the company field in forms. Default true for B2B."
      },
      "signal_events": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Additional signal events to track beyond archetype defaults."
      }
    }
  }
}
```

## Existing Columns — No Migration Required

The Launchpad consumes data from columns that already exist or are recommended by DD#1-DD#4:

| Column              | Status                  | Used By Launchpad                                  |
| ------------------- | ----------------------- | -------------------------------------------------- |
| `archetype`         | Exists                  | Template selection                                 |
| `copy_pack`         | Exists                  | Page content (backward compatible)                 |
| `creative_brief`    | Exists                  | Image selection (via `assets` array)               |
| `campaign_package`  | DD#4 recommendation     | Full data source (replaces copy_pack when present) |
| `stripe_price_id`   | Exists                  | Payment CTA (presale)                              |
| `stripe_product_id` | Exists                  | Payment CTA (presale)                              |
| `price_cents`       | Exists                  | Price display                                      |
| `page_config`       | **New (this document)** | Landing page overrides                             |

## Migration Plan

A single migration adds the `page_config` column:

```sql
-- Migration: 000N_add_page_config.sql
ALTER TABLE experiments ADD COLUMN page_config TEXT;
-- JSON: PageConfigSchema — per-experiment landing page configuration
```

No data migration is needed. Existing experiments have `page_config = NULL`, which causes `resolvePageConfig` to use archetype defaults — producing output functionally equivalent to the current template.

---

# 14. Recommendations for Functional Spec v2.0

1. **Add `page_config` TEXT (JSON) column** to the experiments table (see Schema Sketch in Section 13). This stores per-experiment landing page configuration overrides, including screening questions, resource URLs, pricing tiers, FAQ items, and custom sections.

2. **Evolve `[slug].astro`** from a monolithic template to an archetype-aware router that delegates to component compositions. The component library includes: `HeroSection`, `ValueProps`, `SocialProof`, `PricingSection`, `LeadCaptureForm`, `QualificationForm`, `ContentPreview`, `ProcessSteps`, `FaqSection`, `RefundPolicy`, `PilotDetails`, `PaymentCta`, `SignalCapture`, and `AbVariantWrapper`.

3. **Add the `SignalCapture` component** to all landing pages. This is the highest-priority item — without event tracking, the landing page cannot feed `metrics_daily`, and the Decision Framework cannot evaluate thresholds. Even without the full archetype template system, adding `SignalCapture` to the existing template provides immediate value.

4. **Add `LandingBase.astro` layout** as a shared landing page layout that handles meta tags (from CopyPack `meta_title`, `meta_description`, `og_title`, `og_description`), the `SignalCapture` component injection, and the shared footer.

5. **Add preview mode** to `[slug].astro` — allow `?preview=true` to bypass the status check for operator review before launch. Preview pages should include `<meta name="robots" content="noindex">`.

6. **Standardize event types** in `event_log` for landing page signals: `page_view`, `scroll_depth`, `form_start`, `form_submit`, `payment_start`, `payment_complete`, `payment_failed`, `pricing_view`, `pricing_tier_select`, `content_preview_view`, `resource_downloaded`, `screening_question_answered`, `pilot_details_view`, `experiment_pivoted`.

7. **Add aggregation logic** to bridge `event_log` signals into `metrics_daily` rows. The `sessions` column is populated from deduplicated `page_view` events (by `session_id`). The `conversions` column is populated from `form_submit` events (for non-payment archetypes) and `payment_complete` events (for `presale`).

8. **Add the `resolvePageConfig` function** to `apps/sc-web/src/lib/landing.ts` with archetype defaults for all 7 archetypes. This is the central configuration point for the template system.

9. **Add API endpoint for page_config updates:** `PATCH /experiments/:id` should accept `page_config` as an updatable field. Validation should enforce the `PageConfigSchema` structure.

10. **Extend leads API** to accept `custom_fields` for screening question responses. The `POST /leads` endpoint already accepts a `custom_fields` JSON field — ensure it stores the structured responses from `QualificationForm`.

11. **Add `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`** to the `event_log` `event_data` JSON (not as top-level columns — they are already captured on leads but not on events). This enables channel-level analysis in the measurement system.

---

# 15. Open Questions for Deep Dive #6

Deep Dive #6 covers the **Measurement & Decision System** — Step 6 in the validation workflow. Questions the Launchpad raises for DD#6:

1. **How are per-variant conversion rates calculated and compared?** The landing page assigns variants and tracks `variant_id` in every event. DD#6 must define how to compute per-variant CVR, determine statistical significance at small sample sizes (20-60 conversions), and decide when to call a variant winner.

2. **How does the metrics aggregation pipeline bridge event_log into metrics_daily?** The Launchpad fires granular events; `metrics_daily` stores daily aggregates. DD#6 must specify when and how aggregation runs — scheduled job, on-demand calculation, or real-time counter.

3. **How does the system handle bot traffic and data quality?** The landing page includes a honeypot field on forms and uses `navigator.sendBeacon` for event tracking. DD#6 must define additional data quality checks: duplicate session detection, suspicious click patterns, known bot user agents, and the INVALID flag criteria.

4. **How do pre-pivot and post-pivot metrics get segmented?** The Launchpad logs `experiment_pivoted` events with a timestamp. DD#6 must define how the Validation Report separates pre-pivot performance from post-pivot performance and whether pre-pivot data counts toward the minimum conversion threshold.

5. **How is the per-channel CVR breakdowns calculated from UTM-tagged events?** The Launchpad captures `utm_source` on every event. DD#6 must define how channel-level conversion funnels are constructed and whether channel performance influences the GO/KILL/PIVOT decision or is advisory only.

6. **What is the real-time monitoring approach during the test run?** The Launchpad fires events continuously during the test. DD#6 must define whether there is a real-time dashboard, alert thresholds (e.g., "zero conversions after 48 hours"), and automated Hard Kill detection from the kill criteria JSON.

7. **How does the Validation Report artifact consume landing page signal data?** DD#6 must define the Validation Report schema — which signals from `event_log` are included, how funnel metrics (page_view --> form_start --> form_submit) are calculated, and how the report compares actual metrics against the Test Blueprint's thresholds.
