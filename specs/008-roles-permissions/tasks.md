# Tasks 008 — Roles & permissions

Ordered, checkboxed. `[P]` = parallel-safe. Tick on commit. The migration is the heart — get the role-sets exactly right.

## Phase 0 — the data layer (the whole enforcement model)

- [x] T0 Branch `feat/008-roles-permissions` (exists); ADR-0011 written + indexed · done: `pnpm check:docs` green
- [x] T1 Migration `0006_roles.sql` part A: `project_members` table + RLS (members SELECT own-project rows); helpers `is_superadmin()`, `has_project_access(project, roles[])`, `my_project_role(project)`; `AFTER INSERT` trigger on `projects` → creator = PM · done: applied via MCP
- [x] T2 Migration part B: **rewrite RLS** — projects (SELECT all-roles / UPDATE pm), env*vars + env_var_audit (SELECT pm/developer/viewer), documents (SELECT all / write pm-dev-video), portal*\* (SELECT all / write pm-dev-video), project_members; storage policies (project-documents + portal-attachments) → path-project role checks · done: advisors clean
- [x] T3 Migration part C: env-var RPCs (create/update/delete/reveal) gate `has_project_access(project,['pm','developer'])`; People RPCs `set_project_member(project,email,role)` + `remove_project_member(project,user)` (PM/superadmin + **last-PM guard**), email→user via auth.users, anon no execute · done: applied
- [x] T4 Migration part D: **backfill** — every existing project’s `created_by` → `pm` row; Achref (`achrefarabi414@gmail.com`) → `app_metadata.is_superadmin=true` · done: verified on live data (Achref superadmin, projects have a PM)

## Phase 1 — server auth helpers

- [x] T5 `src/lib/auth/session.ts`: add `isSuperadmin` to `MemberUser`/claims read · done: typecheck
- [x] T6 `src/lib/auth/roles.ts` (server-only): `getProjectRole(projectId)` (RPC `my_project_role`) + `capabilities(role)` → `{ manageProject, managePeople, seeSecrets, writeContent, read }` + `roles.test.ts` (matrix) · done: green

## Phase 2 — People slice + UI gating

- [x] T7 `src/features/people/`: `types.ts` (role enum + zod), `data.ts` (list project members + emails via a SECURITY DEFINER read or admin join), `actions.ts` (`setProjectMemberAction`/`removeProjectMemberAction` → RPC) + `actions.test.ts` (authz, last-PM, bad email) · done: green
- [x] T8 `people` components: `people-panel.tsx` (member list + role badges), `add-member-form.tsx` (email + role select), per-row role select + remove; gated to PM/superadmin · done: `people-panel.test.tsx`
- [x] T9 `src/app/projects/[id]/page.tsx`: compute role; render People panel for PM/superadmin; **hide the env-vars section for video_editor**; pass capability flags to env-vars/documents/portal sections · done: sections gate correctly
- [x] T10 [P] Gate mutation buttons by capability in env-vars / documents / portal / project-detail components (hide add/edit/reveal/delete/archive for viewers & forbidden roles) · done: viewer sees read-only
- [x] T11 i18n: `people` + `roles` namespaces EN+FR · done: parity test green

## Phase 3 — verification

- [x] T12 Integration `src/features/people/roles.integration.test.ts`: provision a superadmin + a member-per-role on a project; assert the FULL matrix at the DB (AC-1..AC-8 — project-scope, dev-vs-video secrets, viewer read-only, last-PM, backfill trigger) · done: `pnpm test:integration` green
- [x] T13 E2E `e2e/roles.spec.ts` (CUJ-07): PM opens People → adds a member + sets a role → the People panel reflects it; (superadmin seeded session covers the rest). `shot()` `people-*` · done: full e2e suite green
- [x] T14 `/verify-ui 008` + `pnpm verify` green · done: screenshots eyeballed

## Phase 4 — review & ship

- [x] T15 `/review` — appsec + frontend + qa + ux board run. No P0s. Fixed: AppSec P1 (projects-read carve-out leaked metadata to a removed creator → `create_project` DEFINER RPC + narrowed SELECT policy, migration `0008`, AC-2 regression test); QA P1 (`changeMemberRoleAction` unit coverage; AC-6 backfill verified on live data: 58/58 creators seated as PM, 0 PM-less projects, owner=superadmin); UX P1 (read-only notice for downgraded roles); a11y P2s (aria fallbacks, field-error `role="alert"`/`aria-describedby`). Logged follow-ups: app-wide `window.confirm` → styled dialog, role badges · done: `pnpm verify` + 24 integration + 17 e2e green, advisors clean
- [x] T16 `/feature-report 008` · done: `docs/reports/008-roles-permissions.md` (AC→evidence table, screenshots, follow-ups); `pnpm check:docs` green
- [x] T17 PR #16 merged (squash) → `main`; CI green (verify + e2e + review); `vercel --prod` deployed READY; prod smoke green (`/`→307, `/sign-in`·`/manifest`·`/api/health`→200); Achref verified superadmin+member on the shared DB → full access · done
- [x] T18 `/update-docs` — `docs/product/features/roles-permissions.md` written; feature index + CUJ-07 registered; specs index → shipped; superseding notes added to env-vars/documents/client-portal docs; `pnpm check:docs` + `check:typography` green; prod test data cleaned (64 E2E/IT projects deleted, real data intact); Notion hub + memory updated · done

## AC coverage

- [x] AC-1 → T1,T2,T12 · [x] AC-2 → T2,T12,T13,T15 · [x] AC-3 → T3,T7,T8,T12,T13 · [x] AC-4 → T2,T3,T12
- [x] AC-5 → T2,T3,T10,T12 · [x] AC-6 → T1,T4,T12,T15 · [x] AC-7 → T3,T7,T12 · [x] AC-8 → T2,T3,T12
