import { metadataCorsOptionsRequestHandler, protectedResourceHandler } from "mcp-handler";

// RFC 9728 — tells MCP clients that this resource (the /api/mcp server) is protected and which
// OAuth authorization server issues its tokens. Supabase Auth is the authorization server (its
// metadata lives at <project>/.well-known/oauth-authorization-server/auth/v1).
const SUPABASE_AUTH_SERVER = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`;

const handler = protectedResourceHandler({ authServerUrls: [SUPABASE_AUTH_SERVER] });
const optionsHandler = metadataCorsOptionsRequestHandler();

export { handler as GET, optionsHandler as OPTIONS };
