# Spec 006 — Client portal (blocks, feature cards & share link)

- **Status:** draft
- **Type:** feature
- **Requested by / owner:** Achref Arabi (owner)
- **Date:** 2026-06-10
- **Slice / areas touched:** new `src/features/portal`, routes `/projects/[id]/portal` (member) and `/share/[token]` (public, token-gated); middleware public-path list; new DB tables + storage bucket; i18n catalogs (new strings EN/FR).

## Problem (the why)

Clients have no window into their project: they can’t see what’s been delivered, react to it, or hand the team a file without DMs and email threads. The PRD’s MVP #4 called for a feedback page; the owner evolved it (2026-06-10) into a richer shared playground: the team showcases the work as organized cards, and the client responds in place — comments, files, and feature proposals — without needing an account. Everything else in progixHub is member-gated, so this is the product’s first external surface and must be safe by construction.

## Desired behavior (the what)

**Team side (signed-in members).** A project gets a **Portal** page. Members create named **blocks** (e.g. “App”, “Backend”, “Website”) and fill them with **feature cards** — title, short description, and a status: **Delivered · In progress · Planned · Proposed**. Members can edit a card, change its status (e.g. accept a client proposal by moving it to Planned), and archive cards or blocks. Members manage the **share link**: create it, copy it, **rotate** it (old link stops working, new one issued), or **revoke** it (portal goes dark for the client). Client activity — comments, attached files, proposals — shows up on the same cards, clearly marked as from the client.

**Client side (no account).** Opening the share link shows a clean, branded page with the project name and the blocks/cards exactly as the team arranged them. The client can: **read everything**, **comment** on any card (with a display name they type once), **attach a file** to a card (same file types as documents, smaller cap), and **propose a feature** — a short form whose submission appears as a new card with the **Proposed** badge for the team to triage. The client cannot edit or delete anything, cannot see any other project, and never sees env vars, documents, or any member-only surface. A revoked or rotated-away link shows a friendly “this link is no longer active” screen — never an error dump.

**Abuse safety.** The link is unguessable. Submissions are rate-limited and size-capped; files are type-whitelisted; a hidden honeypot field silently drops bots. Nothing a client submits can execute in anyone’s browser (text is rendered inert; files download, never render inline).

## Acceptance criteria

- **AC-1 (blocks & cards):** Given a member on a project’s Portal page, when they create a block and add a feature card (title, description, status), then both appear, and the card’s status can be changed and the card edited or archived.
- **AC-2 (share link lifecycle):** Given a member, when they create the share link, then an unguessable URL is shown and copyable; **rotate** invalidates the old URL and issues a new one; **revoke** makes any link show the “no longer active” screen.
- **AC-3 (client views):** Given a client opening a valid share link, then they see the project name, blocks, and cards with statuses — and nothing else of the app (no nav into member surfaces).
- **AC-4 (client comments):** Given a client on a card, when they submit a comment with a display name, then it appears on the card for both client and members, attributed to that name and marked as client-authored.
- **AC-5 (client attaches a file):** Given a client on a card, when they attach an allowed file (PDF/DOCX/image/ZIP ≤ 10 MB), then it appears on the card and a member can download it; a disallowed or oversized file is rejected with a clear message and nothing is stored.
- **AC-6 (client proposes a feature):** Given a client, when they submit a proposal (title + description), then a new card appears with status **Proposed**, visible to both sides, and a member can accept it (change status) or archive it.
- **AC-7 (security boundary — non-happy):** Given an invalid, rotated-away, or revoked token, when anyone opens the share URL, then they get the “no longer active” screen and **no project data**; and a client token can never read or write another project’s portal, nor any member-only data (env vars, documents).
- **AC-8 (abuse guards — non-happy):** Given a burst of rapid submissions on one link, then writes beyond the rate limit are rejected with a friendly message; the honeypot silently drops bot submissions; client text renders inert (no script execution).
- **AC-9 (member gate):** Given a signed-out visitor, when they open `/projects/…/portal`, then they are redirected to sign-in — while `/share/…` remains reachable without an account.

## Out of scope

- Client **accounts**, login, or per-client identity beyond a typed display name.
- **Email notifications** on new comments/proposals (future enhancement).
- Threaded replies, reactions, mentions, or editing/deleting one’s own client comment.
- Realtime/live updates — refresh-based is fine.
- Client-side translations toggle beyond the app default (the share page renders in the app’s default language; full client-facing language switcher can come later).
- Multiple concurrent share links per project, per-link permissions, or expiry dates (one active link, revocable/rotatable).
- Any change to the member-side documents/env-vars features.

## CUJ impact

- Registers **CUJ-06** — Share the portal: member creates blocks/cards + a share link → client opens it, comments, attaches a file, proposes a feature → member sees it all and accepts the proposal. (Screenshots `portal-*`.)

## Open questions

_None blocking — decisions baked in per the owner’s autonomy grant: one revocable/rotatable link per project; client cap 10 MB with the documents whitelist; no client accounts; proposals land as Proposed cards. Genuinely open for later: client-facing language toggle, email notifications on client activity._
