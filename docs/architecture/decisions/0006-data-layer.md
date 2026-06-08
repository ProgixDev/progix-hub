# 0006 — Use Supabase as the data layer

- **Status:** Proposed
- **Date:** 2026-06-08
- **Deciders:** Progix team (engineering accepts)

## Context

progixHub owns its own canonical data — projects, surface links, environment variables, documents, and client feedback — rather than mirroring another surface (it is the registry, not a sync engine). That requires a database, authentication for an invite-only internal team, and file storage for uploaded documents. We want one platform that covers all three with minimal wiring, and that fits the Next.js 16 RSC model. This ADR is the anchor for the first data-layer spec; it does not wire the dependency.

## Decision

Use **Supabase** for persistence (Postgres), authentication (GitHub OAuth + magic link, invite-only), and file storage (uploaded documents). Postgres Row-Level Security governs access. The app is hosted on Vercel; Supabase is the managed backend.

## Alternatives considered

| Option                         | Why not                                                                                        |
| ------------------------------ | ---------------------------------------------------------------------------------------------- |
| Plain Postgres + separate auth | Three services to wire (DB, auth, storage) instead of one; more surface, slower to MVP.        |
| Firebase                       | Document model fits less well than relational here; weaker SQL/RLS story for the access model. |
| Prisma + hosted Postgres       | ORM is fine, but still needs separate auth + storage; Supabase covers all three natively.      |

## Consequences

- Positive: DB + auth + document storage in one platform; RLS gives a clean per-project access model; first-class Next.js SSR support via `@supabase/ssr`.
- Negative / accepted trade-offs: a managed-vendor dependency; `@supabase/ssr` + RSC cookie/auth patterns move fast — needs a 2026 research pass (the `supabase` skill) before wiring.
- Follow-ups required:
  - Resolve the **secrets access model** (any role reveals any project’s envs vs. per-project membership) — it drives the RLS schema. _(PRD open question.)_
  - Decide whether env vars are **encrypted at rest** beyond login-gating. _(PRD open question.)_
  - Add the real env vars to `.env.example` and tighten the zod schema in `src/core/env.ts` (currently `.optional()`) when the data-layer spec lands.
