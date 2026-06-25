# Spec 031 — MCP project-configuration tools

- **Status:** shipped
- **Type:** feature · **Owner:** Achref Arabi · **Date:** 2026-06-25
- **Builds on:** spec 023/027 (MCP), env-vars (encrypted store), documents, reports.

## Problem

The MCP could plan, but a project's real configuration (env, docs, reports) lived only in the repo. Let an AI agent working in a project repo push that truth INTO the hub.

## Desired behavior (new MCP tools)

- `post_daily_report(projectId, content_md)` — posts a markdown daily report (+ activity event).
- `add_document(projectId, title, body?|url?)` — adds a markdown note (or a link).
- `upload_env(projectId, dotenv, scope?)` — uploads a `.env`: each var encrypted at rest (AES-256-GCM, reusing the env-vars store), duplicates skipped, frontend scope auto-detected from NEXT*PUBLIC*/EXPO*PUBLIC* prefixes. PM/developer only.

## Acceptance criteria

- **AC-1:** All tools token-gated + project-access-gated (env requires pm/developer via has_project_access_for).
- **AC-2:** upload_env stores ciphertext (never plaintext), bound to the row id (AAD), with an audit row per var.
- **AC-3:** Writes go to the existing tables (project_reports, documents, env_vars/secrets) so the hub UI shows them.

## Security

New `create_env_var_for(p_user,…)` RPC (migration 0039) mirrors create_env_var with an explicit-user gate (service_role only). Encryption stays app-side. Secrets never returned by these tools.

## CUJ

Extends CUJ-15: AI agents configure a project (env/docs/reports) from its repo.
