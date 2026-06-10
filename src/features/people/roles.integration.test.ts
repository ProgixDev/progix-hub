import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Live-DB proof of the spec-008 / ADR-0011 role matrix. Provisions a superadmin + one user
// per project role on a single project, then asserts the FULL matrix at the DB (RLS + RPCs) —
// i.e. authorization is enforced in Postgres, not just the UI (AC-8). Skips when env is absent.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const configured = Boolean(url && anon && serviceRole);
const noPersist = { auth: { persistSession: false, autoRefreshToken: false } } as const;

describe.skipIf(!configured)("roles & permissions matrix (live DB)", () => {
  const admin = createClient(url as string, serviceRole as string, noPersist);
  const stamp = Date.now();
  const password = "Integration-Test-Pw-123!";
  const userIds: string[] = [];
  let superadmin!: SupabaseClient;
  let pm!: SupabaseClient;
  let developer!: SupabaseClient;
  let video!: SupabaseClient;
  let viewer!: SupabaseClient;
  let outsider!: SupabaseClient;
  let projectId = "";
  let envVarId = "";
  let cardId = "";
  let viewerEmail = "";

  async function makeUser(tag: string, superadmin = false): Promise<SupabaseClient> {
    const email = `role-${tag}-${stamp}@progix.test`;
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { is_member: true, ...(superadmin ? { is_superadmin: true } : {}) },
    });
    if (created.error) throw created.error;
    userIds.push(created.data.user.id);
    const client = createClient(url as string, anon as string, noPersist);
    const signed = await client.auth.signInWithPassword({ email, password });
    if (signed.error) throw signed.error;
    if (tag === "viewer") viewerEmail = email;
    return client;
  }

  beforeAll(async () => {
    superadmin = await makeUser("super", true);
    pm = await makeUser("pm");
    developer = await makeUser("dev");
    video = await makeUser("video");
    viewer = await makeUser("viewer");
    outsider = await makeUser("outsider");

    // PM creates the project via the create_project RPC → trigger makes them PM.
    const project = await pm.rpc("create_project", { p_name: `IT Roles ${stamp}` });
    if (project.error) throw project.error;
    projectId = project.data.id as string;

    // PM assigns the other roles by email via the RPC.
    for (const [tag, role] of [
      ["dev", "developer"],
      ["video", "video_editor"],
      ["viewer", "viewer"],
    ] as const) {
      const res = await pm.rpc("set_project_member", {
        p_project: projectId,
        p_email: `role-${tag}-${stamp}@progix.test`,
        p_role: role,
      });
      if (res.error) throw new Error(`assign ${role}: ${res.error.message}`);
    }

    // PM creates an env var (dummy ciphertext) + a portal card to read/reveal later.
    const ev = await pm.rpc("create_env_var", {
      p_id: crypto.randomUUID(),
      p_project_id: projectId,
      p_key: "STRIPE_SECRET_KEY",
      p_service: "stripe",
      p_ciphertext: "ciphertext-xyz",
    });
    if (ev.error) throw ev.error;
    const evRow = await pm.from("env_vars").select("id").eq("project_id", projectId).single();
    envVarId = evRow.data?.id as string;

    const block = await pm
      .from("portal_blocks")
      .insert({ project_id: projectId, name: "App" })
      .select("id")
      .single();
    if (block.error) throw block.error;
    const card = await pm
      .from("portal_cards")
      .insert({
        project_id: projectId,
        block_id: block.data.id,
        title: "Auth",
        status: "delivered",
      })
      .select("id")
      .single();
    if (card.error) throw card.error;
    cardId = card.data.id as string;
  });

  afterAll(async () => {
    if (projectId) await admin.from("projects").delete().eq("id", projectId);
    for (const id of userIds) await admin.auth.admin.deleteUser(id);
  });

  it("AC-1: a superadmin sees + manages a project with no membership row", async () => {
    const read = await superadmin.from("projects").select("id").eq("id", projectId).maybeSingle();
    expect(read.data?.id).toBe(projectId);
    const ev = await superadmin.from("env_vars").select("id").eq("project_id", projectId);
    expect((ev.data ?? []).length).toBeGreaterThan(0);
    // and can manage People
    const manage = await superadmin.rpc("set_project_member", {
      p_project: projectId,
      p_email: viewerEmail,
      p_role: "viewer",
    });
    expect(manage.error).toBeNull();
  });

  it("AC-2: a non-member sees nothing of the project", async () => {
    const proj = await outsider.from("projects").select("id").eq("id", projectId);
    expect(proj.data ?? []).toHaveLength(0);
    const docs = await outsider.from("documents").select("id").eq("project_id", projectId);
    expect(docs.data ?? []).toHaveLength(0);
    const cards = await outsider.from("portal_cards").select("id").eq("project_id", projectId);
    expect(cards.data ?? []).toHaveLength(0);
  });

  it("AC-4: developer can reveal secrets; video editor cannot even see env vars", async () => {
    const devReveal = await developer.rpc("reveal_env_var", {
      p_id: envVarId,
      p_intent: "reveal",
    });
    expect(devReveal.error).toBeNull();
    expect(devReveal.data).toBe("ciphertext-xyz");

    const videoSees = await video.from("env_vars").select("id").eq("project_id", projectId);
    expect(videoSees.data ?? []).toHaveLength(0); // not even the keys
    const videoReveal = await video.rpc("reveal_env_var", {
      p_id: envVarId,
      p_intent: "reveal",
    });
    expect(videoReveal.error?.message ?? "").toMatch(/not authorized/i);

    // but a video editor CAN write documents
    const doc = await video.from("documents").insert({
      project_id: projectId,
      kind: "link",
      title: "vid",
      url: "https://x.com",
      created_by: userIds[3],
    });
    expect(doc.error).toBeNull();
  });

  it("AC-5: a viewer reads but every mutation is rejected", async () => {
    // reads
    const proj = await viewer.from("projects").select("id").eq("id", projectId).maybeSingle();
    expect(proj.data?.id).toBe(projectId);
    const keys = await viewer.from("env_vars").select("key").eq("project_id", projectId);
    expect((keys.data ?? []).length).toBeGreaterThan(0); // sees keys
    // reveal denied
    const reveal = await viewer.rpc("reveal_env_var", {
      p_id: envVarId,
      p_intent: "reveal",
    });
    expect(reveal.error?.message ?? "").toMatch(/not authorized/i);
    // document insert denied (RLS)
    const doc = await viewer
      .from("documents")
      .insert({ project_id: projectId, kind: "link", title: "v", url: "https://y.com" });
    expect(doc.error).not.toBeNull();
    // portal mutation denied
    const comment = await viewer.from("portal_comments").insert({
      project_id: projectId,
      card_id: cardId,
      author_kind: "member",
      author_name: "v",
      body: "hi",
    });
    expect(comment.error).not.toBeNull();
    // People management denied
    const people = await viewer.rpc("set_project_member", {
      p_project: projectId,
      p_email: viewerEmail,
      p_role: "pm",
    });
    expect(people.error?.message ?? "").toMatch(/not authorized/i);
  });

  it("AC-3: a developer (non-PM) cannot manage People", async () => {
    const res = await developer.rpc("set_project_member", {
      p_project: projectId,
      p_email: viewerEmail,
      p_role: "developer",
    });
    expect(res.error?.message ?? "").toMatch(/not authorized/i);
  });

  it("AC-6: a freshly created project auto-gets a PM row (trigger)", async () => {
    const p = await pm.rpc("create_project", { p_name: `IT Trigger ${stamp}` });
    expect(p.error).toBeNull();
    const pmRow = await admin
      .from("project_members")
      .select("role")
      .eq("project_id", p.data!.id)
      .eq("user_id", userIds[1] as string)
      .maybeSingle();
    expect(pmRow.data?.role).toBe("pm");
    await admin.from("projects").delete().eq("id", p.data!.id);
  });

  it("AC-2: a removed creator can no longer read their old project (no created_by carve-out)", async () => {
    // The developer creates a project (→ PM via trigger), then a superadmin removes them.
    const created = await developer.rpc("create_project", { p_name: `IT Removed ${stamp}` });
    expect(created.error).toBeNull();
    const removedId = created.data.id as string;
    // Seat a second PM so the last-PM guard doesn't block the removal.
    const second = await superadmin.rpc("set_project_member", {
      p_project: removedId,
      p_email: viewerEmail,
      p_role: "pm",
    });
    expect(second.error).toBeNull();
    const removal = await superadmin.rpc("remove_project_member", {
      p_project: removedId,
      p_user: userIds[2] as string, // the developer
    });
    expect(removal.error).toBeNull();
    // The former creator now sees nothing of the project (AC-2), despite created_by matching.
    const read = await developer.from("projects").select("id").eq("id", removedId);
    expect(read.data ?? []).toHaveLength(0);
    await admin.from("projects").delete().eq("id", removedId);
  });

  it("AC-7: the last PM cannot be demoted or removed", async () => {
    // PM demotes self → blocked (they're the only PM)
    const demote = await pm.rpc("set_project_member", {
      p_project: projectId,
      p_email: `role-pm-${stamp}@progix.test`,
      p_role: "viewer",
    });
    expect(demote.error?.message ?? "").toMatch(/last_pm/);
    const remove = await pm.rpc("remove_project_member", {
      p_project: projectId,
      p_user: userIds[1] as string,
    });
    expect(remove.error?.message ?? "").toMatch(/last_pm/);
  });
});
