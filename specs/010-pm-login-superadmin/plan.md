# Plan 010 — PM email/password login + superadmin above roles

- **Spec:** [spec.md](spec.md) (all open questions resolved: yes)
- **Author:** agent · **Date:** 2026-06-16

## Approach

Two small, independent pieces over the existing auth model. (1) A client island calls `supabase.auth.signInWithPassword` and does a full-page navigation on success so SSR/middleware re-read the cookie and apply the membership gate. (2) A new `team` slice exposes a superadmin-only server action that uses the admin client to create an org member; the form lives in Settings behind `user.isSuperadmin`. Migration 0010 enforces the "superadmin above roles" rule in the database (trigger + roster RPC + backfill delete). No new dependency, no boundary change, so no ADR.

## Placement (per `docs/architecture/module-boundaries.md`)

| What           | Where                                                   | Notes                                  |
| -------------- | ------------------------------------------------------- | -------------------------------------- |
| Migration      | `supabase/migrations/0010_superadmin_not_pm.sql`        | trigger skip, roster reject, backfill  |
| Sign-in island | `src/features/auth/components/email-sign-in-form.tsx`   | browser client, full reload on success |
| Team slice     | `src/features/team/`                                    | action + create-member card            |
| Route wiring   | `src/app/sign-in/page.tsx`, `src/app/settings/page.tsx` | compose existing features              |
| i18n           | `src/messages/{en,fr}.json`                             | `auth.*`, `signIn.or`, `team.*`        |

## Data & state

- Server data: none new for sign-in. Account creation reads `getCurrentUser()` then uses `createAdminClient()` (service role) — only after the superadmin check.
- Client state: none — the form holds its own field/error state.
- Actions: `createMemberAccountAction(input)` — superadmin-gated server-side, zod-validates name/email(lowercased)/password(10–72), creates the user with `is_member:true`, maps a duplicate to a field error, returns only the email.

## Acceptance criteria → verification mapping

| AC   | Proven by                                                                   |
| ---- | --------------------------------------------------------------------------- |
| AC-1 | manual / e2e sign-in (CI); island calls signInWithPassword + reload         |
| AC-2 | settings page renders card only when `user.isSuperadmin`                    |
| AC-3 | unit: `team/actions.test.ts` happy path (createUser args, email normalized) |
| AC-4 | migration: `projects_owner_pm` skips `is_superadmin()`                      |
| AC-5 | migration: backfill delete + `set_project_member` rejects superadmin        |
| AC-6 | unit: signed-out + non-superadmin rejected before admin client; gate review |

## Risks & unknowns

- The admin client bypasses RLS — it's reachable only after the server-side superadmin check, never from a client component (`server-only`).
- Full-page reload on sign-in is deliberate (cookie must be re-read by middleware).

## Overlap check

Active specs touching the same areas: spec 009 (env-vars) touches `src/messages/*` only — no functional overlap. This spec extends spec 008's role model.
