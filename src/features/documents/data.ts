import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ProjectDocument } from "./types";

/** A project's non-archived documents (newest first), scoped by the member's RLS session. */
export async function listProjectDocuments(projectId: string): Promise<ProjectDocument[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("project_id", projectId)
    .is("archived_at", null)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ProjectDocument[];
}
