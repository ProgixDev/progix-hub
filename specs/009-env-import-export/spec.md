# Spec 009 — Env vars: bulk import, scope, and `.env` export

- **Status:** active
- **Type:** enhancement
- **Requested by / owner:** Achref Arabi, founder
- **Date:** 2026-06-16
- **Slice / areas touched:** `src/features/env-vars` (extends spec 003), route `/projects/[id]`; migration `0009`. No overlap with other active specs.

## Problem (the why)

Spec 003 added one-at-a-time env var entry — the single biggest follow-up it deferred was bulk `.env` paste/import (see its "Out of scope"). Onboarding a project still means copy-pasting a dozen secrets one row at a time, and there is no way to get them back out into the `.env` a developer actually runs. Teams also need to know which variables are server-only and which are shipped to the browser, because a backend secret pasted into a frontend `.env` is a leak waiting to happen.

## Desired behavior (the what)

Inside a project, a member can import many variables at once: drop one or more `.env` files onto a zone, pick files, or paste `.env` text. progixHub parses every line, shows a preview where each row can be toggled on/off, has its value masked (with a show toggle), and has an auto-detected scope (backend or frontend) that the member can override; rows whose key already exists are flagged. Submitting creates the included rows, skips duplicates, and reports a clear summary.

Each variable now carries a scope — backend (server-only) or frontend (shipped to the browser) — auto-detected from the key (e.g. `NEXT_PUBLIC_*`, `VITE_*` are frontend) and overridable on the add/edit form. The list groups variables under Backend and Frontend headings.

A member can export a project's variables as a `.env` file — all, backend only, or frontend only — downloaded to their machine. Every exported value is decrypted through the same audited path as a reveal, so an export is fully accounted for, value by value.

## Acceptance criteria

- **AC-1 (scope + auto-detect):** Adding/editing a variable shows a scope selector defaulting to an auto-detected value (frontend for public-prefixed keys, else backend); the stored scope shows as a badge and the list groups by Backend/Frontend.
- **AC-2 (parse):** Pasting or uploading `.env` text parses blank lines, `#` comments, optional `export `, and quoted/unquoted values correctly; invalid keys and empty values are dropped; duplicate keys keep the last value.
- **AC-3 (import preview + submit):** The import dialog previews every parsed row with an include checkbox, masked value, scope selector, and an "already exists" flag; submitting creates included rows and returns a summary of created/skipped/failed.
- **AC-4 (export, audited — security):** Exporting downloads a `.env` with `KEY=VALUE` lines for the chosen scope; each exported value is decrypted via the audited `reveal_env_var` path and recorded as an `export` audit row.
- **AC-5 (membership/role gate — non-happy):** A signed-out visitor or a member without env-write access cannot import or export; the server actions refuse before touching the database and the DB gate (`has_project_access` pm/developer) is preserved.
- **AC-6 (empty export — non-happy):** Exporting a scope with no variables returns a friendly message, not an empty download or an error.

## Out of scope

- Environment grouping beyond backend/frontend (dev/staging/prod).
- Sync to external systems (Vercel, GitHub Actions, Doppler).
- Importing values that overwrite existing keys (duplicates are skipped, never clobbered).
- Encrypted `.env` export or password-protected downloads.

## CUJ impact

- Extends **CUJ-03 — Manage a project's env vars** with an import + export leg; update `docs/product/critical-user-journeys.md` at ship.

## Open questions

Resolved: duplicates on import are skipped (never overwritten); export is gated and audited per value, same as reveal.
