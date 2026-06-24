# Tasks 015 — Platform registry (org-wide)

Ordered, checkboxed. Tick on commit. `[P]` = parallel-safe. ≤ ~30 min each.

## Phase 0 — setup

- [x] T0 Scaffold slice `src/features/platforms/` (`/new-module platforms` or by hand: types, lib, data, actions, store, provider, components, index, tests) · done: `pnpm typecheck` green

## Phase 1 — core behavior

- [x] T1 `types.ts` + `lib.ts`: `AccessPattern`, `Platform`, `requiredFieldsFor(pattern)`, and a zod `platformInputSchema` that requires each pattern's fields + validates video/invite URLs · done: `lib.test.ts` covers all three patterns incl. missing-field + bad-URL rejection (AC-2/AC-5)
- [x] T2 Migration `0018_platforms.sql`: org-wide `platforms` table + RLS (member `select`; `insert/update/delete` = `is_superadmin() or is_global_pm()`) · done: applies; a non-admin member cannot write (AC-4)
- [x] T3 `data.ts`: `listPlatforms()` + `canManagePlatforms()` (server-only) · done: typechecks, returns typed rows
- [x] T4 `actions.ts`: `create/update/delete/setDisabled` — `requireMember` + `isSuperadmin||isGlobalPm`, schema-parse, result objects · done: `actions.test.ts` covers create happy path, non-admin refusal, validation error (AC-1/AC-4/AC-5)
- [x] T5 `store.ts` + `provider.tsx`: create/edit modal state (mirror projects) · done: `store.test.ts` (open create/edit/close)
- [x] T6 [P] `components/platform-form.tsx`: create/edit form, access-pattern selector reveals that pattern's fields, logo picker (service set + fallback), critical toggle, steps (newline↔array), optional video URL · done: renders all patterns; invalid input shows per-field errors
- [x] T7 `components/platforms-manager.tsx`: list with logo + name + pattern + critical/disabled badges; add button; edit/disable/delete per row (only when `canManage`) · done: renders list + read-only for non-admins
- [x] T8 Route `src/app/settings/platforms/page.tsx` (+ `loading`/`error`): member-gated RSC, loads platforms + canManage, renders the manager; add a "Platforms" link on `/settings` · done: page serves; reachable from Settings
- [x] T9 Copy: `platforms.*` keys in `en.json` + `fr.json` · done: no raw keys render

## Phase 2 — verification

- [x] T10 E2E `e2e/platforms.spec.ts` (CUJ): Settings → Platforms → add (invite pattern) → edit → disable; assert it lists. Screenshots deferred (Playwright not installed) · done: spec written
- [x] T11 `pnpm verify` green; conventional commits

## Phase 3 — review & ship

- [x] T12 `/review` (appsec: write gated to superadmin/global-PM at RLS + action; no injection via steps/URLs); fix P0/P1
- [ ] T13 Open PR (spec+plan linked); after merge `/update-docs` (CUJ row, spec → shipped); apply migration + deploy

## AC coverage

- [ ] AC-1 → T4,T10 · [ ] AC-2 → T1 · [ ] AC-3 → T4,T5,T7 · [ ] AC-4 → T2,T4 · [ ] AC-5 → T1,T4
