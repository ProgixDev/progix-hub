# PRD — progixHub

> Product Requirements Document. The source of intent: what we’re building and why, before how. Human original lives in Notion; this is the repo mirror agents read. Filled by `/write-prd`; updated by `/meeting-intake` when requirements change.

**Client:** Progix (internal) · **Owner:** Progix team · **Status:** draft · **Updated:** 2026-06-08

## Problem & opportunity

Every Progix project lives across four surfaces — Notion explains it, GitHub tracks it, Slack coordinates it, the repo enforces it — but there is no single internal home that ties those threads to one project. Today the links are scattered across chats and bookmarks, and the things that have no good home at all — a project’s environment variables and its loose documents — end up in local `.env` files, DMs, and people’s heads. When someone joins a project or picks it back up, finding “where is everything for this project” is manual archaeology. progixHub is the internal hub that fixes this: create a project, paste its Notion, Slack, and GitHub links, and keep its env vars and documents in one secured place. It is to Progix projects what GitHub is to repos — the registry everything hangs off.

## Goals & non-goals

**Goals (what success requires):**

- A team member can create a project and attach its four surfaces (Notion page, Slack channel, GitHub repo) by pasting links — in under a minute.
- Per-project **env vars** are stored behind secured login, masked by default, and revealed only by an explicit authenticated action.
- Per-project **documents** live in one place: file uploads (Supabase Storage), external links, and rich-text notes.
- An external **client feedback** page lets a client leave feedback on their project, which the team reads inside progixHub.
- The hub is bilingual (EN + FR) from day one.

**Non-goals (explicitly out of scope — protects the budget and the timeline):**

- **Not a project-management tool.** It links to GitHub/Notion for tasks; no kanban, sprints, or task tracking inside progixHub.
- **Not client-facing beyond feedback.** The only external surface is the feedback page; everything else is internal.
- **Not a live data-sync engine.** Links are pasted, not synced; no real-time mirroring of GitHub/Notion/Slack in the MVP.
- **Not a hardened secrets vault.** It’s a convenient, login-gated store for envs — not a Doppler/Vault replacement.

## Users & jobs

| User                  | What they’re trying to do                                       | Success looks like                                                        |
| --------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Founders / leadership | See the portfolio — every project and where its surfaces live   | Open progixHub, see all projects and jump to any surface in one click     |
| Project managers      | Run a project — keep its links, docs, and context in one place  | A project’s Notion/Slack/GitHub + docs are all current and one click away |
| Developers / agents   | Get a project’s env vars and repo without hunting through chats | Reveal the env they need, behind auth, without asking anyone              |
| External clients      | Tell the team what they think of their project                  | Submit feedback from a link without needing an account                    |

## Scope — MVP

The non-negotiables for launch, ranked. Each becomes one or more specs via `/create-spec`.

0. **App shell** (foundation, not a user feature) — sidebar (Projects, Settings·“soon”, recent projects), top bar with a **⌘K command menu**, dark dev-tool design system ported from the approved Claude Design. Features drop into this shell.
1. **Project creation + the four links** — create/edit/list projects with a status (**Active / At risk / Archived**); attach four surface links by pasting URLs: **Notion, Slack, GitHub, and Live** (deployed site). Project detail header presents the four links as shortcuts plus a **Client link** action and member avatars. _(Signature — must be impeccable.)_
2. **Secure env-vars management** — per-project key/value envs with a **scope** (Production / Preview / Development), masked by default, gated per-row reveal + “Hide all”, behind secured login, **encrypted at rest**. Each variable carries a **service logo** (Stripe, Twilio, Next.js, Redis, SendGrid, Algolia, Postgres, …) so it’s recognizable at a glance — auto-detected from the key (e.g. `STRIPE_*` → Stripe, `REDIS_*` → Redis) with a manual override and a generic key fallback. _(Signature — must be impeccable.)_
3. **Documents** — per project, three kinds in one tabbed view (**All / Files / Links / Notes**): file uploads to Supabase Storage (PDF, DOCX, images, ZIP — **up to 50 MB**), external links, and rich-text notes; each row shows type/size, uploader, and date.
4. **Client feedback page** — a **private-link** (secret URL, not public) per-project page where a client leaves a **star rating + message + optional name**; visible only to the Progix team. In-app: a rating summary, the response list, Copy-client-link and Preview actions.

## Constraints

- **Deadline:** none — build it right.
- **Platforms:** web admin dashboard + one external feedback page. No mobile.
- **Data layer:** Supabase (Postgres + Auth + Storage) — own DB is the source of truth.
- **Auth:** GitHub OAuth, gated to ProgixDev org members (invite-only internal team).
- **Hosting:** Vercel (app) + Supabase (DB/auth/storage).
- **Languages / i18n:** bilingual EN + FR from day one.
- **Security:** env vars are sensitive; secured-login + gated reveal **and encryption at rest** are the MVP bar (the design asserts “Encrypted at rest”). Reveal stays object-level-authorized and audit-logged. See ADR-0006.
- **IP / budget / contract:** internal Progix project; no external contract.

## Success metrics

- Every active Progix project is represented in progixHub (coverage → 100%).
- Zero project env vars living only in local `.env` files or DMs.
- Time to “find everything for a project” drops from minutes of searching to one click.
- Client feedback arrives through the hub rather than scattered email/Slack.

## Open questions

Resolved before the relevant spec proceeds (carried into `/create-spec` interviews — never assumed).

- [x] **Visual personality** — resolved: dark developer-tool direction, approved 2026-06-08 (design in `docs/design/mockups/progixhub`).
- [x] **Encrypt env vars at rest?** — resolved: **yes** (design asserts “Encrypted at rest”). ADR-0006 governs the mechanism.
- [x] **Brand assets** — resolved for MVP: wordmark + palette come from the approved design (`icons.jsx`, `styles.css`). A standalone logo file is still nice-to-have.
- [x] **Secrets access model** — resolved: any signed-in Progix member may reveal (design: “Access is limited to signed-in Progix members”); reveal stays object-level-authorized + audit-logged. Per-project-membership gating is a possible later refinement, not MVP.
- [x] **Feedback page auth** — resolved: **private secret link** (design: “Private link”), not public.
- [ ] **Roles & permissions** — MVP assumes any authenticated member can create/edit/archive; granular roles deferred (Settings is “soon”). Confirm before the project-creation spec if that’s wrong.
- [ ] **Feedback notifications** — should a new client response notify the team (email/Slack)? Not shown in the design; decide during the feedback spec.

## Decision log

- 2026-06-08 — Data layer is **Supabase** (Postgres + Auth + Storage) — because it covers DB, auth, and document storage in one platform that fits this shape.
- 2026-06-08 — Auth is **GitHub OAuth only**, gated to **ProgixDev org membership** — magic link dropped (2026-06-08) to keep the org-membership check trivial; the team already lives in GitHub.
- 2026-06-08 — Surfaces are **linked by pasted URL, not API-synced** — because the MVP is a registry, not a sync engine (anti-goal).
- 2026-06-08 — Env vars are **secured-login + gated reveal** for MVP; not a hardened vault — to ship the hub without over-building the vault.
- 2026-06-08 — Repo/package slug normalized to **`progix-hub`**; human-facing display name stays **progixHub**.
- 2026-06-08 — **Claude Design output approved in full** — dark developer-tool design system is the baseline (`docs/design/mockups/progixhub`). Resolved: visual direction, encrypt-at-rest (yes), secrets access (any signed-in member), feedback private-link.
- 2026-06-08 — Surface links are **four**: Notion, Slack, GitHub, **Live** (deployed site) — Live added per the approved design.
- 2026-06-08 — Env vars carry a **per-variable service logo** auto-detected from the key, with manual override — approved product detail.
- 2026-06-08 — **Settings is out of MVP** (“soon” in the design); MVP assumes flat permissions (any authenticated member).
