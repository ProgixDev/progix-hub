import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Live-DB integration tests for spec-004 RLS: members read/write documents, non-members are shut
// out, and the private Storage bucket isn't listable anonymously. Skips when the env is absent.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const configured = Boolean(url && anon && serviceRole);
const noPersist = { auth: { persistSession: false, autoRefreshToken: false } } as const;

describe.skipIf(!configured)("documents security invariants (live DB)", () => {
  const admin = createClient(url as string, serviceRole as string, noPersist);
  let memberClient: SupabaseClient;
  let nonMemberClient: SupabaseClient;
  let memberId = "";
  let nonMemberId = "";
  let projectId = "";
  let docId = "";

  const stamp = Date.now();
  const password = "Integration-Test-Pw-123!";
  const memberEmail = `doc-member-${stamp}@progix.test`;
  const nonMemberEmail = `doc-nonmember-${stamp}@progix.test`;

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
      .insert({ name: `IT Docs ${stamp}` })
      .select("id")
      .single();
    if (project.error) throw project.error;
    projectId = project.data.id as string;

    const doc = await memberClient
      .from("documents")
      .insert({ project_id: projectId, kind: "link", title: "IT link", url: "https://example.com" })
      .select("id")
      .single();
    if (doc.error) throw doc.error;
    docId = doc.data.id as string;
  });

  afterAll(async () => {
    if (projectId) await admin.from("projects").delete().eq("id", projectId);
    if (memberId) await admin.auth.admin.deleteUser(memberId);
    if (nonMemberId) await admin.auth.admin.deleteUser(nonMemberId);
  });

  it("a member can read the document they added", async () => {
    const res = await memberClient.from("documents").select("id").eq("id", docId).maybeSingle();
    expect(res.data?.id).toBe(docId);
  });

  it("a non-member cannot read or insert documents (AC-6)", async () => {
    const read = await nonMemberClient.from("documents").select("id").eq("project_id", projectId);
    expect(read.data ?? []).toHaveLength(0);

    const insert = await nonMemberClient
      .from("documents")
      .insert({ project_id: projectId, kind: "link", title: "x", url: "https://y.com" });
    expect(insert.error).not.toBeNull();
  });

  it("the private bucket is not listable anonymously", async () => {
    const anonClient = createClient(url as string, anon as string, noPersist);
    const res = await anonClient.storage.from("project-documents").list(projectId);
    expect(res.data ?? []).toHaveLength(0);
  });
});
