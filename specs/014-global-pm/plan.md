# Plan 014 — Global PM org role

- **Spec:** [spec.md](spec.md) (all open questions resolved: yes)
- **Author:** Claude (Opus 4.8) · **Date:** 2026-06-16

## Approach

Mirror the existing "lead" role exactly, one rung higher in access. Add a JWT flag `app_metadata.is_global_pm` and a SQL `is_global_pm()` helper (like `is_lead()`). Make a global PM count as a project PM everywhere by extending the two role gates: `has_project_access(project, roles)` returns true when `is_global_pm() and 'pm' = any(roles)`, and `my_project_role()` returns `'pm'` for a global PM (ranked below superadmin, above an explicit membership/lead). Because every table's RLS and the env-var/people/project RPCs already gate on `has_project_access(..., array['pm'])`, this single change grants PM access across all projects — current and future — with no roster rows. Grant/revoke reuses the spec-011 pattern: a superadmin-only server action calling the admin client to stamp `app_metadata.is_global_pm`. Surface "Global PM" standing by adding `is_global_pm` to `list_org_members` + the `OrgMember` type + `standingOf`. No new dependency, no boundary change → no ADR.

## Placement

| What         | Where                                              | Notes                                                                                   |
| ------------ | -------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Role helpers | migration `0017_global_pm.sql`                     | `is_global_pm()`, updated `has_project_access` + `my_project_role` + `list_org_members` |
| Grant/revoke | `src/features/members/actions.ts`                  | `setGlobalPmAction` (superadmin-only, admin client)                                     |
| Standing     | `src/features/members` types + directory + profile | add `global_pm` standing + badge + toggle button                                        |
| Session      | `src/lib/auth/session.ts`                          | expose `isGlobalPm` on `MemberUser` (parity with isLead)                                |

## Data & state

- **Server:** `list_org_members` gains an `is_global_pm` column; `getCurrentUser` reads `app_metadata.is_global_pm`.
- **Actions:** `setGlobalPmAction({ userId, makeGlobalPm })` — superadmin-gated (reuses the spec-011 guard), admin client stamps the flag, can't target a superadmin, can't self-target; result objects.
- **Authz:** all enforcement is the two SQL role functions + the existing RLS that calls them.

## Acceptance criteria → verification mapping

| AC   | Proven by                                                                                                                                                                           |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1 | DB role tests: a global-PM principal passes `has_project_access(any, ['pm'])` and `my_project_role` = 'pm' on a project with no membership                                          |
| AC-2 | unit: `actions.test.ts` — superadmin grant/revoke calls the admin client with the flag                                                                                              |
| AC-3 | unit: `types.test.ts` `standingOf` ranks superadmin > global_pm > lead > member; directory/profile render the badge                                                                 |
| AC-4 | unit: `actions.test.ts` — a non-superadmin is refused before the admin client is touched                                                                                            |
| AC-5 | reasoning + the unchanged superadmin-only guards (set_project_member rejects superadmin targets; create-member stays superadmin-only) — global PM only satisfies `'pm'` role checks |

## Risks & unknowns

- **Over-grant via `has_project_access`** — the change only adds the `'pm'`-in-roles branch, so a global PM gains exactly PM rights, never superadmin paths (which check `is_superadmin()` directly). Verified against each RPC's guard.
- **JWT staleness** — the flag lands on the next token refresh/sign-in (same as `is_lead`); acceptable and documented.

## Overlap check

Active spec **013** (just merged) and **011/008** (shipped) touch `members` + `lib/auth`. 014 extends the same role model additively (new flag + standing); no conflicting edits. Resolution: **no coordination needed** — forward-only on main.
