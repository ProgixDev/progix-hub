import "server-only";
import { randomUUID } from "node:crypto";
import { encryptSecret } from "@/lib/crypto/secrets";
import { BLOCK_BY_KEY, checklistFor, FEATURE_BLOCKS } from "@/lib/playground/feature-catalog";
import { createAdminClient } from "@/lib/supabase/admin";

const ROLES = ["pm", "developer", "video_editor", "viewer"];
const COLS =
  "id,project_id,type,title,body,status,assignee,estimate_hours,parent_id,pos_x,pos_y,width,height,board_order,color,meta";
type Status = "backlog" | "in_progress" | "in_review" | "done";

type Admin = ReturnType<typeof createAdminClient>;

async function canAccess(
  admin: Admin,
  userId: string,
  projectId: string,
  roles: string[] = ROLES,
): Promise<boolean> {
  const { data } = await admin.rpc("has_project_access_for", {
    p_user: userId,
    p_project: projectId,
    p_roles: roles,
  });
  return data === true;
}

/** The MCP user's email + display label (for report authorship + env audit). */
async function userInfo(admin: Admin, userId: string): Promise<{ email: string; label: string }> {
  const { data } = await admin.auth.admin.getUserById(userId);
  const u = data?.user;
  const meta = (u?.user_metadata ?? {}) as Record<string, unknown>;
  const name = (meta.full_name || meta.name || meta.user_name) as string | undefined;
  const email = u?.email ?? "";
  return { email, label: name || email || "Someone" };
}

/** Parse .env text into key/value pairs (skips comments/blanks; strips quotes; validates keys). */
function parseDotenv(text: string): { key: string; value: string }[] {
  const out: { key: string; value: string }[] = [];
  for (const raw of (text ?? "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line
      .slice(0, eq)
      .trim()
      .replace(/^export\s+/, "");
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    out.push({ key, value });
  }
  return out;
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

/** Resolve an item to its project and check access (used by item-scoped edits). */
async function itemProject(admin: Admin, userId: string, itemId: string): Promise<string> {
  const { data: item } = await admin
    .from("plan_items")
    .select("id,project_id")
    .eq("id", itemId)
    .maybeSingle();
  if (!item) throw new Error("Item not found");
  const projectId = item.project_id as string;
  if (!(await canAccess(admin, userId, projectId))) throw new Error("No access to that item");
  return projectId;
}

/** Edit a card's title / status / estimate. */
export async function mcpUpdateItem(
  userId: string,
  itemId: string,
  patch: { title?: string; status?: Status; estimate_hours?: number | null },
) {
  const admin = createAdminClient();
  await itemProject(admin, userId, itemId);
  const fields: Record<string, unknown> = {};
  if (patch.title !== undefined) fields.title = patch.title.slice(0, 500);
  if (patch.status !== undefined) fields.status = patch.status;
  if (patch.estimate_hours !== undefined) fields.estimate_hours = patch.estimate_hours;
  if (Object.keys(fields).length === 0) return { ok: true };
  const { error } = await admin.from("plan_items").update(fields).eq("id", itemId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

/** Delete a card (a phase's children are detached by the FK, not deleted). */
export async function mcpDeleteItem(userId: string, itemId: string) {
  const admin = createAdminClient();
  await itemProject(admin, userId, itemId);
  const { error } = await admin.from("plan_items").delete().eq("id", itemId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

/** The prebuilt feature-block catalog (so the model knows valid keys). */
export function mcpListFeatures() {
  return FEATURE_BLOCKS.map((b) => ({ key: b.key, name: b.name, category: b.category }));
}

/** Drop a prebuilt feature block (Stripe, Twilio, …) as a rich card, optionally inside a phase. */
export async function mcpAddFeature(
  userId: string,
  projectId: string,
  key: string,
  opts: { phaseId?: string } = {},
) {
  const admin = createAdminClient();
  if (!(await canAccess(admin, userId, projectId))) throw new Error("No access to that project");
  const block = BLOCK_BY_KEY.get(key);
  if (!block) throw new Error(`Unknown feature block: ${key}`);

  let pos_x = 80;
  let pos_y = 80;
  let parent_id: string | null = null;
  if (opts.phaseId) {
    const { data: phase } = await admin
      .from("plan_items")
      .select("id,pos_x,pos_y")
      .eq("id", opts.phaseId)
      .eq("project_id", projectId)
      .maybeSingle();
    if (phase) {
      parent_id = phase.id as string;
      const { count } = await admin
        .from("plan_items")
        .select("id", { count: "exact", head: true })
        .eq("parent_id", phase.id);
      pos_x = (phase.pos_x as number) + 20;
      pos_y = (phase.pos_y as number) + 54 + (count ?? 0) * 74;
    }
  } else {
    const { count } = await admin
      .from("plan_items")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId);
    pos_x = 80 + ((count ?? 0) % 6) * 30;
    pos_y = 80 + ((count ?? 0) % 6) * 30;
  }

  const { data, error } = await admin
    .from("plan_items")
    .insert({
      project_id: projectId,
      type: "task",
      title: block.name,
      status: "backlog",
      pos_x,
      pos_y,
      parent_id,
      meta: {
        feature: block.key,
        category: block.category,
        color: block.color,
        checklist: checklistFor(block),
      },
      created_by: userId,
    })
    .select(COLS)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// ---- Project configuration (push from a repo into the hub) -------------------

/** Post a daily report (markdown) to a project from the repo. */
export async function mcpPostDailyReport(userId: string, projectId: string, contentMd: string) {
  const admin = createAdminClient();
  if (!(await canAccess(admin, userId, projectId))) throw new Error("No access to that project");
  const body = (contentMd ?? "").trim();
  if (!body) throw new Error("Report is empty");
  const { label } = await userInfo(admin, userId);
  const { error } = await admin.from("project_reports").insert({
    project_id: projectId,
    content_md: body.slice(0, 20000),
    created_by: userId,
    author_label: label,
  });
  if (error) throw new Error(error.message);
  await admin.from("activity_events").insert({
    project_id: projectId,
    actor_id: userId,
    actor_label: label,
    kind: "report",
    summary: "posted a daily report",
  });
  return { ok: true };
}

/** Add a document to a project — a markdown note, or a link if `url` is given. */
export async function mcpAddDocument(
  userId: string,
  projectId: string,
  input: { title: string; body?: string; url?: string },
) {
  const admin = createAdminClient();
  if (!(await canAccess(admin, userId, projectId))) throw new Error("No access to that project");
  const title = (input.title ?? "").trim().slice(0, 300);
  if (!title) throw new Error("Title is required");
  const { email } = await userInfo(admin, userId);
  const kind = input.url ? "link" : "note";
  const row: Record<string, unknown> = {
    project_id: projectId,
    kind,
    title,
    created_by: userId,
    created_by_email: email,
  };
  if (kind === "link") row.url = input.url;
  else row.body = (input.body ?? "").slice(0, 100000);
  const { data, error } = await admin
    .from("documents")
    .insert(row)
    .select("id,kind,title")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/** Upload a project's .env: each var is encrypted (AES-256-GCM) and stored; duplicates are skipped.
 * PM/developer only. Frontend scope is auto-detected from NEXT_PUBLIC_/EXPO_PUBLIC_ prefixes. */
export async function mcpUploadEnv(
  userId: string,
  projectId: string,
  dotenv: string,
  scope?: "backend" | "frontend",
) {
  const admin = createAdminClient();
  if (!(await canAccess(admin, userId, projectId, ["pm", "developer"]))) {
    throw new Error("No access — env vars require pm or developer");
  }
  const entries = parseDotenv(dotenv).slice(0, 200);
  if (entries.length === 0) throw new Error("No environment variables found");
  const created: string[] = [];
  let skipped = 0;
  for (const { key, value } of entries) {
    const sc = scope ?? (/^(NEXT_PUBLIC_|EXPO_PUBLIC_)/.test(key) ? "frontend" : "backend");
    const id = randomUUID();
    let ciphertext: string;
    try {
      ciphertext = encryptSecret(value, id);
    } catch {
      throw new Error("Secret encryption is not configured on the server");
    }
    const { error } = await admin.rpc("create_env_var_for", {
      p_user: userId,
      p_id: id,
      p_project_id: projectId,
      p_key: key,
      p_service: null,
      p_ciphertext: ciphertext,
      p_scope: sc,
    });
    if (error) {
      if (error.code === "23505") skipped++;
      else throw new Error(error.message);
    } else {
      created.push(key);
    }
  }
  return { created: created.length, skipped, keys: created };
}

/** Sync a project's specs/PRDs from the repo (upsert by slug) for the playground's Specs lens. */
export async function mcpSyncSpecs(
  userId: string,
  projectId: string,
  specs: {
    slug: string;
    number?: number;
    title?: string;
    status?: string;
    kind?: string;
    body_md?: string;
  }[],
) {
  const admin = createAdminClient();
  if (!(await canAccess(admin, userId, projectId))) throw new Error("No access to that project");
  const rows = (specs ?? [])
    .filter((s) => s.slug)
    .slice(0, 100)
    .map((s) => ({
      project_id: projectId,
      slug: s.slug.slice(0, 120),
      number: typeof s.number === "number" ? s.number : null,
      title: (s.title ?? s.slug).slice(0, 300),
      status: (s.status ?? "draft").slice(0, 40),
      kind: s.kind === "prd" ? "prd" : "spec",
      body_md: (s.body_md ?? "").slice(0, 100000),
      created_by: userId,
      updated_at: new Date().toISOString(),
    }));
  if (rows.length === 0) throw new Error("No specs provided");
  const { error } = await admin
    .from("project_specs")
    .upsert(rows, { onConflict: "project_id,slug" });
  if (error) throw new Error(error.message);
  return { synced: rows.length };
}

// ---- Project lifecycle + read-backs (full two-way bridge) -------------------

/** Create a hub project (the token's user becomes PM). Org members only. */
export async function mcpCreateProject(
  userId: string,
  input: {
    name: string;
    description?: string;
    github_url?: string;
    notion_url?: string;
    slack_url?: string;
    live_url?: string;
  },
) {
  const admin = createAdminClient();
  const { data: u } = await admin.auth.admin.getUserById(userId);
  if (!u?.user?.app_metadata?.is_member) throw new Error("Only org members can create projects");
  const name = (input.name ?? "").trim().slice(0, 120);
  if (!name) throw new Error("Project name is required");
  const { data, error } = await admin
    .from("projects")
    .insert({
      name,
      status: "active",
      description: input.description?.slice(0, 2000) ?? null,
      github_url: input.github_url ?? null,
      notion_url: input.notion_url ?? null,
      slack_url: input.slack_url ?? null,
      live_url: input.live_url ?? null,
      created_by: userId,
    })
    .select("id,name")
    .single();
  if (error || !data) throw new Error(error?.message ?? "create failed");
  // Seat the creator as PM (a default-role trigger may have added them as developer first). If
  // this fails, roll back the orphan project so it can't be left with no manager.
  const seat = await admin
    .from("project_members")
    .upsert(
      { project_id: data.id, user_id: userId, role: "pm" },
      { onConflict: "project_id,user_id" },
    );
  if (seat.error) {
    await admin.from("projects").delete().eq("id", data.id);
    throw new Error(seat.error.message);
  }
  return data;
}

/** Set a project's external links (GitHub / Notion / Slack / Live). PM only. */
export async function mcpSetProjectLinks(
  userId: string,
  projectId: string,
  links: { github_url?: string; notion_url?: string; slack_url?: string; live_url?: string },
) {
  const admin = createAdminClient();
  if (!(await canAccess(admin, userId, projectId, ["pm"]))) {
    throw new Error("No access — project links require pm");
  }
  const patch: Record<string, string | null> = {};
  for (const k of ["github_url", "notion_url", "slack_url", "live_url"] as const) {
    if (links[k] !== undefined) patch[k] = links[k] || null;
  }
  if (Object.keys(patch).length === 0) return { ok: true };
  const { error } = await admin.from("projects").update(patch).eq("id", projectId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

/** The project's env var KEYS + scope — names only, never the secret values. PM/developer. */
export async function mcpGetEnvKeys(userId: string, projectId: string) {
  const admin = createAdminClient();
  if (!(await canAccess(admin, userId, projectId, ["pm", "developer"]))) {
    throw new Error("No access — env requires pm or developer");
  }
  const { data } = await admin
    .from("env_vars")
    .select("key,scope,service")
    .eq("project_id", projectId)
    .order("key");
  return data ?? [];
}

/** A project's documents (metadata + link URLs; never file contents). */
export async function mcpListDocuments(userId: string, projectId: string) {
  const admin = createAdminClient();
  if (!(await canAccess(admin, userId, projectId))) throw new Error("No access to that project");
  const { data } = await admin
    .from("documents")
    .select("id,kind,title,url")
    .eq("project_id", projectId)
    .is("archived_at", null)
    .order("created_at", { ascending: false });
  return data ?? [];
}

/** A project's synced specs/PRDs (metadata). */
export async function mcpListSpecs(userId: string, projectId: string) {
  const admin = createAdminClient();
  if (!(await canAccess(admin, userId, projectId))) throw new Error("No access to that project");
  const { data } = await admin
    .from("project_specs")
    .select("slug,number,title,status,kind")
    .eq("project_id", projectId)
    .order("number", { nullsFirst: false });
  return data ?? [];
}

/** Configuration status (the project checklist) — what's set up vs missing. */
export async function mcpGetProjectStatus(userId: string, projectId: string) {
  const admin = createAdminClient();
  if (!(await canAccess(admin, userId, projectId))) throw new Error("No access to that project");
  const head = { count: "exact" as const, head: true };
  const [proj, env, specs, docs, reports, setup, portal] = await Promise.all([
    admin.from("projects").select("github_url").eq("id", projectId).maybeSingle(),
    admin.from("env_vars").select("id", head).eq("project_id", projectId),
    admin.from("project_specs").select("id", head).eq("project_id", projectId),
    admin.from("documents").select("id", head).eq("project_id", projectId).is("archived_at", null),
    admin.from("project_reports").select("id", head).eq("project_id", projectId),
    admin.from("project_setups").select("project_id", head).eq("project_id", projectId),
    admin
      .from("portal_share_links")
      .select("id", head)
      .eq("project_id", projectId)
      .is("revoked_at", null),
  ]);
  return {
    github_linked: Boolean(proj.data?.github_url),
    env_vars: env.count ?? 0,
    specs: specs.count ?? 0,
    documents: docs.count ?? 0,
    daily_reports: reports.count ?? 0,
    client_setup: (setup.count ?? 0) > 0,
    client_portal: (portal.count ?? 0) > 0,
  };
}
