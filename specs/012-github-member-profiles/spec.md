# Spec 012 — GitHub member profiles & sign-in

- **Status:** shipped
- **Type:** feature
- **Requested by / owner:** Achref Arabi, founder
- **Date:** 2026-06-16
- **Slice / areas touched:** `src/features/members` (commit list, personal profile), `src/features/auth` (GitHub OAuth sign-in + identity linking), `src/lib/auth`; routes `/members`, `/members/[id]`, new `/profile`; Supabase GitHub OAuth provider + env `GITHUB_TOKEN` / `GITHUB_ORG_ID`; migration to persist `github_login`. Builds on specs 010 + 011.

## Problem (the why)

Spec 011 shipped a Members directory and a profile page with an org-scoped contribution graph, but it is inert: nobody has a linked GitHub account (spec 010 made sign-in email/password, which captures no GitHub username), the contribution API was never configured, the GitHub login is display-only, and there is no commit-level detail. So the org still can't see what its developers are actually shipping — the whole reason the Members area exists. The owner wants members to connect their GitHub, sign in with it, and have everyone in the org see each person's real activity.

## Desired behavior (the what)

A member can **connect their GitHub account** from their profile: a "Connect GitHub" action runs a GitHub authorization flow and, on return, the member's GitHub username is stored and shown on their profile. GitHub also becomes a **third way to sign in** alongside email and password — but only for people who are already org members; a GitHub login that doesn't match a known member account is refused, never silently creating an account.

Every signed-in member has a **personal profile** at `/profile` showing who they are, their org standing, their connected GitHub (or a "Connect GitHub" prompt if not yet linked), their contribution graph, and a list of their recent commits. The **Members directory and every member profile are visible to everyone in the org** (not just superadmins/leads/PMs as in spec 011) — the org is transparent about activity.

On any profile, when GitHub is connected and the integration is configured, the **contribution graph renders** (the coloured day blocks, org-scoped) and a **commit list** shows the member's commits across all of the org's repositories for the current year, most recent first. When GitHub isn't connected, isn't configured, or returns nothing, each section shows a clear empty/unavailable state — never an error.

## Acceptance criteria

- **AC-1 (connect GitHub):** A signed-in member can start "Connect GitHub", authorize, and return to their profile with their GitHub username stored and displayed; the link is to their existing account (identity link), not a new account.
- **AC-2 (GitHub sign-in, members only):** A member whose GitHub identity maps to an existing org-member account can sign in with GitHub; a GitHub login with no matching member account is refused with a clear message and creates no account and no session.
- **AC-3 (personal profile):** `/profile` shows the signed-in member's identity, standing, connected GitHub (or a connect prompt), contribution graph, and commit list — without navigating through the directory.
- **AC-4 (org-wide visibility):** Any signed-in member can open the Members directory and any member's profile and see that member's GitHub activity; a signed-out visitor is refused.
- **AC-5 (contribution graph + commits):** When configured and the member is linked, the profile renders the org-scoped contribution graph and a list of the member's commits in the org's repos for the current year, newest first.
- **AC-6 (graceful gaps — non-happy):** When the integration is unconfigured, the member has no linked GitHub, or GitHub returns an error/empty, the activity and commit sections show a clear unavailable/empty state and the page still renders — never a crash or error page.
- **AC-7 (link conflict — non-happy):** Attempting to connect a GitHub identity that is already linked to a different member is refused with a clear message and changes no data.

## Out of scope

- PR review stats, issues, or non-commit GitHub activity.
- Activity outside the org's repositories, or outside the current year.
- Editing another member's GitHub link (each member connects their own; superadmin assignment is not in this spec).
- Real-time commit streaming or webhooks — data is fetched on page load.

## CUJ impact

- Registers a new CUJ — **Member GitHub profile:** sign in → open `/profile` → Connect GitHub → see your contribution graph and commits → open another member from the directory and see theirs. (Spec 011's Members area has no CUJ row yet; this spec adds it. Update `docs/product/critical-user-journeys.md` at ship.)

## Open questions

Resolved with the owner (2026-06-16): visibility is org-wide; commits cover all org repos for the current year; GitHub is a sign-in method in addition to email/password and also links the username; connection is self-service per member.

Resolved in planning (2026-06-16): **token model** — all activity reads (contribution graph + commit list) use a single server-side `GITHUB_TOKEN` (org-read PAT / GitHub App token) plus `GITHUB_ORG_ID`. Per-user OAuth tokens are used only transiently to verify org membership at sign-in (existing, spec 002) and to capture `github_login` at connect time; they are never persisted. Rationale: provider tokens aren't durably stored and expire; one org-scoped server token is simpler, more secure, and gives consistent org-scoped visibility. Trade-off: private-repo activity is visible only within that token's scope (acceptable — org-scoped is the intent).
