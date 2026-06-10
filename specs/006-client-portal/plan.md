# Plan 006 — Client portal

- **Spec:** [spec.md](spec.md) (all open questions resolved: yes — autonomy grant)
- **Author:** Claude (agent) · **Date:** 2026-06-10

## Approach

A new `portal` slice with **two faces over one data model**. Member face: `/projects/[id]/portal` (member-gated like everything else) — blocks + feature cards CRUD via plain RLS, plus a share-link manager. Public face: `/share/[token]` — a standalone, AppShell-free page whose **entire** data access is four `SECURITY DEFINER` RPCs taking the raw token ([ADR-0010](../../docs/architecture/decisions/0010-client-portal-trust-tier.md)): `portal_public_view` (whole tree as JSON), `…_comment`, `…_propose`, `…_record_attachment`. Tokens are 256-bit random, stored **SHA-256-hashed**, one active per project, revocable/rotatable. Client uploads (≤ 10 MB, documents whitelist) post FormData to a server action that validates the token then uploads via a **server-only admin Storage client** — the first sanctioned production use of the service-role key, confined to `src/lib/supabase/admin.ts`. Rate limits (10 writes/min/project) and row caps live **inside the RPCs**; client forms carry a honeypot. `/share` joins the middleware public list. All new copy ships EN + FR per `docs/conventions/copy.md`.

## Placement (per `docs/architecture/module-boundaries.md`)

| What         | Where                                                   | Notes                                                                                    |
| ------------ | ------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Migration    | `supabase/migrations/0005_portal.sql`                   | 5 tables, member RLS, 4 public RPCs, `portal-attachments` bucket                         |
| Admin client | `src/lib/supabase/admin.ts`                             | `server-only`; service-role; used ONLY by portal public upload action                    |
| Slice        | `src/features/portal/`                                  | types/lib/data (member) · actions (member) · public-actions (token) · store · components |
| Member route | `src/app/projects/[id]/portal/{page,loading,error}.tsx` | thin RSC; back-link to project; entry link added on the project page                     |
| Public route | `src/app/share/[token]/{page,loading,error}.tsx`        | standalone chrome (no AppShell); friendly inactive-link screen                           |
| Middleware   | `src/lib/supabase/middleware.ts`                        | add `/share` to public paths (AC-9)                                                      |
| i18n         | `src/messages/{en,fr}.json`                             | new `portal` namespace                                                                   |

## Data & state

- **Tables:** `portal_share_links` (token_hash unique, revoked_at; partial-unique active per project) · `portal_blocks` (name, position, archived_at) · `portal_cards` (block_id, title, description, status ∈ delivered/in_progress/planned/proposed, origin ∈ team/client, client_author, archived_at) · `portal_comments` (card_id, author_kind, author_name, body ≤ 4000) · `portal_attachments` (card_id, file_path/name/size/mime, author_name). All deny-by-default; members SELECT/INSERT/UPDATE (no DELETE → archive); `anon` has **zero table grants** — only EXECUTE on the four RPCs.
- **Member data:** `data.ts` (server-only) loads share link + blocks→cards→comments/attachments via the RLS client.
- **Public data:** the page calls `portal_public_view(token)` (RPC, anon client — no session needed for DEFINER) server-side; invalid/revoked → `null` → inactive screen, no redirect, no data.
- **Client state:** UI-only store (open modal: add-block / add-card / edit-card / closed) mirroring the documents pattern.
- **Actions (member):** create/edit/archive block & card, set status, create/rotate/revoke share link — `requireMember` + zod + RLS client; raw token shown once via return value (only hash persists).
- **Actions (public):** comment / propose / attach — token + zod + honeypot; attach validates file then uploads via admin client to `portal-attachments/{projectId}/{uuid}/{name}` and records via RPC; download mints a signed URL (admin client, member path uses member client policy).

## Acceptance criteria → verification mapping

| AC                         | Proven by                                                                                                                  |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| AC-1 blocks & cards        | unit `actions.test.ts` (create/edit/status/archive) · component `portal-section.test.tsx` · e2e member side                |
| AC-2 link lifecycle        | unit `actions.test.ts` (create returns raw token, rotate revokes old, revoke) · e2e rotate → old URL shows inactive screen |
| AC-3 client view           | e2e: anonymous context opens `/share/<token>`, sees blocks/cards, **no app nav** · integration `portal_public_view`        |
| AC-4 client comment        | unit `public-actions.test.ts` · e2e client comments → visible to member                                                    |
| AC-5 client attach         | unit validate (size/MIME reject) · e2e client uploads a small PDF → member sees it; reject path unit-tested                |
| AC-6 client proposal       | unit `public-actions.test.ts` · e2e propose → Proposed card on both sides → member accepts (status → Planned)              |
| AC-7 security boundary     | integration: invalid/revoked token → null; anon direct table SELECT denied; RPC scoped to one project                      |
| AC-8 abuse guards          | integration: rate limit raises after N rapid writes · unit: honeypot drops silently · component: client text renders inert |
| AC-9 member gate vs public | e2e signed-out: `/projects/…/portal` → redirect; `/share/<bad>` → inactive screen (200, no redirect)                       |

## Risks & unknowns

- **Service-role key in prod env** — required by the upload action. Present in `.env.local` (integration tests) and Vercel (user confirmed at 003). Health-check style guard: the action fails closed with a friendly error if the key is absent.
- **RPC injection surface** — every public function takes untrusted input; all inputs parameterized (no dynamic SQL), zod-capped before the call, SQL CHECK caps after.
- **Rate-limit storms on serverless** — DB-count-based limiting is per-project and cheap (indexed `created_at`); caps are generous for humans, hostile to scripts.
- **Token in URL logs** — accepted per ADR-0010; rotation is the mitigation.
- **Page weight on the public route** — no AppShell, no Zustand, minimal islands (three small forms).

## Overlap check

No other spec is `active` (002–005 shipped). Touches shared `middleware.ts` (adds one public prefix) and the project page (adds a portal entry link) — both additive, no behavioral conflict.
