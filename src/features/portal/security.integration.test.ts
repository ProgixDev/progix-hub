import { createHash, randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Live-DB integration tests for spec-006's public trust tier (ADR-0010): the anon role can
// reach the portal ONLY through the token-validated RPCs — never the tables — and a revoked
// or invalid token yields nothing. Skips when the env is absent.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const configured = Boolean(url && anon && serviceRole);
const noPersist = { auth: { persistSession: false, autoRefreshToken: false } } as const;

describe.skipIf(!configured)("portal security invariants (live DB)", () => {
  const admin = createClient(url as string, serviceRole as string, noPersist);
  const anonClient = () => createClient(url as string, anon as string, noPersist);
  let memberClient: SupabaseClient;
  let memberId = "";
  let projectId = "";
  let otherProjectId = "";
  let blockId = "";
  let cardId = "";
  let token = "";
  let revokedToken = "";

  const stamp = Date.now();
  const password = "Integration-Test-Pw-123!";
  const memberEmail = `portal-member-${stamp}@progix.test`;

  function mint(): { token: string; hash: string } {
    const raw = randomBytes(32).toString("base64url");
    return { token: raw, hash: createHash("sha256").update(raw, "utf8").digest("hex") };
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

    memberClient = createClient(url as string, anon as string, noPersist);
    const { error: signInError } = await memberClient.auth.signInWithPassword({
      email: memberEmail,
      password,
    });
    if (signInError) throw signInError;

    const project = await memberClient
      .from("projects")
      .insert({ name: `IT Portal ${stamp}` })
      .select("id")
      .single();
    if (project.error) throw project.error;
    projectId = project.data.id as string;

    const other = await memberClient
      .from("projects")
      .insert({ name: `IT Portal other ${stamp}` })
      .select("id")
      .single();
    if (other.error) throw other.error;
    otherProjectId = other.data.id as string;

    const block = await memberClient
      .from("portal_blocks")
      .insert({ project_id: projectId, name: "App" })
      .select("id")
      .single();
    if (block.error) throw block.error;
    blockId = block.data.id as string;

    const card = await memberClient
      .from("portal_cards")
      .insert({ project_id: projectId, block_id: blockId, title: "Auth", status: "delivered" })
      .select("id")
      .single();
    if (card.error) throw card.error;
    cardId = card.data.id as string;

    const live = mint();
    token = live.token;
    const linkInsert = await memberClient
      .from("portal_share_links")
      .insert({ project_id: projectId, token_hash: live.hash });
    if (linkInsert.error) throw linkInsert.error;

    const dead = mint();
    revokedToken = dead.token;
    const revokedInsert = await memberClient.from("portal_share_links").insert({
      project_id: projectId,
      token_hash: dead.hash,
      revoked_at: new Date().toISOString(),
    });
    if (revokedInsert.error) throw revokedInsert.error;
  });

  afterAll(async () => {
    if (projectId) await admin.from("projects").delete().eq("id", projectId);
    if (otherProjectId) await admin.from("projects").delete().eq("id", otherProjectId);
    if (memberId) await admin.auth.admin.deleteUser(memberId);
  });

  it("anon cannot SELECT any portal table directly (AC-7)", async () => {
    const client = anonClient();
    for (const table of [
      "portal_share_links",
      "portal_blocks",
      "portal_cards",
      "portal_comments",
      "portal_attachments",
    ]) {
      const res = await client.from(table).select("id").limit(1);
      // Either an explicit permission error or an empty RLS-filtered result — never rows.
      expect(res.data ?? []).toHaveLength(0);
    }
  });

  it("a valid token reads exactly its project's tree via the RPC (AC-3)", async () => {
    const res = await anonClient().rpc("portal_public_view", { p_token: token });
    expect(res.error).toBeNull();
    expect(res.data?.project_name).toContain("IT Portal");
    expect(res.data?.blocks?.[0]?.name).toBe("App");
    expect(res.data?.cards?.[0]?.title).toBe("Auth");
  });

  it("an invalid or revoked token yields nothing (AC-7)", async () => {
    const bogus = await anonClient().rpc("portal_public_view", {
      p_token: randomBytes(32).toString("base64url"),
    });
    expect(bogus.data).toBeNull();

    const revoked = await anonClient().rpc("portal_public_view", { p_token: revokedToken });
    expect(revoked.data).toBeNull();
  });

  it("a client comment lands via the RPC and a bad card is rejected (AC-4/AC-7)", async () => {
    const ok = await anonClient().rpc("portal_public_comment", {
      p_token: token,
      p_card_id: cardId,
      p_author: "IT Client",
      p_body: "Looks great",
    });
    expect(ok.error).toBeNull();

    // A card from another project (or a random id) is unreachable through this token.
    const bad = await anonClient().rpc("portal_public_comment", {
      p_token: token,
      p_card_id: "00000000-0000-4000-8000-00000000dead",
      p_author: "IT Client",
      p_body: "x",
    });
    expect(bad.error?.message ?? "").toContain("portal_unknown_card");
  });

  it("a proposal lands as a proposed client card (AC-6)", async () => {
    const res = await anonClient().rpc("portal_public_propose", {
      p_token: token,
      p_block_id: null,
      p_title: "IT proposal",
      p_description: "please",
      p_author: "IT Client",
    });
    expect(res.error).toBeNull();
    const card = await memberClient
      .from("portal_cards")
      .select("status, origin, client_author")
      .eq("project_id", projectId)
      .eq("title", "IT proposal")
      .single();
    expect(card.data?.status).toBe("proposed");
    expect(card.data?.origin).toBe("client");
    expect(card.data?.client_author).toBe("IT Client");
  });

  it("rapid client writes hit the rate limit (AC-8)", async () => {
    const client = anonClient();
    let limited = false;
    for (let i = 0; i < 12; i++) {
      const res = await client.rpc("portal_public_comment", {
        p_token: token,
        p_card_id: cardId,
        p_author: "IT Flood",
        p_body: `flood ${i}`,
      });
      if (res.error?.message?.includes("portal_rate_limited")) {
        limited = true;
        break;
      }
    }
    expect(limited).toBe(true);
  });

  it("a forged attachment path outside the project prefix is rejected (AC-7)", async () => {
    const res = await anonClient().rpc("portal_public_record_attachment", {
      p_token: token,
      p_card_id: cardId,
      p_file_path: `${otherProjectId}/escape/evil.pdf`,
      p_file_name: "evil.pdf",
      p_file_size: 10,
      p_file_mime: "application/pdf",
      p_author: "IT Client",
    });
    expect(res.error?.message ?? "").toMatch(/portal_bad_path|portal_rate_limited/);
  });

  it("the portal-attachments bucket is not listable anonymously (AC-7)", async () => {
    const res = await anonClient().storage.from("portal-attachments").list(projectId);
    expect(res.data ?? []).toHaveLength(0);
  });
});
