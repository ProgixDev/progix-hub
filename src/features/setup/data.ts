import "server-only";
import { getProjectRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { ProjectSetup, TeamSetupStep } from "./types";

/** The team's view of a project's setup page + steps (RLS-gated to the project's PMs). */
export async function getProjectSetup(
  projectId: string,
): Promise<{ setup: ProjectSetup | null; steps: TeamSetupStep[] }> {
  const supabase = await createClient();
  const { data: setup } = await supabase
    .from("project_setups")
    .select("project_id,enabled,created_at")
    .eq("project_id", projectId)
    .maybeSingle();
  if (!setup) return { setup: null, steps: [] };

  const { data: steps } = await supabase
    .from("setup_steps")
    .select("id,position,status,platform_id,platforms(name)")
    .eq("project_id", projectId)
    .order("position");

  const mapped: TeamSetupStep[] = (steps ?? []).map((s) => {
    const platform = s.platforms as unknown as { name?: string } | null;
    return {
      id: s.id as string,
      position: s.position as number,
      status: s.status as TeamSetupStep["status"],
      platform_id: s.platform_id as string,
      platform_name: platform?.name ?? "",
    };
  });
  return { setup: setup as ProjectSetup, steps: mapped };
}

/** Whether the current viewer may manage a project's setup page (its PM / global PM / superadmin). */
export async function canManageSetup(projectId: string): Promise<boolean> {
  const role = await getProjectRole(projectId);
  return role === "pm" || role === "superadmin";
}
