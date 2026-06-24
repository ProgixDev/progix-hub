# Plan 015 — Platform registry (org-wide)

- **Spec:** [spec.md](spec.md) (all open questions resolved: yes)
- **Author:** Claude (Opus 4.8) · **Date:** 2026-06-24

## Approach

A new `platforms` slice backed by one org-wide table, surfaced as a CRUD area at `/settings/platforms`. It follows the canonical slice shape (store factory + provider for the create/edit modal, server actions, server-only data reads) — closest existing analogue is the projects slice (modal + list + zod-validated actions). The interesting part is the **one-of-three access pattern with conditional required fields**: that lives as a pure, unit-tested validator in `lib.ts` (so AC-2/AC-5 are proven without a DB), and the same shape drives both the zod action schema and the form. Authorization is double-gated like the rest of the app: server actions check `isSuperadmin || isGlobalPm` (spec 014) before mutating, and RLS policies (`is_superadmin() or is_global_pm()` for write, any member for read) are the backstop (AC-4). Logos reuse the spec-003 service id set with a lettered fallback. No new dependency, no boundary change → **no ADR**.

## Placement (per `docs/architecture/module-boundaries.md`)

| What          | Where                                                              | Notes                                                                                                                       |
| ------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Route         | `src/app/settings/platforms/page.tsx` (+ `loading`/`error`)        | thin RSC; gates to members (view), passes `canManage` to the UI                                                             |
| Settings link | `src/app/settings/page.tsx` (edit)                                 | a "Platforms" link/card to `/settings/platforms`                                                                            |
| Slice         | `src/features/platforms/`                                          | `types.ts`, `lib.ts` (+test), `data.ts`, `actions.ts` (+test), `store.ts`/`provider.tsx` (+test), `components/`, `index.ts` |
| DB            | `supabase/migrations/0018_platforms.sql`                           | org-wide `platforms` table + RLS (member read; superadmin/global-PM write)                                                  |
| Shared        | reuse `src/components/brand/surface-glyphs` + env-vars service set | logo options + fallback                                                                                                     |

## Data & state

- **Table `platforms`** (org-wide, no project_id): `id`, `name`, `service_id` (nullable logo key), `access_pattern` (`invite_collaborator|store_key|diy`), `critical bool`, `steps text[]`, `video_url`, `invite_url`/`invite_role`/`invite_email` (invite pattern), `key_label` (store-key pattern), `disabled bool`, audit cols. RLS: `select` any member; `insert/update/delete` `is_superadmin() or is_global_pm()`.
- **Server data:** `listPlatforms()` (all, ordered), `canManagePlatforms()` (`isSuperadmin || isGlobalPm`) — server-only.
- **Client state:** a per-mount store for the create/edit modal (mode + the platform being edited), mirroring the projects store. No server data cached client-side.
- **Actions (`"use server"`, zod-validated, authorize-then-mutate):** `createPlatformAction`, `updatePlatformAction`, `deletePlatformAction`, `setPlatformDisabledAction`. Each: `requireMember` + `isSuperadmin||isGlobalPm`, parse via the access-pattern-aware schema, return result objects with field errors.

## Acceptance criteria → verification mapping

| AC   | Proven by                                                                                                     |
| ---- | ------------------------------------------------------------------------------------------------------------- |
| AC-1 | unit: `actions.test.ts` (create happy path persists all fields) · e2e: `e2e/platforms.spec.ts` add step       |
| AC-2 | unit: `lib.test.ts` `requiredFieldsFor(pattern)` + schema accepts/rejects per-pattern field sets              |
| AC-3 | unit: `actions.test.ts` (update + disable + delete) · store.test (modal open/edit/close)                      |
| AC-4 | unit: `actions.test.ts` (non-admin → notAuthorized, admin client/DB not touched) · RLS policy (write gated)   |
| AC-5 | unit: `lib.test.ts` / `actions.test.ts` (missing invite_url, malformed video URL → per-field error, no write) |

## Risks & unknowns

- **Service logo coverage** — the spec-003 glyph set is small (Notion/Slack/GitHub/Live) vs the env-vars service id list; for ids without art we render a lettered badge fallback. No blocker.
- **Conditional schema drift** — the form, the zod schema, and the RLS-agnostic validator must agree on per-pattern required fields; centralize the requirement map in `lib.ts` and derive all three from it.
- **`steps` as `text[]`** — simple ordered list; the form edits newline-separated text and maps to/from the array. Re-ordering UI is out of scope (steps are entered in order).

## Overlap check

Active specs touching the same areas: the **settings** route/page is edited (one link added) — no other active spec is mid-flight on it (005 shipped; 010's settings edit merged). The new `platforms` slice + `/settings/platforms` route + `0018` migration are net-new. **No conflict** — forward-only on main.
