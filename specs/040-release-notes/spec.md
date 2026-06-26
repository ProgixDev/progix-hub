# Spec 040 — Release notes

- **Status:** shipped
- **Type:** feature · **Owner:** Achref Arabi · **Date:** 2026-06-26

## Problem

No client-facing changelog: clients can't see "what shipped" without asking.

## Desired behavior

On the project page, a "Release notes" section where PMs compose dated entries (version + title + markdown body), optionally **AI-drafted** from recent shipped work (reusing OpenAI). Published entries appear on the client portal as a "What's new" section.

## Acceptance criteria

- **AC-1:** `release_notes` table (migration 0047); members read, PMs write (RLS).
- **AC-2:** `portal_release_notes(p_token)` RPC (SECURITY DEFINER, token-gated, whitelisted fields) exposes only published entries to the client — mirrors portal_roadmap.
- **AC-3:** AI draft (`draftReleaseNoteAction`) is PM-gated, sends only shipped-task titles + activity summaries to OpenAI (no secrets), fails gracefully without a key.
- **AC-4:** Bodies rendered sanitized (rehypeSanitize) on both the team page and the anon portal.
