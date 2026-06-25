# Spec 025 — Feature blocks (playground)

- **Status:** shipped
- **Type:** feature · **Owner:** Achref Arabi · **Date:** 2026-06-25
- **Builds on:** spec 022 (playground), real-time sync.

## Problem

The playground felt empty. Planning a build means listing the same integrations every time (Stripe, Twilio, Auth…). Give the team a palette of prebuilt feature blocks to drop onto a phase.

## Desired behavior

- A catalog of 110+ feature blocks across 20 categories (Payments, Auth, Email, Messaging, Push, Analytics, AI, Media, Storage, Database, Monitoring, Search, Maps, CMS, Infra, Productivity, Scheduling, Flags, Mobile, Support), each with a brand colour and a starter checklist.
- Dropping a block creates a **rich feature card**: brand monogram tile + category + an interactive checklist (progress on the card; toggle steps in the inspector).
- Two ways to add: a **side drawer** (search + category filter, drag a block onto a phase) and a **command palette** (⌘K → type → adds into the focused phase or the viewport).
- Cards sync live via the realtime channel; data stored in `plan_items.meta` (jsonb, migration 0034) — no per-block schema.

## Acceptance criteria

- **AC-1:** The drawer lists 110+ blocks grouped by category, searchable.
- **AC-2:** Dragging a block onto a phase, or ⌘K-adding it, creates a feature card with the brand tile, category, and a checklist.
- **AC-3:** Ticking checklist steps advances the card's progress bar and persists.
- **AC-4:** Feature cards behave like tasks elsewhere (board, inspector, links, realtime).

## Out of scope

Real brand SVG logos (monogram tiles for now); per-block custom checklists (category templates for now).

## CUJ

Extends CUJ-14 (plan in the playground): a member can assemble a plan from prebuilt feature blocks.
