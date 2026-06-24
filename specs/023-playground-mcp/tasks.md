# Tasks — Spec 023 Playground MCP

- [x] Migration: `mcp_tokens` (hashed, own-RLS) + `has_project_access_for(user,project,roles)`
- [x] `src/lib/mcp/auth.ts` — generate/hash/resolve token (service-role, rejects revoked)
- [x] `src/lib/mcp/tools.ts` — list_projects, get_plan, create_item, link, set_status, bulk_create_plan (each access-gated)
- [x] Route `/api/mcp` via mcp-handler + withMcpAuth (Bearer token → user)
- [x] Middleware: `/api/mcp` public (own Bearer auth, not the session gate)
- [x] `src/features/mcp-tokens` — create/revoke actions + data + Settings card (endpoint + mint/revoke)
- [x] Verify: 401 without token; real MCP client lists tools + bulk_create_plan → 3 phases/6 tasks/2 links rendered in playground
- [x] appsec review
- [ ] Ship: PR → CI → merge → deploy → docs closeout
- [ ] Follow-up: OAuth auth, live-reflect (Realtime postgres_changes), update/delete/move tools
