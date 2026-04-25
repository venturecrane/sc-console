# Semgrep Initial Canary Verification

**Date:** 2026-04-25
**PR:** #115 (chore/security-semgrep-ci-gate)
**Pattern:** Mirrors crane-console PR #639

This doc captures the pre-merge evidence that the Semgrep CI gate actually catches findings, not just runs and passes. It survives squash-merge as permanent proof the gate was real at installation time.

## Canary file

`scripts/semgrep-canary.ts` was committed to the draft PR with three deliberate `detect-child-process` findings — `execSync` and `spawn` calls where an argument traces back to a function parameter. All three are exact matches for rules in the pinned pack combination.

Canary content (removed before merge):

```typescript
import { execSync, spawn } from 'child_process'

export function canaryChildProcessExec(userName: string): string {
  return execSync(`echo hello ${userName}`).toString()
}

export function canaryChildProcessSpawn(cmd: string): void {
  spawn(cmd)
}

export function canaryExecThird(venture: string): void {
  execSync(`gh repo list ${venture}`)
}
```

## CI run — with canary (RED, as expected)

**Run:** https://github.com/venturecrane/sc-console/actions/runs/24942297187

**Static Analysis (Semgrep) job:** FAILED (26s)

Findings (3 total, 3 blocking):

```
   ❯❯❱ javascript.lang.security.detect-child-process.detect-child-process
           Blocking — scripts/semgrep-canary.ts:6

   ❯❯❱ javascript.lang.security.detect-child-process.detect-child-process
           Blocking — scripts/semgrep-canary.ts:10

   ❯❯❱ javascript.lang.security.detect-child-process.detect-child-process
           Blocking — scripts/semgrep-canary.ts:14
```

Semgrep scan metadata: `Rules run: 677`, `Targets scanned: 130`.

**Summary job:** FAILED (aggregated as expected — semgrep failure propagates through `needs`).

**nosemgrep Justification Audit job:** PASSED.

## Pre-existing findings / adaptations

Unlike crane-console, sc-console has pre-existing high-severity npm audit vulnerabilities that require an Astro v5 → v6 major upgrade to resolve. The chain is:

- `@astrojs/cloudflare@^12` has transitive high-severity deps (undici, serialize-javascript)
- `@astrojs/cloudflare@13` fixes them but requires `astro@^6`
- sc-console is on `astro@^5.18.1`; the upgrade is out of scope here

**Adaptation:** `npm-audit` runs and surfaces findings but is excluded from the blocking `Security Summary` gate (with a clear comment marking the unlock condition). The 5 gating checks (gitleaks, typescript, astro-check, semgrep, nosemgrep-audit) are fully enforced.

Node setup was adapted from crane-console pattern (node-version-file: .nvmrc) to match sc-console's verify.yml pattern (node-version: '22' + cache: 'npm') due to the GitHub Packages registry auth interaction.

sc-web (Astro SSR frontend) is covered by a flat `astro-check` job instead of a TypeScript matrix entry, since it uses Astro's own type checker.

## CI run — canary removed (GREEN, post-fix)

**Run:** https://github.com/venturecrane/sc-console/actions/runs/24942330764

All 5 blocking security checks pass:

- Secret Detection: PASSED
- TypeScript Validation (sc-api): PASSED
- TypeScript Validation (sc-maintenance): PASSED
- Astro Check (sc-web): PASSED
- Static Analysis (Semgrep): PASSED
- nosemgrep Justification Audit: PASSED
- Security Summary: PASSED

NPM Audit: WARNING (pre-existing Astro v5 transitive vulnerabilities — informational only)

## Ruleset application

Applied 2026-04-25 via `gh api --method POST /repos/venturecrane/sc-console/rulesets --input ~/dev/crane-console/config/github-ruleset-main-protection.json`

**Ruleset ID:** (see below — appended after application)
**Enforcement:** active
**Required status checks:** `Security Summary` (the aggregate gate)

## Takeaways

- Semgrep gate fires on canary (not theatre).
- Summary job correctly aggregates sub-job failures.
- `nosemgrep-audit` accepts justified annotations, rejects bare/short.
- Container pin `returntocorp/semgrep:1.157.0` produces reproducible runs.
- Pre-existing npm vulnerabilities documented and tracked; gate is honest about scope.
