# Spec 017 — Client onboarding ("Setup") page

- **Status:** active
- **Type:** feature
- **Requested by / owner:** Achref Arabi, founder
- **Date:** 2026-06-24
- **Slice / areas touched:** new `src/features/setup`; a panel on the project detail page; a public route `/setup/[token]` (passcode-gated); migration (`project_setups` + `setup_steps` + RLS/RPCs). Feature ③ of the epic — see [PRD](../../docs/product/prd-client-onboarding.md). Builds on 006 (portal token model), 015 (platforms), 016 (tutorials).

## Problem (the why)

Specs 015–016 gave us the catalog (platforms) and the videos (tutorials). This feature is the point of the epic: a per-project page the **client** opens to actually set up their production accounts and grant Progix access — guided, tracked, and self-serve, replacing the repeated Slack hand-holding.

## Desired behavior (the what)

On a project, the team opens a **Client setup** panel and **builds the page**: pick which platforms (from the registry) the client must set up, in order, and generate a **share link + passcode** to hand to the client. The panel then shows the link, the passcode, and a **progress view** — each platform as a step the team can mark **verified**, plus a way to **rotate** the link (kills the old one) or disable the page.

The **client** opens the link, enters the passcode, and sees a guided **checklist**. Each step shows the platform, its **tutorial video if one exists and is marked client-visible** (016), and the **action for its access pattern** (015): for _invite-us-as-collaborator_ — a button/link to the platform's invite settings plus the exact team email and role to grant; for _store-a-key_ — instructions for the value to send; for _do-it-yourself_ — just the steps. The client marks each step **done** (or "I'm stuck"). The client never sees anything sensitive (no env values, no internal notes). Bilingual EN/FR.

## Acceptance criteria

- **AC-1 (build the page):** A project member with manage rights can select platforms and create the setup page; it generates a share link + passcode and lists the chosen platforms as ordered steps.
- **AC-2 (client access — gate):** Opening the link requires the correct passcode; a wrong/empty passcode is refused and reveals no project data; a correct passcode shows the checklist. No progixHub account is required for the client.
- **AC-3 (guided steps):** Each step renders its platform's access action (invite link + team email + role / key instructions / DIY steps) and the client-visible tutorial video when one exists; nothing sensitive is shown.
- **AC-4 (two-sided progress):** The client can mark a step done; the team sees per-step status (pending → client-done → verified) and can mark a step verified.
- **AC-5 (rotate/revoke — non-happy):** Rotating or disabling the page invalidates the old link immediately; opening the old link no longer works.
- **AC-6 (no leakage — non-happy):** Without a valid token+passcode, the public route exposes nothing (no project name, platforms, or steps) and the team-only progress/notes are never on the client surface; a signed-out direct fetch is refused.

## Out of scope

- Automated detection that the client really granted access (team marks "verified" manually — spec 015 non-goal).
- Programmatic API provisioning / sending the invite for the client.
- Collecting the client's account passwords (keys go to the spec-003 vault; access is by invite).
- Emailing/SMSing the link or passcode automatically (the team relays it; delivery is a later step).
- Editing platforms/tutorials here (done in their own areas).

## CUJ impact

- Registers a new CUJ — **Client onboarding:** team builds the setup page from platforms → shares link + passcode → client enters passcode → works the checklist (video + invite action) → marks steps done → team verifies; rotating the link kills the old one. (Add to `docs/product/critical-user-journeys.md` at ship.)

## Open questions

Resolved with the owner / in PRD (2026-06-24): access = **shared link + passcode** (extends spec-006 token model, separate token from the portal); progress statuses = pending → client-done → team-verified; "verified" is a manual team action; passcode is shown to the team to relay.

- [ ] Passcode storage — hashed at rest (yes; argon/bcrypt or a salted hash) and rate-limited on the public route; confirm in `/plan-feature`.
- [ ] Should completion notify the team (daily report / Slack) in v1, or is the panel's progress view enough? (default: panel only for v1.)
