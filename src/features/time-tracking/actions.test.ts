import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ requireMember: vi.fn(), getCurrentUser: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async () => (key: string) => {
    const value = key
      .split(".")
      .reduce<unknown>((acc, part) => (acc as Record<string, unknown>)?.[part], en);
    return typeof value === "string" ? value : key;
  }),
}));

import { getCurrentUser, requireMember } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { startWorkAction } from "./actions";

const mockRequireMember = vi.mocked(requireMember);
const mockGetCurrentUser = vi.mocked(getCurrentUser);
const mockCreateClient = vi.mocked(createClient);

const member = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "dev@progix.test",
  name: "Dev",
  avatarUrl: null,
  initials: "D",
  isSuperadmin: false,
  isLead: false,
};

function client(rpcResult: { error: unknown }, sessionRow: unknown) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: sessionRow });
  const is = vi.fn(() => ({ maybeSingle }));
  const eq = vi.fn(() => ({ is }));
  const select = vi.fn(() => ({ eq }));
  const rpc = vi.fn().mockResolvedValue(rpcResult);
  mockCreateClient.mockResolvedValue({
    rpc,
    from: vi.fn(() => ({ select })),
  } as unknown as Awaited<ReturnType<typeof createClient>>);
  return { rpc };
}

describe("startWorkAction (spec 013 AC-1/AC-5)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("refuses a signed-out caller and never calls the RPC", async () => {
    mockRequireMember.mockResolvedValue(null);
    const { rpc } = client({ error: null }, null);
    const res = await startWorkAction();
    expect(res).toEqual({ ok: false, error: en.errors.notAuthorized });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("starts the clock and returns the fresh session", async () => {
    mockRequireMember.mockResolvedValue(member);
    mockGetCurrentUser.mockResolvedValue(member);
    const session = {
      id: "s1",
      user_id: member.id,
      started_at: "2026-06-16T09:00:00Z",
      ended_at: null,
      break_started_at: null,
      break_seconds: 0,
    };
    const { rpc } = client({ error: null }, session);
    const res = await startWorkAction();
    expect(rpc).toHaveBeenCalledWith("work_start");
    expect(res).toEqual({ ok: true, session });
  });
});
