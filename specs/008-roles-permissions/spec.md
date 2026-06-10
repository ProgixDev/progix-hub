# Spec 008 — Roles & permissions

- **Status:** draft
- **Type:** feature
- **Requested by / owner:** Achref Arabi (owner)
- **Date:** 2026-06-10
- **Slice / areas touched:** new `src/features/people` (per-project member/role management) + a `project_members` table; **changes RLS/authorization across specs 002–006** (projects, env vars, documents, portal) and their server actions / SECURITY DEFINER RPCs; a superadmin flag in `app_metadata`; the project page (a “People” panel) and the portfolio (a member only sees projects they’re on).

## Problem (the why)

Today permissions are flat: any signed-in Progix org member can do anything to any project — reveal every secret, edit every document, delete anyone’s work. As the team grows (devs, PMs, video editors) and projects multiply, that’s neither safe nor sane: a video editor shouldn’t see API secrets, and someone off a project shouldn’t see it at all. The owner wants real, enforced roles — a superadmin tier for the org owners plus per-project roles — so access matches responsibility.

## Desired behavior (the what)

**Two tiers.**

- **Superadmin** (org-level): the org owners. A superadmin has full control over everything — every project, all content, and the ability to manage all people and roles. They bypass per-project checks. (Achref is seeded as superadmin; Ilyes becomes one too.)
- **Per-project roles**: a signed-in org member has **no access to a project until added to it**. On each project a member holds exactly one role:
  - **PM** — manages the project (edit/archive it), manages its **People** (add/remove members, set roles), and has full content access.
  - **Developer** — full **content**: env vars (add/edit/delete **and reveal/copy** secrets), documents, and the client portal. Cannot manage People or the project itself.
  - **Video editor** — **documents** and the **client portal** (cards, blocks, share link), but **no access to env-var secrets** (cannot list, reveal, add, or edit them). Cannot manage People.
  - **Viewer** — read-only: can see the project, its env-var _keys_ (never values), documents, and portal, but cannot change anything.

**Whoever creates a project becomes its PM.** Each project has a **People** panel where a PM (or a superadmin) adds a member **by email**, sets or changes their role, or removes them. Forbidden actions don’t just hide — they’re **rejected by the server** even if attempted directly. The **client** stays the external, account-less portal role from spec 006 (view + comment via the share link) — unchanged.

**Backward compatible:** existing members keep working — Achref is a superadmin (sees/does everything), and every existing project’s creator is backfilled as its PM.

## Acceptance criteria

- **AC-1 (superadmin):** Given a superadmin, when they open the app, then they see and can fully act on **every** project (content + People), with no per-project membership required.
- **AC-2 (project-scoped visibility — non-happy):** Given a signed-in member who is **not** on project X, when they load the portfolio or project X’s URL, then project X is **not listed** and its detail/data is **not returned** (no env vars, documents, or portal) — they’re bounced like a non-member.
- **AC-3 (PM manages People):** Given a PM (or superadmin) on a project, when they add a member by email and assign a role (or change/remove a role), then that member gains exactly that role’s access; a non-PM, non-superadmin sees no People-management controls and the server rejects any such attempt.
- **AC-4 (developer ≠ secrets-for-editors):** Given a **developer**, they can reveal/copy/add/edit env-var secrets, documents, and portal content. Given a **video editor**, they can edit documents + portal content but **every env-var-secret action (list values, reveal, add, edit) is rejected by the server** — not just hidden.
- **AC-5 (viewer read-only — non-happy):** Given a **viewer**, when they attempt any mutation (add a variable, reveal a secret, edit a document, change a portal card, manage People), then the server rejects it; they can still read what their role allows.
- **AC-6 (creator becomes PM + backfill):** Given a member creates a new project, then they’re its PM. Given the migration runs, then every pre-existing project’s creator is its PM and Achref is a superadmin — nothing that worked before breaks for them.
- **AC-7 (can’t orphan a project — non-happy):** Given a project with exactly one PM, when someone tries to remove or demote that last PM, then it’s rejected with a clear message (a project must always have at least one PM or a superadmin owner).
- **AC-8 (enforced at the data layer):** Given any forbidden action attempted directly against the API/RPCs (bypassing the UI), then RLS / the SECURITY DEFINER functions reject it — authorization is in the database, not only the client.

## Out of scope

- **Custom/granular permissions** beyond the four project roles + superadmin (no per-action toggles, no custom roles).
- **Multiple roles per person per project** (exactly one role each).
- **Invitations/emails to people without an account** — adding by email assumes the person is (or will be) a signed-in org member; no email is sent (a later enhancement). Adding an email with no matching account is recorded as pending or rejected (plan.md decides).
- **Org-admin UI for granting superadmin** — superadmin is set out-of-band (SQL/seed) for now; no in-app “make superadmin” button.
- **Changing the client/portal trust model** (spec 006) — clients remain account-less share-link users.
- **Audit of permission changes** beyond what already exists — a People-change log is a later enhancement.

## CUJ impact

- Registers **CUJ-07** — Roles: a PM adds a video editor to a project → the editor can edit documents but is blocked from revealing a secret → a viewer can read but not mutate. (Screenshots `people-*`.) Existing CUJs (02–06) continue to pass for a PM/superadmin.

## Open questions

_None blocking — the matrix above is baked in per the owner’s autonomy grant. Left to `plan.md`: where superadmin lives (`app_metadata.is_superadmin` vs a table), how “add by email” resolves to a user id (and what happens for an email with no account yet), and the exact RLS helper (`project_role(project_id)` SECURITY DEFINER) shape. Deferred: email invitations, a People-change audit log, in-app superadmin granting._
