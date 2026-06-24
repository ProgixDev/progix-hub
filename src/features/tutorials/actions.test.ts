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
import { createTutorialAction } from "./actions";

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
  const insert = vi.fn().mockResolvedValue(result);
  mockCreateClient.mockResolvedValue({
    from: vi.fn(() => ({ insert })),
  } as unknown as Awaited<ReturnType<typeof createClient>>);
  return { insert };
}

const valid = { title: "Set up Stripe", embed_url: "https://youtu.be/8VLGMiM-mm8" };

describe("createTutorialAction (spec 016)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("refuses a non-admin before touching the database (AC-4)", async () => {
    mockGetCurrentUser.mockResolvedValue({ ...admin, isSuperadmin: false });
    clientWithInsert();
    const res = await createTutorialAction(valid);
    expect(res.ok).toBe(false);
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it("rejects an unembeddable link with a field error, writing nothing (AC-5)", async () => {
    mockGetCurrentUser.mockResolvedValue(admin);
    const { insert } = clientWithInsert();
    const res = await createTutorialAction({ title: "x", embed_url: "https://example.com/v/1" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.fieldErrors?.embed_url).toBeTruthy();
    expect(insert).not.toHaveBeenCalled();
  });

  it("inserts a valid tutorial, stamping created_by (AC-1)", async () => {
    mockGetCurrentUser.mockResolvedValue(admin);
    const { insert } = clientWithInsert();
    const res = await createTutorialAction({ ...valid, platform_service_id: "stripe" });
    expect(res).toEqual({ ok: true });
    expect(insert.mock.calls[0]![0]).toMatchObject({
      title: "Set up Stripe",
      embed_url: "https://youtu.be/8VLGMiM-mm8",
      platform_service_id: "stripe",
      created_by: admin.id,
    });
  });
});
