# Client portal

**Status:** live · **Slice:** `src/features/portal` · **Routes:** `/projects/[id]/portal` (member), `/share/[token]` (public)
**Spec history:** specs/006-client-portal (shipped 2026-06-10)

## What it does (user terms)

Each project has a **Portal** the team uses to show a client what’s been built. Members create named **blocks** (App, Backend, Website…) and fill them with **feature cards** — title, description, and a status (Delivered / In progress / Planned / Proposed). Members manage a **share link**: create, copy, rotate, or revoke it. A client opens that link — **no account** — to read everything and respond in place: comment on a card, attach a file (≤ 10 MB), or **propose a feature** (which lands as a Proposed card the team accepts by re-statusing, or archives). This is the only part of progixHub a non-member can ever reach.

## How it works (the non-obvious 20%)

- **First external trust tier (ADR-0010).** Everything else is gated on `app_metadata.is_member`. The portal’s public face is different: the anonymous client holds an unguessable 256-bit token in the URL, stored **only as its SHA-256** (`portal_share_links.token_hash`). The `anon` role has **zero table grants** — its entire surface is four `SECURITY DEFINER` RPCs (`portal_public_view/comment/propose/record_attachment` in `supabase/migrations/0005_portal.sql`). Each resolves the token → exactly one live project and scopes all I/O to it; helper functions are revoked from every API role; all pin `search_path = ''`.
- **One active link per project**, enforced by a partial-unique index (`(project_id) where revoked_at is null`). **Rotate = revoke-then-insert**; a revoked or rotated-away token resolves to nothing, so the share page shows the friendly “no longer active” screen — never an error or any data.
- **Abuse guards live in the database + the action.** A 10-writes/min/project rate limit and hard row caps are enforced inside the RPCs. A hidden honeypot field (`website`) silently drops bots in `public-actions.ts`. Client text renders as inert React (no `dangerouslySetInnerHTML`); downloads force `Content-Disposition: attachment`.
- **Client uploads are the first sanctioned production use of the service-role key.** Storage policies can’t check an app token, so `submitPortalAttachmentAction` validates the token, **rate-gates before uploading** (so a valid-token client can’t burn Storage with files the RPC would reject), then uploads via `src/lib/supabase/admin.ts` (`server-only`, fails closed) to `portalId/uuid/safeName`, and finally records the row through the RPC — which re-checks the path prefix, MIME, card↔project, and caps. The bucket re-enforces size + MIME.
- **Two faces, one model.** The member page reads via the RLS client (`data.ts`); the share page reads via the single anon RPC (`public-data.ts`, token shape-gated before the call). Member mutations `revalidatePath` the portal; client actions `router.refresh()`. The share page uses standalone chrome (no `AppShell`) so no member UI/data is in its bundle; `/share` is in the middleware public-path list.

## Decisions & gotchas

- 2026-06-10 — **Member side superseded by roles (008):** the member-facing `portal_*` table policies are now per-project — read = any project role, write = **pm/developer/video_editor** (a viewer is read-only). The **external client/anon share-token model is unchanged** (still the four `anon` DEFINER RPCs, zero table grants). See [roles-permissions.md](roles-permissions.md).
- 2026-06-10 — `image/svg+xml` stays in the whitelist **only because** downloads force attachment disposition (`createSignedUrl(..., { download: true })`), so an SVG can’t run script inline. The invariant is commented in `types.ts`; if that flag is ever dropped, remove SVG.
- 2026-06-10 — Member-side actions return **generic localized errors**, not raw Postgres messages (no schema leak) — the public actions map RPC raises (`portal_rate_limited`, `portal_invalid_token`, `portal_cap_reached`) to friendly copy.
- `getMemberAttachmentUrlAction` scopes by `id` alone — correct under the current **flat membership** model; revisit if per-project member scoping ever lands.
- The token appears in the URL (may hit logs) — accepted per ADR-0010; **rotation is the mitigation**.
- Gotcha (e2e): `e2e/portal.spec.ts` drives a member session **and a fresh `browser.newContext()`** (a real account-less client); it archives its created project in `afterEach` to keep the shared dev/prod DB clean.

## CUJs covered

- CUJ-06 — Share the portal: member builds blocks/cards + link → client views, comments, attaches, proposes → member triages → rotate kills the old link (`e2e/portal.spec.ts`)
