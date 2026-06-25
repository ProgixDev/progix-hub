import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { MemberOption, PlanItem, PlanLink, PlanSnapshot, PlanSpec, PlanStroke } from "./types";

export const PLAN_COLS =
  "id,project_id,type,title,body,status,assignee,estimate_hours,parent_id,pos_x,pos_y,width,height,board_order,color,meta";

/** All plan items for a project (RLS gates to project members). */
export async function listPlanItems(projectId: string): Promise<PlanItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("plan_items")
    .select(PLAN_COLS)
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as PlanItem[];
}

/** Dependency arrows for a project (RLS gates to project members). */
export async function listPlanLinks(projectId: string): Promise<PlanLink[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("plan_links")
    .select("id,source_id,target_id")
    .eq("project_id", projectId);
  if (error) throw new Error(error.message);
  return (data ?? []) as PlanLink[];
}

/** Freehand sketch strokes for a project (RLS gates to project members). */
export async function listStrokes(projectId: string): Promise<PlanStroke[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("plan_drawings")
    .select("id,points,color,width")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as PlanStroke[];
}

/** Specs/PRDs synced from the repo, newest spec number first (RLS-gated). */
export async function listSpecs(projectId: string): Promise<PlanSpec[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_specs")
    .select("id,slug,number,title,status,kind,body_md,updated_at")
    .eq("project_id", projectId)
    .order("number", { ascending: true, nullsFirst: false });
  if (error) return [];
  return (data ?? []) as PlanSpec[];
}

/** Snapshot list for a project (metadata only — newest first; RLS-gated). */
export async function listSnapshots(projectId: string): Promise<PlanSnapshot[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("plan_snapshots")
    .select("id,label,author_label,created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as PlanSnapshot[];
}

/** Project members, as assignee options (via the access-checked RPC). */
export async function listAssignees(projectId: string): Promise<MemberOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_project_members", { p_project: projectId });
  if (error) return [];
  return (
    (data ?? []) as Array<{ user_id: string; email: string; display_name: string | null }>
  ).map((m) => ({ id: m.user_id, label: m.display_name || m.email }));
}
