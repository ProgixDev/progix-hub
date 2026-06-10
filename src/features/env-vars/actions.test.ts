import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";

// Mock the server-only boundaries so the action module loads + runs in vitest.
vi.mock("@/lib/auth/session", () => ({ requireMember: vi.fn() }));
vi.mock("@/lib/crypto/secrets", () => ({
  encryptSecret: vi.fn((value: string) => `v1:cipher(${value})`),
  decryptSecret: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

// `getTranslations()` resolves dotted keys against the English catalog, so the action
// returns the same user-facing strings these tests already assert on (spec 005).
vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async () => (key: string) => {
    const value = key
      .split(".")
      .reduce<unknown>((acc, part) => (acc as Record<string, unknown>)?.[part], en);
    return typeof value === "string" ? value : key;
  }),
}));

import { requireMember } from "@/lib/auth/session";
import { decryptSecret } from "@/lib/crypto/secrets";
import { createClient } from "@/lib/supabase/server";
import {
  createEnvVarAction,
  deleteEnvVarAction,
  revealEnvVarValueAction,
  updateEnvVarAction,
} from "./actions";

const mockRequireMember = vi.mocked(requireMember);
const mockCreateClient = vi.mocked(createClient);
const mockDecrypt = vi.mocked(decryptSecret);

const member = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "m@progix.test",
  name: "M",
  avatarUrl: null,
  initials: "M",
};
const projectId = "11111111-1111-4111-8111-111111111111";
const envVarId = "22222222-2222-4222-8222-222222222222";

function clientWithRpc(rpc: ReturnType<typeof vi.fn>) {
  mockCreateClient.mockResolvedValue({
    rpc,
  } as unknown as Awaited<ReturnType<typeof createClient>>);
}

beforeEach(() => vi.clearAllMocks());

describe("env-vars actions — membership gate (AC-6)", () => {
  it("every action refuses a non-member before touching the database", async () => {
    mockRequireMember.mockResolvedValue(null);
    const rpc = vi.fn();
    clientWithRpc(rpc);

    const results = await Promise.all([
      createEnvVarAction(projectId, { key: "K", value: "v" }),
      updateEnvVarAction(envVarId, projectId, { key: "K", value: "v" }),
      deleteEnvVarAction(envVarId, projectId),
      revealEnvVarValueAction(envVarId, "reveal"),
    ]);

    for (const res of results) {
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error).toMatch(/authorized/i);
    }
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe("createEnvVarAction", () => {
  beforeEach(() => mockRequireMember.mockResolvedValue(member));

  it("maps a duplicate key (23505) to a friendly field error (AC-7)", async () => {
    clientWithRpc(vi.fn().mockResolvedValue({ error: { code: "23505", message: "dup" } }));
    const res = await createEnvVarAction(projectId, { key: "STRIPE_SECRET_KEY", value: "sk" });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toMatch(/already exists/i);
      expect(res.fieldErrors?.key).toBeTruthy();
    }
  });

  it("encrypts the value before it reaches the RPC (AC-1, AC-5)", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });
    clientWithRpc(rpc);
    const res = await createEnvVarAction(projectId, { key: "K", value: "v", service: "stripe" });
    expect(res.ok).toBe(true);
    expect(rpc).toHaveBeenCalledWith(
      "create_env_var",
      expect.objectContaining({
        p_project_id: projectId,
        p_key: "K",
        p_service: "stripe",
        p_ciphertext: expect.stringContaining("cipher("),
      }),
    );
  });

  it("rejects invalid input without calling the RPC", async () => {
    const rpc = vi.fn();
    clientWithRpc(rpc);
    const res = await createEnvVarAction(projectId, { key: "", value: "" });
    expect(res.ok).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe("revealEnvVarValueAction", () => {
  beforeEach(() => mockRequireMember.mockResolvedValue(member));

  it("decrypts the ciphertext the reveal RPC returns (AC-3)", async () => {
    clientWithRpc(vi.fn().mockResolvedValue({ data: "v1:cipher", error: null }));
    mockDecrypt.mockReturnValue("sk_live_secret");
    expect(await revealEnvVarValueAction(envVarId, "reveal")).toEqual({
      ok: true,
      value: "sk_live_secret",
    });
  });

  it("returns a clear error when decryption fails (rotated/changed key)", async () => {
    clientWithRpc(vi.fn().mockResolvedValue({ data: "v99:garbage", error: null }));
    mockDecrypt.mockImplementation(() => {
      throw new Error("no key for version 99");
    });
    const res = await revealEnvVarValueAction(envVarId, "reveal");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/key may have changed/i);
  });
});
