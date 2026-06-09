import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AuditRow, EnvVarMeta } from "./types";

/** A project's env vars — METADATA ONLY (never the ciphertext), scoped by the member's RLS session. */
export async function listProjectEnvVars(projectId: string): Promise<EnvVarMeta[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("env_vars")
    .select("id, project_id, key, service, created_at, updated_at")
    .eq("project_id", projectId)
    .order("key", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as EnvVarMeta[];
}

/** The reveal/copy/mutation audit trail for a project (AC-10), newest first. */
export async function listEnvVarAudit(projectId: string): Promise<AuditRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("env_var_audit")
    .select("id, action, env_var_key, actor_email, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []) as AuditRow[];
}
