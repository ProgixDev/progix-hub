# Tasks 016 — Tutorials (video library)

Ordered, checkboxed. Tick on commit. `[P]` = parallel-safe. ≤ ~30 min each.

## Phase 1 — core

- [x] T1 `types.ts` + `lib.ts`: `Tutorial`, `embedUrlFor(url)` (YouTube/Loom/Vimeo → canonical embed src, else null), zod `tutorialInputSchema` (title required; link must resolve via embedUrlFor) · done: `lib.test.ts` covers each host + rejection (AC-1/AC-5)
- [x] T2 Migration `0020_tutorials.sql`: `tutorials` table + RLS (member select; admin write) · done: applies
- [x] T3 `data.ts`: `listTutorials()` + `canManageTutorials()` (server-only) · done: typechecks
- [x] T4 `actions.ts`: `create/update/delete` (requireMember + isSuperadmin||isGlobalPm, schema) · done: `actions.test.ts` (create, non-admin refusal, bad link) (AC-3/AC-4/AC-5)
- [x] T5 `store.ts`+`provider.tsx` (+`store.test.ts`): create/edit modal
- [x] T6 [P] `components/tutorial-player.tsx`: iframe from `embedUrlFor` (computed src only) · done: renders embed
- [x] T7 `components/tutorial-form.tsx` + `tutorials-library.tsx`: form (title, link, platform tag, language, show-to-clients) + library grid with players, tags, admin controls · done: renders; read-only for non-admins
- [x] T8 Route `src/app/tutorials/page.tsx` (+ loading/error); sidebar "Tutorials" item + `VideoIcon`; copy EN/FR · done: page serves, reachable from sidebar

## Phase 2 — verification

- [x] T9 E2E `e2e/tutorials.spec.ts`: open Tutorials (member, read-only) → assert library renders; if an embed exists assert the iframe src is a youtube/vimeo/loom embed. Capture screenshots (Playwright now installed) · done: `FEATURE=016-tutorials pnpm e2e:shots` green
- [x] T10 `pnpm verify` green

## Phase 3 — review & ship

- [ ] T11 `/review` (appsec: iframe src safety, write gating); fix P0/P1
- [ ] T12 PR; merge; deploy; `/update-docs` (CUJ + spec shipped). Manually add the test tutorial (`youtu.be/8VLGMiM-mm8`) to prod via the UI/DB to confirm live embed.

## AC coverage

- [ ] AC-1 → T1,T9 · [ ] AC-2 → T1,T7 · [ ] AC-3 → T4 · [ ] AC-4 → T2,T4 · [ ] AC-5 → T1,T4
