import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";

vi.mock("@/lib/auth/session", () => ({ getCurrentUser: vi.fn(), getProjectRole: vi.fn() }));
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

import { getCurrentUser, getProjectRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { upsertDossierAction } from "./actions";

const mockUser = vi.mocked(getCurrentUser);
const mockRole = vi.mocked(getProjectRole);
const mockCreateClient = vi.mocked(createClient);
const PROJECT = "11111111-1111-4111-8111-111111111111";
const user = {
  id: "00000000-0000-4000-8000-000000000009",
  email: "dev@progix.test",
  name: "Dev",
  avatarUrl: null,
  initials: "D",
  isSuperadmin: false,
  isLead: false,
  isGlobalPm: false,
};

function clientWithUpsert(result: { error: unknown } = { error: null }) {
  const upsert = vi.fn().mockResolvedValue(result);
  mockCreateClient.mockResolvedValue({
    from: vi.fn(() => ({ upsert })),
  } as unknown as Awaited<ReturnType<typeof createClient>>);
  return { upsert };
}

describe("upsertDossierAction (spec 018)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("refuses a member with no access to the project (AC-3)", async () => {
    mockUser.mockResolvedValue(user);
    mockRole.mockResolvedValue(null);
    clientWithUpsert();
    const res = await upsertDossierAction(PROJECT, { contact_name: "Jane" });
    expect(res.ok).toBe(false);
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it("rejects an out-of-range IT-savviness (AC-4)", async () => {
    mockUser.mockResolvedValue(user);
    mockRole.mockResolvedValue("developer");
    const { upsert } = clientWithUpsert();
    const res = await upsertDossierAction(PROJECT, { it_savviness: "9" });
    expect(res.ok).toBe(false);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("upserts the dossier scoped to the project (AC-1/AC-2)", async () => {
    mockUser.mockResolvedValue(user);
    mockRole.mockResolvedValue("pm");
    const { upsert } = clientWithUpsert();
    const res = await upsertDossierAction(PROJECT, { contact_name: "Jane", it_savviness: "3" });
    expect(res).toEqual({ ok: true });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: PROJECT,
        contact_name: "Jane",
        it_savviness: 3,
        updated_by: user.id,
      }),
    );
  });
});
