# Spec 021 — Daily reports

- **Status:** shipped
- **Type:** feature
- **Owner:** Achref Arabi, founder · **Date:** 2026-06-24
- **Slice:** new `src/features/reports`; a top-bar trigger slot; a reports section on the project page; migration (`project_reports`). Reads `listProjects`.

## Problem (the why)

The team writes daily progress notes, but there's no in-app home for them. They want a fast path: a button → pick a project → drop in a markdown report → done — readable later by anyone on that project.

## Desired behavior (the what)

A **Daily report** button sits in the top bar, **next to "Start working."** Clicking it opens a modal: choose a project (from the ones you have access to), then write or **load a `.md` file** of the report. Save stores it against that project, stamped with the author + time. On a project's page, a **Reports** section lists its reports (newest first), each rendered as formatted markdown. Reports are **team-only** (project members), never client-facing.

## Acceptance criteria

- **AC-1 (add):** From the top-bar button, a member picks one of their accessible projects, enters markdown (typed or loaded from a `.md` file), and saves — the report is stored against that project with author + timestamp.
- **AC-2 (read):** The project page shows that project's reports, newest first, rendered as formatted markdown.
- **AC-3 (access — non-happy):** Only members with access to a project can add or read its reports (RLS); no anon path. The project select only lists projects the user can access.
- **AC-4 (validation — non-happy):** Saving with no project or empty content is rejected with a clear message; markdown is rendered safely (no script/HTML injection).

## Out of scope

- Editing/versioning a report (add a new one instead), comments, scheduling, export.
- A global cross-project reports dashboard (project-scoped for v1).
- Auto-generating reports from activity (that stays the repo `/daily-report` skill).

## CUJ impact

- New CUJ — "Post a daily report" (top-bar → pick project → markdown → save → read on the project).

## Open questions

Resolved: stored in DB (`project_reports`, markdown text); RLS to project members (all roles), no anon; rendered with the existing `react-markdown` + `rehype-sanitize` (safe, no raw HTML); the top-bar button is a plumbed slot (like `clockSlot`) since the shared top bar can't import a feature.
