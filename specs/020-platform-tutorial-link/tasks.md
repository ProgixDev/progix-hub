# Tasks 020 — Link a tutorial to a platform

Ordered, checkboxed. Tick on commit. ≤ ~30 min each.

## Phase 1 — core

- [x] T1 Migration `0025_platform_tutorial.sql`: platforms `+ tutorial_id uuid references tutorials(id) on delete set null`; drop `video_url` + the `platforms_video_url_http` check; recreate `setup_public_view` to resolve the video from `p.tutorial_id` (embed + visible_to_clients only) · done: applies (AC-3/AC-4)
- [x] T2 `platforms/types.ts` + `lib.ts`: drop `video_url`, add `tutorial_id` (optional uuid) to schema · done: `lib.test.ts` green
- [x] T3 `platforms/actions.ts` `rowFrom`: persist `tutorial_id` (not video_url) · done: `actions.test.ts` green
- [x] T4 `components/tutorial-picker.tsx` + form: replace the video_url input with a button → modal listing `tutorialOptions`; select/change/clear; hidden tutorial_id · done: renders, selects
- [x] T5 Wire `tutorialOptions` from `/settings/platforms` (read `listTutorials`) → manager → form; copy EN/FR · done: picker lists real tutorials

## Phase 2 — verify & ship

- [x] T6 `pnpm verify` green
- [ ] T7 `/review` (appsec: client page shows only embed+client-visible chosen tutorial; no leak); fix P0/P1
- [ ] T8 PR; merge; deploy; `/update-docs` (spec shipped)

## AC coverage

- [ ] AC-1 → T2,T4 · [ ] AC-2 → T4 · [ ] AC-3 → T1 · [ ] AC-4 → T1
