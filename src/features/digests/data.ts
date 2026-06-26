import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ProjectDigest } from "./types";

const COLS = "id,project_id,content_md,period_start,period_end,model,created_at";

/** The most recent digest for a project, or null (RLS-gated to project members). */
export async function getLatestDigest(projectId: string): Promise<ProjectDigest | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_digests")
    .select(COLS)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as ProjectDigest | null) ?? null;
}
