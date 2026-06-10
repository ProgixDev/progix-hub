import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/session", () => ({ requireMember: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("next-intl/server", () => ({ getTranslations: vi.fn(async () => (key: string) => key) }));

import { cookies } from "next/headers";
import { requireMember } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { updateSettingsAction } from "./actions";

const mockRequireMember = vi.mocked(requireMember);
const mockCreateClient = vi.mocked(createClient);
const mockCookies = vi.mocked(cookies);

const member = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "m@progix.test",
  name: "M",
  avatarUrl: null,
  initials: "M",
  isSuperadmin: false,
};
const cookieSet = vi.fn();

function mockClient() {
  const updateUser = vi.fn().mockResolvedValue({ error: null });
  mockCreateClient.mockResolvedValue({
    auth: { updateUser },
  } as unknown as Awaited<ReturnType<typeof createClient>>);
  return { updateUser };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCookies.mockResolvedValue({ set: cookieSet } as unknown as Awaited<
    ReturnType<typeof cookies>
  >);
});

describe("updateSettingsAction (spec 005)", () => {
  it("refuses a non-member (AC-7 defense in depth)", async () => {
    mockRequireMember.mockResolvedValue(null);
    const c = mockClient();
    const res = await updateSettingsAction({ locale: "fr" });
    expect(res.ok).toBe(false);
    expect(c.updateUser).not.toHaveBeenCalled();
  });

  it("persists locale + theme to user_metadata and mirrors the cookies (AC-4)", async () => {
    mockRequireMember.mockResolvedValue(member);
    const c = mockClient();
    const res = await updateSettingsAction({ locale: "fr", theme: "light" });
    expect(res.ok).toBe(true);
    expect(c.updateUser).toHaveBeenCalledWith({ data: { locale: "fr", theme: "light" } });
    expect(cookieSet).toHaveBeenCalledWith(
      "NEXT_LOCALE",
      "fr",
      expect.objectContaining({ path: "/" }),
    );
    expect(cookieSet).toHaveBeenCalledWith(
      "theme",
      "light",
      expect.objectContaining({ path: "/" }),
    );
  });

  it("rejects an invalid value without persisting", async () => {
    mockRequireMember.mockResolvedValue(member);
    const c = mockClient();
    const res = await updateSettingsAction({ locale: "de" });
    expect(res.ok).toBe(false);
    expect(c.updateUser).not.toHaveBeenCalled();
  });
});
