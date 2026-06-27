# Spec 043 — Milestones & deadlines

- **Status:** shipped
- **Type:** feature · **Owner:** Achref Arabi · **Date:** 2026-06-26

## Problem

Tasks had no due dates — the plan was a static board with no time pressure, and nothing surfaced what's due or overdue.

## Desired behavior

A due date on tasks (set in the playground inspector). The Today panel flags my due/overdue items; the cross-project health board shows an overdue count per project.

## Acceptance criteria

- **AC-1:** `plan_items.due_date` (migration 0050); editable via the inspector; persisted through the existing update action (validated YYYY-MM-DD).
- **AC-2:** getMyOpenTasks returns due_date + overdue (date math in the data layer); Today panel shows a "Due {date}" / red "Overdue" badge, due items sorted first.
- **AC-3:** project_health RPC returns an `overdue` count (not-done tasks past due); the health board shows an "{n} overdue" badge.
- **AC-4:** Snapshot restore preserves due_date (nullish — old snapshots still valid).
