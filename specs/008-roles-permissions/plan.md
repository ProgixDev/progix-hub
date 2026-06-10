# Plan 008 — Roles & permissions

- **Spec:** [spec.md](spec.md) (all open questions resolved: yes — autonomy grant)
- **Author:** Claude (agent) · **Date:** 2026-06-10

## Approach

Re-key authorization from flat `is_member` to **superadmin (JWT) + per-project role** ([ADR-0011](../../docs/architecture/decisions/0011-roles-and-permissions.md)). One migration adds `project_members` (`role ∈ pm|developer|video_editor|viewer`), two SECURITY DEFINER helpers (`is_superadmin()`, `has_project_access(project, roles[])`), an `AFTER INSERT` trigger making a project’s creator a PM, a backfill (existing creators → PM; Achref → superadmin), and **rewrites every RLS policy** across projects / env*vars / env_var_audit / documents / portal*\* / storage to the capability matrix. The env-var RPCs (003) swap their `is_member` gate for `has_project_access(project, ['pm','developer'])`. People management is two new DEFINER RPCs (`set_project_member`, `remove_project_member`) that resolve email→user via `auth.users`, authorize PM/superadmin, and enforce a **last-PM guard**. A new `people` slice renders the **People panel**; the project page computes the caller’s role (`my_project_role(project)`) and threads capability flags into each section so the UI hides what a role can’t do — while the DB stays the source of truth (AC-8). The hard part is breadth (every feature’s policies) and getting the role-sets exactly right; the integration suite proves them against the live DB.

## Placement (per `docs/architecture/module-boundaries.md`)

| What            | Where                                              | Notes                                                                                                                   |
| --------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Migration       | `supabase/migrations/0006_roles.sql`               | table + helpers + trigger + backfill + ALL policy rewrites + People RPCs                                                |
| Auth helpers    | `src/lib/auth/session.ts`, `src/lib/auth/roles.ts` | add `is_superadmin` to `MemberUser`; `getProjectRole(projectId)` + capability flags (server-only)                       |
| Slice           | `src/features/people/`                             | `data.ts` (member list), `actions.ts` (set/remove via RPC + last-PM), components (People panel), types                  |
| Project page    | `src/app/projects/[id]/page.tsx`                   | compute role → gate sections (env-vars hidden for video_editor; People panel for PM/superadmin) + pass capability flags |
| Existing slices | env-vars / documents / portal components           | accept a `can` capability prop → hide mutation buttons for viewers/forbidden roles (server already enforces)            |
| Portfolio       | `src/features/projects/data.ts`                    | unchanged code — RLS now returns only the caller’s projects                                                             |
| i18n            | `src/messages/{en,fr}.json`                        | `people` + `roles` namespaces                                                                                           |

## Data & state

- **DB:** `project_members` (RLS: members of a project may SELECT its rows; writes via RPCs only). Helpers `is_superadmin()`, `has_project_access()`, `my_project_role()`. RPCs `set_project_member`, `remove_project_member` (PM/superadmin + last-PM guard).
- **Role-sets per policy:** projects SELECT = all 4; projects UPDATE = pm. env_vars SELECT = pm/developer/viewer (NOT video_editor); env-var RPCs = pm/developer. documents/portal SELECT = all 4; their mutations = pm/developer/video_editor. project_members SELECT = all 4; writes = RPC. storage SELECT (documents) = all 4; storage INSERT (documents) = pm/developer/video_editor.
- **Server:** `getProjectRole(projectId)` (server-only, RLS RPC) → `'superadmin'|role|null`; `capabilities(role)` returns `{ manageProject, managePeople, seeSecrets, writeContent }`. The project page passes the relevant flags to each section.
- **People actions:** `setProjectMemberAction(projectId, email, role)` / `removeProjectMemberAction(projectId, userId)` — `requireMember` + zod + RPC; RPC enforces real authz + last-PM.

## Acceptance criteria → verification mapping

| AC                         | Proven by                                                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| AC-1 superadmin all access | integration: a superadmin reads/writes a project they have no membership row on                                                   |
| AC-2 project-scoped (non)  | integration: a member NOT on project X gets 0 rows for projects/env_vars/documents/portal of X · e2e portfolio omits it           |
| AC-3 PM manages People     | unit `people/actions.test.ts` (set/remove call the RPC) · integration: non-PM `set_project_member` raises · e2e add a member      |
| AC-4 dev vs video editor   | integration: developer `reveal_env_var` ok; video_editor `reveal_env_var` + env_vars SELECT both denied; both can write documents |
| AC-5 viewer read-only      | integration: viewer SELECT ok, every mutation (env RPC, documents insert, portal insert, People RPC) raises                       |
| AC-6 creator=PM + backfill | integration: insert a project → a `pm` membership row appears (trigger); migration backfill asserted on live data                 |
| AC-7 can’t orphan          | unit + integration: `remove_project_member`/demote of the last PM raises `last_pm`                                                |
| AC-8 enforced at DB        | the whole integration suite hits the API/RPCs directly (not the UI) — every forbidden path raises or returns 0 rows               |

## Risks & unknowns

- **Breadth / missed policy.** Every table across 5 migrations is re-keyed; a missed policy = an access bug. Mitigation: the integration suite exercises each table per role; `get_advisors` after apply.
- **RLS recursion on `project_members`.** `has_project_access` is SECURITY DEFINER so policies that consult it don’t recurse into `project_members`’ own RLS.
- **Backward compatibility.** Achref must stay fully functional → seeded superadmin; existing projects’ creators → PM. Verified on live data before ship.
- **Storage path-role check.** Document read/upload policies parse the project id from the object path (`split_part(name,'/',1)`); the existing path convention guarantees it.
- **“Add by email” with no account.** Rejected with a clear message (invitations are out of scope).
- **JWT staleness for superadmin/role changes.** A newly-added member’s access depends on `project_members` (queried live, not the JWT) so it’s immediate; only the `is_superadmin` flag rides the JWT (rare, set out-of-band).

## Overlap check

No other spec is `active` (007 shipped). This spec deliberately rewrites the authorization of 002–006; their **behavior** is unchanged for a PM/superadmin (existing CUJs stay green), only the access boundary changes. No feature is being functionally altered — just gated.
