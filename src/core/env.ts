import "server-only";
import { z } from "zod";

/**
 * Server-side environment access — the ONLY place process.env is read.
 * `server-only` makes importing this from a client component a build error,
 * which is exactly the failure mode we want (secrets can't drift client-side).
 * Client-exposed values must be NEXT_PUBLIC_* and validated in a separate client schema
 * (added when the data-layer spec lands) — never read public values through this module.
 */
const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // Supabase service-role secret (ADR-0006) — bypasses RLS, used only in narrowly-scoped
  // server code (e.g. the admin client that stamps org membership). Optional at parse time
  // so the build stays green before CI secrets are provisioned; the admin client asserts it
  // at call time. Mirror in .env.example. NEVER expose this client-side.
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  // Public Supabase values (NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY) are
  // exposed as NEXT_PUBLIC_* and read at the client boundary by the @supabase/ssr factories,
  // never through this server-only module.
  // Env-var encryption (spec 003, ADR-0007): a keyring — JSON map of version → base64 32-byte key —
  // plus the active version used for new writes. Optional at parse so builds stay green before the
  // secret is provisioned; src/lib/crypto/secrets.ts validates (32 bytes) and fails closed at use.
  // NEVER expose these client-side (no NEXT_PUBLIC_ prefix).
  ENV_VAR_ENCRYPTION_KEYS: z.string().min(1).optional(),
  ENV_VAR_ENCRYPTION_ACTIVE_VERSION: z.string().min(1).optional(),
  // GitHub member-activity integration (spec 012). A single org-read server token + the org's
  // GraphQL node id drive the contribution graph and commit list for every member — never a
  // per-user token (spec 012 token-model decision). Optional at parse so builds/CI stay green
  // before the secret is provisioned; the activity fetchers fail soft (null/[]) when either is
  // absent, so the profile shows an "unavailable" state rather than breaking. NEVER expose
  // client-side (no NEXT_PUBLIC_ prefix). `PROGIX_GITHUB_ORG` (read in features/auth/membership.ts)
  // names the org for the membership gate.
  GITHUB_TOKEN: z.string().min(1).optional(),
  GITHUB_ORG_ID: z.string().min(1).optional(),
});

export const env = serverEnvSchema.parse(process.env);
