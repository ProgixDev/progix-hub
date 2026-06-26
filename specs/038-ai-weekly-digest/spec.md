# Spec 038 — AI weekly digest

- **Status:** shipped
- **Type:** feature · **Owner:** Achref Arabi · **Date:** 2026-06-26

## Problem

A team scaling across many projects needs a fast read on each project's week without reading every report.

## Desired behavior

On a project page, a "Weekly digest" card shows an AI-generated markdown summary of the project's past 7 days (daily reports + activity + task progress), with sections: Highlights, Progress, Risks & blockers, Next week. A PM/admin generates it on demand; any member reads it.

## Provider

Built on **OpenAI** (the studio has OpenAI credits, not Claude). Model via `OPENAI_DIGEST_MODEL` (default `gpt-4o`), key via `OPENAI_API_KEY` (server-only). Cost is ~$1/mo for the whole org at GPT-4o.

## Acceptance criteria

- **AC-1:** `project_digests` table (migration 0045); members read, PMs insert (RLS).
- **AC-2:** `generateDigestAction` gathers the week, calls OpenAI, stores the digest; gated to PM / global-PM / superadmin.
- **AC-3:** OpenAI key is server-only; no env-var values or secrets are sent to OpenAI (only reports/activity/task counts).
- **AC-4:** The digest renders sanitized markdown (rehypeSanitize); fails gracefully when the key is absent.
