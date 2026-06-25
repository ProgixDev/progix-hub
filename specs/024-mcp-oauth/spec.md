# Spec 024 — MCP OAuth (Supabase as authorization server)

- **Status:** shipped
- **Type:** feature · **Owner:** Achref Arabi · **Date:** 2026-06-25
- **Builds on:** spec 023 (Playground MCP). Adds OAuth 2.1 auth alongside personal tokens.

## Problem (the why)

The MCP v1 used personal tokens (manual paste). For a smoother, standards-based connect — Claude redirects the user to sign in + consent, tokens auto-refresh — the server should accept OAuth. Supabase Auth now ships a spec-compliant OAuth 2.1 server, so we don't build an authorization server; we make our MCP the **resource server**.

## Desired behavior (the what)

- The `/api/mcp` server accepts **either** a personal token (`pgx_mcp_…`) **or** a Supabase-issued access token (OAuth or session JWT). `resolveBearerUser` branches on the prefix; JWTs are validated by Supabase (`auth.getUser`, fail-closed, `aud=authenticated`).
- A public RFC 9728 endpoint `/.well-known/oauth-protected-resource` advertises Supabase (`<project>/auth/v1`) as the authorization server; a 401 returns `WWW-Authenticate` with `resource_metadata`, which triggers the MCP client's OAuth discovery.
- Downstream tools are unchanged — every op still gates on `has_project_access_for`, so a token only reaches its owner's projects.

## Acceptance criteria

- **AC-1:** A personal token still authenticates (no regression).
- **AC-2:** A valid Supabase user access token authenticates and is scoped to that user's projects.
- **AC-3:** No/expired/forged token → 401 with an RFC 9728 `WWW-Authenticate` challenge pointing at the protected-resource metadata.
- **AC-4:** The discovery endpoint returns `{ resource, authorization_servers: [<supabase>/auth/v1] }`.

## Out of scope / operator steps (one-time, dashboard)

- Enable **Authentication → OAuth Server** + **Dynamic Client Registration** in Supabase.
- Custom domain `hub.progix.pro` so the resource URL is stable (the code auto-derives origin, so it works on any host).

## CUJ impact

Extends CUJ-15 (AI drafts a plan): connecting an MCP client can now use OAuth sign-in instead of a pasted token.
