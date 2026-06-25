# Tasks — Spec 024 MCP OAuth

- [x] `resolveBearerUser` — PAT or Supabase JWT (validated, fail-closed, aud=authenticated)
- [x] Route uses resolveBearerUser (dual auth, PAT regression-safe)
- [x] `/.well-known/oauth-protected-resource` (RFC 9728) → Supabase auth server
- [x] Middleware: `/.well-known` public
- [x] Verify: discovery JSON ok; 401 WWW-Authenticate ok; PAT + Supabase JWT both connect via real MCP client
- [x] appsec (APPROVE, no P0/P1) + P2 aud check
- [ ] Ship: PR → CI → merge → deploy
- [ ] Operator: enable Supabase OAuth Server + DCR; add hub.progix.pro
