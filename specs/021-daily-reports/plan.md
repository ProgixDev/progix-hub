# Plan 021 — Daily reports

- **Spec:** [spec.md](spec.md) · **Author:** Claude (Opus 4.8) · **Date:** 2026-06-24

## Approach

New `src/features/reports` slice + `project_reports` table (markdown + author_label + created_at,
RLS to project members via `has_project_access`, no anon). A top-bar **Daily report** button (a
plumbed `reportSlot`, since the shared top bar can't import a feature) opens the shared `<Modal>`:
project picker (lazy-loaded via a server action, RLS-scoped) + a markdown textarea that can be
filled by typing or loading a `.md` file. Save → `createReportAction` (zod, access re-checked,
author denormalized). The project page renders its reports newest-first via `react-markdown` +
`rehype-sanitize` (already deps; safe, no raw HTML) styled by a `.md-body` class.

## Placement

| What         | Where                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------- |
| DB           | `supabase/migrations/0027_project_reports.sql`                                                                |
| Slice        | `src/features/reports/{types,data,actions,index}.ts` + `components/{daily-report-button,reports-section}.tsx` |
| Top-bar slot | `app-shell.tsx`/`app-frame.tsx`/`top-bar.tsx` gain `reportSlot`; pages pass `<DailyReportButton/>`            |
| View         | `ReportsSection` on `src/app/projects/[id]/page.tsx`                                                          |

## AC → verification

- AC-1 add → button → modal (select + markdown/file) → `createReportAction`; manual + screenshot.
- AC-2 read → `ReportsSection` renders markdown newest-first.
- AC-3 access → RLS `has_project_access`; picker uses RLS-scoped `projects`; action re-checks `getProjectRole`.
- AC-4 validation → zod (project uuid + non-empty); `rehype-sanitize` strips unsafe HTML.

## Risks

- react-markdown in RSC — verified it builds/renders. Author name denormalized (no joinable user table).
