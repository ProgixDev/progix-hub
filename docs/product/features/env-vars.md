# Secure environment variables

**Status:** live · **Slice:** `src/features/env-vars` · **Routes:** `/projects/[id]` (env section), `/api/health`
**Spec history:** specs/003-secure-env-vars (shipped 2026-06-09)

## What it does (user terms)

Inside a project, a signed-in Progix member keeps that project’s environment variables — API keys, tokens, connection strings — in one secured place. You add a variable (key + value); the matching service logo (Stripe, Twilio, Supabase, …) is recognized from the key and shown, and you can override it. Values are masked by default; you reveal or copy one when you need it, and “Hide all” re-masks them. Every add, edit, delete, reveal, and copy is recorded in a per-project audit trail that **survives the variable’s deletion**. Edit and delete are in place; a blank value on edit keeps the stored secret.

## How it works (the non-obvious 20%)

- **Encrypted at rest with an app-held keyring, not Supabase Vault.** Values are AES-256-GCM-encrypted in app code (`src/lib/crypto/{aes-gcm,keyring,secrets}.ts`) under a versioned keyring in `ENV_VAR_ENCRYPTION_KEYS` (`core/env.ts`). The row’s uuid is bound as GCM **AAD**, so a ciphertext can’t be swapped between rows/projects. The key lives on the host, the ciphertext in Supabase — two trust domains. Full rationale: **[ADR-0007](../../architecture/decisions/0007-env-var-encryption.md)**.
- **Ciphertext never leaves the DB except through a reveal.** It lives in `env_var_secrets` — a table with **no member RLS policies and all grants revoked**. Members can never `SELECT` it; the metadata reads (`data.ts`) return key/service/timestamps only.
- **All writes + secret reads go through four `SECURITY DEFINER` RPCs** (`create/update/delete/reveal_env_var` in `supabase/migrations/0002_env_vars.sql`), not table CRUD. Each re-checks `app_metadata.is_member`, derives the actor from the JWT (never client input), and writes the **append-only** audit row in the **same transaction** — `reveal` audits _before_ returning the ciphertext, so a value is never returned without a record. The audit table has member `SELECT` only (INSERT/UPDATE/DELETE/TRUNCATE revoked), so the trail can’t be forged or erased.
- **The feature uses no admin/service-role client** — the DEFINER functions are the only privileged path, and they’re narrow + member-checked.
- **Key loss = data loss, by design.** Lose the active `ENV_VAR_ENCRYPTION_KEYS` version without a backup and every value under it is unrecoverable. `/api/health` returns 503 if the keyring is missing/malformed, so a mis-keyed deploy is caught there, not on a member’s first reveal. Rotation: add a new version, set it active, lazily re-encrypt, drop the old.
- **Reveal/copy don’t `revalidatePath`** (to avoid a full re-render per reveal), so “Recent activity” reflects them on the next mutation/load — the audit rows are written immediately regardless.

## Decisions & gotchas

- 2026-06-09 — App-held keyring over Supabase Vault/pgsodium: the `service_role` key leaked once, and Vault keeps key material in the DB; app-held splits the trust domains (ADR-0007).
- 2026-06-09 — Hardened by an adversarial pre-implementation review (4 P0): AAD row-binding, the keyring (a single key can’t rotate without bricking data), audit actor-binding, and atomic reveal+audit were all added before code.
- 2026-06-09 — Logos are brand-coloured **monograms** (dependency-free); real `simple-icons` marks are a deferred ADR. Stripe and Supabase both render “S”.
- Gotcha: the DB-level invariants (ciphertext isolation, non-member raise, audit-forgery, append-only) are verified live + encoded in `0002` grants but have **no committed CI integration test yet** — needs a disposable CI Supabase project (same gate as CI e2e).
- Gotcha: a client component must not import the slice barrel (`index.ts` re-exports server-only `data.ts`); client islands use relative imports (same as `projects`).

## CUJs covered

- CUJ-03 — Manage a project’s env vars (`e2e/env-vars.spec.ts`)
