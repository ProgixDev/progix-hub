# Spec 044 — Pricing catalog (Scoping & Pricing, step 1)

- **Status:** shipped (step 1 of the wizard)
- **Type:** feature · **Owner:** Achref Arabi · **Date:** 2026-06-27

## Why

Progix under-scopes and mis-prices client projects and eats scope creep. The fix (from agency research): scope feature-by-feature into a priced catalog → a quote + a cahier des charges that defines scope. This is **step 1**: the catalog itself.

## Behavior

A leadership-only `/pricing` page: every building block (seeded from the 141 feature blocks, extendable) with an editable **base price + effort (days)**, grouped by category, with totals. Later steps: the wizard (select → price + timeline) and the exports (quote + cahier des charges with scope-control clauses).

## Acceptance criteria

- **AC-1:** `pricing_catalog_items` (migration 0051); members read, leadership (superadmin/global-PM/lead) write (RLS).
- **AC-2:** `/pricing` gated to canManagePricing; non-leadership redirected.
- **AC-3:** Import seeds from FEATURE_BLOCKS (idempotent); inline price/effort edit; add custom items; delete custom.

## Next steps

2. The wizard (per-project feature selection → live price + effort → sprints/timeline).
3. Exports: quote + cahier des charges (scope, revision limits, change-order policy).
4. Accepted estimate → seed project phases/tasks; change requests re-priced.
