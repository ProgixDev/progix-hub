# Plan 002 — Sign-in & project registry

- **Spec:** [spec.md](spec.md) (all open questions resolved: yes — e2e auth strategy decided below)
- **Author:** Claude (agent) · **Date:** 2026-06-08

## Approach

Wire Supabase (the data layer from **ADR-0006**) for the first time: GitHub OAuth, an app-wide middleware gate, and a `projects` table behind Row-Level Security. Two feature slices — `auth` (session + org check + sign-in UI) and `projects` (CRUD + portfolio) — composed in `app/`; they never import each other. Server Components fetch projects; a small client store holds only UI state (active filter + the create/edit modal + optimistic insert). The key trade-off: we gate access in **two** places on purpose — middleware for the redirect (UX) **and** RLS + a server-side org check for the real authorization (security), because middleware is not a security boundary. Supabase SSR auth patterns move fast, so implementation does a **2026 research pass via the `supabase` skill** before writing the client factories. Installing `@supabase/supabase-js` + `@supabase/ssr` is anchored by ADR-0006 (flip it Proposed → Accepted in this feature).

**e2e auth strategy (resolves the spec's open question):** real GitHub OAuth is not CI-testable. Playwright `globalSetup` seeds a test member via the Supabase admin API (service-role, test project) and writes a signed-in `storageState`; specs reuse it — no real GitHub. AC-2 (non-member denied) is proven by a **unit test on the pure org-membership decision** (mock the GitHub membership response at the boundary) plus an e2e using a seeded "not allowed" session.

## Placement (per `docs/architecture/module-boundaries.md`)

| What                      | Where                                                                                                                                       | Notes                                                                                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Supabase client factories | `src/lib/supabase/{client,server,admin}.ts`                                                                                                 | shared infra; reads env from `core`; no domain knowledge                                                                                                   |
| Env vars (Supabase)       | `src/core/env.ts` (+ `.env.example` — human)                                                                                                | tighten the existing `.optional()` Supabase vars to required                                                                                               |
| Auth slice                | `src/features/auth/`                                                                                                                        | session provider, `requireMember()` server helper, org check, sign-in island, `signOutAction`                                                              |
| Projects slice            | `src/features/projects/`                                                                                                                    | store + provider, `actions.ts` (create/update/archive), server `data.ts` (list/get), `ProjectCard`, `ProjectForm`, `ProjectHeader`, `types.ts`, `index.ts` |
| App-wide auth gate        | `src/middleware.ts`                                                                                                                         | refresh session, redirect signed-out → `/sign-in`                                                                                                          |
| Routes                    | `src/app/sign-in/page.tsx`, `src/app/auth/callback/route.ts`, `src/app/page.tsx` (portfolio RSC), `src/app/projects/[id]/page.tsx` (header) | thin RSC composition + OAuth callback handler                                                                                                              |
| DB migration              | `supabase/migrations/0001_projects.sql`                                                                                                     | `projects` table + RLS policies                                                                                                                            |

The portfolio page replaces today's static `PROJECTS`/`RECENT` painted-door data with real Supabase fetches; the shell components (`components/app-shell/*`) are reused unchanged.

## Data & state

- **Server data:** RSC fetches the signed-in member's projects via `features/projects/data.ts` (server-only, Supabase server client). Project header fetches one by id. No client-side fetch for first render.
- **Client state:** `projects` store holds UI-only state — active status filter, create/edit modal open + draft, and an optimistic just-created project. No server data cached in the store.
- **Actions:** `createProjectAction` / `updateProjectAction` / `archiveProjectAction` — zod-validated (name required; each link optional but, if present, a valid URL; status enum). Every action re-checks `requireMember()` server-side before writing; RLS is the backstop. `signOutAction` clears the session.
- **DB:** `projects(id uuid pk, name text not null, status text check in (active|at_risk|archived) default 'active', description text, notion_url text, slack_url text, github_url text, live_url text, created_by uuid, created_at, updated_at)`. RLS: a row is selectable/insertable/updatable only by authenticated members (deny-by-default; no anon access). No delete policy (archive-only).

## Acceptance criteria → verification mapping

| AC   | Proven by                                                                                                                                            |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1 | e2e: `e2e/auth.spec.ts` — signed-out visit to `/` and `/projects/<id>` redirects to `/sign-in`                                                       |
| AC-2 | unit: `features/auth/membership.test.ts` (non-member → denied, member → allowed); e2e: seeded non-member session sees access-denied, no project data |
| AC-3 | e2e: `e2e/projects.spec.ts` (CUJ-02) — empty state → create → reload still present; unit: store optimistic add                                       |
| AC-4 | unit: `features/projects/actions.test.ts` — blank name rejected; non-URL link rejected (zod) — no write                                              |
| AC-5 | unit: store — archive removes from Active filter; e2e: `projects.spec.ts` edit + archive persists                                                    |
| AC-6 | unit: `features/projects/components/project-card.test.tsx` — set link → `<a target="_blank">`; unset → empty “add” slot, never a broken href         |

## Risks & unknowns

- **Supabase SSR + Next 16 RSC auth** is fast-moving → mitigate with the `supabase` skill research pass (task T1) before writing factories.
- **RLS correctness is the security crux** (it stores secrets later) → explicit RLS policy tests + AppSec review (Constitution Art. IX); deny-by-default.
- **Org-membership check** calls the GitHub API → cache per session and isolate as a pure decision function so it's unit-testable and rate-limit-safe.
- **External provisioning** (a real Supabase project + GitHub OAuth app + `.env`) is a human step — flagged in tasks; the feature can't be e2e-verified until it exists (CI uses a test Supabase project secret).

## Overlap check

Active specs touching the same areas: **none** (001 abandoned; 002 is the only feature spec). No conflicts.
