# Tasks 021 — Daily reports

- [x] T1 Migration `project_reports` + RLS (members rw, no anon)
- [x] T2 Slice: types, data (listProjectReports, listReportableProjects), actions (create + list-projects)
- [x] T3 `DailyReportButton` (top-bar trigger + shared Modal: project select + markdown/.md load)
- [x] T4 `ReportsSection` (project page, react-markdown + rehype-sanitize, `.md-body` styles)
- [x] T5 Plumb `reportSlot` through app-shell → pages; wire ReportsSection into project page; copy EN/FR
- [x] T6 `pnpm verify` green
- [x] T7 `/review` (appsec: RLS members-only, no anon, safe markdown, action authz)
- [x] T8 PR; merge; deploy; `/update-docs` (spec shipped + CUJ)
