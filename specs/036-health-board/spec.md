# Spec 036 — Cross-project health board

- **Status:** shipped
- **Type:** feature · **Owner:** Achref Arabi · **Date:** 2026-06-26

## Problem

A growing team needs oversight across many projects, not one at a time.

## Desired behavior

A new **/overview** page (nav "Overview") shows every project the user can access in one grid: status, roadmap % (tasks done/total), specs count, last report date, client setup/portal coverage, and team size. Each row links to the project.

## Acceptance criteria

- **AC-1:** `project_health()` RPC returns per-project aggregates, RLS-scoped (SECURITY INVOKER — a member sees only their projects; leads/superadmins see all via existing project RLS).
- **AC-2:** The board renders rows with a roadmap progress bar + config columns; empty state when none.
- **AC-3:** No secrets exposed (counts + names + dates only).

## CUJ

A lead opens Overview to see every project's progress and what's unconfigured.
