import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const ROLES = ["pm", "developer", "video_editor", "viewer"];
const COLS =
  "id,project_id,type,title,body,status,assignee,estimate_hours,parent_id,pos_x,pos_y,width,height,board_order,color";
type Status = "backlog" | "in_progress" | "in_review" | "done";

type Admin = ReturnType<typeof createAdminClient>;

async function canAccess(admin: Admin, userId: string, projectId: string): Promise<boolean> {
  const { data } = await admin.rpc("has_project_access_for", {
    p_user: userId,
    p_project: projectId,
    p_roles: ROLES,
  });
  return data === true;
}

/** Projects the token's owner can plan. */
export async function mcpListProjects(userId: string) {
  const admin = createAdminClient();
  const { data: u } = await admin.auth.admin.getUserById(userId);
  const isSuper = Boolean(u?.user?.app_metadata?.is_superadmin);
  if (isSuper) {
    const { data } = await admin.from("projects").select("id,name").order("name");
    return data ?? [];
  }
  const { data } = await admin
    .from("project_members")
    .select("projects(id,name)")
    .eq("user_id", userId);
  return (data ?? []).map((r) => (r as { projects: unknown }).projects).filter(Boolean);
}

/** The plan (items + links) for a project. */
export async function mcpGetPlan(userId: string, projectId: string) {
  const admin = createAdminClient();
  if (!(await canAccess(admin, userId, projectId))) throw new Error("No access to that project");
  const [items, links] = await Promise.all([
    admin.from("plan_items").select(COLS).eq("project_id", projectId),
    admin.from("plan_links").select("id,source_id,target_id").eq("project_id", projectId),
  ]);
  return { items: items.data ?? [], links: links.data ?? [] };
}

/** Create a single item (task/note/phase). */
export async function mcpCreateItem(
  userId: string,
  projectId: string,
  input: {
    type: "task" | "note" | "phase";
    title?: string;
    status?: Status;
    estimate_hours?: number | null;
    pos_x?: number;
    pos_y?: number;
    width?: number | null;
    height?: number | null;
  },
) {
  const admin = createAdminClient();
  if (!(await canAccess(admin, userId, projectId))) throw new Error("No access to that project");
  const { data, error } = await admin
    .from("plan_items")
    .insert({
      project_id: projectId,
      type: input.type,
      title: (input.title ?? "").slice(0, 500),
      status: input.status ?? "backlog",
      estimate_hours: input.estimate_hours ?? null,
      pos_x: Math.round(input.pos_x ?? 0),
      pos_y: Math.round(input.pos_y ?? 0),
      width: input.width ?? null,
      height: input.height ?? null,
      created_by: userId,
    })
    .select(COLS)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/** Link two items (source → target dependency), both must be in the project. */
export async function mcpLink(
  userId: string,
  projectId: string,
  sourceId: string,
  targetId: string,
) {
  const admin = createAdminClient();
  if (!(await canAccess(admin, userId, projectId))) throw new Error("No access to that project");
  if (sourceId === targetId) throw new Error("Cannot link an item to itself");
  const { data: found } = await admin
    .from("plan_items")
    .select("id")
    .eq("project_id", projectId)
    .in("id", [sourceId, targetId]);
  if (!found || found.length !== 2) throw new Error("Both items must be in the project");
  const { data, error } = await admin
    .from("plan_links")
    .insert({ project_id: projectId, source_id: sourceId, target_id: targetId })
    .select("id,source_id,target_id")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/** Set a task's status. */
export async function mcpSetStatus(userId: string, itemId: string, status: Status) {
  const admin = createAdminClient();
  const { data: item } = await admin
    .from("plan_items")
    .select("id,project_id")
    .eq("id", itemId)
    .maybeSingle();
  if (!item) throw new Error("Item not found");
  if (!(await canAccess(admin, userId, item.project_id as string)))
    throw new Error("No access to that item");
  const { error } = await admin.from("plan_items").update({ status }).eq("id", itemId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

type BulkPlan = {
  phases: {
    title: string;
    tasks?: { title: string; estimate_hours?: number; status?: Status }[];
  }[];
  links?: { from: string; to: string }[];
};

/** Lay down a whole structured plan: phases as frames, tasks stacked inside, optional links by title. */
export async function mcpBulkCreatePlan(userId: string, projectId: string, plan: BulkPlan) {
  const admin = createAdminClient();
  if (!(await canAccess(admin, userId, projectId))) throw new Error("No access to that project");

  const titleToId = new Map<string, string>();
  let createdPhases = 0;
  let createdTasks = 0;

  for (let i = 0; i < plan.phases.length; i++) {
    const ph = plan.phases[i]!;
    const tasks = ph.tasks ?? [];
    const px = i * 420;
    const height = Math.max(220, 80 + tasks.length * 74);
    const { data: phase, error: pe } = await admin
      .from("plan_items")
      .insert({
        project_id: projectId,
        type: "phase",
        title: ph.title.slice(0, 500),
        pos_x: px,
        pos_y: 0,
        width: 360,
        height,
        created_by: userId,
      })
      .select("id")
      .single();
    if (pe || !phase) throw new Error(pe?.message ?? "phase insert failed");
    createdPhases++;

    for (let j = 0; j < tasks.length; j++) {
      const t = tasks[j]!;
      const { data: task, error: te } = await admin
        .from("plan_items")
        .insert({
          project_id: projectId,
          type: "task",
          title: t.title.slice(0, 500),
          status: t.status ?? "backlog",
          estimate_hours: t.estimate_hours ?? null,
          parent_id: phase.id,
          pos_x: px + 20,
          pos_y: 54 + j * 74,
          created_by: userId,
        })
        .select("id")
        .single();
      if (te || !task) throw new Error(te?.message ?? "task insert failed");
      titleToId.set(t.title, task.id as string);
      createdTasks++;
    }
  }

  let createdLinks = 0;
  for (const l of plan.links ?? []) {
    const s = titleToId.get(l.from);
    const tg = titleToId.get(l.to);
    if (!s || !tg || s === tg) continue;
    const { error } = await admin
      .from("plan_links")
      .insert({ project_id: projectId, source_id: s, target_id: tg });
    if (!error) createdLinks++;
  }

  return { createdPhases, createdTasks, createdLinks };
}
