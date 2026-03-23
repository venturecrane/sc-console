# SC Console -- Backlog Proposal

> Extracted from PRD (2026-03-02) and Functional Spec v2.0. Issues grouped by implementation phase per PRD Section 18.

---

## Phase 0: Business Foundation

These issues contain zero platform development. They are the prerequisite business infrastructure needed to accept the first paying client.

| #   | Title                                                | Description                                                                                                                                                                                                                                                                     | Labels           |
| --- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| 1   | Lock sprint pricing for all 4 sprint types           | Resolve ADR-001. Define specific dollar amounts for Preflight, Build-to-Launch, Run + Decide, and Scale Readiness sprints. Establish the founding client rate and conditions (case study rights, testimonial, feedback). This blocks all outreach and the services page update. | `phase-0`, `adr` |
| 2   | Update services page with pricing and sprint details | Add locked pricing, per-sprint deliverables, timelines, and founding client offer to `services.astro`. Clarify that "build" means landing page + tracking, not a functional product (UI-011). Include "What SC Is Not" positioning to prevent agency/accelerator confusion.     | `phase-0`        |
| 3   | Create client intake form                            | Build a structured intake form via Typeform or Tally. Fields: idea description, current stage, budget range, timeline preference, name, email, company. Configure submission notifications. Consider guided intake that recommends sprint type(s) based on idea stage (UI-010). | `phase-0`        |
| 4   | Create contract/SOW template                         | Draft a reusable Statement of Work template covering sprint type, deliverables, timeline, price, kill criteria, payment terms, and case study/testimonial rights for founding clients. Include lead data export clause before archive (UI-009).                                 | `phase-0`        |
| 5   | Set up Stripe payment mechanism                      | Create Stripe products and prices for each sprint type. Configure hosted Checkout or Invoice flow. Verify with a test transaction. This is the exit criterion for accepting money.                                                                                              | `phase-0`        |
| 6   | Draft and publish DFG case study                     | Write the DFG case study with real metrics: hypothesis tested, test methodology, data collected, decision made, current state. Create an anonymized sample Validation Report/Decision Memo for trust building (UI-012). Publish on siliconcrane.com.                            | `phase-0`        |
| 7   | Define capacity and priority arbitration rules       | Resolve ADR-002 and ADR-003. Decide: max concurrent engagements alongside DFG, priority arbitration when conflicts arise, and client tooling access model (Option B sanitized recommended). Document decisions before first client contract.                                    | `phase-0`, `adr` |

---

## Phase 1: Schema Foundation

Migration 0002 execution. No application code changes.

| #   | Title                                                     | Description                                                                                                                                                                                                                                                                                                                                           | Labels           |
| --- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| 8   | Audit production data for interview archetype experiments | Before running Migration 0002, query production D1 for any experiments with `archetype = 'interview'` in active states (`launch`, `run`, `decide`). Resolves ADR-006. Document findings and coordinate if any active experiments need manual handling before migration.                                                                               | `phase-1`, `adr` |
| 9   | Write and execute Migration 0002                          | Implement the 4-step migration: (1) ALTER TABLE for 10 new experiment columns + 1 decision_memos column + 4 new tables, (2) data migration of interview archetype, (3) experiments table recreation with updated CHECK constraints, (4) verification queries. Run local, then preview, then production. Follow ADR-010 pre-migration backup protocol. | `phase-1`        |
| 10  | Update test harness for v2.0 schema                       | Extend the test setup to include Migration 0002 so that all new tables, columns, and CHECK constraints are present in the test D1 instance. Verify trigger recreation and index presence.                                                                                                                                                             | `phase-1`        |

---

## Phase 2: Hypothesis Card

Experiments gain structured hypothesis definition with write invariant enforcement.

| #   | Title                                              | Description                                                                                                                                                                                                                                                                                                                                                                                | Labels           |
| --- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| 11  | Implement Hypothesis Card write and read via PATCH | Add `hypothesis_card` to the updatable fields on `PATCH /experiments/:id` and to the `POST /experiments` creation path. Validate Tier 1 (6 required fields) and Tier 2 (all 10 fields + confidence + confidence_rationale). Enforce `one_liner` max 200 chars, `key_assumptions` 3-5 items, confidence enum (`proceed`/`uncertain`/`abandon`). Return full card on `GET /experiments/:id`. | `phase-2`        |
| 12  | Implement Distill Brief write invariant            | When `hypothesis_card` is non-null: auto-extract projections into the 4 Distill Brief columns on write; reject direct PATCH updates to those columns with 409 `WRITE_INVARIANT_VIOLATION`. Preserve backward compatibility when `hypothesis_card` is null. Handle edge case where Tier 1 card has null `market_sizing` (clears `market_size_estimate`).                                    | `phase-2`        |
| 13  | Decide JSON schema validation approach             | Resolve ADR-007. Choose between (A) full JSON Schema validation via ajv, (B) lightweight structural checks, or (C) no validation. Recommendation is Option B for MVP since all endpoints are internal. Document the decision and implement the chosen approach for `hypothesis_card` as the pattern for all subsequent artifact columns.                                                   | `phase-2`, `adr` |

---

## Phase 3: Discovery Engine

Experiments can enter `discovery` status with interview recording and gate evaluation.

| #   | Title                                            | Description                                                                                                                                                                                                                                                                                                                                                                                             | Labels           |
| --- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| 14  | Add discovery status to valid status transitions | Add `discovery` to `VALID_STATUS_TRANSITIONS`: `preflight -> discovery` (unconditional), `discovery -> build` (unconditional in Phase 3, gated in Phase 4), `discovery -> archive`. Update the status transition validation logic in the API. No gate enforcement yet.                                                                                                                                  | `phase-3`        |
| 15  | Implement discovery sprint lifecycle endpoints   | Build `POST /experiments/:id/discovery/start` (transitions to discovery, logs event, returns 409 if already active), `GET /experiments/:id/discovery/summary` (returns summary with computed weighted count), `POST /experiments/:id/discovery/finalize` (locks summary to final, rejects subsequent updates). All behind X-SC-Key auth.                                                                | `phase-3`        |
| 16  | Implement interviews CRUD                        | Build `POST /experiments/:id/interviews` (insert with validation: mode enum, non-empty protocols_covered, pain_scores 1-5 per dimension or null, required participant_id; returns 400 if not in discovery status) and `GET /experiments/:id/interviews` (list by experiment, ordered by created_at asc). Log `interview_completed` events.                                                              | `phase-3`        |
| 17  | Implement Discovery Gate evaluation endpoint     | Build `GET /experiments/:id/discovery/gate` with 6 checks: (1) minimum weighted interviews >= 5.0, (2) composite pain >= 3.0, (3) peak dimension >= 4.0, (4) problem_confirmed true, (5) at least 1 assumption updated with evidence, (6) saturation reached. Checks 1/4/5 required; 2/3 OR'd; 6 advisory. Compute weighted count from interviews table (UI-001). Log `discovery_gate_evaluated` event. | `phase-3`        |
| 18  | Decide Discovery Summary computation strategy    | Resolve ADR-008. Choose between (A) compute on read, (B) compute on write, or (C) explicit command for Discovery Summary aggregation. Recommendation is Option B. Document the decision and implement accordingly. Determine behavior when a new interview is recorded after summary is written (UI-002).                                                                                               | `phase-3`, `adr` |
| 19  | Add discovery event types to event log           | Register all discovery event types in the event logging system: `discovery_sprint_started`, `interview_completed`, `interview_analyzed`, `saturation_detected`, `discovery_gate_evaluated`, `discovery_summary_finalized`. Ensure each event includes experiment_id, timestamp, and relevant structured metadata.                                                                                       | `phase-3`        |

---

## Cross-Phase: ADRs Requiring Decisions

These ADRs need resolution but are not tied to a single implementation issue above.

| #   | Title                                         | Description                                                                                                                                                                                                                                                                                                      | Labels |
| --- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 20  | Decide equity policy for client engagements   | Resolve ADR-004. Decide whether SC ever takes equity in client ventures. Recommendation is no equity for MVP -- cash only to avoid legal complexity and incentive misalignment with "kill fast" methodology. Document the decision before the 5th client outreach.                                               | `adr`  |
| 21  | Define interview transcript R2 key convention | Resolve ADR-009. Establish the R2 key format for interview transcripts (recommended: `interviews/{experiment_id}/{participant_id}-{ISO_DATE}.txt`). Document the convention so Phase 3 interview recording can store transcript references correctly. Define 90-day PII retention policy for transcript objects. | `adr`  |
| 22  | Define pre-migration backup protocol          | Resolve ADR-010. Document the backup procedure: `wrangler d1 export` before each remote migration, local-first then preview then production, 7-day retention for exports. This should be completed before Phase 1 migration execution.                                                                           | `adr`  |

---

## Cross-Phase: Accessibility and Template Fixes

| #   | Title                                              | Description                                                                                                                                                                                                                                                                                                                     | Labels                   |
| --- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| 23  | Fix accessibility issues on landing page templates | Address UI-016: add `aria-hidden="true"` to decorative SVG checkmark icons in `[slug].astro`, add `aria-live="polite"` to the `#form-message` div, add `aria-busy="true"` and `aria-label="Submitting, please wait"` to submit button during loading state. PRD states these should be fixed in the next PR touching templates. | `enhancement`, `phase-1` |

---

## Cross-Phase: Documentation

| #   | Title                                                     | Description                                                                                                                                                                                                                                                                                            | Labels                     |
| --- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------- |
| 24  | Update services page copy to address positioning concerns | Revise services page to: clarify "build" means landing page + tracking, not a functional product (UI-011); balance "kill bad ideas" messaging with "find out what works" framing (UI-018); add "What SC Is Not" section to prevent agency confusion. Can be combined with issue #2 if done in Phase 0. | `documentation`, `phase-0` |

---

## Summary

| Phase                        | Issue Count | Key Outcome                                            |
| ---------------------------- | ----------- | ------------------------------------------------------ |
| Phase 0: Business Foundation | 7           | Ready to accept first paying client                    |
| Phase 1: Schema Foundation   | 3           | Migration 0002 deployed, v2.0 schema live              |
| Phase 2: Hypothesis Card     | 3           | Structured hypothesis definition with write invariant  |
| Phase 3: Discovery Engine    | 6           | Interview recording, discovery status, gate evaluation |
| ADRs (cross-phase)           | 3           | Open decisions resolved                                |
| Accessibility                | 1           | WCAG 2.1 AA compliance for templates                   |
| Documentation                | 1           | Services page positioning clarity                      |
| **Total**                    | **24**      |                                                        |

### Dependency Chain

```
Phase 0 (no platform deps)
    |
    v
ADR-006 (#8) --> Phase 1 (#9, #10)
                    |
                    v
                Phase 2 (#11, #12, #13)
                    |
                    v
                Phase 3 (#14-19)
```

### Notes

- Issues #2 and #24 overlap on services page work and can be combined into a single PR if both are addressed in Phase 0.
- ADR issues (#20, #21, #22) have no hard phase dependency but should be resolved before the phase that needs them (ADR-009 before Phase 3, ADR-010 before Phase 1).
- Phase 0 issues are business tasks, not engineering tasks. They may be tracked differently than platform issues.
- Phases 4-7 are explicitly out of MVP scope per PRD Section 18. A separate planning cycle will generate issues for those phases after Milestone A is complete.
- UI-013 (no signal capture on landing pages) is acknowledged but deferred to Phase 6 per the functional spec. The PRD calls it out as a known gap.
