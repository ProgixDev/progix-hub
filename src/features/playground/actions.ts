"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser, getProjectRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { listSnapshots, PLAN_COLS } from "./data";
import { ITEM_TYPES, STATUSES, type PlanItem, type PlanLink, type PlanSnapshot } from "./types";

export type CreateResult = { ok: true; item: PlanItem } | { ok: false };
export type ActionResult = { ok: true } | { ok: false };

const metaSchema = z
  .object({
    feature: z.string().max(60),
    category: z.string().max(60),
    color: z
      .string()
      .max(20)
      .regex(/^#[0-9a-fA-F]{3,8}$/),
    checklist: z.array(z.object({ label: z.string().max(200), done: z.boolean() })).max(40),
  })
  .partial()
  .strict();

const createSchema = z.object({
  type: z.enum(ITEM_TYPES),
  title: z.string().max(500).optional(),
  pos_x: z.number(),
  pos_y: z.number(),
  parent_id: z.uuid().nullable().optional(),
  width: z.number().int().nullable().optional(),
  height: z.number().int().nullable().optional(),
  color: z.string().max(20).nullable().optional(),
  meta: metaSchema.optional(),
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
    meta: metaSchema,
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
      meta: parsed.data.meta ?? {},
      created_by: user!.id,
    })
    .select(PLAN_COLS)
    .single();
  if (error || !data) return { ok: false };
  revalidatePath(`/projects/${projectId}/playground`);
  return { ok: true, item: data as PlanItem };
}

const boxSchema = z.object({
  pos_x: z.number(),
  pos_y: z.number(),
  width: z.number().int(),
  height: z.number().int(),
});

/** Create a phase frame at `box` and adopt `childIds` into it (lasso → make phase). */
export async function groupIntoPhaseAction(
  projectId: string,
  childIds: string[],
  box: unknown,
  title?: string,
): Promise<CreateResult> {
  if (!(await assertAccess(projectId))) return { ok: false };
  const ids = z.array(z.uuid()).safeParse(childIds);
  const parsedBox = boxSchema.safeParse(box);
  if (!ids.success || !parsedBox.success) return { ok: false };
  const user = await getCurrentUser();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("plan_items")
    .insert({
      project_id: projectId,
      type: "phase",
      title: (title || "Phase").slice(0, 500),
      pos_x: Math.round(parsedBox.data.pos_x),
      pos_y: Math.round(parsedBox.data.pos_y),
      width: parsedBox.data.width,
      height: parsedBox.data.height,
      created_by: user!.id,
    })
    .select(PLAN_COLS)
    .single();
  if (error || !data) return { ok: false };
  if (ids.data.length > 0) {
    await supabase
      .from("plan_items")
      .update({ parent_id: (data as PlanItem).id })
      .eq("project_id", projectId)
      .in("id", ids.data);
  }
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

// ---- Snapshots (save-states) -------------------------------------------------

type PlanSnapshotData = { items: PlanItem[]; links: PlanLink[] };
export type RestoreResult = { ok: true; items: PlanItem[]; links: PlanLink[] } | { ok: false };

// Restore re-inserts from a stored jsonb blob — validate + allow-list the columns explicitly
// (don't rely on PostgREST rejecting unknown keys), and never trust a project_id from the blob.
const restoreItemSchema = z
  .object({
    id: z.uuid(),
    type: z.enum(ITEM_TYPES),
    title: z.string().max(500),
    body: z.string().nullable(),
    status: z.enum(STATUSES),
    assignee: z.uuid().nullable(),
    estimate_hours: z.number().nullable(),
    parent_id: z.uuid().nullable(),
    pos_x: z.number(),
    pos_y: z.number(),
    width: z.number().int().nullable(),
    height: z.number().int().nullable(),
    board_order: z.number().int(),
    color: z.string().max(20).nullable(),
  })
  .strip();
const restoreLinkSchema = z
  .object({ id: z.uuid(), source_id: z.uuid(), target_id: z.uuid() })
  .strip();
const snapshotDataSchema = z.object({
  items: z.array(restoreItemSchema),
  links: z.array(restoreLinkSchema),
});

async function readPlan(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
): Promise<PlanSnapshotData> {
  const [itemsRes, linksRes] = await Promise.all([
    supabase.from("plan_items").select(PLAN_COLS).eq("project_id", projectId),
    supabase.from("plan_links").select("id,source_id,target_id").eq("project_id", projectId),
  ]);
  return {
    items: (itemsRes.data ?? []) as PlanItem[],
    links: (linksRes.data ?? []) as PlanLink[],
  };
}

/** Save the current plan as a labeled snapshot. */
export async function createSnapshotAction(
  projectId: string,
  label: string,
): Promise<ActionResult> {
  if (!(await assertAccess(projectId))) return { ok: false };
  const user = await getCurrentUser();
  const supabase = await createClient();
  const data = await readPlan(supabase, projectId);
  const { error } = await supabase.from("plan_snapshots").insert({
    project_id: projectId,
    label: (label || "Snapshot").slice(0, 120),
    data,
    created_by: user!.id,
    author_label: user!.name || user!.email,
  });
  if (error) return { ok: false };
  return { ok: true };
}

/** List a project's snapshots (lazy-loaded by the panel). */
export async function listSnapshotsAction(projectId: string): Promise<PlanSnapshot[]> {
  if (!(await getCurrentUser())) return [];
  return listSnapshots(projectId);
}

/** Replace the live plan with a snapshot, auto-backing-up the current state first. */
export async function restoreSnapshotAction(
  projectId: string,
  snapshotId: string,
): Promise<RestoreResult> {
  if (!(await assertAccess(projectId))) return { ok: false };
  if (!z.uuid().safeParse(snapshotId).success) return { ok: false };
  const user = await getCurrentUser();
  const supabase = await createClient();

  // Bind the snapshot to THIS project (not just any project the caller can read).
  const { data: snap } = await supabase
    .from("plan_snapshots")
    .select("data")
    .eq("id", snapshotId)
    .eq("project_id", projectId)
    .single();
  if (!snap?.data) return { ok: false };
  const parsed = snapshotDataSchema.safeParse(snap.data);
  if (!parsed.success) return { ok: false };
  const itemsOut = parsed.data.items.map((it) => ({ ...it, project_id: projectId }));
  const linksOut = parsed.data.links.map((l) => ({
    id: l.id,
    project_id: projectId,
    source_id: l.source_id,
    target_id: l.target_id,
  }));

  // Safety net: snapshot the current state before replacing it.
  const current = await readPlan(supabase, projectId);
  await supabase.from("plan_snapshots").insert({
    project_id: projectId,
    label: "Auto-backup before restore",
    data: current,
    created_by: user!.id,
    author_label: user!.name || user!.email,
  });

  const delLinks = await supabase.from("plan_links").delete().eq("project_id", projectId);
  const delItems = await supabase.from("plan_items").delete().eq("project_id", projectId);
  if (delLinks.error || delItems.error) return { ok: false };

  // Phases first so child tasks' parent_id FK resolves within the same insert.
  const ordered = [...itemsOut].sort(
    (a, b) => (a.type === "phase" ? 0 : 1) - (b.type === "phase" ? 0 : 1),
  );
  if (ordered.length > 0) {
    const { error } = await supabase.from("plan_items").insert(ordered);
    if (error) return { ok: false };
  }
  if (linksOut.length > 0) {
    const { error } = await supabase.from("plan_links").insert(linksOut);
    if (error) return { ok: false };
  }
  return {
    ok: true,
    items: itemsOut as unknown as PlanItem[],
    links: parsed.data.links as PlanLink[],
  };
}

/** Refetch the live plan (items + links) — used to sync after a collaborator's change. RLS-gated. */
export async function getPlanStateAction(
  projectId: string,
): Promise<{ items: PlanItem[]; links: PlanLink[] } | null> {
  if (!(await assertAccess(projectId))) return null;
  const supabase = await createClient();
  return readPlan(supabase, projectId);
}

/** Delete a snapshot. RLS scopes to accessible rows. */
export async function deleteSnapshotAction(id: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(id).success) return { ok: false };
  if (!(await getCurrentUser())) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase.from("plan_snapshots").delete().eq("id", id);
  if (error) return { ok: false };
  return { ok: true };
}
