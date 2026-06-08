# Tasks 002 — Sign-in & project registry

Ordered, executable, checkboxed. Work top-to-bottom, tick boxes as you commit, never reorder silently. `[P]` = parallel-safe. Each task names files + a done-check. Keep tasks ≤ ~30 min.

## Phase 0 — setup & infra

- [ ] T0 Branch `feat/002-auth-and-projects`.
- [ ] T1 **Research pass** — run the `supabase` skill for current `@supabase/ssr` + Next 16 RSC auth patterns; note decisions in plan.md. · done: patterns confirmed before any client code.
- [ ] T2 Install `@supabase/supabase-js` + `@supabase/ssr`; flip **ADR-0006** Proposed → Accepted. · done: deps in `package.json`, ADR status updated.
- [ ] T3 Tighten Supabase env in `src/core/env.ts` (required) + document vars; **human:** provision Supabase project, GitHub OAuth app, and `.env` / CI secret. · done: `env.ts` parses; provisioning checklist noted in PR.
- [ ] T4 Supabase client factories `src/lib/supabase/{client,server,admin}.ts`. · done: typecheck; server client reads cookies, admin uses service role (server-only).
- [ ] T5 Migration `supabase/migrations/0001_projects.sql`: `projects` table + **deny-by-default RLS** (member-only select/insert/update, no delete). · done: applies cleanly to a local/test Supabase.

## Phase 1 — auth slice (AC-1, AC-2)

- [ ] T6 `src/features/auth/membership.ts` — pure `isAllowedMember(githubLogin, orgMembership)` decision + `requireMember()` server helper (fetch + cache GitHub org membership). · done: `membership.test.ts` green (member allowed, non-member denied) — **AC-2 unit**.
- [ ] T7 `src/app/auth/callback/route.ts` — OAuth callback: exchange code, run org check, sign out + redirect to access-denied if not a member. · done: non-member is rejected.
- [ ] T8 `src/middleware.ts` — refresh session; redirect signed-out requests to `/sign-in`. · done: protects all app routes.
- [ ] T9 [P] `src/app/sign-in/page.tsx` + `features/auth` sign-in island ("Continue with GitHub") and the access-denied state. · done: renders; button starts OAuth.
- [ ] T10 [P] `signOutAction` + session provider/`useSession` in `features/auth`; export public API via `index.ts`. · done: sign-out clears session.

## Phase 2 — projects slice (AC-3 … AC-6)

- [ ] T11 Scaffold slice: `/new-module projects` (store, provider, actions, types, index, tests). · done: stub renders.
- [ ] T12 `types.ts` + zod schema (name required; status enum; links optional, valid URL if present). · done: schema unit covers blank-name + bad-URL reject — **AC-4 unit**.
- [ ] T13 Store: filter state + create/edit modal + optimistic insert; archive removes from Active filter. · done: `store.test.ts` green — **AC-5 unit (filter)**.
- [ ] T14 `actions.ts`: `createProjectAction` / `updateProjectAction` / `archiveProjectAction` — zod-validated, `requireMember()` authz, write via server client. · done: invalid input returns typed error (AC-4); unauthorized blocked.
- [ ] T15 `data.ts` (server-only): list projects for the member, get one by id. · done: returns typed rows.
- [ ] T16 [P] `components/project-card.tsx` — set links → `<a target="_blank" rel="noopener">`, unset → empty “add” slot; status badge. · done: `project-card.test.tsx` green — **AC-6 unit**.
- [ ] T17 [P] `components/project-form.tsx` — create/edit modal (name, description, status, four links) with inline validation + designed states.
- [ ] T18 [P] `components/project-header.tsx` — name, status, description, four link shortcuts (unset = empty slot).
- [ ] T19 Wire `src/app/page.tsx` to fetch real projects (replace painted-door data) + empty state; `src/app/projects/[id]/page.tsx` renders the header. · done: portfolio shows DB data; empty account shows empty state — **AC-3**.

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
