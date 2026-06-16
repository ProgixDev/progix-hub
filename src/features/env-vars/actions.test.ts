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
  exportEnvFileAction,
  importEnvVarsAction,
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
  isSuperadmin: false,
};
const projectId = "11111111-1111-4111-8111-111111111111";
const envVarId = "22222222-2222-4222-8222-222222222222";

function clientWithRpc(rpc: ReturnType<typeof vi.fn>) {
  mockCreateClient.mockResolvedValue({
    rpc,
  } as unknown as Awaited<ReturnType<typeof createClient>>);
}

function clientForExport(
  rows: Array<{ id: string; key: string; scope: string }>,
  reveal: (args: { p_id: string; p_intent: string }) => { data: unknown; error: unknown },
) {
  const builder = {
    select: () => builder,
    eq: () => builder,
    order: () => Promise.resolve({ data: rows, error: null }),
  };
  const rpc = vi.fn((name: string, args: { p_id: string; p_intent: string }) =>
    Promise.resolve(name === "reveal_env_var" ? reveal(args) : { data: null, error: null }),
  );
  mockCreateClient.mockResolvedValue({
    from: () => builder,
    rpc,
  } as unknown as Awaited<ReturnType<typeof createClient>>);
  return rpc;
}

beforeEach(() => vi.clearAllMocks());

describe("env-vars actions — membership gate (AC-6 / spec 009 AC-5)", () => {
  it("every action refuses a non-member before touching the database", async () => {
    mockRequireMember.mockResolvedValue(null);
    const rpc = vi.fn();
    clientWithRpc(rpc);

    const results = await Promise.all([
      createEnvVarAction(projectId, { key: "K", value: "v" }),
      updateEnvVarAction(envVarId, projectId, { key: "K", value: "v" }),
      deleteEnvVarAction(envVarId, projectId),
      revealEnvVarValueAction(envVarId, "reveal"),
      importEnvVarsAction(projectId, { items: [{ key: "K", value: "v" }] }),
      exportEnvFileAction(projectId, "all"),
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

  it("encrypts the value and threads the scope to the RPC (AC-1, AC-5, spec 009)", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });
    clientWithRpc(rpc);
    const res = await createEnvVarAction(projectId, {
      key: "NEXT_PUBLIC_X",
      value: "v",
      service: "stripe",
      scope: "frontend",
    });
    expect(res.ok).toBe(true);
    expect(rpc).toHaveBeenCalledWith(
      "create_env_var",
      expect.objectContaining({
        p_project_id: projectId,
        p_key: "NEXT_PUBLIC_X",
        p_service: "stripe",
        p_scope: "frontend",
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

describe("importEnvVarsAction (spec 009 AC-3)", () => {
  beforeEach(() => mockRequireMember.mockResolvedValue(member));

  it("creates rows, skips duplicates (23505), and reports failures", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({ error: null }) // A → created
      .mockResolvedValueOnce({ error: { code: "23505", message: "dup" } }) // B → skipped
      .mockResolvedValueOnce({ error: { code: "XXXXX", message: "boom" } }); // C → failed
    clientWithRpc(rpc);
    const res = await importEnvVarsAction(projectId, {
      items: [
        { key: "A", value: "1" },
        { key: "B", value: "2" },
        { key: "C", value: "3" },
      ],
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.created).toEqual(["A"]);
      expect(res.skipped).toEqual(["B"]);
      expect(res.failed).toEqual(["C"]);
    }
    expect(rpc).toHaveBeenCalledTimes(3);
    expect(rpc).toHaveBeenCalledWith(
      "create_env_var",
      expect.objectContaining({ p_key: "A", p_ciphertext: expect.stringContaining("cipher(") }),
    );
  });

  it("rejects an empty or invalid payload without calling the RPC", async () => {
    const rpc = vi.fn();
    clientWithRpc(rpc);
    const res = await importEnvVarsAction(projectId, { items: [] });
    expect(res.ok).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe("exportEnvFileAction (spec 009 AC-4, AC-6)", () => {
  beforeEach(() => mockRequireMember.mockResolvedValue(member));

  it("decrypts each row via the audited export intent and serializes a .env", async () => {
    const rpc = clientForExport(
      [
        { id: "a", key: "SECRET", scope: "backend" },
        { id: "b", key: "NEXT_PUBLIC_X", scope: "frontend" },
      ],
      ({ p_id }) => ({ data: `cipher:${p_id}`, error: null }),
    );
    mockDecrypt.mockImplementation((stored: string) => `plain(${stored})`);
    const res = await exportEnvFileAction(projectId, "all");
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.filename).toBe(".env");
      expect(res.content).toContain("SECRET=plain(cipher:a)");
      expect(res.content).toContain("# Frontend");
    }
    // every value was decrypted through the audited 'export' intent
    expect(rpc).toHaveBeenCalledWith("reveal_env_var", { p_id: "a", p_intent: "export" });
    expect(rpc).toHaveBeenCalledWith("reveal_env_var", { p_id: "b", p_intent: "export" });
  });

  it("names backend-only and frontend-only files", async () => {
    clientForExport([{ id: "a", key: "SECRET", scope: "backend" }], ({ p_id }) => ({
      data: `cipher:${p_id}`,
      error: null,
    }));
    mockDecrypt.mockImplementation((stored: string) => `plain(${stored})`);
    const res = await exportEnvFileAction(projectId, "backend");
    expect(res.ok && res.filename).toBe(".env.backend");
  });

  it("returns a friendly error when the scope has no variables (AC-6)", async () => {
    clientForExport([], () => ({ data: null, error: null }));
    const res = await exportEnvFileAction(projectId, "frontend");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/no variables to export/i);
  });

  it("maps a 42501 (no env-write role) to a friendly not-authorized error", async () => {
    clientForExport([{ id: "a", key: "SECRET", scope: "backend" }], () => ({
      data: null,
      error: { code: "42501", message: "not authorized" },
    }));
    const res = await exportEnvFileAction(projectId, "all");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/authorized/i);
  });
});
