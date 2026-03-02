# CLAUDE.md - SC Console

This file provides guidance for Claude Code agents working in this repository.

## About This Repository

SC Console is the development hub for Silicon Crane (SC). It contains:

- **apps/sc-web/** - Astro 5 frontend with Tailwind CSS
- **workers/** - Cloudflare Workers for backend services
  - `sc-api/` - Main API worker
  - `sc-maintenance/` - Maintenance/admin worker
- **docs/** - Technical documentation
- **scripts/** - Automation scripts

## Session Start

Every session must begin with:

1. Call the `crane_preflight` MCP tool (no arguments)
2. Call the `crane_sod` MCP tool with `venture: "sc"`

This creates a session, loads documentation, and establishes handoff context.

## Enterprise Rules

- **All changes through PRs.** Never push directly to main. Branch, PR, CI, QA, merge.
- **Never echo secret values.** Transcripts persist in ~/.claude/ and are sent to API providers. Pipe from Infisical, never inline.
- **Verify secret VALUES, not just key existence.** Agents have stored descriptions as values before.
- **Never auto-save to VCMS** without explicit Captain approval.
- **Scope discipline.** Discover additional work mid-task - finish current scope, file a new issue.
- **Never remove, deprecate, or disable existing features** without explicit Captain directive. "Unused" is not sufficient justification. See `guardrails.md`.
- **Escalation triggers.** Credential not found in 2 min, same error 3 times, blocked >30 min - stop and escalate.

## Development Workflow

### Commands

| Command             | Purpose                                                    |
| ------------------- | ---------------------------------------------------------- |
| `npm run verify`    | Full local verification (typecheck + format + lint + test) |
| `npm run format`    | Format all files with Prettier                             |
| `npm run lint`      | Run ESLint on all files                                    |
| `npm run typecheck` | Check TypeScript                                           |
| `npm test`          | Run tests                                                  |

### Pre-commit Hooks

Automatically run on staged files:

- Prettier formatting
- ESLint fixes

### Pre-push Hooks

Full verification runs before push:

- TypeScript compilation check
- Prettier format check
- ESLint check
- Test suite

### CI Must Pass

- Never merge with red CI
- Fix root cause, not symptoms
- Run `npm run verify` locally before pushing

## Build Commands

### Frontend (sc-web)

```bash
cd apps/sc-web
npm install             # Install dependencies
npm run dev             # Local dev server
npm run build           # Production build
npm run preview         # Preview production build
```

### Workers

```bash
cd workers/sc-api       # or sc-maintenance
npm install             # Install dependencies
npx wrangler dev        # Local dev server
npx wrangler deploy     # Deploy to Cloudflare
npx tsc --noEmit        # TypeScript validation
```

## Tech Stack

| Layer    | Technology                     |
| -------- | ------------------------------ |
| Frontend | Astro 5, Tailwind CSS          |
| Hosting  | Cloudflare (via Astro adapter) |
| Backend  | Cloudflare Workers (Hono)      |
| Database | Cloudflare D1                  |

## Key Files

- `apps/sc-web/src/` - Astro pages and components
- `workers/sc-api/src/index.ts` - API routes
- `docs/technical/sc-technical-spec.md` - Technical specification

## QA Grade Labels

When PM creates an issue, they assign a QA grade. This determines verification requirements:

| Label        | Meaning    | Verification                       |
| ------------ | ---------- | ---------------------------------- |
| `qa-grade:0` | CI-only    | Automated - no human review needed |
| `qa-grade:1` | API/data   | Scriptable checks                  |
| `qa-grade:2` | Functional | Requires app interaction           |
| `qa-grade:3` | Visual/UX  | Requires human judgment            |
| `qa-grade:4` | Security   | Requires specialist review         |

## Security Requirements

- Never commit secrets to the repository
- Use environment variables for credentials
- Validate all input at API boundaries
- Use parameterized queries for D1 (always `.bind()`)

## Instruction Modules

Detailed domain instructions stored as on-demand documents.
Fetch the relevant module when working in that domain.

| Module                    | Key Rule (always applies)                                                       | Fetch for details                                        |
| ------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `secrets.md`              | Verify secret VALUES, not just key existence                                    | Infisical, vault, API keys, GitHub App                   |
| `content-policy.md`       | Never auto-save to VCMS; agents ARE the voice                                   | VCMS tags, storage rules, editorial, style               |
| `team-workflow.md`        | All changes through PRs; never push to main                                     | Full workflow, QA grades, escalation triggers            |
| `fleet-ops.md`            | Bootstrap phases IN ORDER: Tailscale -> CLI -> bootstrap -> optimize -> mesh    | SSH, machines, Tailscale, macOS                          |
| `creating-issues.md`      | Backlog = GitHub Issues (`gh issue create`), never VCMS notes                   | Templates, labels, target repos                          |
| `pr-workflow.md`          | Push branch, `gh pr create`, assign QA grade - never skip the PR                | Branch naming, commit format, PR template, post-merge QA |
| `guardrails.md`           | Never deprecate features, drop schema, or change auth without Captain directive | Protected actions, escalation format, feature manifests  |
| `wireframe-guidelines.md` | Wireframe committed and linked before status:ready (UI stories)                 | Wireframe generation, file conventions, quality bar      |
| `design-system.md`        | Load design spec before wireframe/UI work: `crane_doc('sc', 'design-spec.md')`  | Design tokens, component patterns, venture specs         |

Fetch with: `crane_doc('global', '<module>')`

## Related Documentation

Venture-specific instructions are served by crane-context via the `crane_sod` MCP tool.
See `docs/process/` for process documentation.
