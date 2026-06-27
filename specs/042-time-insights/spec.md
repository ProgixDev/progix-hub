# Spec 042 — Time insights

- **Status:** shipped
- **Type:** feature · **Owner:** Achref Arabi · **Date:** 2026-06-26

## Problem

The work clock collects hours but nothing surfaces them beyond today's running total. Weeks of tracked time sit unused.

## Desired behavior

A "Time" panel on /overview (org-directory viewers): per-member hours this week (with a 7-day bar sparkline) + last 30 days, sorted by week, with a team-week total. Per-member only — the clock has no project link, so this is not billing.

## Acceptance criteria

- **AC-1:** `team_work_hours(p_since)` RPC (migration 0049, SECURITY DEFINER, is_member-gated like work_status_all) returns per-member per-day worked seconds.
- **AC-2:** getTimeInsights aggregates into per-member week/month totals + a 7-day daily array (date math in the data layer, not render).
- **AC-3:** TimePanel renders on /overview for canViewOrgMembers only; members with no hours are omitted.

## Out of scope

Per-project time / billing — would need project attribution on the clock (a deliberate widget change).
