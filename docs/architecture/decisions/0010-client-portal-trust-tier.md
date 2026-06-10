# 0010 — Token-gated public portal: hashed share links, SECURITY DEFINER RPCs, server-only admin Storage client

- **Status:** Accepted
- **Date:** 2026-06-10
- **Deciders:** Achref Arabi (owner), Claude (agent)

## Context

[Spec 006](../../../specs/006-client-portal/spec.md) introduces the app’s first **external surface**: a client opens an unguessable share link — no account — and can read a project’s portal, comment, attach files, and propose features. Until now every byte behind progixHub required `app_metadata.is_member`; RLS policies and Storage policies are all keyed on it. An anonymous visitor has no JWT, so `auth.uid()` is null and the existing policy model denies everything. We need a way for the server to act _for_ a token-holder without weakening the member-only model, and a way to accept client file uploads into private Storage that policies can’t authorize.

## Decision

1. **Share tokens are high-entropy and stored hashed.** The URL carries a 256-bit random token (base64url); the database stores only its SHA-256 (`token_hash`). A DB leak does not leak working links. One active link per project (partial unique index), revocable; rotate = revoke + issue.
2. **All anonymous reads/writes go through `SECURITY DEFINER` RPCs** (`portal_public_view`, `portal_public_comment`, `portal_public_propose`, `portal_public_record_attachment`). Each RPC hashes the supplied token, resolves it to exactly one live project, and applies **rate limits and size caps inside the function**. The `anon` role gets EXECUTE on these functions and **no table grants** — the RPCs are the entire public surface. Tables keep deny-by-default member RLS for the team side.
3. **Client file uploads use the service-role admin client, server-only, behind token validation.** Storage policies can’t validate an app-level token, so the share page posts the file to a server action which (a) validates the token via RPC, (b) validates size/MIME, then (c) uploads with a `src/lib/supabase/admin.ts` client (`import "server-only"`, key never reaches the browser). This is the first production use of the service-role key; it is confined to this one module and each use is preceded by token validation.
4. **`/share` joins the middleware public-path list** (alongside `/sign-in`, `/auth`, `/api/health`). The member portal page `/projects/[id]/portal` stays behind the member gate.

## Alternatives considered

| Option                                              | Why not                                                                                                                           |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Supabase anonymous sign-ins for clients             | Creates real auth users per visit, needs cleanup, and still can’t scope RLS to “this share token” without custom claims plumbing. |
| Plain-text token column + RLS `current_setting()`   | Per-request GUC plumbing through PostgREST is fragile; a DB leak would expose working links.                                      |
| Client uploads straight to Storage from the browser | Storage RLS can’t check an app token; making the bucket anon-writable would let anyone with the URL pattern spam uploads.         |
| Signed upload URLs minted per request               | Still needs a privileged client to mint them; routing the (≤10 MB) file through the action is simpler and lets us sniff/limit it. |

## Consequences

- Positive: the public attack surface is four auditable functions; tokens are revocable/rotatable and unguessable; the member-side model is untouched; the service-role key stays server-only in one file.
- Negative / accepted trade-offs: the token rides in the URL (may appear in logs — acceptable for this trust level, mitigated by rotation); uploads consume server bandwidth (capped at 10 MB); rate limiting is per-function DB counting, not a dedicated limiter.
- Follow-ups: per-link expiry dates and client-facing language toggle are explicitly deferred; if more public surfaces appear, promote the token pattern into a shared lib.
