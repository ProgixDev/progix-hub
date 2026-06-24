# Plan 017 — Client onboarding ("Setup") page

- **Spec:** [spec.md](spec.md) (all open questions resolved: yes)
- **Author:** Claude (Opus 4.8) · **Date:** 2026-06-24

## Approach

Mirror the spec-006 portal exactly, then add a passcode. Two tables: `project_setups` (one per project: `token_hash` = sha256 of the raw token like the portal, `passcode_hash` = pgcrypto bcrypt, `enabled`) and `setup_steps` (one per chosen platform: position, status `pending|client_done|verified`). The client surface is **one anon `SECURITY DEFINER` RPC** `setup_public_view(token, passcode)` that resolves token→setup, verifies `enabled` + `crypt(passcode, passcode_hash) = passcode_hash`, and returns only **non-sensitive** JSON (project name + steps + each platform's access action + the client-visible tutorial embed) — never the hashes, never env values. A second anon RPC `setup_mark_step(token, passcode, step_id, done)` lets the client tick a step (re-verifies every call). The team side is RLS-gated to project PMs/global-PM/superadmin via `has_project_access(project,['pm'])`, with manager RPCs `create/rotate/set-enabled/verify-step`. The **raw token + passcode are generated in the server action** (crypto-random) and **shown once** to the team (hashed at rest; rotate to reissue). Public route `/setup/[token]`: no cookie → passcode form (server action verifies, sets an httpOnly cookie scoped to the route) → checklist. No new dep (pgcrypto = `extensions`, already used by the portal) → no ADR.

## Placement

| What          | Where                                                                        | Notes                                                                                                                                                          |
| ------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public route  | `src/app/setup/[token]/page.tsx` (+ loading/error)                           | standalone chrome (no AppShell); passcode gate → checklist                                                                                                     |
| Project panel | `src/features/setup/components/setup-panel.tsx` rendered on `/projects/[id]` | build page, show link+passcode once, progress, verify, rotate                                                                                                  |
| Slice         | `src/features/setup/`                                                        | `types`, `lib`(+test: token/passcode gen + step status), `data`, `actions`(+test), `public-data`, `public-actions`, `store`/`provider`, `components/`, `index` |
| DB            | `supabase/migrations/0021_client_setup.sql`                                  | 2 tables + RLS + anon RPCs (view/mark) + manager RPCs                                                                                                          |

## Data & state

- **Team:** `getProjectSetup(projectId)` + steps (RLS: `has_project_access(project,['pm'])`). Actions: `createSetupAction(projectId, platformIds[])` (gen token+passcode, returns them once), `rotateSetupAction`, `setSetupEnabledAction`, `verifyStepAction(stepId)`.
- **Client (anon):** `getPublicSetup(token, passcode)` → `setup_public_view`; `markStepAction(token, stepId, done)` reads passcode from the httpOnly cookie → `setup_mark_step`.
- **Tutorial match:** the view RPC joins each step's platform `service_id` to a `tutorials` row with `visible_to_clients = true` (server-side filter — per the 016 review note) and returns the embed_url.

## Acceptance criteria → verification mapping

| AC   | Proven by                                                                                                                                                             |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1 | unit: `actions.test.ts` (createSetup gen + manager gate) · e2e: panel shows link+passcode                                                                             |
| AC-2 | unit: `lib.test.ts` (passcode/token shape) + DB RPC (wrong passcode → null) · e2e: `e2e/setup.spec.ts` wrong then right passcode                                      |
| AC-3 | e2e: checklist renders the access action + video; unit: `accessActionFor(platform)` shaping                                                                           |
| AC-4 | unit: `lib.test.ts` step-status transitions · e2e: client marks done, panel shows status; verify action sets verified                                                 |
| AC-5 | unit/DB: rotate changes token_hash so the old token → null · e2e: old link dead after rotate                                                                          |
| AC-6 | DB: anon `select` on the tables is denied (RLS, no anon policy); `setup_public_view` returns no hashes/sensitive fields; bad/no token+passcode → null · appsec review |

## Risks & unknowns

- **Public auth surface** — the only externally-reachable write path is the two anon RPCs, both re-verifying token+passcode every call and scoped to that setup's project; tables have no anon RLS policy so direct PostgREST reads are denied. Rate-limiting is light in v1 (bcrypt verify cost + unguessable token); a proper limiter is a noted follow-up.
- **Passcode relay** — hashed at rest ⇒ shown once on create/rotate; the panel makes "rotate to reissue" obvious. Trade-off accepted for security.
- **No leakage** — the view RPC hand-builds its JSON from whitelisted columns; never `select *`. Appsec must confirm no hash/sensitive field escapes and the client surface has no nav into member pages.

## Overlap check

Touches `/projects/[id]` (adds a panel) — no active spec is mid-flight there. New slice + route + migration are net-new. Reuses portal (006), platforms (015), tutorials (016) read-only. **No conflict** — forward-only on main.
