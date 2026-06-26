# Spec 039 — Real notifications

- **Status:** shipped
- **Type:** feature · **Owner:** Achref Arabi · **Date:** 2026-06-26

## Problem

The activity feed exists but there's no at-a-glance "you have new activity" — users must open /activity to check.

## Desired behavior

A bell in the top bar shows an unread badge. Opening it reveals the latest events and marks everything read (badge clears). "View all" links to /activity. Per-user read state; a user's own actions never count as unread.

## Acceptance criteria

- **AC-1:** `notification_reads` (per-user last_seen_at; migration 0046) with own-row RLS.
- **AC-2:** `unread_notification_count()` RPC is SECURITY INVOKER — counts only activity_events the caller can see (RLS), newer than last_seen_at, excluding their own.
- **AC-3:** The bell self-fetches (client), badges the count, and marks read on open.
- **AC-4:** No secrets; notification items are member-readable activity summaries (plain text).
