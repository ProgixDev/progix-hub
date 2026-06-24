# Plan 016 — Tutorials (video library)

- **Spec:** [spec.md](spec.md) (all open questions resolved: yes)
- **Author:** Claude (Opus 4.8) · **Date:** 2026-06-24

## Approach

A `tutorials` slice over one table, surfaced at `/tutorials` with a new sidebar item. The crux is **safe embedding**: a pure `embedUrlFor(url)` parses only YouTube / Loom / Vimeo URLs into their canonical `embed` iframe src and returns `null` for anything else — the zod schema rejects on `null` (AC-5), and the player only ever renders a computed embed src (never the raw user URL), so no arbitrary-iframe / `javascript:` vector. Shape mirrors the platforms slice (015): store+provider modal, server actions gated to superadmin/global PM, RLS backstop, member read. Logos/tags reference the platform `service_id` set. Uploads are deferred (embed-only v1). No new dependency → no ADR.

## Placement

| What    | Where                                                    | Notes                                                                                                                                           |
| ------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Route   | `src/app/tutorials/page.tsx` (+ `loading`/`error`)       | member-gated RSC; loads tutorials + canManage                                                                                                   |
| Sidebar | `src/components/app-shell/sidebar.tsx` (+ a `VideoIcon`) | a "Tutorials" nav item for every member                                                                                                         |
| Slice   | `src/features/tutorials/`                                | `types`, `lib`(+test: embedUrlFor + schema), `data`, `actions`(+test), `store`/`provider`(+test), `components/`(manager, form, player), `index` |
| DB      | `supabase/migrations/0020_tutorials.sql`                 | `tutorials` table + RLS (member read; admin write)                                                                                              |

## Data & state

- **Table `tutorials`:** `id`, `title`, `description`, `platform_service_id` (nullable tag), `embed_url`, `language` (`en|fr` nullable = both), `visible_to_clients bool`, `created_by`, timestamps. RLS: `select` any member; `insert/update/delete` `is_superadmin() or is_global_pm()`.
- **Server:** `listTutorials()`, `canManageTutorials()` (server-only).
- **Client state:** create/edit modal store (mirror platforms).
- **Actions:** `create/update/delete` — `requireMember` + admin guard, zod (title + `embedUrlFor` non-null), result objects.

## Acceptance criteria → verification mapping

| AC   | Proven by                                                                                                                                         |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1 | unit: `lib.test.ts` (embedUrlFor: youtu.be / watch / embed → canonical) · e2e: `e2e/tutorials.spec.ts` add the test YouTube link → iframe present |
| AC-2 | unit: schema accepts tag/language/visible flags · e2e: tag shows on the card                                                                      |
| AC-3 | unit: `actions.test.ts` (update + delete)                                                                                                         |
| AC-4 | unit: `actions.test.ts` (non-admin refused, DB untouched) · RLS write policy                                                                      |
| AC-5 | unit: `lib.test.ts` (vimeo? loom? random/`javascript:` → null → schema rejects) + `actions.test.ts`                                               |

## Risks & unknowns

- **Embed host quirks** — YouTube `youtu.be`, `watch?v=`, `/embed/`, `/shorts/`; Loom `/share/`; Vimeo numeric id. Cover these in `embedUrlFor` + tests; unknown hosts → reject.
- **iframe safety** — render only the computed `https://www.youtube.com/embed/…` / `player.vimeo.com` / `loom.com/embed` src, with a minimal `allow`; never the raw input. DB stores the original link; the player derives the src each render.
- **Playwright** — now installed; the e2e adds the provided test URL (`youtu.be/8VLGMiM-mm8`) and asserts the iframe src resolves to the YouTube embed.

## Overlap check

Active/shipped specs on the same areas: 015 (platforms) — tutorials only _references_ a platform `service_id` (no edit); the sidebar gets one additive nav item. **No conflict** — net-new slice + route, forward-only on main.
