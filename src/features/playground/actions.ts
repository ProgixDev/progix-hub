"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser, getProjectRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PLAN_COLS } from "./data";
import { ITEM_TYPES, STATUSES, type PlanItem, type PlanLink } from "./types";

export type CreateResult = { ok: true; item: PlanItem } | { ok: false };
export type ActionResult = { ok: true } | { ok: false };

const createSchema = z.object({
  type: z.enum(ITEM_TYPES),
  title: z.string().max(500).optional(),
  pos_x: z.number(),
  pos_y: z.number(),
  parent_id: z.uuid().nullable().optional(),
  width: z.number().int().nullable().optional(),
  height: z.number().int().nullable().optional(),
  color: z.string().max(20).nullable().optional(),
});

const patchSchema = z
  .object({
    title: z.string().max(500),
    body: z.string().max(20000).nullable(),
    status: z.enum(STATUSES),
    assignee: z.uuid().nullable(),
    estimate_hours: z.number().nonnegative().nullable(),
    parent_id: z.uuid().nullable(),
    pos_x: z.number(),
    pos_y: z.number(),
    width: z.number().int().nullable(),
    height: z.number().int().nullable(),
    board_order: z.number().int(),
    color: z.string().max(20).nullable(),
  })
  .partial()
  .strict();

async function assertAccess(projectId: string): Promise<boolean> {
  if (!z.uuid().safeParse(projectId).success) return false;
  const user = await getCurrentUser();
  if (!user) return false;
  return Boolean(await getProjectRole(projectId));
}

/** Create a plan item (card / note / phase). Authz: project access; RLS backstops. */
export async function createPlanItemAction(
  projectId: string,
  input: unknown,
): Promise<CreateResult> {
  if (!(await assertAccess(projectId))) return { ok: false };
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  const user = await getCurrentUser();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("plan_items")
    .insert({
      project_id: projectId,
      type: parsed.data.type,
      title: parsed.data.title ?? "",
      parent_id: parsed.data.parent_id ?? null,
      pos_x: Math.round(parsed.data.pos_x),
      pos_y: Math.round(parsed.data.pos_y),
      width: parsed.data.width ?? null,
      height: parsed.data.height ?? null,
      color: parsed.data.color ?? null,
      created_by: user!.id,
    })
    .select(PLAN_COLS)
    .single();
  if (error || !data) return { ok: false };
  revalidatePath(`/projects/${projectId}/playground`);
  return { ok: true, item: data as PlanItem };
}

/** Patch a plan item (move, status, title, assignee, …). RLS scopes to accessible rows. */
export async function updatePlanItemAction(id: string, patch: unknown): Promise<ActionResult> {
  if (!z.uuid().safeParse(id).success) return { ok: false };
  if (!(await getCurrentUser())) return { ok: false };
  const parsed = patchSchema.safeParse(patch);
  if (!parsed.success || Object.keys(parsed.data).length === 0) return { ok: false };

  const data = { ...parsed.data, updated_at: new Date().toISOString() };
  if (typeof data.pos_x === "number") data.pos_x = Math.round(data.pos_x);
  if (typeof data.pos_y === "number") data.pos_y = Math.round(data.pos_y);

  const supabase = await createClient();
  const { error } = await supabase.from("plan_items").update(data).eq("id", id);
  if (error) return { ok: false };
  return { ok: true };
}

/** Delete a plan item (children's parent_id is cleared by the FK). */
export async function deletePlanItemAction(id: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(id).success) return { ok: false };
  if (!(await getCurrentUser())) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase.from("plan_items").delete().eq("id", id);
  if (error) return { ok: false };
  return { ok: true };
}

export type LinkResult = { ok: true; link: PlanLink } | { ok: false };

/** Create a dependency arrow (source → target). Authz: project access; RLS backstops. */
export async function createLinkAction(
  projectId: string,
  sourceId: string,
  targetId: string,
): Promise<LinkResult> {
  if (!(await assertAccess(projectId))) return { ok: false };
  if (!z.uuid().safeParse(sourceId).success || !z.uuid().safeParse(targetId).success) {
    return { ok: false };
  }
  if (sourceId === targetId) return { ok: false };
  const supabase = await createClient();
  // Both items must belong to this project (keeps links same-project; RLS-scoped read).
  const { data: found } = await supabase
    .from("plan_items")
    .select("id")
    .eq("project_id", projectId)
    .in("id", [sourceId, targetId]);
  if (!found || found.length !== 2) return { ok: false };

  const { data, error } = await supabase
    .from("plan_links")
    .insert({ project_id: projectId, source_id: sourceId, target_id: targetId })
    .select("id,source_id,target_id")
    .single();
  if (error || !data) return { ok: false };
  return { ok: true, link: data as PlanLink };
}

/** Delete a dependency arrow. RLS scopes to accessible rows. */
export async function deleteLinkAction(id: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(id).success) return { ok: false };
  if (!(await getCurrentUser())) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase.from("plan_links").delete().eq("id", id);
  if (error) return { ok: false };
  return { ok: true };
}
