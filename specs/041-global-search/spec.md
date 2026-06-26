# Spec 041 — Global search (⌘K)

- **Status:** shipped
- **Type:** feature · **Owner:** Achref Arabi · **Date:** 2026-06-26

## Problem

The ⌘K palette was navigation-only — you couldn't find a project, doc, spec, task, person, or tutorial by name.

## Desired behavior

Typing ≥2 chars in the ⌘K palette searches across projects, documents, specs, tasks, members, and tutorials, RLS-scoped to what the caller can access, and navigates to the hit. Quick-action nav items still show.

## Acceptance criteria

- **AC-1:** `global_search(q)` RPC (migration 0048, SECURITY INVOKER) returns hits from projects/documents/specs/tasks/tutorials — only rows the caller can read (RLS).
- **AC-2:** `/api/search` route handler is auth-gated; members searched via the existing list_org_members RPC.
- **AC-3:** The palette debounces, shows typed results with a kind tag + subtitle, and navigates on select. No cross-tenant leakage.
- **AC-4:** ilike wildcards in the query are escaped (no injection / pattern abuse).
