# Roles & permissions

**Status:** live · **Slice:** src/features/people (+ `src/lib/auth/roles.ts`, RLS across every slice) · **Routes:** /projects/[id] (People panel)
**Spec history:** specs/008-roles-permissions (shipped 2026-06-10)

## What it does (user terms)

Access matches responsibility. Two **org superadmins** (the owners) see and manage everything. Everyone else has **no access to a project until they're added to it**, and then holds exactly one **per-project role**: PM (runs the project + its people), developer (full content incl. secrets), video editor (documents + portal, but never env-var secrets), or viewer (read-only). Whoever creates a project becomes its PM. The external client stays the account-less share-link role from the portal (unchanged).

## How it works

Authorization is **in the database**, not the UI. The UI hiding is courtesy; the boundary is Postgres.

- **Superadmin** rides in the JWT: `app_metadata.is_superadmin` (set out-of-band via SQL — there is no in-app "make superadmin" button). `is_superadmin()` reads the claim.
- **Per-project roles** live in `project_members(project_id, user_id, role)`. `has_project_access(project, roles[])` = superadmin OR a membership row whose role is in the set — this one helper backs nearly every RLS policy. `my_project_role(project)` returns `'superadmin' | role | null` for the UI to gate on.
- **The capability matrix** (single source: `src/lib/auth/roles.ts` `capabilities(role)`, and ADR-0011):

  | Role            | manage project | manage people | see env vars  | write env vars | write content |
  | --------------- | -------------- | ------------- | ------------- | -------------- | ------------- |
  | Superadmin / PM | ✓              | ✓             | ✓             | ✓              | ✓             |
  | Developer       | —              | —             | ✓             | ✓              | ✓             |
  | Video editor    | —              | —             | **—**         | —              | ✓             |
  | Viewer          | —              | —             | ✓ (keys only) | —              | —             |

- **The project page** (`src/app/projects/[id]/page.tsx`) computes the caller's role once, then only fetches data the role may see and threads `canWrite`/`canManage` flags into each section. A **read-only notice** renders for roles with no write capability so vanished controls read as intentional.
- **The People panel** (`src/features/people/`, PM/superadmin only) adds a member **by email**, changes a role, or removes one — each via a `SECURITY DEFINER` RPC (`set_project_member` / `remove_project_member`) that re-checks authorization server-side.
- **Project creation** goes through the `create_project` RPC (not a direct insert) so the row and the creator's PM membership are seated atomically.

## Decisions & gotchas

- **2026-06-10 — the DB is the boundary (AC-8).** Every forbidden action is rejected by RLS / the RPCs even if the UI is bypassed. When adding a feature to any slice, add its RLS policy keyed to `has_project_access(project, [allowed roles])`; don't rely on the page gate. The 8-assertion live matrix in `src/features/people/roles.integration.test.ts` is the regression net — extend it.
- **2026-06-10 — video editor must never touch env-var secrets.** `env_vars` / `env_var_audit` SELECT and the env-var RPCs exclude `video_editor` deliberately (they can write documents + portal). Don't widen these role-sets without re-reading the spec.
- **2026-06-10 — last-PM guard.** A project must always keep at least one PM (or a superadmin owner). `set_project_member` (demote) and `remove_project_member` both raise `last_pm`; the UI maps it to friendly copy. Don't add a People-mutation path that skips the RPCs.
- **2026-06-10 — `create_project` RPC + no `created_by` carve-out.** An earlier version let the projects-SELECT policy match `created_by = auth.uid()` so a creator could read back a freshly-inserted row. Because `created_by` is immutable, that permanently leaked project metadata to a _removed_ creator (AC-2 violation, caught in review). The fix: create via the RPC (project + PM membership atomic) and gate SELECT on `has_project_access` only. **Don't reintroduce a direct `projects` insert** in app code or tests — use `create_project`, or the read-back breaks and the leak returns.
- **2026-06-10 — `capabilities()` is pure / client-safe.** It lives in `src/lib/auth/roles.ts` with no `server-only` import so client islands can gate on it; `getProjectRole()` (the DB call) lives in `src/lib/auth/session.ts`. Keep that split.
- **2026-06-10 — backfill is one-shot, verified on live data.** Every pre-existing project's creator was seated as PM and Achref stamped superadmin (58/58 creator-owned projects have a PM, 0 PM-less, 1 superadmin). The ongoing mechanism is the `projects_owner_pm` trigger.
- **Out of scope (later):** email invitations to account-less people, an in-app superadmin-granting UI, and a People-change audit log.

## CUJs covered

- [CUJ-07](../critical-user-journeys.md) — a PM manages a project's People (add by email, change role, remove); the per-role enforcement matrix is proven at the DB.
