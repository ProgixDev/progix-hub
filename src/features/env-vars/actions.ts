"use server";

import { requireMember } from "@/lib/auth/session";
import { envVarInputSchema } from "./types";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const NOT_AUTHORIZED: ActionResult = { ok: false, error: "You aren’t authorized to do that." };

/**
 * Stub — fleshed out in T12 (calls the create_env_var RPC with an encrypted blob).
 * Validates input even as a stub so the painted-door shell cannot mutate.
 */
export async function createEnvVarAction(
  _projectId: string,
  input: unknown,
): Promise<ActionResult> {
  const member = await requireMember();
  if (!member) return NOT_AUTHORIZED;

  const parsed = envVarInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields." };

  return { ok: true };
}
