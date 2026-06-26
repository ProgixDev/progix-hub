import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ReleaseNote } from "./types";

const COLS = "id,project_id,version,title,body_md,published,created_at";

/** All release notes for a project, newest first (RLS-gated to members). */
export async function listReleaseNotes(projectId: string): Promise<ReleaseNote[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("release_notes")
    .select(COLS)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as ReleaseNote[];
}
