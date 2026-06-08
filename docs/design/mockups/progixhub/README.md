# progixHub — Claude Design mockups

The visual source of truth for the build, exported from Claude Design (2026-06-08). These are **design reference only** — not the production code. The real app is built in `src/` following the repo's conventions; use these for layout, tokens, and component intent.

## What's here

- `screenshots/` — rendered screens: sign-in, projects portfolio, project detail, env vars (masked + revealed), documents, feedback (+ client confirm), command menu.
- `styles.css` — the design tokens (colors, spacing, type). Port these into `globals.css` per `docs/conventions/styling.md`.
- `icons.jsx` — the icon set + **brand glyphs** (Notion, Slack, GitHub, Live, Figma, Drive) + the progixHub wordmark/logo.
- `screens_*.jsx`, `components.jsx`, `commandmenu.jsx`, `app.jsx`, `data.jsx` — the mockup React (plain inline-style JSX, **not** our stack — reference the structure, not the implementation).

## Design language (observed)

Dark developer-tool aesthetic (the chosen archetype): deep navy surfaces, blue accent (`--blue` ≈ `#4C82FB`), monospace for keys/values, dense but legible. Every project card shows the four surface icons; the project detail header presents Notion/Slack/GitHub/Live as prominent shortcuts; the env table masks values by default with a per-row reveal and an "Encrypted at rest" badge.

## Known gap to close in the env-vars feature

`icons.jsx` ships brand glyphs **only for the four surfaces**. The env-vars screens use a generic lock icon per row. The product requires **per-variable service logos** (Stripe, Twilio, Next.js, Redis, SendGrid, Algolia, Postgres, etc.) so a variable is recognizable at a glance — see the env-vars scope in `docs/product/prd.md`. The service-logo set must be added during that feature.
