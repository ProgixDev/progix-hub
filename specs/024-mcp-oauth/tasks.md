# Tasks — Spec 024 MCP OAuth

- [x] `resolveBearerUser` — PAT or Supabase JWT (validated, fail-closed, aud=authenticated)
- [x] Route uses resolveBearerUser (dual auth, PAT regression-safe)
- [x] `/.well-known/oauth-protected-resource` (RFC 9728) → Supabase auth server
- [x] Middleware: `/.well-known` public
- [x] Verify: discovery JSON ok; 401 WWW-Authenticate ok; PAT + Supabase JWT both connect via real MCP client
- [x] appsec (APPROVE, no P0/P1) + P2 aud check
- [ ] Ship: PR → CI → merge → deploy
- [x] OAuth consent screen `/oauth/consent` + decision route `/api/oauth/decision` (Supabase delegates the consent UI to the app)
- [x] Operator: enabled Supabase OAuth Server + DCR; project transferred to Pro org
- [ ] Operator: set Site URL to hub.progix.pro once DNS live
