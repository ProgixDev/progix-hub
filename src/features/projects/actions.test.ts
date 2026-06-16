import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";

vi.mock("@/lib/auth/session", () => ({ requireMember: vi.fn() }));
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

import { requireMember } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { deleteProjectAction } from "./actions";

const mockRequireMember = vi.mocked(requireMember);
const mockCreateClient = vi.mocked(createClient);
const VALID_ID = "11111111-1111-4111-8111-111111111111";

const member = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "pm@progix.test",
  name: "PM",
  avatarUrl: null,
  initials: "PM",
  isSuperadmin: false,
  isLead: false,
};

/** A supabase stub whose projects.delete()…select() resolves to the given result. */
function clientReturning(result: { data: { id: string }[] | null; error: unknown }) {
  const select = vi.fn().mockResolvedValue(result);
  const eq = vi.fn(() => ({ select }));
  const del = vi.fn(() => ({ eq }));
  mockCreateClient.mockResolvedValue({
    from: vi.fn(() => ({ delete: del })),
  } as unknown as Awaited<ReturnType<typeof createClient>>);
  return { del, eq, select };
}

describe("deleteProjectAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireMember.mockResolvedValue(member);
  });

  it("refuses a signed-out caller before touching the database", async () => {
    mockRequireMember.mockResolvedValue(null);
    const res = await deleteProjectAction(VALID_ID);
    expect(res.ok).toBe(false);
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it("rejects a malformed project id", async () => {
    const res = await deleteProjectAction("not-a-uuid");
    expect(res).toEqual({ ok: false, error: en.errors.unknownProject });
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it("reports not-authorized when RLS deletes no rows (non-PM)", async () => {
    clientReturning({ data: [], error: null });
    const res = await deleteProjectAction(VALID_ID);
    expect(res).toEqual({ ok: false, error: en.errors.notAuthorized });
  });

  it("succeeds when a row is deleted", async () => {
    clientReturning({ data: [{ id: VALID_ID }], error: null });
    const res = await deleteProjectAction(VALID_ID);
    expect(res).toEqual({ ok: true });
  });
});
