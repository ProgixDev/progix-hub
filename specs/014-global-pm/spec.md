# Spec 014 — Global PM org role

- **Status:** shipped
- **Type:** feature
- **Requested by / owner:** Achref Arabi, founder
- **Date:** 2026-06-16
- **Slice / areas touched:** `src/lib/auth` (role helpers), `src/features/members` (standing + a superadmin toggle); migration (new `is_global_pm` JWT flag + updated `has_project_access` / `my_project_role` / `list_org_members`). Builds on specs 008 + 011.

## Problem (the why)

Some people manage the whole portfolio, not one project. Today PM is strictly per-project, so a portfolio-wide PM has to be added to every project by hand and is missed on new ones. The owner wants a single "global PM" who is automatically PM on every project, current and future — the same shape as the existing org-wide "lead", but with PM (write) access rather than read-only.

## Desired behavior (the what)

A **global PM** is an org-wide standing (like superadmin and lead) carried in the member's account, not per project. A global PM has **PM-level access to every project automatically** — including projects created later — without being added to each one: they can open any project, manage its env vars, documents, people, and edit it, exactly as a project's own PM can. They rank below superadmin and above lead; an explicit per-project role is never _reduced_ by being a global PM.

A **superadmin can grant or revoke** global-PM standing from the Members directory (the same place they set "lead"). The Members directory and a member's profile show "Global PM" as that person's standing.

## Acceptance criteria

- **AC-1 (access everywhere):** A global PM can read every project and perform PM actions (edit project, manage env vars / documents / people) on any project — including one created after they were made global PM — with no per-project membership.
- **AC-2 (grant/revoke):** A superadmin can set and unset a member as global PM from the directory; the change takes effect on the member's next authenticated request.
- **AC-3 (standing shown):** The directory and profile show "Global PM" standing for such a member (ranked superadmin > global PM > lead > member).
- **AC-4 (permission — non-happy):** A non-superadmin cannot grant/revoke global PM; the action is refused server-side before any change.
- **AC-5 (no privilege bleed — non-happy):** Global PM grants PM access only — never superadmin-only abilities (e.g. it cannot create members, change roles to/from superadmin, or bypass the superadmin-only guards).

## Out of scope

- A per-project "PM of just these projects" multi-select (this is all-or-nothing, org-wide).
- Changing what a normal project PM can do.
- Auto-seating the global PM into `project_members` rows (access is virtual, via the role check — not a roster row).

## CUJ impact

- Extends CUJ-07 (Manage people) — a superadmin can additionally toggle "Global PM". No new CUJ; covered by the roles e2e + the DB role tests.

## Open questions

Resolved with the owner (2026-06-16): org-wide all-projects (incl. future); superadmin grants it; ranks below superadmin, above lead. First grantee: Morgane Rebindaine.
