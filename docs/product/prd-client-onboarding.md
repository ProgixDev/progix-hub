# PRD — Client onboarding & platform provisioning (epic)

> Focused PRD for a post-MVP epic on top of progixHub. Extends the main [prd.md](prd.md); same conventions. Human original lives in Notion. One page where possible.

**Client:** Progix (internal) · **Owner:** Achref Arabi · **Status:** draft · **Updated:** 2026-06-24

## Problem & opportunity

Every new client project needs the client to set up a handful of production accounts — Stripe, Vercel, Supabase, a domain, email, etc. — and grant Progix access to them. Today this happens over Slack and calls: a dev explains, screen-by-screen, how to create each account and how to invite the team, and re-explains it for the next client. It is slow, repetitive, error-prone, and depends on the client's comfort with IT. There is no record of what's been set up or what's still missing, so projects stall waiting on access nobody is tracking. We can turn this into a self-serve, guided, tracked flow: a per-project page the client opens from a link, that walks them through each platform with a short video and the exact action to take, and shows the team what's done. The how-to videos and the per-platform steps are written once and reused on every project.

## Goals & non-goals

**Goals (what success requires):**

- A **reusable library of how-to videos**, one or more per platform, that the team records once and never re-explains.
- An **org-wide platform registry** where each platform we use is configured once — its access pattern, steps, and linked video.
- A **per-project client onboarding ("Setup") page**: the team picks the platforms, hits a button, and shares a link + passcode; the client follows a guided checklist and grants/invites access.
- **Access without handing over secrets**: critical platforms use "invite us as collaborator" (the page pre-fills our team email + role + a deep link), never raw credential sharing; API keys land in the existing encrypted env-vars vault.
- **Visible progress**: the team sees, per project, which platforms the client has completed and what's still pending.
- A **team-only client dossier** per project — who the client is, their type, temperament, and IT-savviness — so whoever picks up the project knows how to handle them.
- Bilingual (EN + FR), consistent with the rest of progixHub.

**Non-goals (explicitly out of scope — protects budget and timeline):**

- **No automated provisioning.** We do not call Stripe/Vercel/etc. APIs to create or invite programmatically; the flow guides a human, it doesn't act for them.
- **Not a credential store for the client's passwords.** We never collect a client's account password; access is via collaborator invites or keys in the existing encrypted vault.
- **Not a generic LMS / course platform.** Tutorials are short, platform-scoped how-tos, not a training product.
- **Not a CRM.** The client dossier is lightweight context for the team, not a sales pipeline.
- **No real client accounts/logins for the onboarding page.** Access is a shared link + passcode (extends the spec-006 portal token model), not a username/password system.
- **No verification that the client actually did it correctly** beyond a team member marking a step "verified."

## Users & jobs

| User                             | What they're trying to do                                         | Success looks like                                                          |
| -------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Developer / PM (team)            | Get the client to set up & grant access to production platforms   | Sends one link; the client self-serves; access arrives without a call       |
| Global PM / superadmin           | Configure the platforms & videos once, for all projects           | Maintains the registry + tutorial library in Settings; projects reuse it    |
| Client (external, no account)    | Understand exactly what to create and how to give the team access | Opens a link, watches a short video, follows the steps, marks them done     |
| Team member picking up a project | Know who the client is and how to communicate with them           | Reads the dossier: client type, temperament, IT level — before reaching out |

## Scope — MVP (ranked; each → one or more specs)

1. **Platform registry** (Settings, org-wide). Per platform: name, logo (reuse spec-003 service glyphs), access pattern, ordered steps/instructions, optional linked tutorial video, `critical` flag. Access patterns: (a) **invite-collaborator** — deep link to the client's invite settings + our team email + role to grant; (b) **store-a-key** — client pastes into the project's encrypted env-vars vault (spec 003); (c) **DIY** — video + checklist only. _Foundation for #3._
2. **Tutorials** (new sidebar section). Library of how-to videos; each is an **embed link** (YouTube unlisted primarily; Loom/Vimeo) **or** an uploaded file (Supabase Storage), tagged to a platform, EN/FR, internal by default with an "include on client pages" flag. _Feeds #1 and #3._
3. **Client onboarding / "Setup" page** (per project; the signature feature). A button on the project page creates the page from selected registry platforms; the client opens it via **shared link + passcode** and works a **progress checklist** (pending → client-done → team-verified), each step showing the video (if any) + the access action. Client can mark steps done / request help; the team is notified on completion. Idea: **stack templates** to prefill platforms.
4. **Client dossier** (per project; team-only, sensitive). Contact details + client type + temperament/emotional read + IT-savviness + freeform notes. RLS-restricted to project members/superadmin; never on any client-facing surface.

> Dependency note: #1 and #2 are independent and unblock #3. #4 is fully independent and can land any time (quickest standalone win).

## Constraints

- Reuse, don't reinvent: spec 003 (encrypted env-vars + service logos), spec 006 (client portal token/link-gated surface + its share/passcode model), specs 008/011/014 (roles incl. global PM — who can configure/create), spec 013 patterns. New module per feature under `src/features/`.
- Bilingual EN/FR (next-intl), curly-quote copy rules, the layer/RLS conventions, and "migrations applied to the shared dev/prod Supabase" all still apply.
- Client-facing surfaces must leak nothing sensitive (no env values, no dossier) and must work on mobile.
- Video: prefer embed links to avoid Storage cost/egress; uploads are the fallback.

## Success metrics

- **Onboarding touch time**: median dev time spent explaining/setting up client accounts per project drops sharply (target: from hours of back-and-forth to one link + occasional help).
- **Self-serve rate**: % of onboarding steps completed by the client without a call.
- **Time-to-access**: days from project creation to all required platforms granted.
- **Reuse**: # of projects reusing each registry platform / video (proves the write-once payoff).
- **Coverage**: % of active projects with a Setup page and a filled dossier.

## Open questions

- [ ] Passcode delivery — do we show it to the team to relay manually, or email/SMS it to the client? (default: shown to the team, like the portal link.)
- [ ] "Team verified" — manual checkbox only, or any lightweight signal (e.g. the collaborator invite landing in our inbox)? (default: manual for v1.)
- [ ] Completion notifications — daily report only for v1, or also a direct Slack ping? (Slack auto-posting is currently un-wired.)
- [ ] Does the onboarding page reuse the **same** share link/token as the existing client portal (one client link) or a **separate** link? (lean: separate token, same mechanism.)
- [ ] Dossier "temperament/IT level" — free text only, or a few structured tags + a 1–5 scale? (default: a small scale + tags + notes.)

## Decision log

- 2026-06-24 — Client access to the Setup page = **shared link + passcode** (extends spec-006 token model), not username/password — simpler, nothing new to secure, reuses a proven surface.
- 2026-06-24 — Tutorial videos support **both** embed links and uploads; **YouTube unlisted links are the default** to avoid Storage cost.
- 2026-06-24 — Platform configs live in an **org-wide registry in Settings**, configured once and reused per project.
- 2026-06-24 — **No automated API provisioning**; the flow guides a human. Critical platforms use collaborator invites, never raw credential sharing.
- 2026-06-24 — Build order: **this PRD first, then feature-by-feature** starting from the foundation (registry + tutorials).

## Forward map — first `/create-spec` candidates (ranked)

1. `/create-spec` **Platform registry** (Settings, org-wide) — the foundation.
2. `/create-spec` **Tutorials library** (sidebar + videos) — parallel to #1.
3. `/create-spec` **Client onboarding / Setup page** (per project, link+passcode, checklist) — after 1–2.
4. `/create-spec` **Client dossier** (team-only project info) — independent; can slot in any time.
