import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Live-DB integration tests for the spec-003 security invariants — the things RLS/grants/RPCs
// enforce that unit tests can't reach. Skips cleanly when the Supabase env is absent. Creates a
// member + a non-member, a project, and a variable, then cleans up. Run with `pnpm test:integration`.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const configured = Boolean(url && anon && serviceRole);

const noPersist = { auth: { persistSession: false, autoRefreshToken: false } } as const;

describe.skipIf(!configured)("env-vars security invariants (live DB)", () => {
  const admin = createClient(url as string, serviceRole as string, noPersist);

  let memberClient: SupabaseClient;
  let nonMemberClient: SupabaseClient;
  let memberId = "";
  let nonMemberId = "";
  let projectId = "";

  const stamp = Date.now();
  const envVarId = randomUUID();
  const key = `IT_SECRET_${stamp}`;
  const ciphertext = `v1:integration-ciphertext-${stamp}`;
  const memberEmail = `it-member-${stamp}@progix.test`;
  const nonMemberEmail = `it-nonmember-${stamp}@progix.test`;
  const password = "Integration-Test-Pw-123!";

  async function signIn(email: string): Promise<SupabaseClient> {
    const client = createClient(url as string, anon as string, noPersist);
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw new Error(`sign-in failed for ${email}: ${error.message}`);
    return client;
  }

  beforeAll(async () => {
    const member = await admin.auth.admin.createUser({
      email: memberEmail,
      password,
      email_confirm: true,
      app_metadata: { is_member: true },
    });
    if (member.error) throw member.error;
    memberId = member.data.user.id;

    const nonMember = await admin.auth.admin.createUser({
      email: nonMemberEmail,
      password,
      email_confirm: true,
      app_metadata: { is_member: false },
    });
    if (nonMember.error) throw nonMember.error;
    nonMemberId = nonMember.data.user.id;

    memberClient = await signIn(memberEmail);
    nonMemberClient = await signIn(nonMemberEmail);

    const project = await memberClient
      .from("projects")
      .insert({ name: `IT Project ${stamp}` })
      .select("id")
      .single();
    if (project.error) throw project.error;
    projectId = project.data.id as string;
  });

  afterAll(async () => {
    if (projectId) {
      await admin.from("env_var_audit").delete().eq("project_id", projectId);
      await admin.from("projects").delete().eq("id", projectId);
    }
    if (memberId) await admin.auth.admin.deleteUser(memberId);
    if (nonMemberId) await admin.auth.admin.deleteUser(nonMemberId);
  });

  it("stores ciphertext that a member can never SELECT (AC-5 isolation)", async () => {
    const created = await memberClient.rpc("create_env_var", {
      p_id: envVarId,
      p_project_id: projectId,
      p_key: key,
      p_service: "stripe",
      p_ciphertext: ciphertext,
    });
    expect(created.error).toBeNull();

    // admin sees exactly the stored ciphertext (the column holds the blob, not plaintext)
    const raw = await admin
      .from("env_var_secrets")
      .select("value_ciphertext")
      .eq("env_var_id", envVarId)
      .single();
    expect(raw.data?.value_ciphertext).toBe(ciphertext);

    // a member cannot read env_var_secrets at all (no policy + grants revoked)
    const leak = await memberClient.from("env_var_secrets").select("value_ciphertext");
    expect(leak.data ?? []).toHaveLength(0);
  });

  it("forbids a member from forging or erasing the audit trail (append-only)", async () => {
    const forge = await memberClient.from("env_var_audit").insert({
      project_id: projectId,
      env_var_key: key,
      action: "reveal",
      actor_email: "victim@progix.test",
    });
    expect(forge.error).not.toBeNull();

    const wipe = await memberClient.from("env_var_audit").delete().eq("project_id", projectId);
    expect(wipe.error).not.toBeNull();
  });

  it("refuses a non-member at the RPC layer (AC-6)", async () => {
    const blocked = await nonMemberClient.rpc("reveal_env_var", {
      p_id: envVarId,
      p_intent: "reveal",
    });
    expect(blocked.error).not.toBeNull();
  });

  it("reveals the ciphertext and records a server-bound actor (AC-3)", async () => {
    const revealed = await memberClient.rpc("reveal_env_var", {
      p_id: envVarId,
      p_intent: "reveal",
    });
    expect(revealed.error).toBeNull();
    expect(revealed.data).toBe(ciphertext);

    // the actor on the audit row comes from the JWT, not a client field
    const audit = await admin
      .from("env_var_audit")
      .select("actor_email")
      .eq("env_var_id", envVarId)
      .eq("action", "reveal")
      .single();
    expect(audit.data?.actor_email).toBe(memberEmail);
  });

  it("retains the audit trail after the variable is deleted (AC-10)", async () => {
    const del = await memberClient.rpc("delete_env_var", { p_id: envVarId });
    expect(del.error).toBeNull();

    // the variable + its secret are gone
    const gone = await admin.from("env_vars").select("id").eq("id", envVarId).maybeSingle();
    expect(gone.data).toBeNull();

    // the audit history survives, with the key preserved
    const trail = await admin.from("env_var_audit").select("action").eq("env_var_key", key);
    const actions = (trail.data ?? []).map((r) => r.action as string);
    expect(actions).toEqual(expect.arrayContaining(["create", "reveal", "delete"]));
  });
});
