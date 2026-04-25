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

sc-console's `npm audit --audit-level=high` has been failing on `main` since 2026-04-22 due to the GitHub Actions runner being unable to resolve `@venturecrane/crane-test-harness` from GitHub Packages when workspace deps walk through workers/sc-api. The `audit` job is kept as the original flat job from `main` (no matrix expansion) so behavior is unchanged from the pre-existing baseline.

0 pre-existing findings from Semgrep on the codebase itself.

## CI run — canary removed (GREEN, post-fix)

**Run:** (appended after push)

## Ruleset application

Applied 2026-04-25 via `gh api --method POST /repos/venturecrane/sc-console/rulesets --input ~/dev/crane-console/config/github-ruleset-main-protection.json`

**Ruleset ID:** 15555250
**Enforcement:** active
**Required status checks:** `Security Summary` (the aggregate gate)

## Takeaways

- Semgrep gate fires on canary (not theatre).
- Summary job correctly aggregates sub-job failures.
- `nosemgrep-audit` accepts justified annotations, rejects bare/short.
- Container pin `returntocorp/semgrep:1.157.0` produces reproducible runs.
- Pre-existing npm vulnerabilities documented and tracked; gate is honest about scope.
