import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";

vi.mock("@/lib/auth/session", () => ({ getCurrentUser: vi.fn() }));
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

import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createPlatformAction } from "./actions";

const mockGetCurrentUser = vi.mocked(getCurrentUser);
const mockCreateClient = vi.mocked(createClient);

const admin = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "boss@progix.test",
  name: "Boss",
  avatarUrl: null,
  initials: "B",
  isSuperadmin: true,
  isLead: false,
  isGlobalPm: false,
};

function clientWithInsert(result: { error: unknown } = { error: null }) {
  // platforms: insert(row).select("id").single(); platform_tutorials: delete().eq() / insert([])
  const single = vi.fn().mockResolvedValue({ data: { id: "p1" }, error: result.error });
  const insert = vi.fn((_row: Record<string, unknown>) => ({ select: vi.fn(() => ({ single })) }));
  const del = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) }));
  mockCreateClient.mockResolvedValue({
    from: vi.fn(() => ({ insert, delete: del })),
  } as unknown as Awaited<ReturnType<typeof createClient>>);
  return { insert };
}

const validInvite = {
  name: "Stripe",
  access_pattern: "invite_collaborator",
  critical: true,
  steps: ["Open settings"],
  invite_url: "https://dashboard.stripe.com/settings/team",
  invite_role: "Developer",
  invite_email: "dev@progix.com",
};

describe("createPlatformAction (spec 015)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("refuses a non-admin before touching the database (AC-4)", async () => {
    mockGetCurrentUser.mockResolvedValue({ ...admin, isSuperadmin: false });
    clientWithInsert();
    const res = await createPlatformAction(validInvite);
    expect(res.ok).toBe(false);
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it("returns per-field errors on invalid input and writes nothing (AC-5)", async () => {
    mockGetCurrentUser.mockResolvedValue(admin);
    const { insert } = clientWithInsert();
    const res = await createPlatformAction({
      name: "Stripe",
      access_pattern: "invite_collaborator",
      steps: [],
    });
    expect(res.ok).toBe(false);
    if (!res.ok)
      expect(Object.keys(res.fieldErrors ?? {})).toEqual(
        expect.arrayContaining(["invite_url", "invite_role", "invite_email"]),
      );
    expect(insert).not.toHaveBeenCalled();
  });

  it("inserts a clean row for a valid platform, stamping created_by (AC-1)", async () => {
    mockGetCurrentUser.mockResolvedValue(admin);
    const { insert } = clientWithInsert();
    const res = await createPlatformAction(validInvite);
    expect(res).toEqual({ ok: true });
    expect(insert).toHaveBeenCalledTimes(1);
    const row = insert.mock.calls[0]![0];
    expect(row).toMatchObject({
      name: "Stripe",
      access_pattern: "invite_collaborator",
      invite_email: "dev@progix.com",
      key_label: null, // cross-pattern field nulled
      created_by: admin.id,
    });
  });
});
