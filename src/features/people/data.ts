import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ProjectMember } from "./types";

/** The project's roster (member emails + roles), via the access-checked RPC. */
export async function getProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_project_members", { p_project: projectId });
  if (error) throw new Error(error.message);
  return (data ?? []) as ProjectMember[];
}
