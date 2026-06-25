import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";

vi.mock("@/lib/auth/session", () => ({ getProjectRole: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/activity/record", () => ({ recordActivity: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async () => (key: string) => {
    const value = key
      .split(".")
      .reduce<unknown>((acc, part) => (acc as Record<string, unknown>)?.[part], en);
    return typeof value === "string" ? value : key;
  }),
}));

import { getProjectRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createSetupAction } from "./actions";

const mockRole = vi.mocked(getProjectRole);
const mockCreateClient = vi.mocked(createClient);
const PROJECT = "11111111-1111-4111-8111-111111111111";
const PLATFORM = "22222222-2222-4222-8222-222222222222";

function clientWithRpc(result: { error: unknown } = { error: null }) {
  const rpc = vi.fn().mockResolvedValue(result);
  mockCreateClient.mockResolvedValue({ rpc } as unknown as Awaited<
    ReturnType<typeof createClient>
  >);
  return { rpc };
}

describe("createSetupAction (spec 017 AC-1)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("refuses a non-manager before touching the database (AC-6)", async () => {
    mockRole.mockResolvedValue("developer");
    clientWithRpc();
    const res = await createSetupAction(PROJECT, [PLATFORM]);
    expect(res.ok).toBe(false);
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it("rejects an empty platform selection", async () => {
    mockRole.mockResolvedValue("pm");
    const { rpc } = clientWithRpc();
    const res = await createSetupAction(PROJECT, []);
    expect(res.ok).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("creates the setup and returns a token + passcode once (AC-1)", async () => {
    mockRole.mockResolvedValue("pm");
    const { rpc } = clientWithRpc();
    const res = await createSetupAction(PROJECT, [PLATFORM]);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.token).toMatch(/^[A-Za-z0-9_-]{20,80}$/);
      expect(res.passcode).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
    }
    expect(rpc).toHaveBeenCalledWith(
      "create_project_setup",
      expect.objectContaining({ p_project: PROJECT, p_platform_ids: [PLATFORM] }),
    );
  });
});
