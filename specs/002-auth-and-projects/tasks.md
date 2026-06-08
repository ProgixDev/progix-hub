# Tasks 002 — Sign-in & project registry

Ordered, executable, checkboxed. Work top-to-bottom, tick boxes as you commit, never reorder silently. `[P]` = parallel-safe. Each task names files + a done-check. Keep tasks ≤ ~30 min.

## Phase 0 — setup & infra

- [x] T0 Branch `feat/002-auth-and-projects`.
- [x] T1 **Research pass** — `@supabase/ssr` confirmed: `getAll/setAll` cookies (+ `headers` arg), `getClaims()` for server auth checks, legacy anon/service keys valid through 2026, `middleware.ts` still supported in Next 16. Org membership via GitHub at callback → stamp `app_metadata.is_member`.
- [x] T2 Installed `@supabase/supabase-js` + `@supabase/ssr`; ADR-0006 → Accepted.
- [x] T3 `src/core/env.ts`: service-role secret (optional at parse, asserted at call); `.env.example` documents the shape; `.env.local` set by human; Supabase project provisioned + MCP connected.
- [x] T4 Supabase client factories `src/lib/supabase/{client,server,admin}.ts` (browser, server-cookies, service-role admin).
- [x] T5 `projects` table + deny-by-default RLS applied to the live DB (member-only select/insert/update, no delete); security advisors clean; saved as `supabase/migrations/0001_projects.sql`.

## Phase 1 — auth slice (AC-1, AC-2)

- [x] T6 `features/auth/membership.ts` — pure `isAllowedMember` + `fetchOrgMembership`; `session.ts` `requireMember`/`getCurrentUser` (getClaims + app_metadata). `membership.test.ts` green — **AC-2 unit**.
- [x] T7 `src/app/auth/callback/route.ts` — exchange code, GitHub org check, stamp `app_metadata.is_member` + refresh, or sign out → `?error=access_denied`.
- [x] T8 `src/middleware.ts` + `lib/supabase/middleware.ts` — session refresh; signed-out → `/sign-in` (public: /sign-in, /auth).
- [x] T9 `src/app/sign-in/page.tsx` + `SignInButton` island ("Continue with GitHub", read:org) + access-denied state.
- [x] T10 `signOutAction` + `UserMenu` island; public API via `index.ts`.

## Phase 2 — projects slice (AC-3 … AC-6)

- [x] T11 Projects slice scaffolded (store + provider, actions, data, types, lib, components, index, tests).
- [x] T12 `types.ts` + zod schema; `types.test.ts` green — **AC-4 unit** (blank-name + bad-URL reject, empty links → undefined).
- [x] T13 Store: filter + create/edit modal; `filterProjects` helper; `store.test.ts` green — **AC-5 unit (filter)**.
- [x] T14 `actions.ts`: create/update/archive — zod-validated, `requireMember()` authz, server-client write, revalidatePath.
- [x] T15 `data.ts` (server-only): `listProjects` / `getProject`.
- [x] T16 `components/project-card.tsx` — set links → new-tab anchors, unset → non-link slot; `project-card.test.tsx` green — **AC-6 unit**. (Fixed RTL cleanup in `vitest.setup.ts`.)
- [x] T17 `components/project-form.tsx` — create/edit modal with inline field errors.
- [x] T18 `components/project-detail.tsx` — header: name, status, description, four surface shortcuts (set → anchor, unset → “Add …” slot), Edit + Archive.
- [x] T19 `src/app/page.tsx` (real portfolio + empty state) + `src/app/projects/[id]/page.tsx` (detail); shell shows the signed-in user (UserMenu) — **AC-3**. Root `loading.tsx`/`error.tsx` added.

## Phase 3 — verification

- [ ] T20 `e2e/auth.spec.ts` — signed-out → `/sign-in` redirect from `/` and `/projects/<id>`; seeded non-member → access-denied. · done: **AC-1, AC-2 e2e** green.
- [ ] T21 Playwright `globalSetup` seeds a test member + `storageState` (no real OAuth); `e2e/projects.spec.ts` (CUJ-02) — empty → create → reload → edit → archive, with `shot()` captures. · done: `FEATURE=002-auth-and-projects pnpm e2e:shots` green — **AC-3, AC-5, AC-6 e2e**.
- [ ] T22 Run `/verify-ui` — inspect sign-in, portfolio (empty + populated), create modal, project header vs the approved mockups; fix what you see.
- [ ] T23 `pnpm verify` green; conventional commit history.

## Phase 4 — review & ship

- [ ] T24 Run `/review` — **AppSec is mandatory** (RLS, authz on every action, secret handling, OAuth callback); fix P0/P1.
- [ ] T25 `/feature-report` → `docs/reports/002-auth-and-projects.md`.
- [ ] T26 Open PR (template filled; spec + plan + report linked).
- [ ] T27 After merge: `/update-docs` — feature doc, CUJ table (extend CUJ-01, register CUJ-02), specs index → shipped.

## AC coverage (mirror of plan.md — keep ticked in sync)

- [ ] AC-1 → T8, T20 · [ ] AC-2 → T6, T7, T20 · [ ] AC-3 → T13, T19, T21 · [ ] AC-4 → T12, T14 · [ ] AC-5 → T13, T21 · [ ] AC-6 → T16, T21
