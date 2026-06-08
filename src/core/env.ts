import "server-only";
import { z } from "zod";

/**
 * Server-side environment access — the ONLY place process.env is read.
 * `server-only` makes importing this from a client component a build error,
 * which is exactly the failure mode we want (secrets can't drift client-side).
 * Client-exposed values must be NEXT_PUBLIC_* and added to the separate schema below.
 */
const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // Supabase data layer (ADR-0006). Optional until the data-layer spec wires them,
  // so the build stays green before secrets are provisioned. Mirror in .env.example.
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  // Public Supabase values (URL + anon key) are exposed as NEXT_PUBLIC_* and read at the
  // client boundary, never here — server-only forbids importing this from a client component.
});

export const env = serverEnvSchema.parse(process.env);
