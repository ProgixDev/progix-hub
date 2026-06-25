# Spec 027 — MCP expansion (revise + feature blocks)

- **Status:** shipped
- **Type:** feature · **Owner:** Achref Arabi · **Date:** 2026-06-25
- **Builds on:** spec 023 (Playground MCP), 025 (feature blocks).

## Problem

The MCP could create plans but not revise them, and couldn't use the new feature-block catalog. Give AI clients the tools to edit and to drop prebuilt feature blocks.

## Desired behavior

New tools on `/api/mcp` (same token/OAuth auth, same per-op access gating):

- `update_task` — edit a card's title / status / estimate.
- `delete_item` — delete a card.
- `add_note` — add a sticky note.
- `list_features` — the 140-block catalog (keys + categories) so the model knows valid keys.
- `add_feature` — drop a feature block (Stripe, Twilio, …) as a rich card with its starter checklist, optionally inside a phase.
- The feature catalog moved to `src/lib/playground/feature-catalog.ts` (one source of truth for the UI and the MCP).

## Acceptance criteria

- **AC-1:** All new tools require a valid token and gate on project access (service-role client, `has_project_access_for`).
- **AC-2:** `add_feature` creates a feature card identical to the UI (meta + checklist), parented to a phase when given, staggered.
- **AC-3:** `update_task`/`delete_item` only affect items in projects the caller can access.
- **AC-4:** `list_features` returns the catalog without leaking project data.

## CUJ

Extends CUJ-15 (AI drafts a plan): the AI can now also revise plans and assemble them from feature blocks.
