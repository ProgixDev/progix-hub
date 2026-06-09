# Plan 003 — Secure environment variables per project

- **Spec:** [spec.md](spec.md) (all open questions resolved: yes)
- **Author:** Claude (with Achref Arabi) · **Date:** 2026-06-09
- **Hardened by:** adversarial pre-implementation design review (4 P0 + 4 P1 findings folded into this plan, [ADR-0007](../../docs/architecture/decisions/0007-env-var-encryption.md), and the migration).

## Approach

A new `env-vars` feature slice mirrors the `projects` slice (UI-only store, `requireMember`-guarded actions, server-only metadata reads), but every secret- or audit-touching operation goes through a `SECURITY DEFINER` Postgres RPC rather than direct table CRUD. Values are encrypted with an **app-held keyring** (AES-256-GCM, per-value IV, the row’s uuid bound as AAD — [ADR-0007](../../docs/architecture/decisions/0007-env-var-encryption.md)) and stored in an **isolated `env_var_secrets` table that members cannot `SELECT`**. The RPCs re-check membership at the DB layer, derive the actor from the verified session, and write the **append-only audit row in the same transaction** as the action — so reveal-without-record, cross-row ciphertext swap, audit forgery, and a value returned before its audit commits are all closed by construction. The env section is composed onto `/projects/[id]` by the app layer (features never import each other). Key trade-off: more SQL and a keyring to operate, in exchange for real at-rest confidentiality and non-repudiable accountability.

## Placement (per `docs/architecture/module-boundaries.md`)

| What          | Where                                                                                          | Notes                                                                                            |
| ------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Route         | `src/app/projects/[id]/page.tsx` (+ `loading.tsx`/`error.tsx`)                                 | thin RSC; composes `EnvVarsSection` alongside `ProjectDetail`, fetches metadata + audit          |
| Health route  | `src/app/api/health/route.ts`                                                                  | genuine HTTP API (route handler) — fails loud in production if the active key is unset/malformed |
| Slice         | `src/features/env-vars/` (store, provider, actions, data, types, lib, components, index)       | scaffold via `/new-module env-vars`; takes `projectId` — never imports the `projects` slice      |
| Shared crypto | `src/lib/crypto/aes-gcm.ts` (pure, env-free, AAD) + `secrets.ts` (server-only, keyring)        | pure cipher unit-tests without `server-only`; secrets.ts loads + validates the keyring           |
| Core config   | `src/core/env.ts` gains `ENV_VAR_ENCRYPTION_KEYS` (JSON) + `ENV_VAR_ENCRYPTION_ACTIVE_VERSION` | optional at parse; validated (32 bytes/key) at use; `.env.example` + `openssl rand -base64 32`   |
| Database      | `supabase/migrations/0002_env_vars.sql`                                                        | 3 tables + 4 `SECURITY DEFINER` RPCs + grants/revokes (below)                                    |
| Service logos | `src/features/env-vars/components/service-logo.tsx`                                            | inline SVGs + neutral default; `simple-icons` dependency deferred (its own ADR)                  |

## Data model (migration `0002_env_vars.sql`)

- **`env_vars`** — metadata only: `id` (uuid, app-supplied so it can be the AAD), `project_id → projects on delete cascade`, `key`, `service`, `created_by default auth.uid()`, timestamps, **`unique(project_id, key)`** (AC-7). RLS: members `SELECT` only; all mutations go through RPCs.
- **`env_var_secrets`** — `env_var_id → env_vars on delete cascade` (PK), `value_ciphertext`. RLS enabled, **no member policies**; `SELECT/INSERT/UPDATE/DELETE` revoked from `authenticated`/`anon`. Reachable only inside the DEFINER RPCs.
- **`env_var_audit`** — append-only trail: `action` (`create|edit|delete|reveal|copy`), denormalized `actor_id`, `actor_email`, `env_var_key`, `project_id`, `created_at`. RLS: members `SELECT` only; `INSERT` only inside RPCs; **`UPDATE/DELETE` revoked** from `authenticated`/`anon`.
- **RPCs** (`SECURITY DEFINER`, `set search_path = ''`, `EXECUTE` to `authenticated` only): `create_env_var(id, project_id, key, service, ciphertext)`, `update_env_var(id, key, service, ciphertext?)`, `delete_env_var(id)` (snapshots key → audit → delete, atomic), `reveal_env_var(id, intent)` (audit **then** return ciphertext, atomic). Each raises unless `app_metadata.is_member` is true; actor comes from `auth.uid()` + the JWT email claim.

## Data & state

- **Server data:** `listProjectEnvVars(projectId)` (server-only, member `SELECT`) returns metadata only — never ciphertext; `listEnvVarAudit(projectId)` returns the trail.
- **Client state:** UI only — modal `{closed|create|edit}` + `revealed: Record<id, string>` (plaintext held in memory only after an explicit reveal). Server data flows in as props.
- **Actions** (`requireMember` → zod → `supabase.rpc(...)`, returning `ActionResult`): `create`/`update`/`delete` pass the app-generated id + encrypted blob; `revealEnvVarValueAction(id, intent)` calls `reveal_env_var`, then decrypts the returned ciphertext with `secrets.ts` and returns `{ value }`. A unique-key violation maps to a friendly field error (AC-7); a decrypt failure maps to a distinct “key may have changed” error (the RPC has already recorded the attempt).

## Acceptance criteria → verification mapping

| AC                               | Proven by                                                                                                                                                                                                                                                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1 add + auto-logo             | unit `lib.test.ts` (`detectService`) + `types.test.ts` (schema); e2e `env-vars.spec.ts` add step shows masked value + auto logo (`shot`)                                                                                                                        |
| AC-2 override logo               | unit `lib.test.ts` (manual override / “none” default); e2e set service manually                                                                                                                                                                                 |
| AC-3 reveal audited              | e2e reveal shows the value **and** an audit entry appears; integration: `reveal_env_var` writes the audit row before returning; unit: action authz guard                                                                                                        |
| AC-4 copy audited                | e2e copy → clipboard holds the value (`grantPermissions`) **and** an audit entry appears                                                                                                                                                                        |
| AC-5 encrypted at rest           | unit `aes-gcm.test.ts` (round-trip; ciphertext ≠ plaintext; **decrypt under a different AAD throws**; fresh IV per call; strict-parse/tamper throw); integration: raw `env_var_secrets` row is ciphertext, and a member `SELECT` on `env_var_secrets` is denied |
| AC-6 membership gate (non-happy) | e2e signed-out → redirected; unit: actions return NOT_AUTHORIZED without a member; integration: RPC raises for a non-member; a direct member `INSERT` into `env_var_audit` is denied (forgery blocked)                                                          |
| AC-7 duplicate key (non-happy)   | unit/integration: `create_env_var` unique violation → friendly error; e2e duplicate add shows the message                                                                                                                                                       |
| AC-8 edit & delete               | e2e edit changes the value, delete (after confirm) removes it; integration: `delete_env_var` is atomic                                                                                                                                                          |
| AC-9 empty state                 | component test + e2e: a project with no variables shows the invite state, not an error                                                                                                                                                                          |
| AC-10 full audit trail, retained | e2e: create/edit/delete/reveal/copy all appear; integration: deleting a variable keeps its audit rows (key + actor preserved); `UPDATE/DELETE` on audit is denied                                                                                               |

## Risks & unknowns

- **Key loss = data loss** (ADR-0007) → keyring backed up off-host + verified restore; `encryptSecret` fails closed; a production `/api/health` canary + key fingerprint catch a mis-keyed deploy at boot, not on first reveal.
- **`server-only` blocks unit-testing crypto** → the pure cipher (`aes-gcm.ts`, env-free, AAD-aware) is unit-tested directly; `secrets.ts` (keyring/env) is exercised via integration.
- **SECURITY DEFINER in `public`** (PostgREST requires it) → safe-by-construction: `set search_path = ''`, `EXECUTE` to `authenticated` only, internal `is_member` check (Supabase security guidance).
- **Clipboard in Playwright** → `context.grantPermissions(['clipboard-read','clipboard-write'])`; fallback asserts the action returns the value.
- **Service logos without a new dependency** → inline SVGs; `simple-icons` would be a separate ADR.
- **e2e writes to the live Supabase project** (same as spec 002) → the CI disposable-project remains a tracked follow-up, not a blocker.

## Overlap check

No other spec is `active` (001 abandoned, 002 shipped). Spec 003 integrates with the `projects` route `/projects/[id]` and the spec-002 auth/RLS model — an integration point, not a conflict. Resolution: compose in the **app** layer; reuse `requireMember`, the RLS-scoped Supabase client (for `.rpc()` calls and metadata reads), and the `app_metadata.is_member` predicate. No new boundary exceptions; the env-vars feature uses no admin/service-role client.
