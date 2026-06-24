# Spec 023 — Playground MCP (AI drafts plans)

- **Status:** shipped
- **Type:** feature · **Owner:** Achref Arabi · **Date:** 2026-06-25
- **Slice:** `src/lib/mcp` (auth + tools), route `/api/[transport]` (mcp-handler), `src/features/mcp-tokens` (Settings UI + actions), migration `mcp_tokens` + `has_project_access_for`.

## Problem (the why)

The playground is a rich planning canvas, but plans are built by hand. An MCP server lets any AI client (Claude Desktop/Code, claude.ai) **draft a whole project plan into the playground** by calling tools — composable with other MCPs (e.g. read a PRD from Notion → build the plan here).

## Desired behavior (the what)

A remote MCP server at `/api/mcp` (Streamable HTTP) exposes playground tools. Auth is a **personal token** (v1): a member creates a token in Settings → MCP (shown once, hashed at rest, revocable), pastes it into their MCP client; the server resolves it to that member and acts **as them**, gated by `has_project_access_for`. Tools: `list_projects`, `get_plan`, `create_task`/`create_phase`/`create_note`, `link_tasks`, `set_status`, and `bulk_create_plan` (lay down a structured plan in one call). Items appear in the playground (manual refresh in v1; live-reflect is a fast-follow).

## Acceptance criteria

- **AC-1:** With a valid token, an MCP client can list the member's projects, read a project's plan, and create tasks/phases/links — they persist and show in the playground.
- **AC-2 (bulk):** `bulk_create_plan` creates a multi-phase plan (phases as frames, tasks inside, optional dependency links) in one call, laid out readably.
- **AC-3 (access — non-happy):** A token only works for projects its owner can access (`has_project_access_for`); an invalid/revoked token is rejected; no anon/no-token access.
- **AC-4:** Tokens are hashed at rest, shown once, listable + revocable by their owner in Settings.

## Out of scope (later)

- OAuth (v2 auth), live-reflect via Realtime postgres_changes, update/delete/move tools, resources/prompts, rate limiting.

## CUJ impact

- New CUJ — "AI drafts a plan" (create token → MCP client calls bulk_create_plan → plan appears).

## Open questions

Resolved: PAT auth for v1 (OAuth later); service-role MCP client + explicit `has_project_access_for(user,…)` per call (the user has no Supabase JWT in the MCP context); Streamable HTTP (SSE disabled, no Redis needed).
