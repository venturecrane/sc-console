# UX Lead Contribution - PRD Review Round 1

**Author:** UX Lead
**Date:** 2026-03-02
**Scope:** MVP / Phase 0 only
**Source Documents:** `docs/process/sc-project-instructions.md`, `docs/technical/sc-functional-spec-v2.md`
**Supporting References:** Deep Dive #1 (The Venture Narrative), Deep Dive #5 (The Launchpad), Tech Spec v1.2, existing codebase at `apps/sc-web/`

---

## Target User Personas

### Persona 1: Marcus Chen -- The Technical Founder with Too Many Ideas

Marcus is a 34-year-old senior software engineer at a mid-size fintech company in Austin. He has been building side projects for six years, shipping three to production, and watching all three flatline after launch. His GitHub is full of well-architected codebases that nobody uses. He has a new idea every quarter -- an accessibility auditing SaaS, a competitor-tracking tool for marketers, a niche CRM for freelance consultants -- and he cannot tell which one deserves his nights and weekends.

**Frustration:** Marcus builds first and validates never. He spent four months and $3,200 on AWS costs building a full product for his last idea before discovering that his target customers already had a "good enough" spreadsheet workflow. He knows he should validate before building but does not have a framework, the marketing skills, or the patience to run a proper demand test. He reads about lean startup methodology but cannot translate it into a concrete next step.

**Goal:** Marcus wants someone to tell him, with evidence, whether his current idea is worth building. He wants a GO/NO-GO signal he can trust, delivered fast enough that he does not lose momentum. He is willing to pay $2,500 if it saves him from burning another $10K+ and six months on the wrong idea.

**Relationship to SC:** Marcus is the prototypical Preflight + Build-to-Launch client. He arrives with a specific idea, can articulate the problem, and is ready to define kill criteria. He does not need hand-holding on basic business concepts. He needs execution and objectivity. He is the "Good Fit" profile described in the project instructions (Section 3, Qualification Criteria).

**How he finds SC:** LinkedIn post from a founder friend, Indie Hackers community thread, or cold outreach targeting founders who launched and failed publicly.

**Landing page behavior:** Marcus will read the entire page. He cares about the process ("How does this work?"), not the emotional pitch. He wants to see a case study with real metrics. He will scroll past urgency hooks but will carefully read the value props and FAQ. He converts on `waitlist` or `priced_waitlist` archetypes after 2-3 minutes of reading.

---

### Persona 2: Priya Kapoor -- The Non-Technical Domain Expert

Priya is a 41-year-old operations director at a regional healthcare staffing agency. She has spent 15 years watching her industry solve scheduling, credentialing, and compliance problems with Excel spreadsheets and phone calls. She believes a purpose-built tool could save agencies like hers 20+ hours per week, but she does not know how to build software and does not trust agencies that quote $80K for an MVP.

**Frustration:** Priya has talked to two dev shops. Both produced SOWs that would take 4-6 months and cost more than her annual bonus. She does not know if the problem is big enough to justify that investment, or if the nurses and schedulers she imagines as users would actually adopt a new tool. She is stuck between "I know this is a real problem" and "I have no idea if anyone would pay for the solution."

**Goal:** Priya wants to know if her idea has legs before she risks her savings or seeks outside investment. She wants someone who will do the validation work -- run the interviews, build the test page, measure the demand -- because she does not have the technical skills or the time to learn growth hacking while running a full-time job.

**Relationship to SC:** Priya is the ideal full-stack engagement client: Preflight through Run + Decide. She needs the most hand-holding during intake and scoping, but once the sprint starts, she is a responsive decision-maker. She maps to the "Non-technical people with domain expertise + idea" target segment from the project instructions' marketing strategy (Section 5).

**How she finds SC:** Warm introduction from someone in the Venture Crane network, or a targeted LinkedIn DM referencing healthcare staffing pain points she has posted about.

**Landing page behavior:** Priya will scan, not read. She needs the headline and subheadline to immediately tell her this is for people like her (domain experts, not developers). She will look for social proof and a clear "How it works" process section. She will not tolerate jargon ("archetypes," "kill criteria," "conversion rate"). She converts on `concierge` or `service_pilot` archetypes after confirming that SC does the work, not just advises.

---

### Persona 3: Jordan Reeves -- The Repeat Founder Validating a Pivot

Jordan is a 29-year-old founder who shut down their first startup (a D2C subscription box) after 18 months and $140K burned. They are now sitting on two new ideas and a dwindling runway of personal savings. They have founder scars: they know what it feels like to build the wrong thing. They are hyper-aware of vanity metrics, sunk cost fallacy, and the emotional trap of falling in love with an idea.

**Frustration:** Jordan knows how to validate -- they have read The Mom Test, run Facebook ads, built landing pages on Carrd. But they are exhausted and do not trust their own judgment anymore. They want external objectivity and a structured process with predefined kill criteria so that their emotional attachment cannot override the data. They have done this before and know they need a forcing function.

**Goal:** Jordan wants to run two cheap, fast validation tests on their two ideas and kill the loser within two weeks. They want evidence they can show a potential co-founder or angel investor. They value speed above all else.

**Relationship to SC:** Jordan is the most sophisticated buyer. They understand the methodology and will evaluate SC on execution speed, data quality, and the rigor of the decision framework. They map to the "Founders who launched something that didn't work" target segment. They are likely a Preflight + Build-to-Launch client who may run two experiments in parallel.

**How he finds SC:** Content marketing (Twitter/X thread about validation frameworks, blog post about the DFG case study), or Indie Hackers / Hacker News discussion.

**Landing page behavior:** Jordan will skip the hero section and scroll directly to the case study, pricing, and process details. They will evaluate the kill criteria methodology and want to see real numbers (conversion rates, cost per lead, time to decision). They convert fast on `presale` archetypes if the price is right, or on `fake_door` if they just want to test demand. They are the most likely persona to click through from a specific ad with high message-match expectations.

---

## User Journey

### Journey Map: First Touch to Core Value Delivery

This journey traces a new prospect (using Marcus as the primary persona) from first encountering SC to receiving a GO/NO-GO decision. MVP scope only -- no client portal, no automated campaign generation, no discovery engine.

---

**Step 1: Discovery (External)**

- **Trigger:** Marcus sees a LinkedIn post about SC's DFG case study, or receives a cold outreach email with the value prop: "Kill bad ideas in 2 weeks instead of 6 months."
- **Action:** Clicks link to siliconcrane.com.
- **Screen:** `index.astro` (homepage at siliconcrane.com).
- **Content consumed:** Hero headline ("From Hypothesis to Working Software in 30 Days"), problem statement ("The average startup spends $250K and 18 months before realizing they built the wrong thing"), service overview (Landing Pages, MVPs & Prototypes, Validation Infrastructure), and "Why Silicon Crane" proof points.
- **Signal captured:** GA4 page_view (existing).
- **Decision point:** "Is this for me?" -- Marcus needs to see that SC validates ideas, not just builds software.

**Step 2: Services Exploration**

- **Action:** Marcus clicks "How It Works" anchor link, or navigates to `/services`.
- **Screen:** `services.astro` or the "#how-it-works" section on index.
- **Content consumed:** Sprint types (Preflight, Build-to-Launch, Run + Decide), what each includes, timeline, and pricing (once Tier 1 items are complete per project instructions Section 2).
- **Missing today (Tier 1 blocker):** Pricing is not locked. Services page exists but does not have specific prices or clear "next steps" CTAs. The intake form does not exist yet.
- **Decision point:** "What would I buy, and what does it cost?"

**Step 3: Trust Building**

- **Action:** Marcus looks for proof that SC has done this before.
- **Screen:** Case study page (does not exist yet -- Tier 2 per project instructions).
- **Content consumed:** DFG case study with the 5-part structure from project instructions Section 4: Hypothesis, Test, Data, Decision, Current State. Real metrics: time from idea to prototype, cost to reach market test, key pivots.
- **Missing today (Tier 2 blocker):** Case study page does not exist. FAQ page does not exist.
- **Decision point:** "Do they have the track record to execute?"

**Step 4: Intake**

- **Action:** Marcus clicks "Start Your Sprint" CTA or navigates to the intake form.
- **Screen:** Intake form (does not exist yet -- Tier 1 per project instructions).
- **Form fields:** Idea description (free text), current stage (select: just an idea / have done some research / have a prototype / have launched and need validation), budget range (select), timeline preference (select), name, email, company.
- **Post-submission:** Confirmation page with expected response time (24-48 hours) and what happens next.
- **Signal captured:** `POST /leads` with `custom_fields` containing intake responses.
- **Decision point:** "Am I willing to fill this out?" -- The form must feel lightweight, not like an enterprise procurement questionnaire.

**Step 5: Qualification (Internal)**

- **Action:** SC operator reviews the intake submission against qualification criteria (project instructions Section 3).
- **Screen:** Coda admin interface (Phase 1 admin per tech spec Section 9).
- **Operator evaluates:** Does Marcus have a specific idea? Can he articulate the problem? Is the budget aligned? Can he make decisions quickly?
- **Output:** GO/NO-GO on fit. If GO, schedule a scoping call. If NO-GO, send a polite decline with alternative resources.
- **Touchpoint with Marcus:** Email with either a Calendly link for a scoping call or a decline message.

**Step 6: Scoping Call**

- **Action:** Marcus and SC operator have a 30-minute call.
- **Screen:** None (video call, external to SC Console).
- **Discussion:** Align on sprint type, define preliminary kill criteria, agree on timeline.
- **Output:** Draft SOW with sprint type, deliverables, timeline, price, and kill criteria.

**Step 7: Contract + Payment**

- **Action:** Marcus reviews and signs SOW, pays via Stripe.
- **Screen:** Stripe Checkout (hosted by Stripe, not SC Console).
- **Trigger:** SC operator sends Stripe invoice or checkout link.
- **Post-payment:** Marcus receives confirmation email and kickoff scheduling link.
- **Signal captured:** `payments` table via Stripe webhook.

**Step 8: Sprint Execution (Opaque to Client)**

- **Action:** SC executes the sprint. Per project instructions Section 3, start with Option B (Sanitized): weekly updates and deliverable docs only. No client access to Command Center or GitHub issues.
- **Client touchpoints:** Weekly email updates with progress summary. No screen in SC Console -- this is email-based for MVP.
- **Output:** Experiment landing page deployed at `/e/[slug]`, ad campaign live, data collecting.

**Step 9: Landing Page Live**

- **Action:** The experiment landing page goes live, driving traffic from ad campaigns.
- **Screen:** `[slug].astro` -- the experiment landing page, rendered per archetype.
- **Visitors:** Marcus's target audience arrives from ads. They see the landing page, interact with the form or payment CTA, and generate signal data.
- **Signals captured:** `page_view`, `form_start`, `form_submit` (or `payment_complete`) via `POST /events`. Leads captured via `POST /leads`.
- **Marcus's role:** Passive. He may check in on weekly updates but does not interact with SC Console.

**Step 10: Decision Delivery**

- **Action:** SC operator compiles results and delivers GO/NO-GO recommendation.
- **Screen:** None for Marcus -- he receives a deliverable document (PDF or email) with the 5-part case study structure.
- **Content delivered:** Hypothesis tested, test methodology, data collected (conversion rate, cost per lead, total spend, time elapsed), decision recommendation (GO/KILL/PIVOT), evidence supporting the decision, and next steps.
- **Signal captured:** `decision_memos` table entry via Coda admin.
- **Marcus's outcome:** He now has evidence-based signal on whether to build. This is the core value delivery moment.

---

## Information Architecture

### Screen Inventory

The following screens exist or must exist for MVP. Each screen lists its content blocks and their data sources.

---

#### Public Marketing Site (siliconcrane.com)

**Screen 1: Homepage** (`/` -- `index.astro`)

- Status: Exists
- Content blocks:
  1. Hero section: headline, subheadline, primary CTA ("Start Your Sprint"), secondary CTA ("How It Works")
  2. Problem statement: single-paragraph pain point
  3. Services grid: 3 cards (Landing Pages, MVPs & Prototypes, Validation Infrastructure)
  4. "Why Silicon Crane" proof points: 3 stat cards (30 Days, Evidence-Focused, Go/Kill/Pivot)
  5. Contact/intake form: name, email, company, message, honeypot, submit
  6. Footer: copyright, Privacy link, Venture Crane link

**Screen 2: Services** (`/services` -- `services.astro`)

- Status: Exists (content needs Tier 1 completion: pricing, specific deliverables)
- Content blocks:
  1. Sprint type breakdown: Preflight, Build-to-Launch, Run + Decide, Scale Readiness
  2. Per-sprint details: duration, deliverables, price point
  3. Founding client offer: $2,500 rate with case study/testimonial exchange
  4. CTA to intake form

**Screen 3: About** (`/about` -- `about.astro`)

- Status: Exists
- Content blocks: Company background, methodology overview, team

**Screen 4: Case Study** (does not exist -- Tier 2)

- Content blocks:
  1. DFG case study header: venture name, archetype, sprint type
  2. The Hypothesis: what was believed
  3. The Test: what was built/run
  4. The Data: metrics (time to prototype, cost to market test, key pivots)
  5. The Decision: GO/NO-GO and rationale
  6. Current State: where it is now
- Data source: Static content (pre-rendered)

**Screen 5: Intake Form** (does not exist -- Tier 1)

- Content blocks:
  1. Form header: "Tell us about your idea"
  2. Idea description (textarea)
  3. Current stage (select)
  4. Budget range (select)
  5. Timeline preference (select)
  6. Contact fields: name, email, company
  7. Honeypot field
  8. Submit button
  9. Confirmation/thank-you state
- Data source: `POST /leads` with `custom_fields` for intake-specific responses

---

#### Experiment Landing Pages (siliconcrane.com/e/[slug])

**Screen 6: Landing Page** (`/e/[slug]` -- `[slug].astro`)

- Status: Exists (single-template, needs archetype-aware evolution per func spec Phase 6)
- MVP content blocks (current template):
  1. Headline (from `copy_pack.headline` or `experiment.name`)
  2. Subheadline (from `copy_pack.subheadline`)
  3. Price badge (conditional: if `stripe_price_id` and `price_cents` are set)
  4. Value props list (from `copy_pack.value_props`)
  5. Lead capture form (email, name, company, honeypot) OR Payment CTA
  6. Form message area (success/error/duplicate states)
- Data source: `GET /experiments/by-slug/:slug` (public endpoint)
- MVP evolution (per func spec Phase 6): Archetype-aware sections, SignalCapture component, social proof, FAQ, pricing section, qualification form, content preview, process steps

**Screen 7: Thank You** (`/e/[slug]/thank-you` -- `thank-you.astro`)

- Status: Exists
- Content blocks:
  1. Success icon
  2. Thank you heading
  3. "What happens next" list (3 items)
  4. Back to homepage link
- Data source: `getExperimentBySlug(slug)` for experiment name

**Screen 8: Payment** (`/e/[slug]/payment` -- `payment.astro`)

- Status: Exists
- Content blocks: Stripe Checkout redirect
- Data source: Experiment's `stripe_price_id`

---

#### Admin Interface

**Screen 9: Coda Admin Dashboard** (external -- Coda Pack)

- Status: Phase 1 per tech spec Section 9
- Content blocks:
  1. Experiment list with status filters
  2. Experiment detail view (all fields)
  3. Status transition controls
  4. Metrics import form
  5. Lead list per experiment
  6. Decision memo creation form
  7. Learning memo creation form
- Data source: sc-api internal endpoints via `X-SC-Key` auth

---

### Navigation Structure

**Primary navigation** (visible on marketing pages):

- Homepage (`/`)
- Services (`/services`)
- About (`/about`)
- Case Study (Tier 2 -- not yet built)
- Contact (`/#contact` anchor or separate intake page)

**Landing page navigation:** None. Experiment landing pages at `/e/[slug]` are standalone -- no site navigation, no header links, no distractions. This is intentional: landing pages must minimize exit paths to maximize conversion signal quality. The only navigation is the form CTA and the post-submission thank-you page.

**Footer navigation** (all pages):

- Privacy Policy
- Venture Crane (external)

---

## Interaction Patterns

### Pattern 1: Lead Capture Form (Experiment Landing Page)

**Flow:** Visitor arrives -> reads page -> interacts with form -> submits -> receives confirmation

**States:**

| State              | UI Presentation                                                                                           | Trigger                                 |
| ------------------ | --------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Default            | Form visible with empty fields. Submit button active with CTA text from `copy_pack.cta_primary`.          | Page load                               |
| Form start         | No visible change. `form_start` event fired to `POST /events` on first field focus.                       | First field interaction                 |
| Submitting         | Submit button disabled, text changes to "Submitting...", all fields disabled.                             | Form submit click                       |
| Success            | Redirect to `/e/[slug]/thank-you`.                                                                        | `POST /leads` returns `success: true`   |
| Error (duplicate)  | Yellow message box: "You're already on the list! Check your email for updates." Submit button re-enabled. | API returns `DUPLICATE_LEAD` error code |
| Error (validation) | Red message box with error message from API. Submit button re-enabled.                                    | API returns `VALIDATION_ERROR`          |
| Error (network)    | Red message box: "Network error. Please check your connection and try again." Submit button re-enabled.   | Fetch throws exception                  |
| Honeypot triggered | Silent redirect to thank-you page. No API call.                                                           | Hidden `website` field has value        |

**Error handling notes:**

- The submit button text reverts to the CTA text on error, not a generic fallback. Currently the code falls back to "Get Early Access" -- this should use the experiment's `copy_pack.cta_primary` value.
- Duplicate lead handling is a yellow warning, not a red error -- the visitor should not feel punished for submitting twice.
- Network errors should suggest checking connectivity, not "something went wrong" (which implies a server problem the visitor cannot fix).

---

### Pattern 2: Payment CTA (Priced Experiments)

**Flow:** Visitor arrives -> reads page -> clicks payment CTA -> redirected to Stripe Checkout -> completes payment -> redirected to confirmation

**States:**

| State                 | UI Presentation                                                                           | Trigger                                  |
| --------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------- |
| Default               | Payment CTA button with price display: "Proceed to Payment". Price badge visible in hero. | Page load                                |
| Navigating to payment | Browser navigates to `/e/[slug]/payment`.                                                 | CTA click                                |
| Stripe Checkout       | Stripe-hosted checkout page. SC Console has no control over this UI.                      | Payment page loads Stripe session        |
| Payment success       | Stripe redirects to success URL (currently `/e/[slug]/thank-you`).                        | Stripe confirms payment                  |
| Payment failure       | Stripe shows error on checkout page. Visitor can retry or cancel.                         | Card declined or payment error           |
| Payment cancel        | Stripe redirects to cancel URL (back to landing page).                                    | Visitor clicks cancel on Stripe checkout |

**Notes:**

- The current flow uses a separate `/e/[slug]/payment` page as an intermediary before Stripe Checkout. This adds a click to the flow. For MVP this is acceptable. Phase 6 evolution should evaluate whether a direct Stripe Checkout redirect from the landing page CTA reduces friction.
- Post-payment confirmation should differ from post-signup confirmation: it should include the amount paid, expected delivery timeline, and "what happens next" specific to the purchase, not the generic "We'll be in touch" message.

---

### Pattern 3: Contact Form (Homepage)

**Flow:** Visitor arrives at homepage -> scrolls to contact section -> fills form -> submits -> receives confirmation

**States:**

| State              | UI Presentation                                                                                                               | Trigger                           |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| Default            | Form with 4 fields: name (required), email (required), company (optional), message (required). Submit button: "Get in Touch". | Page load or scroll to `#contact` |
| Submitting         | Submit button disabled, text changes to "Sending...".                                                                         | Form submit click                 |
| Success            | Green message box: "Thanks! We'll be in touch soon." Form fields reset.                                                       | `POST /contact` returns 200       |
| Error (fallback)   | Browser opens `mailto:launch@siliconcrane.com` with prefilled subject and body.                                               | Fetch fails                       |
| Honeypot triggered | Fake success message displayed. No API call.                                                                                  | Hidden `website` field has value  |

**Design note:** The mailto fallback on network error is a smart degradation pattern. The visitor still gets to communicate their interest even if the API is down. This should be preserved in any future redesign.

---

### Pattern 4: Preview Mode (Operator Review)

**Flow:** Operator appends `?preview=true` to any experiment URL -> page renders regardless of experiment status -> operator reviews -> transitions status to `launch` when satisfied

**States:**

| State                              | UI Presentation                                                                                                                                                                       | Trigger                                                                      |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Preview active                     | Page renders normally but includes `<meta name="robots" content="noindex">`. Visual indicator (e.g., banner) should show "PREVIEW MODE - Not visible to public" for operator clarity. | `?preview=true` query parameter                                              |
| Status not launch/run (no preview) | Redirect to 404.                                                                                                                                                                      | Experiment status is not `launch` or `run`, and no `?preview=true` parameter |

**Notes:**

- Preview mode currently does not exist in the codebase. The current `[slug].astro` redirects to 404 for any experiment not in `launch` or `run` status.
- The preview banner must be visually obvious but must not affect the page layout -- the operator needs to see exactly what visitors will see, with a non-intrusive overlay indicating preview mode.

---

## Platform-Specific Design Constraints

### Primary Platform: Mobile Web

Per DD#5 Section 3: "DD#2 specifies mobile-first for all archetypes -- the majority of ad traffic arrives on mobile." Landing pages receive traffic primarily from paid social ads (Facebook, Instagram, TikTok, LinkedIn) where the majority of users are on mobile devices.

**Constraints:**

1. **Viewport:** All landing page content must be legible and interactive at 320px minimum width. The current template uses `container mx-auto px-4` which provides adequate padding, but form inputs at `px-4 py-2` may be undersized for mobile touch targets.

2. **Touch targets:** All interactive elements (buttons, form fields, links) must meet a minimum 44x44px touch target (Apple HIG / WCAG 2.5.5). The current submit button (`py-3 px-6`) meets this requirement. Form inputs (`py-2`) may fall below the 44px minimum height on some devices.

3. **Form input sizing:** On iOS Safari, form inputs with font-size below 16px trigger automatic zoom, which disrupts the page layout. All form inputs must use `text-base` (16px) or larger to prevent this.

4. **Scroll performance:** The `scroll_depth` tracking event listener must use `{ passive: true }` to avoid blocking scroll on mobile. The DD#5 signal capture spec already specifies this.

5. **Connection reliability:** Mobile users on cellular connections may have intermittent connectivity. The `navigator.sendBeacon` approach for event tracking (specified in DD#5) is correct -- it survives page navigation and is fire-and-forget. Form submissions use `fetch`, which can fail on poor connections. The existing error handling ("Network error. Please check your connection and try again.") is appropriate.

6. **Page weight:** Landing pages must load within 3 seconds on a 3G connection. Astro's zero-JS-by-default architecture helps. The only client-side JS should be: form handling, signal capture (sendBeacon), and A/B variant assignment (Phase 6). No JavaScript frameworks, no heavy libraries.

7. **Above the fold:** On mobile, the headline, subheadline, and primary CTA must be visible without scrolling. For `fake_door` (the lightest archetype), the entire conversion path (headline + email field + submit button) should be above the fold on a standard mobile viewport (375x667px).

### Secondary Platform: Desktop Web

Desktop is the secondary consumption context, primarily for direct traffic (bookmarks, email links, organic search).

**Adaptations:**

- Use the existing responsive breakpoint pattern (`md:` prefix in Tailwind) for two-column layouts where appropriate (e.g., hero image beside hero text, form beside value props).
- Maximum content width is constrained to `max-w-2xl` (672px) on the current landing page template, which is appropriate for readability but may waste space on wide monitors. Consider `max-w-3xl` or `max-w-4xl` for pages with more sections (presale, concierge, service_pilot).
- Desktop users are more likely to read long-form content (case studies, FAQ). Prioritize scannable formatting: clear headings, short paragraphs, bullet lists.

---

## Accessibility Requirements

### WCAG Compliance Target

**WCAG 2.1 Level AA** -- This is the baseline for all public-facing pages (marketing site and experiment landing pages). Level AAA is not targeted for MVP but specific AAA criteria should be adopted where low-effort (e.g., 4.5:1 contrast ratios over the 3:1 AA minimum for large text).

### Specific Requirements

**1. Color Contrast (WCAG 1.4.3)**

- All text must meet 4.5:1 contrast ratio against its background for normal text, 3:1 for large text (18px+ or 14px+ bold).
- The current color scheme uses `text-gray-600` on white (`#4B5563` on `#FFFFFF` = 5.9:1 ratio -- passes) and `text-slate-300` on `bg-slate-900` (`#CBD5E1` on `#0F172A` = 11.1:1 ratio -- passes).
- The `text-slate-500` used for footnotes on dark backgrounds (`#64748B` on `#0F172A` = 4.5:1 -- borderline, must be verified).
- Form validation error colors (`text-red-800` on `bg-red-50`) and duplicate warning colors (`text-yellow-800` on `bg-yellow-50`) must be verified for contrast.
- The tone-based styling system (Phase 6) must enforce contrast minimums for all three registers: `rational` (blue/gray), `empathetic` (teal), `urgent` (red). The `tone-urgent` red palette (`bg-red-600`) with white text passes at 4.6:1 but is close to the threshold.

**2. Keyboard Navigation (WCAG 2.1.1)**

- All interactive elements must be reachable and operable via keyboard (Tab, Enter, Escape).
- The current form implementation uses standard HTML form elements, which are keyboard-accessible by default.
- The honeypot field uses `tabindex="-1"` to remove it from the tab order -- correct.
- Focus indicators must be visible. The current `focus:ring-2 focus:ring-blue-500` provides a visible focus ring. Do not remove or suppress default focus outlines without providing a custom alternative.

**3. Form Labels (WCAG 1.3.1, 3.3.2)**

- All form inputs must have associated `<label>` elements with matching `for`/`id` attributes. The current implementation does this correctly.
- Required fields must be programmatically indicated, not just visually. The current pattern uses `*` in label text and the `required` attribute on the input. Both should be present.
- Error messages must be associated with their fields using `aria-describedby` or `aria-live` regions. The current implementation uses a generic message div (`#form-message`) that is not associated with specific fields. For MVP this is acceptable for single-form pages; Phase 6 should add per-field validation with `aria-describedby`.

**4. Semantic HTML (WCAG 1.3.1)**

- Landing pages must use proper heading hierarchy: one `<h1>` per page (the headline), `<h2>` for section headings, `<h3>` for subsections.
- The current template uses `<h1>` for the headline and `<h2>` for the form section heading -- correct.
- Lists of value props must use `<ul>`/`<li>` elements -- the current implementation does this correctly.
- The thank-you page uses proper heading hierarchy with `<h1>` and `<h2>`.

**5. Alternative Text (WCAG 1.1.1)**

- All images must have meaningful `alt` text. Decorative SVG icons should have `aria-hidden="true"`.
- The current template's checkmark SVGs do not have `aria-hidden="true"` -- these should be added since the checkmarks are decorative (the meaning is conveyed by the list text).
- Hero images (Phase 6, from `asset_references`) must have `alt` text derived from the `creative_brief.primary_subject` field or a fallback description.

**6. Screen Reader Compatibility (WCAG 4.1.2)**

- Form submission states (submitting, success, error) must be announced to screen readers. Use `aria-live="polite"` on the `#form-message` div so state changes are announced without interrupting the user.
- The current implementation does not include `aria-live` on the message div -- this must be added.
- Loading states on the submit button should use `aria-busy="true"` and update `aria-label` to "Submitting, please wait" during submission.

**7. Motion and Animation (WCAG 2.3.1, 2.3.3)**

- The A/B variant no-flicker protocol (Phase 6) uses `opacity` transitions. These must respect `prefers-reduced-motion`:
  ```css
  @media (prefers-reduced-motion: reduce) {
    .ab-pending {
      opacity: 1;
      transition: none;
    }
  }
  ```
- No auto-playing animations, carousels, or videos on landing pages.

**8. Touch Target Size (WCAG 2.5.5 -- Level AAA, adopted for MVP)**

- All interactive elements must be at least 44x44 CSS pixels. This is Level AAA but is critical for mobile-first landing pages where the majority of traffic is touch-based.
- The current submit button meets this requirement. Form inputs should be audited.

### Assistive Technology Support

- **Screen readers:** VoiceOver (iOS/macOS), NVDA (Windows), TalkBack (Android). Test with at least VoiceOver for MVP since the primary developer environment is macOS.
- **Keyboard-only navigation:** Full form completion and submission must be possible without a mouse or touch input.
- **Zoom:** Pages must remain functional and legible at 200% browser zoom (WCAG 1.4.4). The responsive Tailwind layout handles this inherently, but fixed-width elements and absolute-positioned elements (like the honeypot) should be verified.

---

## UX Risks and Open Items

### Risk 1: No Signal Capture on Current Landing Pages

The existing `[slug].astro` template fires zero events to `event_log`. No `page_view`, no `form_start`, no `scroll_depth`. This means the metrics pipeline has no landing-page-side data -- `sessions` and `conversions` in `metrics_daily` must be populated manually or from ad platform data only. The func spec identifies `SignalCapture` as "the highest-priority item" (Phase 6). From a UX perspective, this means the operator has no visibility into visitor behavior until SignalCapture is implemented. Recommendation: prioritize `SignalCapture` ahead of archetype-specific templates.

### Risk 2: Thank-You Page is Generic

The current thank-you page shows the same "We'll be in touch" message for all archetypes. For `content_magnet`, it should show a download link. For `presale`, it should show payment confirmation and delivery timeline. For `concierge`/`service_pilot`, it should promise personal founder outreach within 24 hours. These archetype-specific thank-you variants should ship alongside the archetype-aware template router in Phase 6.

### Risk 3: No Intake Form Exists

The Tier 1 blockers from the project instructions list an intake form as a must-have to accept money. The current homepage has a contact form, but it captures free-text "What are you looking to validate?" without structured fields for stage, budget, or timeline. A proper intake form is needed before the first client engagement. This is a UX deliverable that must precede the func spec v2.0 implementation work.

### Risk 4: Accessibility Debt in Current Template

The decorative SVG icons lack `aria-hidden="true"`, the form message div lacks `aria-live`, and submit button loading states are not announced to screen readers. These are small fixes that should be addressed in the next PR touching `[slug].astro` or `thank-you.astro`, not deferred to a dedicated accessibility sprint.
