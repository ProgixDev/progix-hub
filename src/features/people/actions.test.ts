import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/session", () => ({ requireMember: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next-intl/server", async () => {
  const en = (await import("@/messages/en.json")).default as Record<string, Record<string, string>>;
  return {
    getTranslations: async (ns?: string) => (key: string) => {
      const path = ns ? `${ns}.${key}` : key;
      const [a, b] = path.split(".");
      return en[a!]?.[b!] ?? path;
    },
  };
});

import { requireMember } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  changeMemberRoleAction,
  removeProjectMemberAction,
  setProjectMemberAction,
} from "./actions";

const mockRequireMember = vi.mocked(requireMember);
const mockCreateClient = vi.mocked(createClient);

const member = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "pm@progix.test",
  name: "PM",
  avatarUrl: null,
  initials: "PM",
  isSuperadmin: false,
};
const projectId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";

function mockRpc(error: { message: string } | null = null) {
  const rpc = vi.fn().mockResolvedValue({ data: null, error });
  mockCreateClient.mockResolvedValue({ rpc } as unknown as Awaited<
    ReturnType<typeof createClient>
  >);
  return rpc;
}

beforeEach(() => vi.clearAllMocks());

describe("setProjectMemberAction (AC-3)", () => {
  it("refuses a non-member without calling the RPC", async () => {
    mockRequireMember.mockResolvedValue(null);
    const rpc = mockRpc();
    const res = await setProjectMemberAction(projectId, {
      email: "x@progix.test",
      role: "developer",
    });
    expect(res.ok).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("passes a validated email + role to set_project_member", async () => {
    mockRequireMember.mockResolvedValue(member);
    const rpc = mockRpc();
    const res = await setProjectMemberAction(projectId, {
      email: "Dev@Progix.test",
      role: "developer",
    });
    expect(res.ok).toBe(true);
    expect(rpc).toHaveBeenCalledWith("set_project_member", {
      p_project: projectId,
      p_email: "dev@progix.test", // normalized
      p_role: "developer",
    });
  });

  it("rejects a bad email with a field error", async () => {
    mockRequireMember.mockResolvedValue(member);
    const rpc = mockRpc();
    const res = await setProjectMemberAction(projectId, { email: "not-an-email", role: "viewer" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.fieldErrors?.email).toBeTruthy();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("maps no_account / last_pm raises to friendly copy (AC-7)", async () => {
    mockRequireMember.mockResolvedValue(member);
    mockRpc({ message: "no_account" });
    const a = await setProjectMemberAction(projectId, {
      email: "ghost@progix.test",
      role: "viewer",
    });
    expect(a.ok).toBe(false);
    if (!a.ok) expect(a.error).toMatch(/no progixhub account/i);

    mockRpc({ message: "last_pm" });
    const b = await setProjectMemberAction(projectId, { email: "pm@progix.test", role: "viewer" });
    expect(b.ok).toBe(false);
    if (!b.ok) expect(b.error).toMatch(/at least one pm/i);
  });
});

describe("changeMemberRoleAction (AC-3)", () => {
  // This action resolves userId → email via list_project_members, then delegates to
  // set_project_member, so the RPC mock dispatches on the call name.
  function mockRpcByName(
    roster: Array<{ user_id: string; email: string | null }>,
    setError = null,
  ) {
    const rpc = vi.fn((name: string) => {
      if (name === "list_project_members") return Promise.resolve({ data: roster, error: null });
      return Promise.resolve({ data: null, error: setError });
    });
    mockCreateClient.mockResolvedValue({ rpc } as unknown as Awaited<
      ReturnType<typeof createClient>
    >);
    return rpc;
  }

  it("resolves the user's email and forwards the new role to set_project_member", async () => {
    mockRequireMember.mockResolvedValue(member);
    const rpc = mockRpcByName([{ user_id: userId, email: "dev@progix.test" }]);
    const res = await changeMemberRoleAction(projectId, { userId, role: "viewer" });
    expect(res.ok).toBe(true);
    expect(rpc).toHaveBeenCalledWith("set_project_member", {
      p_project: projectId,
      p_email: "dev@progix.test",
      p_role: "viewer",
    });
  });

  it("returns the no-account error when the user isn't on the roster", async () => {
    mockRequireMember.mockResolvedValue(member);
    const rpc = mockRpcByName([]); // empty roster → user not found
    const res = await changeMemberRoleAction(projectId, { userId, role: "viewer" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/no progixhub account/i);
    expect(rpc).not.toHaveBeenCalledWith("set_project_member", expect.anything());
  });

  it("maps a last-PM raise from set_project_member to friendly copy (AC-7)", async () => {
    mockRequireMember.mockResolvedValue(member);
    mockRpcByName([{ user_id: userId, email: "pm@progix.test" }], {
      message: "last_pm",
    } as unknown as null);
    const res = await changeMemberRoleAction(projectId, { userId, role: "viewer" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/at least one pm/i);
  });

  it("rejects a bad userId without touching the RPC", async () => {
    mockRequireMember.mockResolvedValue(member);
    const rpc = mockRpcByName([]);
    const res = await changeMemberRoleAction(projectId, { userId: "not-a-uuid", role: "viewer" });
    expect(res.ok).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe("removeProjectMemberAction (AC-3/AC-7)", () => {
  it("calls remove_project_member and maps the last-PM guard", async () => {
    mockRequireMember.mockResolvedValue(member);
    const rpc = mockRpc();
    const ok = await removeProjectMemberAction(projectId, userId);
    expect(ok.ok).toBe(true);
    expect(rpc).toHaveBeenCalledWith("remove_project_member", {
      p_project: projectId,
      p_user: userId,
    });

    mockRpc({ message: "last_pm" });
    const res = await removeProjectMemberAction(projectId, userId);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/at least one pm/i);
  });
});
