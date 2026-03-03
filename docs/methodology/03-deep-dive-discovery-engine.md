# Deep Dive #3: AI-Scaled Customer Discovery — The Discovery Engine

> **Source:** Notion page `318786f4-e365-81af-bcc1-e8bb13b576ff`
> **Document Type:** Deep Dive Working Document
> **Series:** SC Validation Methodology
> **Date:** March 2, 2026
> **Status:** Complete — pending functional spec integration
> **Parent:** SC Validation Methodology — Strategy Session (March 2026)
> **Prior:** Deep Dive #2: Test Type Taxonomy — The Validation Ladder

---

# 1. Purpose & Scope

This deep dive defines the **Discovery Engine** — the Step 2 system in the SC validation workflow that transforms customer discovery interviews from a manual bottleneck into an AI-scalable process. It specifies three interview modes, four interview protocols, a pain severity scoring rubric, the Discovery Summary artifact, the Discovery Gate mechanism, and the AI agent workflow for orchestrating the entire discovery process.

**What this document covers:**

- The solopreneur scaling problem and why AI assistance is necessary for customer discovery
- Three interview modes (AI-Moderated, Human-Led, Hybrid) with per-mode specifications
- Four interview protocols mapped to Hypothesis Card fields (Problem Discovery, Solution Fit, Willingness to Pay, ICP Validation)
- A 3-dimensional pain severity scoring rubric (Functional Pain, Emotional Cost, Opportunity Cost)
- The Discovery Summary artifact specification and schema sketch
- The Discovery Gate — revised criteria with mode-weighted interview counting
- Minimum interview counts and saturation detection
- Assumption type classification from interview signals
- Technology landscape for AI-conducted interviews (build vs. buy)
- Trust and quality considerations for Validation-as-a-Service (VaaS)
- The 6-step AI agent workflow for discovery orchestration

**Relationship to DD#1 (The Venture Narrative):**

The Hypothesis Card (DD#1) is the primary input to discovery. The Venture Narrative's five elements — Hero, Struggle, Stakes, Breakthrough, Moment — directly map to interview protocol questions. The three-dimensional problem taxonomy (Functional Pain / Emotional Cost / Opportunity Cost) from DD#1 Section 2 becomes the foundation for pain severity scoring in this document. Discovery interviews enrich the Hypothesis Card from Tier 1 (Draft) to Tier 2 (Full), populating Current Alternatives, Market Sizing, Competitive Landscape, and Key Assumptions with real customer evidence.

**Relationship to DD#2 (The Validation Ladder):**

The Discovery Summary (this document's output artifact) feeds into the Discovery Gate defined in DD#2 Section 4. DD#2 established three gate checks (>=5 interviews, pain severity >=3/5, assumption informed by interview data) and left six open questions (DD#2 Section 10) that this document answers directly in Section 13.5.

**Questions this document answers:**

1. Can AI agents help source and screen interview candidates?
2. Can AI conduct preliminary discovery interviews?
3. What is the trade-off between AI interviews and human intuition for catching real pain points?
4. If offered as VaaS, do customers trust AI-conducted interviews?
5. What technology exists today to enable this?
6. How does the Discovery Summary artifact get populated from interview data?
7. How do AI-scaled discovery interviews feed into the discovery gate?
8. What interview protocols map to each Hypothesis Card field?
9. What minimum interview count is needed before each test category?
10. How does pain severity scoring work in AI-conducted interviews?
11. What interview signals specifically inform the assumption type classification used in test selection?

---

# 2. The Discovery Bottleneck — Why AI is Necessary

## The Solopreneur Scaling Problem

Customer discovery is the most important and least scalable step in lean validation. The math is brutal for a solopreneur or small team:

- **Minimum viable discovery:** 5-15 interviews per venture hypothesis
- **Time per interview:** 3-5 hours (sourcing + scheduling + conducting + notes + analysis)
- **Calendar time:** 2-4 weeks to complete a discovery sprint
- **Cognitive load:** After 5-8 interviews in a week, a solo founder's ability to detect novel patterns degrades

For Ventracrane validating multiple ventures, or for SC offered as VaaS to external clients, this creates an impossible constraint. A single operator cannot run discovery sprints for 3-5 ventures simultaneously without quality collapse.

## Where the Bottleneck Actually Lives

The discovery process has four phases, and the bottleneck is not evenly distributed:

| Phase          | Activity                                      | Time per Interview | Bottleneck Severity                                        |
| -------------- | --------------------------------------------- | ------------------ | ---------------------------------------------------------- |
| **Sourcing**   | Finding qualified candidates matching the ICP | 30-90 min          | High — most time-consuming, lowest success rate            |
| **Scheduling** | Coordinating calendars, sending reminders     | 15-30 min          | Medium — administrative, automatable                       |
| **Conducting** | Running the actual interview                  | 30-60 min          | Low — the core value activity                              |
| **Analysis**   | Extracting signals, scoring, synthesizing     | 45-90 min          | High — cognitively demanding, quality degrades with volume |

The counterintuitive insight: **conducting the interview is not the bottleneck**. Sourcing candidates and analyzing results are. This means AI can deliver the most value by automating the bookends (sourcing + analysis) even if human-led interviews remain the gold standard for the middle.

## The Quality-Quantity Tradeoff

Research on AI-conducted interviews (Outset AI, Listen Labs, academic studies) reveals a consistent pattern:

- **Human saturation:** A skilled interviewer reaches thematic saturation at 5-15 interviews. Beyond 15, marginal insight per interview drops sharply.
- **AI scale advantage:** AI-moderated interviews can reach 30+ participants in the same calendar time, with consistent protocol adherence across all sessions.
- **Emotional depth gap:** AI interviews show approximately 26% lower emotional connection scores compared to skilled human interviewers, based on participant self-reports.
- **Disclosure paradox:** Multiple studies show participants disclose more to AI interviewers on sensitive or embarrassing topics — the absence of human judgment reduces social desirability bias.
- **Protocol adherence:** AI interviewers follow the protocol 100% of the time. Human interviewers drift, skip questions under time pressure, and introduce unconscious framing biases.

The tradeoff is not "AI vs. human" — it is "consistent breadth vs. empathetic depth." SC's Discovery Engine is designed to capture both.

---

# 3. The Discovery Engine — SC's Interview Framework

## Three Interview Modes

| Attribute              | AI-Moderated                                                 | Human-Led                                                | Hybrid                                                        |
| ---------------------- | ------------------------------------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------- |
| **Modality**           | Asynchronous text/voice via AI platform                      | Synchronous video/phone call                             | Human conducts, AI assists in real-time + analyzes            |
| **Conductor**          | AI agent following protocol                                  | Founder or trained interviewer                           | Human interviewer with AI co-pilot                            |
| **Depth**              | Moderate — follows protocol precisely, limited improvisation | High — can pursue unexpected threads, read body language | High — human improvisation with AI ensuring protocol coverage |
| **Scale**              | High — 10-30+ interviews per week                            | Low — 3-5 interviews per week                            | Medium — 5-10 interviews per week                             |
| **Cost per Interview** | \$5-15 (platform fee + AI compute)                           | \$50-150 (interviewer time + scheduling)                 | \$30-75 (reduced prep/analysis time)                          |
| **Best For**           | ICP validation, broad pattern detection, sensitive topics    | Problem discovery, emotional depth, complex B2B          | Default mode — balanced quality and throughput                |

**Default mode: Hybrid.** Human-led interviews with AI-powered preparation, real-time protocol tracking, and automated post-interview analysis. This captures the depth of human conversation with the consistency and scale of AI processing.

### AI-Moderated Mode

The AI agent conducts the interview independently, following the selected protocol. The interview happens asynchronously (the participant responds at their own pace) or synchronously via voice AI. The agent handles follow-up probing, enforces time boundaries, and extracts signals in real-time.

**Strengths:** Scale, consistency, lower cost, reduced social desirability bias, 24/7 availability across time zones.

**Weaknesses:** Cannot read body language or vocal micro-expressions, limited ability to pursue truly unexpected threads, lower emotional rapport.

**When to use:** ICP validation at scale (need 20+ data points on demographics/firmographics), sensitive topics where anonymity helps disclosure, early-stage screening before committing to human interviews.

### Human-Led Mode

A human interviewer (founder, trained researcher, or VaaS operator) conducts the interview. AI assists with preparation (generating the protocol from the Hypothesis Card) and post-interview analysis (transcript processing, signal extraction, pain scoring).

**Strengths:** Deepest emotional insight, ability to follow unexpected threads, builds personal relationships with potential early adopters, body language and tonal cues.

**Weaknesses:** Lowest throughput, highest cost, interviewer bias and fatigue, inconsistent protocol adherence.

**When to use:** Problem discovery for novel/ambiguous problem spaces, B2B enterprise interviews where relationships matter, when the founder needs to personally hear customer pain.

### Hybrid Mode

The human conducts the interview while an AI agent operates as a co-pilot: monitoring protocol coverage in real-time, suggesting follow-up questions, flagging when key topics have not been explored, and performing real-time signal extraction. Post-interview, the AI generates the full analysis automatically.

**Strengths:** Human depth + AI consistency, reduced interviewer cognitive load, real-time gap detection, automated analysis.

**Weaknesses:** Requires technology integration (transcript streaming + AI overlay), higher per-interview cost than pure AI, interviewer must be comfortable with AI assistance.

**When to use:** Default mode for all discovery sprints. The best balance of quality and efficiency.

## The Trust Disclosure Principle

> **When using AI-Moderated mode, the participant must always be informed they are interacting with an AI.** No deception. The disclosure should be upfront, clear, and normalized: "This interview is conducted by an AI research assistant. Your responses are confidential and will be used to understand [problem space]." Studies show that upfront disclosure does not significantly reduce participation rates and may increase disclosure on sensitive topics.

## Phase 1 Focus

SC's Phase 1 implementation focuses on **human-led interviews with AI-powered analysis**. The AI agent handles:

1. Generating interview protocols from the Hypothesis Card
2. Assisting with candidate sourcing (search queries, outreach templates, screening criteria)
3. Post-interview transcript analysis (signal extraction, pain scoring, Discovery Summary population)

Full AI-Moderated interviews are a Phase 2 capability, dependent on the maturity of conversational AI platforms and SC's own trust calibration data from Phase 1 human interviews.

---

# 4. Interview Protocols — Mapping to Hypothesis Card Fields

## Protocol Overview

Each protocol is designed to extract specific information that maps directly to Hypothesis Card fields and Discovery Summary outputs.

| Protocol               | Purpose                                                               | Primary HC Fields Tested                                      | Discovery Summary Fields Populated                                          | Typical Duration |
| ---------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------- |
| **Problem Discovery**  | Validate problem existence, severity, and current coping mechanisms   | Problem Statement, Stakes (Failure/Success), Customer Segment | problem_confirmed, pain_severity, top_quotes, current_alternatives_observed | 30-45 min        |
| **Solution Fit**       | Test whether the proposed solution resonates and what features matter | Solution Hypothesis, Why Now                                  | solution_resonance, feature_priorities, objections                          | 20-30 min        |
| **Willingness to Pay** | Explore price sensitivity and value perception                        | Solution Hypothesis, Market Sizing                            | wtp_signal, price_range_observed, value_anchors                             | 15-25 min        |
| **ICP Validation**     | Refine the customer segment with real demographic/firmographic data   | Customer Segment                                              | icp_refinements, segment_characteristics, disqualification_patterns         | 15-20 min        |

## 4.1 Problem Discovery Protocol

The foundational protocol. Every discovery sprint begins here. No interview should skip problem discovery — it is the minimum viable protocol even when time is constrained.

### Opening Questions

These questions are asked in order. They are designed to be open-ended, non-leading, and to let the participant's natural language reveal pain points.

1. "Tell me about your role and what a typical [day/week] looks like."
2. "What are the biggest challenges you face in [problem domain]?"
3. "Can you walk me through the last time you dealt with [problem]? What happened?"
4. "How are you handling [problem] today? What tools or workarounds do you use?"
5. "What happens when [problem] doesn't get solved? What's the impact?"

### Probing Follow-Ups

The interviewer (human or AI) selects from these follow-ups based on participant responses:

- **Functional depth:** "How much time does that take you? How often does it happen?"
- **Emotional depth:** "How does that make you feel when [situation] happens?"
- **Opportunity cost:** "What would you be doing instead if this wasn't a problem?"
- **Severity calibration:** "On a scale of 1-10, how much of a pain point is this for you?"
- **Frequency and recency:** "When was the last time this happened? How often?"
- **Current alternatives:** "Have you tried any solutions for this? What worked and what didn't?"
- **Switching cost:** "What would it take for you to switch from your current approach?"

### Closing Questions

6. "If you could wave a magic wand and fix one thing about [problem domain], what would it be?"
7. "Is there anything else about [problem] that I should have asked about but didn't?"

### Signal Extraction Rules

After the interview, the following signals are extracted:

| Signal                         | Extraction Method                                                          | Maps To                         |
| ------------------------------ | -------------------------------------------------------------------------- | ------------------------------- |
| Problem confirmed (Y/N)        | Participant describes the problem unprompted OR confirms it when described | `problem_confirmed`             |
| Pain severity (1-5)            | Scored across 3 dimensions using rubric (Section 5)                        | `pain_severity`                 |
| Current alternatives           | Participant describes existing solutions/workarounds                       | `current_alternatives_observed` |
| Frequency and recency          | Explicit statements about how often/recently the problem occurs            | `frequency_indicator`           |
| Emotional language             | Direct quotes expressing frustration, anxiety, relief, etc.                | `top_quotes`                    |
| Willingness to discuss further | Participant asks for follow-up, offers to connect others                   | `engagement_signal`             |

### Red Flag Patterns

These patterns suggest the problem may not be real or severe enough to validate:

- Participant cannot describe a specific recent instance of the problem
- Pain is acknowledged but described as "not a big deal" or "I've gotten used to it"
- Current alternatives are described as "fine" or "good enough" without frustration
- Participant redirects to a different problem repeatedly (the stated problem may not be the real one)
- Excessive agreement without specifics (acquiescence bias — see Section 11)

## 4.2 Solution Fit Protocol

Run after Problem Discovery has confirmed the problem. Presents the solution concept (from the Hypothesis Card's Solution Hypothesis and Breakthrough narrative element) and measures resonance.

### Opening Questions

1. "Based on what you've told me about [problem], I'd like to describe a possible solution and get your reaction."
2. [Present the solution concept in 2-3 sentences, adapted from the Solution Hypothesis field]
3. "What's your initial reaction to that?"
4. "What would this need to do for you to actually use it?"
5. "What concerns or objections come to mind?"

### Probing Follow-Ups

- **Feature priority:** "Of the things I described, which is the most important to you? Which could you live without?"
- **Competitive comparison:** "How does this compare to what you use today?"
- **Adoption friction:** "What would make it hard for you to switch to something like this?"
- **Timing:** "If this existed today, would you try it? What would you need to see first?"
- **Social proof need:** "Would you need to see other people using this before you tried it?"

### Closing Questions

6. "If this existed exactly as I described it, would you want to be notified when it launches?"
7. "Who else in your [company/network] would benefit from something like this?"

### Signal Extraction Rules

| Signal                   | Extraction Method                                                    | Maps To              |
| ------------------------ | -------------------------------------------------------------------- | -------------------- |
| Solution resonance (1-5) | Enthusiasm level: 1=dismissive, 3=interested, 5=desperate to have it | `solution_resonance` |
| Feature priorities       | Ranked list of features/capabilities mentioned as important          | `feature_priorities` |
| Objections               | Specific concerns or reasons they would not use it                   | `objections`         |
| Referral willingness     | Offers to connect others or asks for follow-up                       | `engagement_signal`  |
| Adoption timeline        | Expressed urgency or lack thereof                                    | `urgency_indicator`  |

## 4.3 Willingness to Pay Protocol

Run after Solution Fit has confirmed resonance. Explores price sensitivity without anchoring the participant to a specific number prematurely.

### Opening Questions

1. "You mentioned [solution] would be valuable for you. I'd like to understand what that value looks like in terms of cost."
2. "How much does [problem] cost you today — in time, money, or missed opportunities?"
3. "If a solution like this saved you [time/money/pain described], what would that be worth to you per month?"
4. "At what price would this feel like a no-brainer? At what price would you say 'no way'?"

### Probing Follow-Ups

- **Value anchoring:** "You mentioned it costs you [X hours/dollars] today. If this cut that in half, what would you pay?"
- **Comparison pricing:** "What do you pay for similar tools/services today?"
- **Budget reality:** "Is this something you'd pay for out of pocket, or would it need organizational approval?"
- **Payment model preference:** "Would you prefer monthly, annual, or one-time pricing?"
- **Free vs. paid threshold:** "What would it need to do for you to pay for it vs. expecting it for free?"

### Closing Questions

5. "If I told you this was [specific price], what would your reaction be?"
6. "Would you pre-order this today at [price]? What would make you say yes?"

### Signal Extraction Rules

| Signal                   | Extraction Method                                            | Maps To                |
| ------------------------ | ------------------------------------------------------------ | ---------------------- |
| WTP signal (Y/N/Maybe)   | Participant expresses willingness to pay at some price point | `wtp_signal`           |
| Price range              | Stated acceptable range (no-brainer to no-way)               | `price_range_observed` |
| Value anchors            | Specific comparisons to existing spend or cost-of-problem    | `value_anchors`        |
| Budget authority         | Whether participant controls the purchase decision           | `budget_authority`     |
| Payment model preference | Monthly/annual/one-time preference                           | `payment_model_pref`   |

## 4.4 ICP Validation Protocol

Run in parallel with any other protocol, or as a standalone for demographic/firmographic data collection at scale. This protocol is the best candidate for AI-Moderated mode because it requires breadth over depth.

### Opening Questions

1. "Tell me about yourself and your [role/business/situation]."
2. "How large is your [team/company/operation]?"
3. "What tools/platforms do you use for [relevant activity]?"
4. "How did you first become aware of [problem]?"
5. "Who else in your [company/network] deals with this problem?"

### Probing Follow-Ups

- **Demographic precision:** "How long have you been in this role? What's your background?"
- **Firmographic detail:** "What industry? How many employees? Annual revenue range?"
- **Behavioral patterns:** "How do you typically discover new tools/services? What channels?"
- **Decision-making:** "Who makes the buying decision for tools like this? Is it you, a team, a committee?"
- **Segmentation signals:** "Would you describe yourself as [segment characteristic]?"

### Closing Questions

6. "If I wanted to find more people like you who have this problem, where would I look?"
7. "What communities, publications, or events are relevant to people in your situation?"

### Signal Extraction Rules

| Signal                    | Extraction Method                                                              | Maps To                     |
| ------------------------- | ------------------------------------------------------------------------------ | --------------------------- |
| Segment match (Y/N)       | Participant matches the Hypothesis Card's Customer Segment description         | `segment_match`             |
| ICP refinements           | Demographic/firmographic details that refine or challenge the Customer Segment | `icp_refinements`           |
| Discovery channels        | Where this person can be found for marketing (feeds campaign targeting)        | `discovery_channels`        |
| Decision dynamics         | Solo vs. committee, budget authority, approval process                         | `decision_dynamics`         |
| Disqualification patterns | Characteristics that correlate with non-customers                              | `disqualification_patterns` |

## Protocol Selection Logic

Not every interview needs all four protocols. Selection depends on the current state of the Hypothesis Card and what has already been validated.

| Current State                         | Required Protocols                 | Optional Protocols                |
| ------------------------------------- | ---------------------------------- | --------------------------------- |
| Tier 1 card, no interviews yet        | Problem Discovery + ICP Validation | —                                 |
| Problem confirmed, solution undefined | Problem Discovery + Solution Fit   | ICP Validation                    |
| Problem + solution confirmed          | Willingness to Pay                 | Solution Fit (refinement)         |
| All protocols run, enriching Tier 2   | ICP Validation (at scale via AI)   | Any protocol for saturation check |

**Rule:** Problem Discovery is always the first protocol in any discovery sprint. Never skip directly to Solution Fit or WTP without confirming the problem first.

## Worked Example

> **Scenario:** SC is validating a B2B SaaS idea — AI-powered competitor tracking for marketing managers at mid-size companies (50-200 employees).
>
> **Hypothesis Card (Tier 1):**
>
> - Customer Segment: Marketing managers at B2B SaaS companies, 50-200 employees
> - Problem Statement: Tracking competitors manually in spreadsheets takes 5+ hours/week and misses real-time changes
> - Solution Hypothesis: Automated competitor monitoring dashboard with AI-generated insight summaries
>
> **Discovery Sprint Plan:**
>
> - Week 1: 5 Hybrid interviews using Problem Discovery + ICP Validation protocols
> - Week 2: If problem confirmed, 3 Hybrid interviews adding Solution Fit protocol
> - Week 2 (parallel): 10 AI-Moderated ICP Validation interviews for demographic breadth
> - Week 3: 3 Hybrid interviews adding WTP protocol for confirmed problem-holders
>
> **Total:** 21 interviews over 3 weeks — 11 Hybrid, 10 AI-Moderated. Weighted count: 11 x 0.75 + 10 x 0.5 = 13.25 (see Section 7 for mode weighting).

---

# 5. Pain Severity Scoring Rubric

## Three-Dimensional Pain Assessment

Pain severity uses the same three dimensions from DD#1's Venture Narrative problem taxonomy (The Struggle). Each dimension is scored independently on a 1-5 scale.

### Functional Pain

| Score | Label      | Description                                                     | Interview Signal                   |
| ----- | ---------- | --------------------------------------------------------------- | ---------------------------------- |
| 1     | Negligible | Minor inconvenience, barely noticed                             | "It's not really a problem"        |
| 2     | Mild       | Noticeable friction, easy workaround exists                     | "I deal with it, it's fine"        |
| 3     | Moderate   | Regular time/effort drain, workaround is tolerable but annoying | "It's frustrating but I manage"    |
| 4     | Severe     | Significant daily/weekly impact, workaround is painful          | "I waste hours on this every week" |
| 5     | Critical   | Blocking or crisis-level, no acceptable workaround              | "This is killing our business"     |

### Emotional Cost

| Score | Label          | Description                                                  | Interview Signal                                 |
| ----- | -------------- | ------------------------------------------------------------ | ------------------------------------------------ |
| 1     | Unbothered     | No emotional reaction to the problem                         | Neutral tone, no affect                          |
| 2     | Mildly annoyed | Slight frustration, quickly dismissed                        | "It's a bit annoying"                            |
| 3     | Frustrated     | Clear negative emotion, recurring dissatisfaction            | Audible sighing, repeated "frustrating"          |
| 4     | Stressed       | Anxiety, dread, or anger associated with the problem         | "I dread doing this" / "It keeps me up at night" |
| 5     | Overwhelmed    | The problem causes significant emotional distress or burnout | "I'm at my breaking point" / visible distress    |

### Opportunity Cost

| Score | Label       | Description                                             | Interview Signal                                     |
| ----- | ----------- | ------------------------------------------------------- | ---------------------------------------------------- |
| 1     | Minimal     | Problem doesn't prevent anything meaningful             | Cannot name what they would do instead               |
| 2     | Minor       | Small opportunities missed, low value                   | "I could probably do [low-value task] instead"       |
| 3     | Moderate    | Meaningful activities displaced by the problem          | "I should be doing [specific valuable task] instead" |
| 4     | Major       | High-value activities blocked, competitive disadvantage | "We're losing to competitors who have solved this"   |
| 5     | Existential | Business viability or career progression threatened     | "If we don't fix this, we won't survive"             |

## Composite Score Calculation

The composite pain severity score is the **weighted average** of the three dimensions:

```
composite_pain = (functional_pain + emotional_cost + opportunity_cost) / 3
```

Rounded to one decimal place. Range: 1.0 to 5.0.

**Example:** Functional Pain = 4, Emotional Cost = 3, Opportunity Cost = 5 --> Composite = (4 + 3 + 5) / 3 = 4.0

## The Peak Dimension Rule

> **Any single dimension scoring >= 4.0 (averaged across interviews) meets the Discovery Gate threshold, regardless of the composite score.** A problem that is functionally minor but existentially threatening (Opportunity Cost = 5) is still a validated pain point. The composite score captures breadth; the peak dimension captures depth.

## The Polarization Flag

When the standard deviation across the three dimensions exceeds 1.5, the Discovery Summary flags the pain as **polarized**. This means the pain is intense in one dimension but weak in others — a signal that messaging and solution positioning should emphasize the peak dimension.

**Example:** Functional = 2, Emotional = 2, Opportunity = 5. Std dev = 1.73. Polarization flag = true. Messaging should emphasize the existential risk, not the daily friction.

## AI Scoring Method (3-Step)

When AI is performing the scoring (in AI-Moderated or Hybrid post-analysis mode):

1. **Extract verbatim quotes** from the transcript that relate to each pain dimension. Tag each quote with the dimension it maps to.
2. **Score each quote** against the rubric descriptions above. Use the interview signal column as calibration anchors.
3. **Average the per-quote scores** within each dimension to produce the dimension score. If multiple quotes exist for a dimension, weight longer/more detailed quotes higher (they indicate the participant spent more time on that dimension, suggesting greater salience).

**Quality guard:** If fewer than 2 quotes are extracted for any dimension, score that dimension as "insufficient data" rather than defaulting to 1. Insufficient data in a dimension does not count toward the composite or peak evaluation.

## Threshold Significance

The pain severity score feeds directly into two gates:

- **Discovery Gate (DD#2 Section 4):** Composite pain severity >= 3.0 OR any peak dimension >= 4.0
- **Accelerate (GO) Criteria (Strategy Session):** Discovery Summary showed pain severity >= 3/5

A score below 3.0 with no peak dimension >= 4.0 means the problem is real but not painful enough to drive purchasing behavior. This is the most common discovery outcome and the primary mechanism for cheap kills before campaign spend.

---

# 6. The Discovery Summary — Artifact Specification

The **Discovery Summary** is the Step 2 output artifact. It bridges the Hypothesis Card (what we believe) and the Test Blueprint (how we test it). It is the structured output of the discovery sprint — populated from interview data, not from founder opinion.

## Field Specification

| Field                           | Type          | Description                                                                                                 | Source Protocol    | Required                 |
| ------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------ |
| `experiment_id`                 | string        | References the parent experiment                                                                            | System             | Yes                      |
| `hypothesis_card_version`       | string        | "draft" or "full" — which tier was used as input                                                            | System             | Yes                      |
| `interview_count`               | integer       | Total number of completed interviews                                                                        | System             | Yes                      |
| `interview_count_weighted`      | number        | Mode-weighted count (see Section 7)                                                                         | Calculated         | Yes                      |
| `mode_breakdown`                | object        | Count per mode: `{ ai: N, hybrid: N, human: N }`                                                            | System             | Yes                      |
| `problem_confirmed`             | boolean       | Did interviews confirm the problem exists?                                                                  | Problem Discovery  | Yes                      |
| `pain_severity`                 | object        | `{ functional: N, emotional: N, opportunity: N, composite: N, peak_dimension: string, polarized: boolean }` | Problem Discovery  | Yes                      |
| `current_alternatives_observed` | array[string] | Actual solutions/workarounds participants described                                                         | Problem Discovery  | Yes                      |
| `top_quotes`                    | array[object] | `{ quote: string, participant_id: string, dimension: string, protocol: string }` — max 10                   | All protocols      | Yes                      |
| `solution_resonance`            | number (1-5)  | Average enthusiasm for the proposed solution                                                                | Solution Fit       | No (if protocol not run) |
| `feature_priorities`            | array[string] | Ranked features/capabilities by interview frequency                                                         | Solution Fit       | No                       |
| `objections`                    | array[string] | Common objections or concerns raised                                                                        | Solution Fit       | No                       |
| `wtp_signal`                    | string        | "strong" / "moderate" / "weak" / "none"                                                                     | Willingness to Pay | No                       |
| `price_range_observed`          | object        | `{ low: cents, mid: cents, high: cents, currency: string }`                                                 | Willingness to Pay | No                       |
| `value_anchors`                 | array[string] | What participants compared the value to                                                                     | Willingness to Pay | No                       |
| `icp_refinements`               | object        | Refined segment characteristics from real data                                                              | ICP Validation     | No                       |
| `segment_characteristics`       | object        | Demographics/firmographics observed across participants                                                     | ICP Validation     | No                       |
| `disqualification_patterns`     | array[string] | Characteristics that correlate with non-customers                                                           | ICP Validation     | No                       |
| `discovery_channels`            | array[string] | Where to find more customers like the ones interviewed                                                      | ICP Validation     | No                       |
| `assumption_updates`            | array[object] | `{ assumption: string, original_risk: string, updated_risk: string, evidence: string }`                     | All protocols      | Yes                      |
| `gate_status`                   | object        | See structure below                                                                                         | Calculated         | Yes                      |
| `saturation_reached`            | boolean       | Whether thematic saturation was detected (see Section 8)                                                    | Calculated         | Yes                      |
| `analyst_notes`                 | string        | Free-text observations from the interviewer or AI analyst                                                   | All protocols      | No                       |

## Gate Status Structure

```json
{
  "gate_status": {
    "passed": true,
    "checks": {
      "minimum_interviews": { "passed": true, "value": 13.25, "threshold": 5 },
      "pain_severity": { "passed": true, "value": 3.8, "threshold": 3.0 },
      "peak_dimension": {
        "passed": true,
        "dimension": "opportunity_cost",
        "value": 4.2,
        "threshold": 4.0
      },
      "assumption_evidence": { "passed": true, "evidence_type": "direct_quote", "count": 7 },
      "problem_confirmed": { "passed": true },
      "saturation_reached": { "passed": true, "consecutive_no_new_themes": 3 }
    },
    "override": null,
    "override_rationale": null
  }
}
```

## Two Completion Stages

### Draft Summary

Populated automatically after each interview. The agent updates running tallies (interview count, mode breakdown), appends new quotes, recalculates pain severity averages, and updates the gate status. The Draft Summary is a living document during the discovery sprint.

### Final Summary

Locked after the discovery sprint completes (either saturation is reached, minimum interviews are met, or the sprint time-box expires). The Final Summary includes the analyst notes, final gate status, and assumption updates. It becomes the input to Test Blueprint creation (Step 3).

## Relationship to Hypothesis Card

The Discovery Summary **enriches** the Hypothesis Card from Tier 1 to Tier 2:

| Discovery Summary Field                       | Enriches HC Field                                       |
| --------------------------------------------- | ------------------------------------------------------- |
| `current_alternatives_observed`               | Current Alternatives                                    |
| `icp_refinements` + `segment_characteristics` | Customer Segment (refined)                              |
| `assumption_updates`                          | Key Assumptions (evidence-based risk updates)           |
| `pain_severity`                               | Problem Statement (validated severity)                  |
| `discovery_channels`                          | Competitive Landscape (indirect — channel intelligence) |

## Relationship to Test Blueprint

The Discovery Summary provides concrete inputs to DD#2's test selection logic:

| Discovery Summary Field    | Test Blueprint Field                                                          |
| -------------------------- | ----------------------------------------------------------------------------- |
| `gate_status`              | `discovery_gate`                                                              |
| `pain_severity.composite`  | Gate check #2 (pain severity >= 3.0)                                          |
| `interview_count_weighted` | Gate check #1 (>= 5 weighted interviews)                                      |
| `assumption_updates`       | `riskiest_assumption` + `assumption_type` selection                           |
| `wtp_signal`               | Category routing (if strong WTP signal, may skip to Willingness to Pay tests) |

## Worked Example

> **Scenario:** Discovery sprint for the B2B competitor tracking tool. 11 Hybrid + 10 AI-Moderated interviews completed.
>
> **Discovery Summary (Final):**
>
> ```json
> {
>   "experiment_id": "SC-2026-007",
>   "hypothesis_card_version": "draft",
>   "interview_count": 21,
>   "interview_count_weighted": 13.25,
>   "mode_breakdown": { "ai": 10, "hybrid": 11, "human": 0 },
>   "problem_confirmed": true,
>   "pain_severity": {
>     "functional": 4.1,
>     "emotional": 3.2,
>     "opportunity": 3.6,
>     "composite": 3.6,
>     "peak_dimension": "functional",
>     "polarized": false
>   },
>   "current_alternatives_observed": [
>     "Manual spreadsheet tracking (mentioned by 14/21)",
>     "Google Alerts (mentioned by 9/21)",
>     "Occasional competitor website visits (mentioned by 7/21)",
>     "Asking sales team for anecdotal intel (mentioned by 5/21)"
>   ],
>   "top_quotes": [
>     {
>       "quote": "I spend at least 5 hours a week just checking competitor websites and updating my spreadsheet. It's the worst part of my job.",
>       "participant_id": "P003",
>       "dimension": "functional",
>       "protocol": "problem_discovery"
>     },
>     {
>       "quote": "Our CEO asked me last week what Competitor X launched and I had no idea. That was embarrassing.",
>       "participant_id": "P007",
>       "dimension": "emotional",
>       "protocol": "problem_discovery"
>     },
>     {
>       "quote": "If I could automate this, I'd spend that time on actual campaigns instead of detective work.",
>       "participant_id": "P011",
>       "dimension": "opportunity",
>       "protocol": "problem_discovery"
>     }
>   ],
>   "solution_resonance": 4.1,
>   "feature_priorities": [
>     "Real-time alerts when competitors change pricing or messaging",
>     "Weekly AI-generated summary of competitor activity",
>     "Integration with Slack for team notifications"
>   ],
>   "objections": [
>     "How accurate is the AI analysis? (mentioned by 6/21)",
>     "Does it track social media or just websites? (mentioned by 4/21)",
>     "Concern about data freshness — how often does it scan? (mentioned by 3/21)"
>   ],
>   "wtp_signal": "strong",
>   "price_range_observed": { "low": 4900, "mid": 9900, "high": 19900, "currency": "usd" },
>   "value_anchors": [
>     "Comparable to SEMrush competitive module ($99-199/mo)",
>     "Less than one hour of a marketing manager's time per week"
>   ],
>   "icp_refinements": {
>     "company_size": "50-200 employees confirmed. Below 50: problem exists but budget is DIY. Above 200: dedicated competitive intelligence role exists.",
>     "role": "Marketing Manager or VP Marketing. Not individual contributors — they don't own the competitive tracking task.",
>     "industry": "B2B SaaS confirmed. B2B services also showed signal but weaker."
>   },
>   "segment_characteristics": {
>     "avg_company_size": 120,
>     "common_tools": ["HubSpot", "SEMrush", "Google Analytics", "Slack"],
>     "decision_authority": "Can approve up to $200/mo without VP sign-off"
>   },
>   "disqualification_patterns": [
>     "Companies under 30 employees — no dedicated marketing role",
>     "Enterprise (500+) — have dedicated CI team, different buying process"
>   ],
>   "discovery_channels": [
>     "LinkedIn Marketing Manager groups",
>     "SaaStr community",
>     "HubSpot User Groups",
>     "r/marketing on Reddit"
>   ],
>   "assumption_updates": [
>     {
>       "assumption": "Marketing managers track competitors manually in spreadsheets",
>       "original_risk": "medium",
>       "updated_risk": "low",
>       "evidence": "14/21 participants confirmed spreadsheet tracking. Direct quotes from P003, P008, P015."
>     },
>     {
>       "assumption": "Managers will pay $99/mo for automation",
>       "original_risk": "high",
>       "updated_risk": "medium",
>       "evidence": "WTP signal strong. Mid-range anchor at $99. But 4/21 expected it to be free or <$50."
>     }
>   ],
>   "gate_status": {
>     "passed": true,
>     "checks": {
>       "minimum_interviews": { "passed": true, "value": 13.25, "threshold": 5 },
>       "pain_severity": { "passed": true, "value": 3.6, "threshold": 3.0 },
>       "peak_dimension": {
>         "passed": true,
>         "dimension": "functional",
>         "value": 4.1,
>         "threshold": 4.0
>       },
>       "assumption_evidence": { "passed": true, "evidence_type": "direct_quote", "count": 14 },
>       "problem_confirmed": { "passed": true },
>       "saturation_reached": { "passed": true, "consecutive_no_new_themes": 4 }
>     },
>     "override": null,
>     "override_rationale": null
>   },
>   "saturation_reached": true,
>   "analyst_notes": "Strong problem signal with functional pain as the peak dimension. Solution resonance is high but price sensitivity exists — the $99 anchor is accepted by the majority but a significant minority (19%) expects cheaper. Recommend priced_waitlist test at $99/mo with a secondary variant at $49/mo."
> }
> ```

---

# 6.5. Discovery Summary Schema Sketch

Field specification for the `discovery_summary` JSONB column, following the same pattern as DD#1's `hypothesis_card` and DD#2's `test_blueprint` schemas:

```json
{
  "experiment_id": {
    "type": "string",
    "required": true,
    "description": "References parent experiment ID (SC-YYYY-NNN)"
  },
  "hypothesis_card_version": {
    "type": "string",
    "enum": ["draft", "full"],
    "required": true,
    "description": "Which tier of the Hypothesis Card was used as input"
  },
  "interview_count": {
    "type": "integer",
    "required": true,
    "minimum": 0,
    "description": "Total completed interviews (raw count)"
  },
  "interview_count_weighted": {
    "type": "number",
    "required": true,
    "minimum": 0,
    "description": "Mode-weighted count: AI=0.5x, Hybrid=0.75x, Human=1.0x"
  },
  "mode_breakdown": {
    "type": "object",
    "required": true,
    "properties": {
      "ai": { "type": "integer", "minimum": 0 },
      "hybrid": { "type": "integer", "minimum": 0 },
      "human": { "type": "integer", "minimum": 0 }
    }
  },
  "problem_confirmed": {
    "type": "boolean",
    "required": true,
    "description": "Whether interviews confirmed the stated problem exists"
  },
  "pain_severity": {
    "type": "object",
    "required": true,
    "properties": {
      "functional": { "type": "number", "minimum": 1, "maximum": 5 },
      "emotional": { "type": "number", "minimum": 1, "maximum": 5 },
      "opportunity": { "type": "number", "minimum": 1, "maximum": 5 },
      "composite": { "type": "number", "minimum": 1, "maximum": 5 },
      "peak_dimension": { "type": "string", "enum": ["functional", "emotional", "opportunity"] },
      "polarized": { "type": "boolean" }
    }
  },
  "current_alternatives_observed": {
    "type": "array",
    "required": true,
    "items": { "type": "string" },
    "description": "Workarounds and existing solutions described by participants"
  },
  "top_quotes": {
    "type": "array",
    "required": true,
    "maxItems": 10,
    "items": {
      "quote": { "type": "string", "maxLength": 500 },
      "participant_id": { "type": "string" },
      "dimension": {
        "type": "string",
        "enum": ["functional", "emotional", "opportunity", "solution", "wtp", "icp"]
      },
      "protocol": {
        "type": "string",
        "enum": ["problem_discovery", "solution_fit", "willingness_to_pay", "icp_validation"]
      }
    }
  },
  "solution_resonance": {
    "type": "number",
    "required": false,
    "minimum": 1,
    "maximum": 5,
    "description": "Average enthusiasm for proposed solution. Null if Solution Fit protocol not run."
  },
  "feature_priorities": {
    "type": "array",
    "required": false,
    "items": { "type": "string" },
    "description": "Ranked features by interview mention frequency"
  },
  "objections": {
    "type": "array",
    "required": false,
    "items": { "type": "string" },
    "description": "Common objections or concerns about the solution"
  },
  "wtp_signal": {
    "type": "string",
    "enum": ["strong", "moderate", "weak", "none"],
    "required": false,
    "description": "Aggregate willingness-to-pay signal. Null if WTP protocol not run."
  },
  "price_range_observed": {
    "type": "object",
    "required": false,
    "properties": {
      "low": { "type": "integer", "description": "No-brainer price in cents" },
      "mid": { "type": "integer", "description": "Acceptable price in cents" },
      "high": { "type": "integer", "description": "Too-expensive price in cents" },
      "currency": { "type": "string", "default": "usd" }
    }
  },
  "value_anchors": {
    "type": "array",
    "required": false,
    "items": { "type": "string" },
    "description": "What participants compared the value to (existing tools, time saved, etc.)"
  },
  "icp_refinements": {
    "type": "object",
    "required": false,
    "description": "Free-form refinements to customer segment based on interview data",
    "additionalProperties": { "type": "string" }
  },
  "segment_characteristics": {
    "type": "object",
    "required": false,
    "description": "Observed demographics/firmographics across participants",
    "additionalProperties": true
  },
  "disqualification_patterns": {
    "type": "array",
    "required": false,
    "items": { "type": "string" },
    "description": "Characteristics correlated with non-customers"
  },
  "discovery_channels": {
    "type": "array",
    "required": false,
    "items": { "type": "string" },
    "description": "Where to find more customers — feeds campaign targeting"
  },
  "assumption_updates": {
    "type": "array",
    "required": true,
    "items": {
      "assumption": { "type": "string" },
      "original_risk": { "type": "string", "enum": ["high", "medium", "low"] },
      "updated_risk": { "type": "string", "enum": ["high", "medium", "low"] },
      "evidence": { "type": "string", "maxLength": 500 }
    },
    "description": "Updates to Hypothesis Card Key Assumptions based on interview evidence"
  },
  "gate_status": {
    "type": "object",
    "required": true,
    "properties": {
      "passed": { "type": "boolean" },
      "checks": {
        "type": "object",
        "properties": {
          "minimum_interviews": {
            "type": "object",
            "properties": {
              "passed": { "type": "boolean" },
              "value": { "type": "number" },
              "threshold": { "type": "number" }
            }
          },
          "pain_severity": {
            "type": "object",
            "properties": {
              "passed": { "type": "boolean" },
              "value": { "type": "number" },
              "threshold": { "type": "number" }
            }
          },
          "peak_dimension": {
            "type": "object",
            "properties": {
              "passed": { "type": "boolean" },
              "dimension": { "type": "string" },
              "value": { "type": "number" },
              "threshold": { "type": "number" }
            }
          },
          "assumption_evidence": {
            "type": "object",
            "properties": {
              "passed": { "type": "boolean" },
              "evidence_type": { "type": "string" },
              "count": { "type": "integer" }
            }
          },
          "problem_confirmed": {
            "type": "object",
            "properties": {
              "passed": { "type": "boolean" }
            }
          },
          "saturation_reached": {
            "type": "object",
            "properties": {
              "passed": { "type": "boolean" },
              "consecutive_no_new_themes": { "type": "integer" }
            }
          }
        }
      },
      "override": { "type": "boolean | null" },
      "override_rationale": { "type": "string | null" }
    }
  },
  "saturation_reached": {
    "type": "boolean",
    "required": true,
    "description": "Whether thematic saturation was detected"
  },
  "analyst_notes": {
    "type": "string",
    "required": false,
    "maxLength": 2000,
    "description": "Free-text observations from interviewer or AI analyst"
  },
  "stage": {
    "type": "string",
    "enum": ["draft", "final"],
    "required": true,
    "description": "Draft = in-progress during sprint. Final = locked after sprint completes."
  }
}
```

---

# 7. Discovery Gate Integration

DD#2 (Section 4) established three Discovery Gate checks. This document revises and expands the gate to six checks, adds mode-weighted counting, and defines override mechanics.

## Revised Gate Criteria

The Discovery Gate now has six checks. All six must pass for the gate to be "passed." If any fail, the gate can be overridden with rationale.

| #   | Check                            | Threshold                                                                             | Source                      |
| --- | -------------------------------- | ------------------------------------------------------------------------------------- | --------------------------- |
| 1   | Minimum weighted interview count | >= 5.0 (weighted)                                                                     | `interview_count_weighted`  |
| 2   | Composite pain severity          | >= 3.0                                                                                | `pain_severity.composite`   |
| 3   | Peak dimension severity          | >= 4.0 in any dimension (OR with check #2)                                            | `pain_severity.[dimension]` |
| 4   | Problem confirmed                | `true`                                                                                | `problem_confirmed`         |
| 5   | Assumption evidence              | At least 1 Key Assumption updated with "direct_quote" or "observed_behavior" evidence | `assumption_updates`        |
| 6   | Saturation reached               | 3 consecutive interviews with no new themes (OR time-box expired with minimum met)    | `saturation_reached`        |

**Gate logic:** Checks 1, 4, and 5 are required. Checks 2 and 3 are OR'd — either composite >= 3.0 OR any peak dimension >= 4.0 satisfies the pain threshold. Check 6 is recommended but not blocking — the gate can pass without saturation if the minimum interview count is met.

## Mode-Weighted Counting

Not all interview modes produce equal evidence quality. Mode weighting ensures that an operator cannot game the gate by running 5 cheap AI interviews and calling discovery complete.

| Mode         | Weight | Rationale                                                            |
| ------------ | ------ | -------------------------------------------------------------------- |
| AI-Moderated | 0.5x   | Consistent but lower depth, no body language, limited improvisation  |
| Hybrid       | 0.75x  | Human depth with AI consistency, but some signal loss vs. pure human |
| Human-Led    | 1.0x   | Full depth, the gold standard for qualitative research               |

**Calculation:** `interview_count_weighted = (ai_count * 0.5) + (hybrid_count * 0.75) + (human_count * 1.0)`

**Examples:**

| Interview Mix      | Raw Count | Weighted Count | Meets Minimum (>= 5.0)? |
| ------------------ | --------- | -------------- | ----------------------- |
| 10 AI-only         | 10        | 5.0            | Yes (barely)            |
| 5 Human-only       | 5         | 5.0            | Yes                     |
| 7 Hybrid-only      | 7         | 5.25           | Yes                     |
| 3 Human + 4 AI     | 7         | 5.0            | Yes                     |
| 8 AI-only          | 8         | 4.0            | No                      |
| 2 Human + 2 Hybrid | 4         | 3.5            | No                      |

The weighting creates a natural incentive to include human-led or hybrid interviews in the mix. Pure AI discovery is possible but requires roughly twice the interview count to pass the gate.

## Override Mechanics

Any gate check can be overridden by the operator with a rationale. Overrides are recorded in the Discovery Summary's `gate_status` field and persist through the experiment lifecycle.

**Common override scenarios:**

- **Niche market with limited candidates:** Cannot reach 5 weighted interviews because the addressable population is tiny. Override with rationale: "Total addressable market is ~200 companies. 3 human interviews represent 1.5% coverage."
- **Time pressure:** Sprint time-box expired before saturation. Override with rationale: "7 weighted interviews completed, clear pattern established, saturation not formally reached but themes are consistent."
- **Pivot from prior experiment:** Discovery from a related experiment transfers. Override with rationale: "8 interviews from SC-2026-003 covered the same ICP. 3 new interviews confirmed the same pain for the revised hypothesis."

**Override tracking:** Over time, the ratio of overridden gates to total gates — and the correlation between overrides and experiment outcomes — provides calibration data for adjusting gate thresholds.

## Outcome Tracking

Every experiment records its gate status. After decisions (GO/KILL/PIVOT/INVALID) are made, the system can correlate:

- **Passed gate + GO:** Expected outcome. Validates the gate thresholds.
- **Passed gate + KILL:** Gate may be too lenient, or post-discovery execution failed.
- **Overridden gate + GO:** Override was justified. Consider loosening the gate check that was overridden.
- **Overridden gate + KILL:** Override was not justified. Evidence that the gate check matters.

This feedback loop is the calibration mechanism for gate thresholds over time (see Deep Dive #6).

---

# 8. Minimum Interview Counts & Saturation

## Mode-Weighted Minimums by Test Category

Different test categories (from DD#2's Validation Ladder) require different levels of discovery evidence. Solution Validation tests require the deepest discovery because they commit the most resources.

| Test Category       | Minimum Weighted Count | Minimum Human/Hybrid Count | Rationale                                                                                                          |
| ------------------- | ---------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Demand Signal       | 5.0                    | 2                          | Lightest commitment. Need to confirm problem exists, not deep understanding.                                       |
| Willingness to Pay  | 8.0                    | 3                          | Price sensitivity requires nuanced conversation. AI interviews alone miss tonal cues on pricing discomfort.        |
| Solution Validation | 10.0                   | 5                          | Highest commitment. Solution design requires deep understanding of workflows, pain points, and feature priorities. |

**Rule:** The minimum human/hybrid count ensures that at least some interviews include the depth that AI-Moderated mode cannot provide. You can exceed the weighted minimum with all-AI interviews for ICP Validation breadth, but you cannot enter Solution Validation without at least 5 human or hybrid interviews.

## Saturation Detection — The "3 in a Row" Rule

Thematic saturation is reached when **3 consecutive interviews produce no new themes**. A "new theme" is defined as:

- A problem dimension, workaround, or pain point not previously mentioned by any participant
- A significant contradiction of an established pattern (e.g., first participant to report the problem as "not a big deal" after 8 participants called it "critical")
- A new ICP characteristic that changes the segment definition

**How it works:**

1. After each interview, the AI analyst compares extracted themes against the running theme inventory.
2. If no new themes are detected, a counter increments. If a new theme is detected, the counter resets to zero.
3. When the counter reaches 3, saturation is flagged.

**Saturation does not automatically end the sprint.** It signals that additional interviews of the same type are unlikely to produce new information. The operator may:

- End the discovery sprint and finalize the Discovery Summary
- Switch to a different protocol (e.g., from Problem Discovery to Solution Fit)
- Expand to a different segment to test whether the problem exists beyond the initial ICP

## Confidence Score Interaction

The Hypothesis Card confidence score (DD#1, Section 3.5) interacts with minimum interview counts:

- **Proceed:** Standard minimums apply.
- **Uncertain:** Add 50% to the minimum weighted count (e.g., Demand Signal: 5.0 --> 7.5). The uncertainty warrants deeper investigation.
- **Abandon:** No discovery sprint. The idea was killed at Step 1.

---

# 9. Assumption Type Classification from Interview Signals

Interview data feeds directly into the assumption type classification that DD#2 uses for test selection. This section specifies how raw interview signals map to structured assumption types.

## Signal to Assumption Type Mapping

| Interview Signal                                                                  | Assumption Type    | Classification Rule                                                    | Recommended Test Category                                   |
| --------------------------------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------- | ----------------------------------------------------------- |
| Problem not confirmed OR pain severity < 2.0                                      | `problem_exists`   | Fewer than 50% of participants confirm the problem                     | Back to Step 2 (more interviews with different ICP)         |
| Problem confirmed but solution resonance < 2.5                                    | `solution_desired` | Problem is real but proposed solution does not excite                  | Demand Signal (test different solution framings)            |
| Solution resonance >= 3.0 but WTP signal = "weak" or "none"                       | `will_pay`         | People want it but balk at paying                                      | Willingness to Pay (test pricing)                           |
| WTP signal = "strong" or "moderate" but objections center on delivery/feasibility | `solution_works`   | People will pay but doubt you can deliver                              | Solution Validation (prove it works)                        |
| All signals positive, no dominant risk                                            | `solution_desired` | Default to Demand Signal — validate with market data before committing | Demand Signal (validate at scale what interviews suggested) |

## Evidence Quality Rubric

Not all evidence is created equal. The assumption type classification should weight higher-quality evidence more heavily.

| Evidence Type     | Quality Level | Weight | Description                                                                                                                                                                                   |
| ----------------- | ------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Founder Intuition | 1 (lowest)    | 0.25x  | "I think customers have this problem" — no external validation                                                                                                                                |
| Indirect Signal   | 2             | 0.5x   | Market research, competitor analysis, survey data — evidence exists but is not from direct conversation                                                                                       |
| Direct Quote      | 3             | 1.0x   | Participant stated something relevant in an interview — primary source evidence                                                                                                               |
| Observed Behavior | 4 (highest)   | 1.5x   | Participant demonstrated the behavior (showed their spreadsheet, walked through their process, showed frustration in real-time) — behavioral evidence is more reliable than stated preference |

**Application:** When updating Key Assumptions in the `assumption_updates` field, the `evidence` field should note the evidence type. The assumption type classification uses the highest-quality evidence available for each assumption.

## Worked Example

> **Scenario:** After the B2B competitor tracking discovery sprint (21 interviews):
>
> **Assumption:** "Marketing managers at B2B SaaS companies (50-200 employees) will pay \$99/mo for automated competitor tracking."
>
> **Evidence inventory:**
>
> - Founder Intuition: "I think this is a real problem." (0.25x)
> - Direct Quote: "I spend at least 5 hours a week just checking competitor websites." (1.0x) -- 14 participants confirmed
> - Observed Behavior: P003 shared their actual tracking spreadsheet during the interview (1.5x)
> - Direct Quote: "I'd pay \$99/mo for this." (1.0x) -- 11 participants in WTP range
> - Direct Quote: "That's too expensive, maybe \$49." (1.0x) -- 4 participants below range
>
> **Classification:** The riskiest remaining assumption is `will_pay` — the problem is confirmed (strong evidence) and the solution resonates (direct quotes + observed behavior), but WTP has mixed signals (strong for majority, weak for a significant minority). Route to **Willingness to Pay** test category.
>
> **Updated assumption risk:** High --> Medium (evidence: 11/21 direct quotes confirming \$99/mo acceptable, 4/21 below range, observed behavior from P003 showing spreadsheet workaround confirms functional pain severity).

---

# 10. Technology Landscape & Build vs. Buy

## AI Interview Platforms

The market for AI-conducted user research is emerging rapidly. Key players as of early 2026:

| Platform                  | Funding        | Core Capability                                     | Interview Mode            | Pricing Model           | Developer API                |
| ------------------------- | -------------- | --------------------------------------------------- | ------------------------- | ----------------------- | ---------------------------- |
| **Outset**                | \$21M Series A | AI-moderated video/text interviews                  | AI-Moderated              | Per-interview (\$15-30) | No public API                |
| **Listen Labs**           | \$69M total    | AI research assistant for qual research             | AI-Moderated + analysis   | Enterprise subscription | No public API                |
| **Strella**               | \$14M Seed     | AI-powered customer interviews at scale             | AI-Moderated (voice)      | Per-interview           | Limited API (beta)           |
| **Keplar**                | Undisclosed    | Synthetic audience simulation (not real interviews) | AI-Simulated              | Per-project             | No public API                |
| **Maze**                  | \$75M+ total   | Product research platform with AI analysis          | Human-Led + AI analysis   | Subscription            | REST API (surveys only)      |
| **UserCall**              | Bootstrapped   | AI phone interviews                                 | AI-Moderated (phone)      | Per-minute              | No public API                |
| **Anthropic Interviewer** | N/A (build)    | Custom Claude-based interview agent                 | AI-Moderated (text/voice) | API usage costs         | Full API access (Claude API) |

## API Maturity Assessment

**The critical finding: no major AI interview platform offers a production-ready developer API for programmatic interview orchestration.** Outset, Listen Labs, and Strella are GUI-first products designed for UX researchers, not for integration into automated validation pipelines. Their value proposition is the platform experience, not the API.

This means SC cannot buy an off-the-shelf interview API and integrate it into the validation workflow today. The options are:

1. **Use a platform's GUI manually** — the operator runs interviews through Outset/Strella's web interface, then manually exports transcripts for SC's analysis pipeline. This works for Phase 1 but does not scale.
2. **Build a custom interview agent** — use the Claude API (or similar LLM API) to build SC's own interview agent that follows the four protocols defined in Section 4. This requires more upfront development but produces a fully integrated, automatable system.
3. **Hybrid approach** — use a platform for AI-Moderated interviews (their strength), build custom analysis pipeline for transcript processing, signal extraction, and Discovery Summary population.

## SC's Phased Approach

| Phase                  | Interview Capability                                                                             | Analysis Capability                                                                          | Integration                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| **Phase 1 (now)**      | Human-led interviews. Manual transcript import.                                                  | AI-powered analysis: transcript --> signal extraction --> pain scoring --> Discovery Summary | Custom-built analysis pipeline using Claude API |
| **Phase 2 (Q3 2026)**  | Add Hybrid mode: real-time AI co-pilot during human interviews                                   | Same as Phase 1, plus real-time protocol tracking                                            | Streaming transcript integration                |
| **Phase 3 (Q4 2026+)** | Add AI-Moderated mode: custom SC interview agent OR integration with platform API (if available) | Fully automated: interview --> analysis --> Discovery Summary                                | End-to-end automated pipeline                   |

## Cost Comparison

| Approach                     | Cost per Interview              | Setup Cost                        | Ongoing Cost                             | Scale Ceiling  |
| ---------------------------- | ------------------------------- | --------------------------------- | ---------------------------------------- | -------------- |
| Manual (founder interviews)  | \$50-150 (time value)           | \$0                               | \$0                                      | 5-8 per week   |
| Platform (Outset/Strella)    | \$15-30 (platform fee)          | \$0-500 (onboarding)              | \$200-500/mo subscription                | 30+ per week   |
| Custom SC agent (Claude API) | \$5-15 (API compute)            | \$5,000-15,000 (development)      | \$50-200/mo (API costs at modest volume) | 100+ per week  |
| Hybrid (human + SC analysis) | \$30-75 (reduced prep/analysis) | \$2,000-5,000 (analysis pipeline) | \$50-100/mo (API costs)                  | 10-15 per week |

**Phase 1 recommendation:** Build the analysis pipeline first (the high-value, lower-cost component). This immediately helps human-led interviews by automating the analysis bottleneck identified in Section 2. Interview conducting is not the bottleneck — sourcing and analysis are.

## Candidate Sourcing Platforms

AI can assist with finding interview candidates even before it conducts interviews:

| Platform                     | Approach                                   | Cost                      | SC Integration                                                   |
| ---------------------------- | ------------------------------------------ | ------------------------- | ---------------------------------------------------------------- |
| **LinkedIn Sales Navigator** | Search by title, company size, industry    | \$80-130/mo               | Manual search, export contacts                                   |
| **Apollo.io**                | Contact database with email/phone          | \$49-99/mo                | API available for programmatic search                            |
| **Respondent.io**            | Recruit pre-screened research participants | \$100-300 per participant | Manual recruiting, scheduled interviews                          |
| **User Interviews**          | Similar to Respondent.io                   | \$50-200 per participant  | Manual recruiting                                                |
| **Reddit / Communities**     | Post in relevant subreddits/communities    | Free (time cost)          | AI can draft outreach posts                                      |
| **Warm network**             | Founder's existing contacts                | Free                      | AI can help identify relevant contacts from LinkedIn connections |

**Phase 1 sourcing strategy:** AI agent generates search criteria from the Hypothesis Card's Customer Segment field, creates outreach templates, and suggests sourcing channels from the `discovery_channels` field. The human operator executes the actual outreach.

---

# 11. Trust & Quality — VaaS Considerations

## AI Disclosure

When SC operates as a Validation-as-a-Service provider, the trust equation includes three parties: SC (the operator), the VaaS client (the entrepreneur), and the interview participant.

**Disclosure requirements:**

- **To participants:** Always disclose AI involvement. For AI-Moderated interviews: "This interview is conducted by an AI research assistant." For Hybrid mode: "This interview includes AI-powered analysis." No deception.
- **To VaaS clients:** Always disclose the interview mode mix. Clients must understand which interviews were AI-moderated vs. human-led, and how mode weighting affects the evidence count.
- **In the Discovery Summary:** The `mode_breakdown` field provides transparent accounting of the interview mix.

## Quality Comparison Statistics

Based on published research and platform benchmarks:

| Metric                                | AI-Moderated | Human-Led | Hybrid        |
| ------------------------------------- | ------------ | --------- | ------------- |
| Protocol adherence                    | 100%         | 60-80%    | 85-95%        |
| Average interview duration            | 15-25 min    | 30-60 min | 25-45 min     |
| Participant completion rate           | 85-90%       | 70-80%    | 80-85%        |
| Emotional depth score (self-reported) | 3.2/5        | 4.3/5     | 3.9/5         |
| Disclosure on sensitive topics        | Higher       | Lower     | Moderate      |
| Interviewer bias introduced           | None         | Moderate  | Low           |
| Unexpected theme discovery rate       | Low          | High      | Moderate-High |

## Where AI Excels vs. Humans

**AI advantages:**

- **Consistency:** Every interview follows the protocol identically. No fatigue, no mood effects, no rushing through the last interview of the day.
- **Scale:** Can run 10-30+ interviews in the time a human runs 3-5.
- **Sensitive topics:** Participants disclose more about embarrassing problems, failures, or socially undesirable behaviors when talking to AI.
- **Analysis speed:** Transcript processing and signal extraction happen in real-time, not hours later.
- **Availability:** 24/7 across time zones. No scheduling coordination needed for asynchronous modes.

**Human advantages:**

- **Empathy and rapport:** Humans build trust through micro-expressions, vocal tone, and genuine curiosity that AI cannot replicate.
- **Improvisation:** A skilled interviewer pursues unexpected threads that may reveal insights the protocol did not anticipate.
- **Body language:** Video interviews give humans access to non-verbal cues (posture shifts, facial expressions, hesitation) that reveal unspoken feelings.
- **Relationship building:** Interviewees can become early adopters, beta testers, or champions. AI interviews do not build personal relationships.
- **Judgment under ambiguity:** When a response is contradictory or confusing, humans can probe with nuance that AI may miss.

## VaaS Trust Model

For external VaaS clients, trust in the discovery process depends on:

1. **Transparency:** Full disclosure of methods, mode mix, and limitations.
2. **Calibration data:** Over time, SC builds a track record of discovery-to-outcome correlations. "Discovery sprints using our methodology have a 72% GO accuracy rate" is compelling.
3. **Human-in-the-loop guarantee:** Phase 1 ensures every discovery sprint includes human-led interviews. No VaaS client receives a Discovery Summary based purely on AI interviews.
4. **Audit trail:** Every quote, score, and classification is traceable to a specific interview and timestamp.

## Dog-Fooding Requirement

> **SC must use its own Discovery Engine for every Ventracrane venture before offering it as VaaS.** This is non-negotiable. The methodology must be proven internally before it is sold externally. Dog-fooding provides calibration data, reveals edge cases, and builds credibility.

**Minimum dog-fooding threshold:** 5 completed discovery sprints across different ventures before VaaS launch. Each sprint must include all three interview modes (AI, Hybrid, Human) to calibrate the mode weighting and quality comparison data.

## Acquiescence Bias Mitigation

Acquiescence bias — the tendency for participants to agree with the interviewer's framing — is the most dangerous bias in customer discovery. It produces false positives that waste campaign budget.

**Mitigation strategies:**

- **Ask about behavior, not opinion.** "Walk me through the last time you dealt with [problem]" vs. "Do you have [problem]?"
- **Use disconfirming questions.** "What's working well about your current approach?" (not just "What's broken?")
- **Avoid leading language.** "Tell me about your experience with [domain]" vs. "How frustrated are you with [problem]?"
- **Triangulate.** Cross-reference stated pain with behavioral evidence. If someone says the problem is "critical" but has never searched for a solution, the stated severity may be inflated.
- **AI advantage:** AI interviewers do not unconsciously nod, lean forward, or express excitement when hearing confirming evidence. Their neutral delivery reduces acquiescence bias compared to a passionate founder interviewing about their own idea.

---

# 12. AI Agent Workflow for Discovery

The Discovery Engine's AI agent orchestrates the entire discovery process in 6 steps. In Phase 1, some steps require human execution; the agent handles preparation and analysis.

## Step 1: Parse Hypothesis Card

**Input:** Hypothesis Card (Tier 1 or Tier 2)

**Agent actions:**

- Extract the Customer Segment to define the interview target profile
- Extract the Problem Statement to identify the three pain dimensions (functional, emotional, opportunity cost)
- Extract Stakes (Failure/Success) to calibrate expected severity signals
- Extract Solution Hypothesis and Why Now for Solution Fit and WTP protocol preparation
- Identify Key Assumptions and their risk levels to prioritize protocol selection

**Output:** Interview target profile + protocol priority list

**Phase 1 automation:** Fully automated. The agent generates all outputs from the Hypothesis Card without human intervention.

## Step 2: Generate Interview Protocol

**Input:** Interview target profile + protocol priority list

**Agent actions:**

- Select the appropriate protocol(s) based on current discovery state (see Section 4 Protocol Selection Logic)
- Customize opening questions using the Hypothesis Card's specific language (e.g., replace "[problem]" with the actual problem statement)
- Generate follow-up probing questions tailored to the three pain dimensions
- Set signal extraction rules for post-interview analysis
- Produce a printable interview guide for Human-Led and Hybrid modes

**Output:** Customized interview protocol document

**Phase 1 automation:** Fully automated. The agent generates a complete protocol that the human interviewer can use directly.

## Step 3: Assist Candidate Sourcing

**Input:** Interview target profile + Customer Segment from Hypothesis Card

**Agent actions:**

- Generate search queries for LinkedIn Sales Navigator, Apollo.io, and community platforms based on the Customer Segment description
- Draft personalized outreach messages (email, LinkedIn message, community post)
- Define screening criteria: must-have characteristics (matches ICP) and disqualifiers
- Suggest sourcing channels based on the Customer Segment's likely online presence
- Track outreach status and response rates

**Output:** Sourcing plan with search queries, outreach templates, and screening criteria

**Phase 1 automation:** Partially automated. The agent generates the plan; the human operator executes outreach and scheduling.

## Step 4: Conduct Interviews

**Input:** Customized interview protocol + scheduled participants

**Agent actions (varies by mode):**

- **AI-Moderated:** Agent conducts the interview independently, following the protocol, generating follow-up probes, recording the session, and extracting signals in real-time.
- **Hybrid:** Agent operates as co-pilot during the human-led interview — monitoring protocol coverage, suggesting follow-up questions via a side channel, and flagging when key topics have not been explored.
- **Human-Led:** Agent is not active during the interview. The human interviewer uses the protocol document from Step 2.

**Output:** Interview transcript (text) + real-time signal extraction (AI-Moderated and Hybrid modes)

**Phase 1 automation:** Human-Led only. The agent provides the protocol document; the human conducts and records the interview. Transcripts are imported manually (recording --> transcription service --> text import).

## Step 5: Extract & Score

**Input:** Interview transcript

**Agent actions:**

- Extract verbatim quotes and tag each with the relevant pain dimension and protocol
- Score pain severity using the 3-step method (Section 5): extract quotes --> score per rubric --> average within dimensions
- Identify new themes and update the theme inventory for saturation tracking
- Classify signals against the assumption type mapping (Section 9)
- Update the running Discovery Summary (draft stage)
- Flag red patterns (acquiescence bias indicators, contradictions, insufficient data)

**Output:** Per-interview signal extraction report + updated Discovery Summary (draft)

**Phase 1 automation:** Fully automated. The agent processes transcripts through the Claude API and produces structured signal extraction. Human review is recommended but not required.

## Step 6: Synthesize Discovery Summary

**Input:** All per-interview signal extraction reports

**Agent actions:**

- Aggregate pain severity scores across all interviews (weighted by evidence quality)
- Calculate composite and peak dimension scores
- Check polarization flag (std dev > 1.5)
- Run saturation detection (3-in-a-row rule)
- Evaluate all 6 gate checks and produce the gate status
- Select top 10 quotes (prioritize Observed Behavior > Direct Quote > Indirect Signal)
- Generate assumption updates with evidence citations
- Write analyst notes summarizing key findings and recommendations
- Lock the Discovery Summary to "final" stage

**Output:** Final Discovery Summary artifact

**Phase 1 automation:** Fully automated. The agent synthesizes all interview data into the structured Discovery Summary. The operator reviews and can override gate status or adjust analyst notes before locking.

## Integration with Event Log

All discovery activities are logged to the `event_log` table for audit and analysis:

| Event Type                    | Trigger                | Event Data                                                                                        |
| ----------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------- |
| `discovery_sprint_started`    | Sprint initiated       | `{ mode: string, target_count: number, protocols: string[] }`                                     |
| `interview_scheduled`         | Participant confirmed  | `{ participant_id: string, mode: string, scheduled_at: number }`                                  |
| `interview_completed`         | Interview finished     | `{ participant_id: string, mode: string, duration_minutes: number, protocols_covered: string[] }` |
| `interview_analyzed`          | AI extraction complete | `{ participant_id: string, new_themes: number, pain_scores: object }`                             |
| `saturation_detected`         | 3-in-a-row triggered   | `{ consecutive_count: 3, total_interviews: number }`                                              |
| `discovery_gate_evaluated`    | Gate check run         | `{ checks: object, passed: boolean, override: boolean }`                                          |
| `discovery_summary_finalized` | Summary locked         | `{ interview_count: number, weighted_count: number, gate_passed: boolean }`                       |

## Quality Criteria for Discovery Sprints

A discovery sprint meets quality criteria when:

1. Minimum weighted interview count is met for the target test category (Section 8)
2. At least 2 protocols were used (Problem Discovery is always one)
3. Pain severity scores have sufficient data (>= 2 quotes per dimension for at least 2 dimensions)
4. No more than 50% of interviews show acquiescence bias red flags
5. The Discovery Summary has been reviewed by a human (not just AI-generated and auto-locked)
6. All interviews are logged to `event_log` with complete metadata

---

# 13. Answering the Six Strategy Session Questions

The strategy session (Deep Dive #3 section) identified six questions. Here are the answers:

**1. Can AI agents help source and screen interview candidates?**

Yes. The AI agent generates search queries, outreach templates, and screening criteria from the Hypothesis Card's Customer Segment field (Section 12, Step 3). In Phase 1, the agent produces the plan and the human executes. In later phases, API integrations with Apollo.io or LinkedIn allow programmatic candidate sourcing. Screening criteria are derived from the ICP Validation protocol's disqualification patterns.

**2. Can AI conduct preliminary discovery interviews?**

Yes, with caveats. AI-Moderated interviews (Section 3) can conduct full protocol-adherent interviews independently. They excel at ICP Validation and broad pattern detection. However, they show approximately 26% lower emotional depth scores and are weaker at pursuing unexpected threads. SC's Phase 1 starts with human-led interviews and AI-powered analysis; full AI-Moderated interviews are Phase 3.

**3. What's the trade-off between AI interviews and human intuition for catching real pain points?**

The tradeoff is consistent breadth (AI) vs. empathetic depth (human). AI interviews follow protocols perfectly, run at 5-10x the throughput, and reduce acquiescence and social desirability bias. Human interviews catch non-verbal cues, pursue unexpected threads, and build relationships with potential early adopters. The Hybrid mode (Section 3) captures both. Mode weighting (Section 7) ensures the evidence quality difference is reflected in the gate calculations.

**4. If offered as VaaS, do customers trust AI-conducted interviews?**

Trust depends on transparency and track record (Section 11). Upfront disclosure of AI involvement does not significantly reduce participation rates and may increase disclosure on sensitive topics. VaaS trust requires: (a) full mode breakdown transparency, (b) human-in-the-loop guarantee for Phase 1, (c) calibration data showing discovery-to-outcome accuracy, and (d) the dog-fooding requirement — SC uses its own methodology on Ventracrane ventures before selling it externally.

**5. What technology exists today to enable this?**

The AI interview platform market (Outset, Listen Labs, Strella, UserCall) is funded but API-immature (Section 10). No platform offers a production developer API for programmatic interview orchestration. SC's phased approach builds the analysis pipeline first (custom, using Claude API), adds Hybrid co-pilot capability second, and either builds a custom interview agent or integrates with a platform API when available for Phase 3.

**6. How does the Discovery Summary artifact get populated from interview data?**

Through the 6-step AI agent workflow (Section 12): Parse Hypothesis Card --> Generate Protocol --> Assist Sourcing --> Conduct Interviews --> Extract & Score --> Synthesize Discovery Summary. Each interview produces a signal extraction report. The agent aggregates these reports into the Discovery Summary fields using the pain severity rubric (Section 5), assumption type classification (Section 9), and saturation detection (Section 8). The schema is specified in Section 6.5.

---

# 13.5. Answering DD#2's Open Questions

DD#2 (Section 10) identified six open questions for this deep dive. Here are the answers, numbered 7-11 to continue the sequence from Section 13:

**7. How do AI-scaled discovery interviews feed into the discovery gate?**

Through mode-weighted counting (Section 7). Each interview mode has a weight (AI=0.5x, Hybrid=0.75x, Human=1.0x) that reflects evidence quality. The weighted count must reach >= 5.0 for the minimum interview check. Additionally, pain severity scoring (Section 5) from AI-analyzed transcripts feeds gate check #2 (composite >= 3.0) and #3 (peak dimension >= 4.0). The gate now has 6 checks instead of the original 3.

**8. What interview protocols map to each Hypothesis Card field?**

Four protocols (Section 4): Problem Discovery maps to Problem Statement, Stakes, and Customer Segment. Solution Fit maps to Solution Hypothesis and Why Now. Willingness to Pay maps to Solution Hypothesis and Market Sizing. ICP Validation maps to Customer Segment. Each protocol has specific opening questions, probing follow-ups, closing questions, and signal extraction rules that populate corresponding Discovery Summary fields.

**9. How is the Discovery Summary artifact populated from interview data?**

Via the 6-step AI agent workflow (Section 12). Per-interview signal extraction reports are aggregated: pain severity scores are averaged across participants per dimension, quotes are ranked and the top 10 selected, assumption risk levels are updated based on interview evidence, and the gate status is evaluated against the 6 checks. The schema (Section 6.5) specifies all fields and their data types.

**10. What minimum interview count is needed before each test category?**

Mode-weighted minimums (Section 8): Demand Signal requires 5.0 weighted with >= 2 human/hybrid. Willingness to Pay requires 8.0 weighted with >= 3 human/hybrid. Solution Validation requires 10.0 weighted with >= 5 human/hybrid. These minimums increase by 50% when the Hypothesis Card confidence score is "Uncertain."

**11. How does pain severity scoring work in AI-conducted interviews?**

The AI uses a 3-step method (Section 5): (1) extract verbatim quotes from the transcript and tag each with a pain dimension, (2) score each quote against the rubric anchors (1-5 per dimension), (3) average per-quote scores within each dimension, weighting longer/more detailed quotes higher. If fewer than 2 quotes exist for a dimension, it is marked "insufficient data." The composite score is the average of the three dimensions. Polarization is flagged when standard deviation exceeds 1.5.

---

# 14. Recommendations for Functional Spec v2.0

1. **Add `discovery_summary` JSONB column** to the experiments table (see Schema Sketch in Section 6.5). This stores the complete Discovery Summary artifact as structured JSON, parallel to the `hypothesis_card` and `test_blueprint` columns recommended by DD#1 and DD#2.

2. **Create an `interviews` table** to store individual interview records with per-interview metadata:

   ```sql
   CREATE TABLE IF NOT EXISTS interviews (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     experiment_id TEXT NOT NULL REFERENCES experiments(id),
     participant_id TEXT NOT NULL,
     mode TEXT NOT NULL CHECK(mode IN ('ai', 'hybrid', 'human')),
     protocols_covered TEXT NOT NULL,     -- JSON array of protocol names
     duration_minutes INTEGER,
     pain_scores TEXT,                    -- JSON: { functional: N, emotional: N, opportunity: N }
     signal_extraction TEXT,              -- JSON: full extraction report
     transcript_ref TEXT,                 -- R2 reference to transcript file
     new_themes_detected INTEGER DEFAULT 0,
     created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
   );
   ```

3. **Add API endpoints** for discovery workflow:
   - `POST /experiments/:id/discovery/start` — Initialize a discovery sprint
   - `POST /experiments/:id/interviews` — Record a completed interview
   - `GET /experiments/:id/discovery/summary` — Retrieve the current Discovery Summary
   - `POST /experiments/:id/discovery/finalize` — Lock the Discovery Summary to "final"
   - `GET /experiments/:id/discovery/gate` — Evaluate and return gate status

4. **Implement mode-weighted counting** in the gate evaluation logic. The weighted count calculation (`ai * 0.5 + hybrid * 0.75 + human * 1.0`) should be computed server-side when the gate is evaluated, not stored as a static value.

5. **Add event types to `event_log`** for discovery activities (Section 12): `discovery_sprint_started`, `interview_scheduled`, `interview_completed`, `interview_analyzed`, `saturation_detected`, `discovery_gate_evaluated`, `discovery_summary_finalized`.

6. **Extend the `experiments.status` CHECK constraint** to include a `discovery` status between `preflight` and `build`: `('draft','preflight','discovery','build','launch','run','decide','archive')`. This explicitly represents the discovery sprint as a workflow stage.

7. **Store interview transcripts in R2** (sc-assets bucket) with a reference in the interviews table. Transcripts contain PII and should follow the 90-day retention policy established in the strategy session.

8. **Plan D1 migration** for: `discovery_summary` JSONB column on experiments, `interviews` table creation, status CHECK constraint update, new event types.

---

# 15. Open Questions for Deep Dive #4

1. How does the Discovery Summary's `feature_priorities` field inform the Campaign Package's messaging hierarchy? Which discovered features become headlines vs. supporting copy?

2. How do `top_quotes` from the Discovery Summary feed into ad copy generation? Can real customer language be adapted directly into campaign creative, and what are the ethical/consent considerations?

3. How does the `discovery_channels` field inform campaign channel selection and targeting parameters? Is there a direct mapping from "where we found interviewees" to "where we run ads"?

4. When the Discovery Summary shows polarized pain (one dominant dimension), how should the Campaign Package's creative strategy reflect this? Should all variants emphasize the peak dimension, or should A/B testing explore multiple dimensions?

5. How does the `wtp_signal` and `price_range_observed` from discovery inform the pricing presentation in campaign creative and landing pages for `priced_waitlist` and `presale` archetypes?
