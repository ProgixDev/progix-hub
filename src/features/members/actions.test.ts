import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";

vi.mock("@/lib/auth/session", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async () => (key: string) => {
    const value = key
      .split(".")
      .reduce<unknown>((acc, part) => (acc as Record<string, unknown>)?.[part], en);
    return typeof value === "string" ? value : key;
  }),
}));

import { getCurrentUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { setMemberLeadAction } from "./actions";

const mockGetCurrentUser = vi.mocked(getCurrentUser);
const mockCreateAdminClient = vi.mocked(createAdminClient);

const superadmin = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "boss@progix.test",
  name: "Boss",
  avatarUrl: null,
  initials: "B",
  isSuperadmin: true,
  isLead: false,
};
const targetId = "22222222-2222-4222-8222-222222222222";

function adminWith(
  getUser: ReturnType<typeof vi.fn>,
  updateUser: ReturnType<typeof vi.fn> = vi.fn().mockResolvedValue({ error: null }),
) {
  mockCreateAdminClient.mockReturnValue({
    auth: { admin: { getUserById: getUser, updateUserById: updateUser } },
  } as unknown as ReturnType<typeof createAdminClient>);
  return { getUser, updateUser };
}

beforeEach(() => vi.clearAllMocks());

describe("setMemberLeadAction (spec 011 AC-2 / AC-5)", () => {
  it("refuses a non-superadmin before touching the admin client", async () => {
    mockGetCurrentUser.mockResolvedValue({ ...superadmin, isSuperadmin: false });
    adminWith(vi.fn());
    const res = await setMemberLeadAction({ userId: targetId, makeLead: true });
    expect(res.ok).toBe(false);
    expect(mockCreateAdminClient).not.toHaveBeenCalled();
  });

  it("refuses changing your own role", async () => {
    mockGetCurrentUser.mockResolvedValue(superadmin);
    adminWith(vi.fn());
    const res = await setMemberLeadAction({ userId: superadmin.id, makeLead: true });
    expect(res.ok).toBe(false);
    expect(mockCreateAdminClient).not.toHaveBeenCalled();
  });

  it("refuses promoting a superadmin target", async () => {
    mockGetCurrentUser.mockResolvedValue(superadmin);
    const { updateUser } = adminWith(
      vi.fn().mockResolvedValue({
        data: { user: { app_metadata: { is_superadmin: true } } },
        error: null,
      }),
    );
    const res = await setMemberLeadAction({ userId: targetId, makeLead: true });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/superadmin/i);
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("sets is_lead on a normal member (happy path)", async () => {
    mockGetCurrentUser.mockResolvedValue(superadmin);
    const { updateUser } = adminWith(
      vi
        .fn()
        .mockResolvedValue({ data: { user: { app_metadata: { is_member: true } } }, error: null }),
    );
    const res = await setMemberLeadAction({ userId: targetId, makeLead: true });
    expect(res.ok).toBe(true);
    expect(updateUser).toHaveBeenCalledWith(targetId, {
      app_metadata: { is_member: true, is_lead: true },
    });
  });
});
