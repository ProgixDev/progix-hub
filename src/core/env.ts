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
});

export const env = serverEnvSchema.parse(process.env);
