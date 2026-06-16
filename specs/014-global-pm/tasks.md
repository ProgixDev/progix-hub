# Tasks 014 — Global PM org role

Ordered, checkboxed. Tick on commit. ≤ ~30 min each.

## Phase 1 — core

- [ ] T1 Migration `0017_global_pm.sql`: `is_global_pm()`; extend `has_project_access` (global PM ⇒ 'pm'), `my_project_role` (superadmin > global_pm > membership > lead), `list_org_members` (+`is_global_pm` col) · done: applies; a global-PM principal gets pm access on a membership-less project (AC-1)
- [ ] T2 `src/lib/auth/session.ts`: add `isGlobalPm` to `MemberUser` (read `app_metadata.is_global_pm`) · done: typechecks
- [ ] T3 `members/types.ts`: add `is_global_pm` to `OrgMember`; `standingOf` ⇒ "global_pm" ranked under superadmin · done: `types.test.ts` covers ranking (AC-3)
- [ ] T4 `members/actions.ts`: `setGlobalPmAction` (superadmin-only, admin client, reject superadmin/self target) · done: `actions.test.ts` covers grant + non-superadmin refusal (AC-2/AC-4)
- [ ] T5 Directory + profile: "Global PM" badge + a superadmin toggle (parallel to lead); copy EN/FR · done: renders; superadmin sees the toggle (AC-3)

## Phase 2 — verify & ship

- [ ] T6 `pnpm verify` green
- [ ] T7 Grant Morgane Rebindaine global PM (set the flag on the shared DB)
- [ ] T8 `/review` (appsec: no privilege bleed beyond pm — AC-5); PR; merge; deploy; close out docs

## AC coverage

- [ ] AC-1 → T1 · [ ] AC-2 → T4 · [ ] AC-3 → T3,T5 · [ ] AC-4 → T4 · [ ] AC-5 → T1 (review)
