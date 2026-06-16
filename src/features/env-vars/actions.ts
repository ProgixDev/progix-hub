"use server";

import { randomUUID } from "node:crypto";
import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireMember } from "@/lib/auth/session";
import { decryptSecret, encryptSecret } from "@/lib/crypto/secrets";
import { createClient } from "@/lib/supabase/server";
import { serializeDotenv, type SerializeEntry } from "./lib";
import {
  ENV_EXPORT_SCOPES,
  envImportSchema,
  envVarEditSchema,
  envVarInputSchema,
  type EnvScope,
  type ExportResult,
  type ImportResult,
} from "./types";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export type RevealResult = { ok: true; value: string } | { ok: false; error: string };

export type ImportActionResult = ({ ok: true } & ImportResult) | { ok: false; error: string };

type Translate = Awaited<ReturnType<typeof getTranslations>>;

function fieldErrorsOf(error: z.ZodError, t: Translate): Record<string, string> {
  const flat = z.flattenError(error);
  const out: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flat.fieldErrors)) {
    const list = messages as string[] | undefined;
    if (list && list.length > 0) out[key] = t(list[0]!);
  }
  return out;
}

/** Create a variable (AC-1, AC-7): encrypt app-side, then the create_env_var RPC inserts + audits atomically. */
export async function createEnvVarAction(projectId: string, input: unknown): Promise<ActionResult> {
  const t = await getTranslations();
  const member = await requireMember();
  if (!member) return { ok: false, error: t("errors.notAuthorized") };
  if (!z.uuid().safeParse(projectId).success)
    return { ok: false, error: t("errors.unknownProject") };

  const parsed = envVarInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: t("errors.fixFields"),
      fieldErrors: fieldErrorsOf(parsed.error, t),
    };
  }

  const id = randomUUID();
  let ciphertext: string;
  try {
    ciphertext = encryptSecret(parsed.data.value, id);
  } catch {
    return { ok: false, error: t("envVars.errorNoEncryption") };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_env_var", {
    p_id: id,
    p_project_id: projectId,
    p_key: parsed.data.key,
    p_service: parsed.data.service ?? null,
    p_ciphertext: ciphertext,
    p_scope: parsed.data.scope,
  });
  if (error) {
    if (error.code === "23505") {
      const duplicate = t("envVars.errorDuplicate");
      return { ok: false, error: duplicate, fieldErrors: { key: duplicate } };
    }
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
  const t = await getTranslations();
  const member = await requireMember();
  if (!member) return { ok: false, error: t("errors.notAuthorized") };
  if (!z.uuid().safeParse(id).success) return { ok: false, error: t("envVars.errorUnknownVar") };

  const parsed = envVarEditSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: t("errors.fixFields"),
      fieldErrors: fieldErrorsOf(parsed.error, t),
    };
  }

  let ciphertext: string | null = null;
  if (parsed.data.value !== undefined) {
    try {
      ciphertext = encryptSecret(parsed.data.value, id);
    } catch {
      return { ok: false, error: t("envVars.errorNoEncryption") };
    }
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_env_var", {
    p_id: id,
    p_key: parsed.data.key,
    p_service: parsed.data.service ?? null,
    p_ciphertext: ciphertext,
    p_scope: parsed.data.scope,
  });
  if (error) {
    if (error.code === "23505") {
      const duplicate = t("envVars.errorDuplicate");
      return { ok: false, error: duplicate, fieldErrors: { key: duplicate } };
    }
    return { ok: false, error: error.message };
  }
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

/** Delete a variable (AC-8) — the delete_env_var RPC snapshots the key into the audit row first. */
export async function deleteEnvVarAction(id: string, projectId: string): Promise<ActionResult> {
  const t = await getTranslations();
  const member = await requireMember();
  if (!member) return { ok: false, error: t("errors.notAuthorized") };
  if (!z.uuid().safeParse(id).success) return { ok: false, error: t("envVars.errorUnknownVar") };

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
  const t = await getTranslations();
  const member = await requireMember();
  if (!member) return { ok: false, error: t("errors.notAuthorized") };
  if (!z.uuid().safeParse(id).success) return { ok: false, error: t("envVars.errorUnknownVar") };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reveal_env_var", { p_id: id, p_intent: intent });
  if (error) return { ok: false, error: error.message };
  if (typeof data !== "string") return { ok: false, error: t("envVars.errorNotFound") };

  try {
    return { ok: true, value: decryptSecret(data, id) };
  } catch {
    return { ok: false, error: t("envVars.errorDecrypt") };
  }
}

/**
 * Bulk-import variables (spec 009 AC-3, AC-5). Member-gated; each value is encrypted app-side and
 * created through create_env_var (which re-checks the pm/developer gate and audits). Duplicates
 * (23505) are skipped, never overwritten; per-key outcomes are collected for a summary.
 */
export async function importEnvVarsAction(
  projectId: string,
  input: unknown,
): Promise<ImportActionResult> {
  const t = await getTranslations();
  const member = await requireMember();
  if (!member) return { ok: false, error: t("errors.notAuthorized") };
  if (!z.uuid().safeParse(projectId).success)
    return { ok: false, error: t("errors.unknownProject") };

  const itemsRaw = (input as { items?: unknown } | null)?.items;
  const parsed = envImportSchema.safeParse(itemsRaw);
  if (!parsed.success) return { ok: false, error: t("envVars.errorImportInvalid") };

  const supabase = await createClient();
  const created: string[] = [];
  const skipped: string[] = [];
  const failed: string[] = [];
  for (const item of parsed.data) {
    const id = randomUUID();
    let ciphertext: string;
    try {
      ciphertext = encryptSecret(item.value, id);
    } catch {
      failed.push(item.key);
      continue;
    }
    const { error } = await supabase.rpc("create_env_var", {
      p_id: id,
      p_project_id: projectId,
      p_key: item.key,
      p_service: item.service ?? null,
      p_ciphertext: ciphertext,
      p_scope: item.scope,
    });
    if (!error) created.push(item.key);
    else if (error.code === "23505") skipped.push(item.key);
    else failed.push(item.key);
  }
  revalidatePath(`/projects/${projectId}`);
  return { ok: true, created, skipped, failed };
}

/**
 * Export a project's variables as a `.env` (spec 009 AC-4, AC-5, AC-6). Member-gated; each value is
 * decrypted through the audited reveal_env_var path with the `export` intent — so every exported
 * value is recorded. A viewer (who lacks the env-write gate) hits a 42501 mapped to a friendly error.
 */
export async function exportEnvFileAction(
  projectId: string,
  scope: unknown,
): Promise<ExportResult> {
  const t = await getTranslations();
  const member = await requireMember();
  if (!member) return { ok: false, error: t("errors.notAuthorized") };
  if (!z.uuid().safeParse(projectId).success)
    return { ok: false, error: t("errors.unknownProject") };

  const parsedScope = z.enum(ENV_EXPORT_SCOPES).safeParse(scope);
  if (!parsedScope.success) return { ok: false, error: t("envVars.errorExportEmpty") };
  const sel = parsedScope.data;

  const supabase = await createClient();
  let query = supabase.from("env_vars").select("id, key, scope").eq("project_id", projectId);
  if (sel !== "all") query = query.eq("scope", sel);
  const { data: rows, error } = await query.order("key", { ascending: true });
  if (error) return { ok: false, error: error.message };

  const list = (rows ?? []) as { id: string; key: string; scope: EnvScope }[];
  if (list.length === 0) return { ok: false, error: t("envVars.errorExportEmpty") };

  const entries: SerializeEntry[] = [];
  for (const row of list) {
    const { data: cipher, error: revealError } = await supabase.rpc("reveal_env_var", {
      p_id: row.id,
      p_intent: "export",
    });
    if (revealError) {
      if (revealError.code === "42501") return { ok: false, error: t("errors.notAuthorized") };
      return { ok: false, error: revealError.message };
    }
    if (typeof cipher !== "string") continue;
    try {
      entries.push({ key: row.key, value: decryptSecret(cipher, row.id), scope: row.scope });
    } catch {
      // A value whose key version is missing (rotated) can't be exported; skip it.
    }
  }
  if (entries.length === 0) return { ok: false, error: t("envVars.errorExportEmpty") };

  const filename = sel === "all" ? ".env" : sel === "backend" ? ".env.backend" : ".env.frontend";
  const content = serializeDotenv(entries, { groupByScope: sel === "all" });
  return { ok: true, filename, content };
}
