# Tasks 003 — Secure environment variables per project

Ordered, executable, checkboxed. Work top-to-bottom, tick boxes as you commit, never reorder silently. `[P]` = parallel-safe. Each task names files + a done-check. Keep tasks ≤ ~30 min. Hardened per the design review (P0/P1 fixes are called out inline).

## Phase 0 — setup

- [x] T0 Branch `feat/003-secure-env-vars` (exists); scaffold the slice with `/new-module env-vars` · done: `src/features/env-vars/*` exist, `pnpm lint` green
- [x] T1 ADR-0007 (env-var encryption, keyring + AAD + DEFINER RPCs) written + indexed · done: `docs/architecture/decisions/0007-env-var-encryption.md`, `pnpm check:docs` green

## Phase 1 — data layer (AC-5, AC-6, AC-7, AC-10)

- [x] T2 Migration `0002_env_vars.sql` — **tables + RLS**: `env_vars` (metadata; app-supplied `id`; `unique(project_id, key)`; members `SELECT` only), `env_var_secrets` (`value_ciphertext`; RLS on, **no member policies**, `REVOKE ALL FROM authenticated, anon`), `env_var_audit` (append-only; denormalized `actor_id`/`actor_email`/`env_var_key`; members `SELECT` only; **`REVOKE UPDATE, DELETE FROM authenticated, anon`**); indexes; reuse `set_updated_at` · done: applied via MCP `execute_sql`, `get_advisors` clean (P1: ciphertext isolation, append-only)
- [x] T3 Migration `0002` — **SECURITY DEFINER RPCs** (`set search_path=''`, `EXECUTE` to `authenticated` only, `REVOKE` from `public`/`anon`): `create_env_var`/`update_env_var`/`delete_env_var`/`reveal_env_var`; each raises unless `app_metadata.is_member`; actor from `auth.uid()`+JWT email; audit written **in-txn** (reveal audits _before_ returning ciphertext; delete snapshots key first) · done: member can call, non-member raises; advisors clean (P0: atomicity, audit-actor binding)
- [x] T4 `src/core/env.ts`: add `ENV_VAR_ENCRYPTION_KEYS` (JSON map) + `ENV_VAR_ENCRYPTION_ACTIVE_VERSION` (optional at parse); `.env.example` shape + the `openssl rand -base64 32` command; note the human sets them in `.env.local` + Vercel and **backs them up** · done: `pnpm typecheck` green

## Phase 2 — crypto (AC-5)

- [x] T5 [P] Pure cipher `src/lib/crypto/aes-gcm.ts` (`encryptValue(pt,key,aad)`/`decryptValue(blob,key,aad)`, random 12-byte IV, **strict parse**: exactly 3 fields, `iv`=12, `tag`=16, else clean error) + `aes-gcm.test.ts` (round-trip; ciphertext ≠ plaintext; **decrypt under a different AAD throws**; fresh IV per call; malformed/tamper throw) · done: tests green (**AC-5**; P0 AAD, P2 strict-parse/static-IV)
- [x] T6 [P] `src/lib/crypto/secrets.ts` (`server-only`): load keyring + **assert each key decodes to 32 bytes**; `encryptSecret(pt, id)` (active version, AAD=`<ver>:<id>`, **throws without a valid key — never writes**); `decryptSecret(blob, id)` (version→key, distinct “key may have changed” error); `keyFingerprint()` + `secrets.test.ts` (reject bad/short key; fail-closed; decrypt a `v1` blob after the active version advances) · done: tests green (P0 key-ops, P1 key-validation)
- [x] T7 `src/app/api/health/route.ts`: in `production`, assert the active key is present + 32 bytes (503 + clear message otherwise); 200 `{ ok: true }` when healthy · done: returns ok locally; fails loud when mis-keyed (P0 key-ops boot canary)

## Phase 3 — slice (AC-1, AC-2, AC-9)

- [x] T8 `types.ts`: `envVarInputSchema` (key required + format, value, optional service) + `EnvVar`/`EnvVarMeta`/`AuditRow` types + `types.test.ts` · done: schema tests green (**AC-1**, **AC-7** input)
- [x] T9 `lib.ts`: `SERVICES` registry + `detectService(key)` + `lib.test.ts` · done: detect + override tests green (**AC-1**, **AC-2**)
- [x] T10 `store.ts` + `provider.tsx`: modal `{closed|create|edit}` + `revealed` map; `store.test.ts` · done: store tests green
- [x] T11 `data.ts` (`server-only`): `listProjectEnvVars` (metadata only) + `listEnvVarAudit` · done: `pnpm typecheck`; returns no ciphertext
- [x] T12 `actions.ts`: `create`/`update`/`delete`/`revealEnvVarValueAction(id, intent)` — `requireMember` → zod → `supabase.rpc(...)`; app-generate `id` + `encryptSecret` on write; decrypt on reveal; map unique violation → field error, decrypt failure → “key may have changed” · done: action unit tests (authz **AC-6**, duplicate **AC-7**) green
- [x] T13 Components: `env-vars-section.tsx` (list + empty state), `env-var-row.tsx` (masked / reveal / copy), `env-var-form.tsx` (add/edit modal, service picker + auto-detect), `service-logo.tsx` (inline SVGs + default) · done: states render; empty-state component test green (**AC-9**)
- [x] T14 `index.ts` public API: server-only data fns + `EnvVarsSection` + types only · done: app imports only the barrel (boundaries lint green)
- [x] T15 Compose into the route: `src/app/projects/[id]/page.tsx` renders `EnvVarsSection` (RSC fetches metadata + audit, passes as props); ensure `loading.tsx`/`error.tsx` exist · done: env section serves under a project

## Phase 4 — verification

- [x] T16 E2E `e2e/env-vars.spec.ts` (CUJ-03): add → see logo → reveal → copy → edit → delete, with audit-trail assertions and `grantPermissions` for clipboard; `shot()` `env-*` captures · done: `FEATURE=003-secure-env-vars pnpm e2e:shots` green (**AC-1..4, 8, 10**)
- [x] T17 Verify the security invariants + add the achievable committed tests: `actions.test.ts` (authz guard **AC-6**, duplicate **AC-7**, rotated-key), section logo render (**AC-1/2**), e2e duplicate + audit-retention (**AC-7/10**). The DB-level invariants — `env_var_secrets` isolation, non-member RPC raise, audit-forgery, append-only — are **verified on the live DB (MCP) and encoded in `0002` RLS/grants**; a committed CI-runnable DB-integration test is **deferred** (needs a member JWT + a disposable Supabase project — the CI-Supabase follow-up) · done: unit + e2e green; invariants confirmed live
- [x] T18 Run `/verify-ui 003` — inspect screenshots against ACs; fix what you see · done: attestation recorded
- [x] T19 `pnpm verify` green; commit history clean (conventional) · done: full gate green

## Phase 5 — review & ship

- [x] T20 Run `/review` — **AppSec is mandatory** (crypto + AAD, keyring/rotation, RLS + DEFINER RPCs, audit atomicity/immutability, key handling); fix P0/P1
- [x] T21 `/feature-report 003` → `docs/reports/003-secure-env-vars.md` (AC→evidence table + curated screenshots)
- [ ] T22 Open PR (template filled; spec + plan + ADR-0007 + report linked)
- [ ] T23 After merge: `/update-docs` — feature doc, register **CUJ-03**, specs index → shipped, ADR-0007 → Accepted

## AC coverage (mirror of plan.md — keep ticked in sync)

- [ ] AC-1 → T8, T9, T16 · [ ] AC-2 → T9, T16 · [ ] AC-3 → T3, T12, T16 · [ ] AC-4 → T16 · [ ] AC-5 → T5, T6, T17
- [ ] AC-6 → T3, T12, T16, T17 · [ ] AC-7 → T8, T12, T16 · [ ] AC-8 → T12, T16 · [ ] AC-9 → T13, T16 · [ ] AC-10 → T3, T16, T17
