# Plan 020 — Link a tutorial to a platform

- **Spec:** [spec.md](spec.md) (open questions resolved: yes)
- **Author:** Claude (Opus 4.8) · **Date:** 2026-06-24

## Approach

Replace the platform's free-text `video_url` with a `tutorial_id` FK (`on delete set null`, so deleting a tutorial just clears the link — AC-4). The form's tutorial row becomes a **button + picker modal**: the platforms Settings page (app layer — allowed to read both features) fetches the tutorial list and passes `tutorialOptions` to the manager → form; the picker is a nested modal listing title + tag, selecting sets a hidden `tutorial_id` and shows the title. The client setup page's `setup_public_view` swaps its by-name tutorial match for the platform's chosen `tutorial_id`, still gated to embed + `visible_to_clients` (uploads/internal never reach the anon client). No new dep → no ADR.

## Placement

| What        | Where                                                                               | Notes                                                                                                                 |
| ----------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| DB          | `supabase/migrations/0025_platform_tutorial.sql`                                    | platforms: + `tutorial_id` FK, drop `video_url` + its check; recreate `setup_public_view` to resolve by `tutorial_id` |
| Type/schema | `platforms/types.ts`, `lib.ts` (drop video_url, add tutorial_id)                    | tutorial_id optional uuid                                                                                             |
| Action      | `platforms/actions.ts` `rowFrom` (tutorial_id instead of video_url)                 | unchanged authz                                                                                                       |
| Form        | `platforms/components/platform-form.tsx` + a `tutorial-picker.tsx`                  | button → modal of tutorials                                                                                           |
| Wiring      | `platforms/components/platforms-manager.tsx`, `src/app/settings/platforms/page.tsx` | page reads `listTutorials()` → `tutorialOptions`                                                                      |

## Acceptance criteria → verification mapping

| AC   | Proven by                                                                                                          |
| ---- | ------------------------------------------------------------------------------------------------------------------ |
| AC-1 | unit: schema accepts tutorial_id, no video_url · e2e/manual: picker modal lists + selects                          |
| AC-2 | form clears/changes selection → action persists tutorial_id or null                                                |
| AC-3 | DB: `setup_public_view` returns embed_url only for the chosen tutorial when embed + visible · existing setup tests |
| AC-4 | DB: `tutorial_id` FK `on delete set null` — deleting a tutorial clears the platform link                           |

## Risks & unknowns

- **Dropping `video_url`** — unused by any read path (the setup RPC matched by service_id, now by tutorial_id); drop its column + the `platforms_video_url_http` check (0019). Existing platform rows lose only an unused field.
- **Nested modal** — the picker opens over the platform form modal; manage focus/escape and z-index so both close cleanly.
- **Feature boundary** — platforms can't import tutorials; the tutorial list is passed in as plain `tutorialOptions` from the page (same pattern as the tutorials platform-tag options).

## Overlap check

Extends 015 (platforms) + updates the 017 setup RPC; both shipped, no active spec mid-flight on them. The tutorials slice is read-only via passed-in options. Forward-only on main.
