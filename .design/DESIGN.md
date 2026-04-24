# Silicon Crane — Design Spec

Design system definition for `sc-console`. Brand guidance for the public marketing surface (`/`, `/services`, `/about`), the validation experiments landing pages (`/e/[slug]`), and the gated validation tooling at `/app/*`.

## Design System Overview

- **Brand:** Silicon Crane — Expert B2B software sprint execution (front door); Validation tooling for shipping and measuring product experiments (gated product behind login)
- **Audience:** Founders and product teams validating B2B software hypotheses; on the gated side, internal operators and invited testers running structured experiments through the platform
- **Platform:** Astro 5 + Tailwind 3 on Cloudflare Pages (SSR via @astrojs/cloudflare); Cloudflare Workers + D1 backing the API and the experiments lifecycle (sc-api)
- **Theme:** Light mode default. Operator surface (`/app/*`) uses the same palette — no dark mode in this iteration.
- **Voice:** Evidence-driven, calibrated, no marketing fluff. The product is a validation methodology made operational; the writing should reflect that the reasoning is grounded in observed signal, not promises.
- **Auth:** Clerk via `@clerk/astro`, Restricted Mode allowlist on the gated `/app/*` surface only. Marketing pages remain fully public and prerendered.

## Color Palette

### Surfaces

| Token       | Hex                                            | Usage                                    |
| ----------- | ---------------------------------------------- | ---------------------------------------- |
| Page bg     | `#ffffff`                                      | Default page background                  |
| Surface alt | `#f8fafc`                                      | Secondary section backgrounds (slate-50) |
| Card        | `#ffffff`                                      | Card backgrounds with `border-slate-200` |
| Hero dark   | `linear-gradient(to bottom, #0f172a, #1e293b)` | Hero gradient (slate-900 → slate-800)    |

### Text

| Token     | Hex       | Usage                       |
| --------- | --------- | --------------------------- |
| Primary   | `#0f172a` | Headings (slate-900)        |
| Secondary | `#475569` | Body, muted (slate-600)     |
| Tertiary  | `#94a3b8` | Captions, hints (slate-400) |
| Inverse   | `#ffffff` | Text on dark/accent bg      |

### Accent (Calibrated Blue)

| Token        | Hex       | Usage                                |
| ------------ | --------- | ------------------------------------ |
| Accent       | `#2563eb` | Primary CTAs, links (blue-600)       |
| Accent hover | `#1d4ed8` | Hover state (blue-700)               |
| Accent soft  | `#dbeafe` | Soft accent backgrounds (blue-100)   |
| Highlight    | `#3b82f6` | Active items, focus rings (blue-500) |

### Status (carry-over from existing landing)

| Use case | Tailwind class                 |
| -------- | ------------------------------ |
| Success  | `text-green-600` `bg-green-50` |
| Warning  | `text-amber-600` `bg-amber-50` |
| Error    | `text-red-600` `bg-red-50`     |

## Typography

- **Sans (UI + body):** system stack (`ui-sans-serif, system-ui, ...`) — Tailwind default. No custom font load (privacy + performance).
- **Mono (numeric, technical):** `ui-monospace, SFMono-Regular, Menlo, monospace` for archetype names, status labels, lifecycle stages — anywhere precision matters.

### Scale (Tailwind defaults)

| Use         | Tailwind class                                |
| ----------- | --------------------------------------------- |
| Hero H1     | `text-4xl md:text-6xl font-bold`              |
| Section H2  | `text-3xl md:text-4xl font-bold`              |
| Card title  | `text-xl font-bold`                           |
| Body lead   | `text-xl text-slate-600`                      |
| Body        | `text-base`                                   |
| Metadata    | `text-sm text-slate-500`                      |
| Mono labels | `text-xs uppercase tracking-widest font-mono` |

### Weights

400 body, 500 labels, 600 navigation, 700 headings.

## Spacing & Radius

Tailwind defaults. Specifics:

- Card radius: `rounded-xl` (12px)
- Button radius: `rounded-lg` (8px)
- Mobile container padding: `px-4`, desktop: `container mx-auto px-4`
- Section vertical: `py-20` (default), `py-16` (compact), `py-32` (hero)

## Imagery Direction

- **No stock photos.** Silicon Crane reads as a serious operator surface — consumer-stock imagery undermines the positioning.
- **Inline SVG icons** (lucide-style, currently hand-rolled) for all interface chrome.
- **No experiment-tooling screenshots on the public marketing page.** The validation tooling is the gated product; revealing its UI removes the reason to sign in.
- For hero/section illustration when needed, use abstract geometric line-art SVG in the accent palette. If no illustration is ready, ship typography-only.

## Component Patterns

Existing inline patterns in `pages/index.astro` (gradient hero, card grids, contact form) are the marketing-side primitives. The gated `/app/*` surface inherits from the same Tailwind tokens but shifts toward higher data density (smaller text, denser tables, lifecycle status chips).

## Layout Principles

- **Marketing landing:** generous whitespace, single column on mobile, three-column max on desktop, full-width gradient hero, sticky top nav with primary CTA visible at all times.
- **Validation tooling (`/app/*`):** dense, table-friendly, status-chip heavy, max two clicks to reach any experiment.
- **Validation experiment landing pages (`/e/[slug]`):** lighter, conversion-optimized, single column, clear CTA above the fold.

## Voice Examples

- Marketing hero: "From hypothesis to working software in 30 days." (not "Let's build something amazing!")
- Section headers: "What we build" / "Why Silicon Crane" / "Ready to validate faster?" (operator language)
- Empty states: "No experiments yet. Start with a hypothesis." (not "Looks empty!")
- Errors: "Verification failed. Re-check the email and try again." (not "Oops!")

## Accessibility

- WCAG 2.1 AA minimum
- Status conveyed through icon + text, never color alone
- Focus rings: `focus:ring-2 focus:ring-blue-500`
- Touch targets: 44px minimum on the marketing CTAs
- Form labels always present (use `sr-only` for visual-hide-only patterns)
