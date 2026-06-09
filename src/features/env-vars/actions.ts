"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireMember } from "@/lib/auth/session";
import { decryptSecret, encryptSecret } from "@/lib/crypto/secrets";
import { createClient } from "@/lib/supabase/server";
import { envVarEditSchema, envVarInputSchema } from "./types";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export type RevealResult = { ok: true; value: string } | { ok: false; error: string };

const NOT_AUTHORIZED = "You aren’t authorized to do that.";
const DUPLICATE = "A variable with that key already exists in this project.";
const ENC_NOT_CONFIGURED = "Encryption isn’t configured — contact an admin.";

function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const flat = z.flattenError(error);
  const out: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flat.fieldErrors)) {
    const list = messages as string[] | undefined;
    if (list && list.length > 0) out[key] = list[0]!;
  }
  return out;
}

/** Create a variable (AC-1, AC-7): encrypt app-side, then the create_env_var RPC inserts + audits atomically. */
export async function createEnvVarAction(projectId: string, input: unknown): Promise<ActionResult> {
  const member = await requireMember();
  if (!member) return { ok: false, error: NOT_AUTHORIZED };
  if (!z.uuid().safeParse(projectId).success) return { ok: false, error: "Unknown project." };

  const parsed = envVarInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }

  const id = randomUUID();
  let ciphertext: string;
  try {
    ciphertext = encryptSecret(parsed.data.value, id);
  } catch {
    return { ok: false, error: ENC_NOT_CONFIGURED };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_env_var", {
    p_id: id,
    p_project_id: projectId,
    p_key: parsed.data.key,
    p_service: parsed.data.service ?? null,
    p_ciphertext: ciphertext,
  });
  if (error) {
    if (error.code === "23505")
      return { ok: false, error: DUPLICATE, fieldErrors: { key: DUPLICATE } };
    return { ok: false, error: error.message };
  }
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

/** Edit a variable (AC-8). A blank value keeps the stored secret; a new value is re-encrypted. */
export async function updateEnvVarAction(
  id: string,
  projectId: string,
  input: unknown,
): Promise<ActionResult> {
  const member = await requireMember();
  if (!member) return { ok: false, error: NOT_AUTHORIZED };
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Unknown variable." };

  const parsed = envVarEditSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }

  let ciphertext: string | null = null;
  if (parsed.data.value !== undefined) {
    try {
      ciphertext = encryptSecret(parsed.data.value, id);
    } catch {
      return { ok: false, error: ENC_NOT_CONFIGURED };
    }
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_env_var", {
    p_id: id,
    p_key: parsed.data.key,
    p_service: parsed.data.service ?? null,
    p_ciphertext: ciphertext,
  });
  if (error) {
    if (error.code === "23505")
      return { ok: false, error: DUPLICATE, fieldErrors: { key: DUPLICATE } };
    return { ok: false, error: error.message };
  }
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

/** Delete a variable (AC-8) — the delete_env_var RPC snapshots the key into the audit row first. */
export async function deleteEnvVarAction(id: string, projectId: string): Promise<ActionResult> {
  const member = await requireMember();
  if (!member) return { ok: false, error: NOT_AUTHORIZED };
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Unknown variable." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_env_var", { p_id: id });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

/**
 * Reveal or copy a value (AC-3, AC-4). The reveal_env_var RPC writes the audit row in the same
 * transaction and returns the ciphertext; we decrypt it here. The audit is recorded even if the
 * decrypt then fails (e.g. a rotated key).
 */
export async function revealEnvVarValueAction(
  id: string,
  intent: "reveal" | "copy",
): Promise<RevealResult> {
  const member = await requireMember();
  if (!member) return { ok: false, error: NOT_AUTHORIZED };
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Unknown variable." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reveal_env_var", { p_id: id, p_intent: intent });
  if (error) return { ok: false, error: error.message };
  if (typeof data !== "string") return { ok: false, error: "That variable could not be found." };

  try {
    return { ok: true, value: decryptSecret(data, id) };
  } catch {
    return {
      ok: false,
      error: "This value can’t be decrypted — the encryption key may have changed.",
    };
  }
}
