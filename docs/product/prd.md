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

1. **Project creation + the four links** — create/edit/list projects; paste-and-validate Notion, Slack, GitHub URLs. _(Signature — must be impeccable.)_
2. **Secure env-vars management** — per-project key/value envs, masked by default, gated reveal, behind secured login. _(Signature — must be impeccable.)_
3. **Documents** — file uploads (Supabase Storage) + external links + rich-text notes per project.
4. **Client feedback page** — per-project link-gated page for client feedback; team reads it in-app.

## Constraints

- **Deadline:** none — build it right.
- **Platforms:** web admin dashboard + one external feedback page. No mobile.
- **Data layer:** Supabase (Postgres + Auth + Storage) — own DB is the source of truth.
- **Auth:** GitHub OAuth + magic link; invite-only internal team.
- **Hosting:** Vercel (app) + Supabase (DB/auth/storage).
- **Languages / i18n:** bilingual EN + FR from day one.
- **Security:** env vars are sensitive; secured-login + gated reveal is the MVP bar. Encryption-at-rest is recommended hardening (see open questions).
- **IP / budget / contract:** internal Progix project; no external contract.

## Success metrics

- Every active Progix project is represented in progixHub (coverage → 100%).
- Zero project env vars living only in local `.env` files or DMs.
- Time to “find everything for a project” drops from minutes of searching to one click.
- Client feedback arrives through the hub rather than scattered email/Slack.

## Open questions

Resolved before the relevant spec proceeds (carried into `/create-spec` interviews — never assumed).

- [ ] **Visual personality** — deferred to Claude Design (designer’s call).
- [ ] **Encrypt env vars at rest?** — recommended; decide before the env-vars spec is built.
- [ ] **Brand assets** — logo, colors, store name not yet provided; needed for the design pass.
- [ ] **Secrets access model** — can any internal role reveal any project’s envs, or is reveal gated by per-project membership? (drives Supabase RLS design)
- [ ] **Feedback page auth** — fully public, or per-project secret link?

## Decision log

- 2026-06-08 — Data layer is **Supabase** (Postgres + Auth + Storage) — because it covers DB, auth, and document storage in one platform that fits this shape.
- 2026-06-08 — Auth is **GitHub OAuth + magic link**, invite-only — because the org’s GitHub is already central and the team is internal.
- 2026-06-08 — Surfaces are **linked by pasted URL, not API-synced** — because the MVP is a registry, not a sync engine (anti-goal).
- 2026-06-08 — Env vars are **secured-login + gated reveal** for MVP; not a hardened vault — to ship the hub without over-building the vault.
- 2026-06-08 — Repo/package slug normalized to **`progix-hub`**; human-facing display name stays **progixHub**.
