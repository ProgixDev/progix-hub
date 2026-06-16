# Spec 011 — Org members directory, lead role & GitHub activity

- **Status:** active
- **Type:** feature
- **Requested by / owner:** Achref Arabi, founder
- **Date:** 2026-06-16
- **Slice / areas touched:** new `src/features/members`; `src/lib/auth` (lead role); routes `/members`, `/members/[id]`; sidebar; migration `0011`. Builds on specs 008 + 010.

## Problem (the why)

The org needs one place to see who's in progixHub, what each person can do, and what the developers are actually shipping. Today roles live only per-project and there's no org-wide view of people or their activity. The owner wants a Members area: a directory of everyone, an org-level "lead" who can see every project, and — on each member — a GitHub contribution graph scoped to the org so the team can see what devs do. Project creation should also stop forcing the creator into PM: a developer can spin up their own project and keep their role.

## Desired behavior (the what)

A "Members" item sits in the sidebar next to Projects and Settings, visible to superadmins, leads, and PMs. It opens a directory of every org member showing name, email, and org standing (superadmin / lead / member). A superadmin can promote or demote a member to "lead"; a lead can see every project in the portfolio (read-only) without being added to each one.

Opening a member shows their profile: who they are, their standing, and — when their GitHub is connected and the integration is configured — a contribution graph of their activity within the org's repositories, drawn as the familiar coloured day blocks. When GitHub isn't configured or the member has no linked GitHub, the profile says so instead of breaking.

When anyone creates a project, they keep their role: a developer who creates a project is added to it as a developer (not auto-promoted to PM), and a superadmin isn't added at all. A PM is assigned afterward.

## Acceptance criteria

- **AC-1 (directory + visibility):** Superadmins, leads, and PMs see a Members link and a directory of all org members with their standing; other members don't see the link, and the page refuses non-authorized viewers.
- **AC-2 (lead role):** A superadmin can set/unset a member as lead; a lead can read every project in the portfolio without per-project membership.
- **AC-3 (member profile + GitHub):** Opening a member shows their profile and, when configured + linked, a GitHub contribution graph scoped to the org; when not, a clear "activity unavailable" state — never an error.
- **AC-4 (creator keeps role):** Creating a project adds a non-superadmin creator as a `developer` (not PM); a superadmin isn't added; the project may start with no PM.
- **AC-5 (permission — non-happy):** Promoting to lead and reading the directory are refused server-side for a non-superadmin / non-authorized caller before any privileged call.

## Out of scope

- Editing per-project rosters from here (that stays in the project People panel).
- Live GitHub OAuth re-linking flow; we read the GitHub login already captured at sign-in.
- Commit-level detail, PR review stats, or non-org activity.

## CUJ impact

- Registers a new CUJ — Manage org members: open Members → see the directory → set a lead → open a member → view their org GitHub activity. Add the row to `docs/product/critical-user-journeys.md` at ship.

## Open questions

Resolved with the owner: the four founding emails are superadmins; leads see all projects (read-only); project creators keep their role; GitHub activity is org-scoped and read from the member's linked GitHub login, behind a configured integration token.
