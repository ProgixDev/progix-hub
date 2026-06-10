# Product Overview

## What this product is

**progixHub** is the internal home base for every Progix project. You create a project, paste in its Notion page, Slack channel, and GitHub repo links, and keep its environment variables (secured) and documents in one place. It is to Progix projects what GitHub is to repos — the registry everything hangs off. It deliberately _links to_ the four surfaces (Notion explains · GitHub tracks · Slack coordinates · the repo enforces) rather than replacing them.

The bet: the cost of finding "where is everything for this project" — scattered across chats, bookmarks, and local `.env` files — is paid on every handoff and every context-switch. One secured internal hub erases it.

## Users

| User                  | Wants                                                       | Success looks like                                           |
| --------------------- | ----------------------------------------------------------- | ------------------------------------------------------------ |
| Founders / leadership | A portfolio view of every project and its surfaces          | Open progixHub, see all projects, one click to any surface   |
| Project managers      | A project’s links, docs, and context in one current place   | Notion/Slack/GitHub + docs always one click away             |
| Developers / agents   | A project’s env vars and repo without hunting through chats | Reveal the env they need, behind auth, without asking anyone |
| External clients      | To tell the team what they think of their project           | Submit feedback from a link without needing an account       |

## What we will NOT do (anti-goals)

- **Not a project-management tool** — links to GitHub/Notion for tasks; no kanban or sprints inside.
- **Not client-facing beyond feedback** — the only external surface is the per-project feedback page.
- **Not a live data-sync engine** — surface links are pasted, not synced; no real-time mirroring.
- **Not a hardened secrets vault** — a convenient login-gated store, not Doppler/Vault.

## MVP scope (ranked)

1. Project creation + the four links — create/edit/list projects; paste-and-validate Notion, Slack, GitHub URLs. _(Signature.)_
2. Secure env-vars management — per-project key/value, masked by default, gated reveal, behind secured login; each variable shows a recognizable **service logo** (Stripe, Twilio, Next.js, Redis, …) auto-detected from the key with a manual override. _(Signature.)_
3. Documents — file uploads (Supabase Storage) + external links + rich-text notes.
4. Client portal — per-project, link-gated. Shipped as a two-way playground (blocks + feature cards the client can comment on, attach files to, and propose features into), evolved from the original one-way “feedback page”.

All four MVP scope items are now shipped & deployed. Full intent and acceptance criteria: [prd.md](prd.md). Stack & data layer: [ADR-0006](../architecture/decisions/0006-data-layer.md).

## Current feature map

Shipped: **sign-in & project registry** (002, [auth-and-projects.md](features/auth-and-projects.md)), **secure environment variables** (003, [env-vars.md](features/env-vars.md)), **documents** (004, [documents.md](features/documents.md)), **settings — language & theme** (005, [settings.md](features/settings.md); the app is bilingual EN/FR and supports light/dark), and the **client portal** (006, [client-portal.md](features/client-portal.md); the first external/token-gated surface). Living per-feature docs: [features/](features/README.md). Journeys that must never break: [critical-user-journeys.md](critical-user-journeys.md).

## Glossary

| Term    | Meaning here                                                              |
| ------- | ------------------------------------------------------------------------- |
| Surface | One of the four homes a project lives in: Notion, GitHub, Slack, the repo |
| Env var | A per-project secret/config value, stored masked and revealed behind auth |
| CUJ     | Critical user journey — an e2e-tested, screenshot-evidenced path          |
| Slice   | A `src/features/<name>` vertical module                                   |
| Harness | Everything that steers agents: docs, gates, skills, hooks, personas       |
