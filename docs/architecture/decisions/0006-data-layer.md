# 0006 — Use Supabase as the data layer

- **Status:** Accepted
- **Date:** 2026-06-08 (accepted 2026-06-08 with spec 002)
- **Deciders:** Progix team (engineering accepts)

## Context

progixHub owns its own canonical data — projects, surface links, environment variables, documents, and client feedback — rather than mirroring another surface (it is the registry, not a sync engine). That requires a database, authentication for an invite-only internal team, and file storage for uploaded documents. We want one platform that covers all three with minimal wiring, and that fits the Next.js 16 RSC model. This ADR is the anchor for the first data-layer spec; it does not wire the dependency.

## Decision

Use **Supabase** for persistence (Postgres), authentication (GitHub OAuth, gated to DigitariaWebs org members), and file storage (uploaded documents). Postgres Row-Level Security governs access. The app is hosted on Vercel; Supabase is the managed backend.

## Alternatives considered

| Option                         | Why not                                                                                        |
| ------------------------------ | ---------------------------------------------------------------------------------------------- |
| Plain Postgres + separate auth | Three services to wire (DB, auth, storage) instead of one; more surface, slower to MVP.        |
| Firebase                       | Document model fits less well than relational here; weaker SQL/RLS story for the access model. |
| Prisma + hosted Postgres       | ORM is fine, but still needs separate auth + storage; Supabase covers all three natively.      |

## Consequences

- Positive: DB + auth + document storage in one platform; RLS gives a clean per-project access model; first-class Next.js SSR support via `@supabase/ssr`.
- Negative / accepted trade-offs: a managed-vendor dependency; `@supabase/ssr` + RSC cookie/auth patterns move fast — needs a 2026 research pass (the `supabase` skill) before wiring.
- Follow-ups required (the env-vars spec starts from these as **default-secure** posture, not open-ended questions):
  - **Secrets access model — default deny.** RLS is deny-by-default; revealing an env is an authenticated, object-level-authorized (no IDOR on `project_id`), audit-logged action. Whether reveal is gated by per-project membership or allowed for any internal role is the only open variable — and it must be decided _before_ the spec, never defaulted to “everyone sees everything.” This is a non-negotiable acceptance criterion of the env-vars spec.
  - **Service-role key is scoped, never a general client.** `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS, so it is used only inside narrowly-scoped server actions, never as an app-wide query client. Captured as an acceptance criterion the reviewer checks.
  - **Encrypt at rest — decision owed, default-secure fallback.** Because the product stores other projects’ secrets, a DB compromise exposes every plaintext env at once. Before the env-vars spec is approved, encrypt-at-rest (app-layer envelope encryption / `pgsodium`, key held outside the same Supabase project) is a **decision with an owner**; if undecided, the secure fallback (encrypt) wins — not plaintext.
  - Add the real env vars to `.env.example` and tighten the zod schema in `src/core/env.ts` (currently `.optional()`) when the data-layer spec lands — in the same PR that wires Supabase, so the build doesn’t go red on an un-provisioned skeleton.
