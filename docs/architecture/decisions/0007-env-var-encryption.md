# 0007 — Encrypt env-var values with an app-held keyring (AES-256-GCM) behind SECURITY DEFINER RPCs

- **Status:** Proposed
- **Date:** 2026-06-09
- **Deciders:** Achref Arabi (founder), Claude
- **Review:** hardened after an adversarial pre-implementation design review (4 P0 + 4 P1 findings folded in).

## Context

Spec 003 stores real third-party secrets (Stripe, Twilio, … keys) per project. Supabase encrypts at the disk level, but that does not defend the realistic threats here: a leaked `service_role` key (which already happened once during setup), dashboard access, or a database dump — any of which expose every secret in clear if values are plaintext. Spec 003 AC-5 requires that reading the store directly yields only ciphertext, and AC-3/AC-4/AC-10 require a non-repudiable, append-only audit of who revealed/copied/changed what. A first design (single key, GCM blob, supabase-js CRUD) was reviewed adversarially and found to have four merge-blocking holes; this ADR records the hardened decision.

## Decision

Encrypt each env-var value in application code with **AES-256-GCM**, using an **app-held keyring**, and gate all secret-touching operations behind **`SECURITY DEFINER` Postgres RPCs** that bind the audit write into the same transaction.

1. **Keyring, not a scalar.** `core/env.ts` exposes `ENV_VAR_ENCRYPTION_KEYS` (a JSON map `{ "1": "<base64 32-byte key>" }`) and `ENV_VAR_ENCRYPTION_ACTIVE_VERSION`. New values encrypt under the active key; a stored blob decrypts under the key named by its own version prefix. Rotation = add `"2"`, set active = `2`, lazily re-encrypt `v1` rows, then drop `"1"`. (A single key cannot do lazy re-encryption — swapping it would brick every existing row.)
2. **Blob format `v<ver>:base64(iv):base64(tag):base64(ciphertext)`** with a fresh random 96-bit IV per value. Decryption parses strictly: exactly four fields, a known version, `iv` 12 bytes, `tag` 16 bytes — else a single clean “decryption failed” error (never partial plaintext).
3. **Row binding via AAD.** The GCM call authenticates `aad = "<ver>:<env_var_id>"` (the value’s immutable uuid PK + key version). A ciphertext copied from another row/project fails authentication on decrypt — closing the cross-row substitution hole that a write-capable attacker (leaked `service_role`) would otherwise exploit undetected.
4. **Ciphertext is isolated.** Values live in `env_var_secrets` (one row per variable), a table with **RLS enabled and no member policies** and `UPDATE/DELETE/SELECT` **revoked from `authenticated`/`anon`**. Members can never read ciphertext over PostgREST; the only path to a value is a reveal RPC.
5. **SECURITY DEFINER RPCs for every secret/audit operation.** `create_env_var`, `update_env_var`, `delete_env_var`, and `reveal_env_var` are `SECURITY DEFINER`, `set search_path = ''`, with `EXECUTE` granted only to `authenticated` (revoked from `public`/`anon`). Each re-checks `app_metadata.is_member` internally (the DB-layer backstop, since DEFINER bypasses RLS), derives the actor from `auth.uid()` / the JWT email claim (never client input), and writes the audit row **in the same transaction** as the action — `reveal_env_var` writes the audit row _before_ returning the ciphertext, so a value can never be returned without a durable record.
6. **Append-only audit at the grant level.** `env_var_audit` grants members `SELECT` only; `INSERT` happens solely inside the DEFINER functions; `UPDATE`/`DELETE` are revoked from `authenticated`/`anon`. Rows denormalize `actor_id`, `actor_email`, and `env_var_key`, so the trail survives variable (and user) deletion.
7. **Fail-closed key handling.** Keys are optional at parse (builds stay green pre-provision) but validated at use: each must base64-decode to exactly 32 bytes. `encryptSecret` throws rather than ever persisting a non-encrypted value; a production `/api/health` check fails loudly when the active key is absent/malformed; a non-secret key fingerprint lets the app flag a mis-keyed deploy instead of surfacing it as a per-user reveal crash.

RLS (deny-by-default, `app_metadata.is_member`, mirroring spec 002) remains the backstop for metadata; encryption + the DEFINER path are defense-in-depth on top, splitting the secret across two trust domains — Supabase holds ciphertext, the host holds the keyring.

## Alternatives considered

| Option                                   | Why not                                                                                                                                                                                                                    |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Supabase Vault / pgsodium (key in DB)    | Key material lives in the database, so a `service_role`/dashboard compromise — the exact risk we have — can decrypt. The app-held keyring closes that.                                                                     |
| RLS + masking, plaintext at rest         | A DB dump / dashboard / leaked `service_role` exposes every secret. Fails AC-5.                                                                                                                                            |
| Single app key (no keyring)              | The advertised “lazy re-encrypt” rotation is impossible with one key — swapping it bricks every existing row. A keyring is required for safe rotation.                                                                     |
| GCM with no AAD                          | The tag authenticates only the bytes, not the row, so a write-capable attacker can swap valid ciphertext between rows undetected. AAD = id closes it.                                                                      |
| supabase-js CRUD + app-side audit insert | No transaction across decrypt → return → audit, so an audit-side failure leaks an unrecorded reveal; and a member can `SELECT` ciphertext / forge audit rows. DEFINER RPCs make the action+audit atomic and forgery-proof. |
| Per-user / envelope keys via a KMS       | Right for a hardened vault; over-engineered for a “convenient login-gated store” (product anti-goal). Revisit if requirements harden.                                                                                      |

## Consequences

- **Positive:** a DB dump, dashboard access, or a leaked `service_role` key yields only ciphertext, and a cross-row swap fails authentication (AAD). Members cannot read ciphertext or forge/erase audit rows — reveal and audit are atomic and actor-bound, giving real non-repudiation. Rotation is incremental (keyring + version tag). The env-vars feature uses **no service-role/admin client at all** — the DEFINER functions are narrow and member-checked, shrinking the blast surface.
- **Negative / accepted trade-offs:** more SQL (four plpgsql functions) and a keyring to operate. We own key management: **losing the active key (with no backup) permanently destroys every value encrypted under it** — by design. The key(s) must be backed up outside the host (a password manager) and verified to restore. A compromise of the running server process (which holds the keyring and the member session) can still read values — acceptable, since an authorized member can anyway.
- **Follow-ups required:** add `ENV_VAR_ENCRYPTION_KEYS` + `ENV_VAR_ENCRYPTION_ACTIVE_VERSION` to `core/env.ts` and `.env.example` (document `openssl rand -base64 32`); the human provisions them in `.env.local` + Vercel and backs them up. Keep the pure cipher in an env-free, unit-tested module (`src/lib/crypto/aes-gcm.ts`) so AC-5 (incl. the AAD-swap case) is provable without tripping `server-only`. SECURITY DEFINER functions live in `public` only because PostgREST requires it; they are safe-by-construction via `set search_path = ''`, `EXECUTE` to `authenticated` only, and an internal `is_member` check (per the Supabase security guidance). Mark **Accepted** once spec 003 lands.
