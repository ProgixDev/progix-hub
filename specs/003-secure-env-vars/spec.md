# Spec 003 — Secure environment variables per project

- **Status:** draft
- **Type:** feature
- **Requested by / owner:** Achref Arabi, founder
- **Date:** 2026-06-09
- **Slice / areas touched:** `src/features/env-vars` (new), route `/projects/[id]` (env section under project detail); new persistence for env variables + a reveal/copy audit trail. Reuses the spec-002 auth/membership model. No overlap with other active specs (002 is shipped).

## Problem (the why)

A project’s secrets — API keys, tokens, connection strings — live scattered across local `.env` files, DMs, and people’s heads. Every handoff and context-switch pays the cost of “where’s the Stripe key for this project, and which one is current?” progixHub is already the registry every project hangs off (spec 002); the env vars belong there too, behind the same login, so a developer finds them where they find everything else about the project. This is signature MVP scope #2 (product overview). It must feel convenient, not bureaucratic — but the values are real third-party secrets, so casual exposure (a shared screen, a database dump, a leaked dashboard) must not hand them over.

## Desired behavior (the what)

Inside a project, a signed-in Progix member sees that project’s environment variables as a flat list of entries — each a key, a hidden value, and a small service logo. They add an entry by typing a key and a value; the matching service logo (Stripe, Twilio, Next.js, Redis, Supabase, Vercel, GitHub, …) is recognized automatically from the key and shown next to it, and they can override it to a different service or to none. Values are masked by default (shown as dots). To use one, the member reveals it — the real value appears — or copies it straight to the clipboard. Every reveal and every copy is recorded: who, which variable, and when, viewable by the team, so there is an accountability trail for who has seen a secret. A member can edit an entry’s value or service, and delete an entry (with a confirmation) when a secret is rotated or retired. A project with no variables yet shows a friendly empty state inviting the first one.

Nobody outside the org ever reaches any of this: the same membership gate as sign-in protects the whole surface, and the stored values are encrypted — a value is only ever turned back into readable text for an authenticated member who explicitly reveals or copies it. Someone reading the underlying store directly (a database dump, the dashboard, a leaked service key) sees ciphertext, not secrets.

## Acceptance criteria

- **AC-1 (add + auto-logo):** Given a signed-in member on a project, when they add an entry with a key and a value, then it appears in that project’s list with the value masked; and when the key matches a known service (e.g. begins with `STRIPE_`), the matching service logo is shown automatically.
- **AC-2 (override logo):** Given an entry, when the member sets its service manually, then the chosen logo — or a neutral default for “none/unknown” — is shown instead of the auto-detected one.
- **AC-3 (reveal is audited):** Given a masked entry, when the member reveals it, then the real value is shown, and an audit record is created capturing who revealed which variable and when; the record is visible to members.
- **AC-4 (copy is audited):** Given an entry, when the member copies its value, then the value is placed on the clipboard and a copy is recorded in the same audit trail.
- **AC-5 (encrypted at rest — security):** Given a stored value, when the persistence layer is read directly rather than through an authorized reveal, then only ciphertext is present — the plaintext value is never stored or returned except to an authenticated member performing a reveal or copy.
- **AC-6 (membership gate — non-happy):** Given a signed-out visitor or an authenticated non-member, when they attempt to view, reveal, or copy any project’s variables, then they are denied and redirected to sign-in, and no key or value is exposed.
- **AC-7 (duplicate key — non-happy):** Given a project that already has an entry with key `K`, when a member adds another entry with key `K`, then it is rejected with a clear message and no duplicate is created.
- **AC-8 (edit & delete):** Given an entry, when a member edits its value or service it updates in place; and when they delete it after confirming, it no longer appears and its value is unrecoverable.
- **AC-9 (empty state — empty path):** Given a project with no variables, when a member opens its env section, then they see an empty state inviting the first variable — not an error or a blank panel.
- **AC-10 (full audit trail, retained):** Given any create, edit, delete, reveal, or copy of a variable, when the action succeeds, then an append-only audit record is written capturing the actor, the variable’s key, the action, and the time; the trail is visible to members and is retained even after a variable is deleted (its key is preserved in the record), though deletion never recovers the value.

## Out of scope

- **Environments (dev / staging / prod) grouping** — a single flat list per project; environment tabs are a possible fast-follow.
- **Bulk `.env` paste / import** — entries are added one at a time; paste-and-parse is the top follow-up.
- **Pushing or pulling to external systems** — no sync to Vercel, GitHub Actions, Doppler, or actual deploy targets; values are pasted and read here only.
- **Value-change history / versioning** — the audit trail records _that_ a value changed and by whom, never the previous plaintext; old values are not retained after an edit.
- **Roles beyond org membership** — every active member can add, reveal, edit, and delete equally (the flat model from spec 002); no per-project owners or reveal-only roles.
- **Secret rotation reminders, expiry, or strength checks.**
- **Hardened-vault guarantees** — per-user keys, HSM, break-glass. This is a convenient login-gated store, not Doppler/Vault (product anti-goal).

## CUJ impact

- Registers new **CUJ-03 — Manage a project’s env vars:** open a project → add a variable (see its service logo auto-fill) → reveal it → copy it → edit it → delete it. New e2e spec + `env-*` screenshots; add the row to `docs/product/critical-user-journeys.md` at ship.

## Design decisions (resolved 2026-06-09)

These were the open questions; the owner resolved them before planning:

- **Encryption uses an app-held key** kept in the application environment, not in the database — so a database dump, dashboard access, or a leaked `service_role` key yields only ciphertext; decrypting also requires the app key, which lives in a separate trust domain. Algorithm, per-value nonce, and rotation strategy are recorded in **ADR-0007** during planning. **Operational requirement:** the key must be backed up outside the host — losing it permanently destroys every stored value (that is the deliberate cost of this threat model).
- **The audit trail covers all five actions** — create, edit, delete, reveal, copy (AC-10).
- **The audit trail is retained through deletion** — a deleted variable’s records survive, with its key preserved, so accountability outlives the secret (AC-10).
