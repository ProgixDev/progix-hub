import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/session", () => ({ requireMember: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
// Back the translator with the English catalog (no request context in jsdom).
vi.mock("next-intl/server", async () => {
  const en = (await import("@/messages/en.json")).default as Record<string, Record<string, string>>;
  return {
    getTranslations: async (ns?: string) => (key: string) => {
      const path = ns ? `${ns}.${key}` : key;
      const [a, b] = path.split(".");
      return en[a!]?.[b!] ?? path;
    },
  };
});

import { requireMember } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  archivePortalCardAction,
  createPortalBlockAction,
  createPortalCardAction,
  createShareLinkAction,
  revokeShareLinkAction,
  updatePortalCardAction,
} from "./actions";

const mockRequireMember = vi.mocked(requireMember);
const mockCreateClient = vi.mocked(createClient);

const member = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "m@progix.test",
  name: "M",
  avatarUrl: null,
  initials: "M",
  isSuperadmin: false,
};
const projectId = "11111111-1111-4111-8111-111111111111";
const blockId = "22222222-2222-4222-8222-222222222222";
const cardId = "33333333-3333-4333-8333-333333333333";

function mockClient() {
  const insert = vi.fn().mockResolvedValue({ error: null });
  const match = vi.fn().mockResolvedValue({ error: null });
  const is = vi.fn().mockResolvedValue({ error: null });
  const eq = vi.fn(() => ({ is }));
  const update = vi.fn(() => ({ match, eq }));
  const select = vi.fn(() => ({
    eq: vi.fn(() => ({ is: vi.fn().mockResolvedValue({ count: 0 }) })),
  }));
  const from = vi.fn(() => ({ insert, update, select }));
  mockCreateClient.mockResolvedValue({
    from,
  } as unknown as Awaited<ReturnType<typeof createClient>>);
  return { from, insert, update, match, eq, is };
}

beforeEach(() => vi.clearAllMocks());

describe("portal member actions — membership gate (AC-9)", () => {
  it("every mutating action refuses a non-member", async () => {
    mockRequireMember.mockResolvedValue(null);
    const c = mockClient();
    const results = await Promise.all([
      createPortalBlockAction(projectId, { name: "App" }),
      createPortalCardAction(projectId, {
        block_id: blockId,
        title: "Auth",
        description: "",
        status: "delivered",
      }),
      updatePortalCardAction(cardId, projectId, { status: "planned" }),
      archivePortalCardAction(cardId, projectId),
      createShareLinkAction(projectId),
      revokeShareLinkAction(projectId),
    ]);
    for (const res of results) {
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error).toMatch(/authorized/i);
    }
    expect(c.from).not.toHaveBeenCalled();
  });
});

describe("blocks & cards (AC-1)", () => {
  beforeEach(() => mockRequireMember.mockResolvedValue(member));

  it("creates a block", async () => {
    const c = mockClient();
    const res = await createPortalBlockAction(projectId, { name: "App" });
    expect(res.ok).toBe(true);
    expect(c.insert).toHaveBeenCalledWith(
      expect.objectContaining({ project_id: projectId, name: "App" }),
    );
  });

  it("rejects an invalid card without inserting", async () => {
    const c = mockClient();
    const res = await createPortalCardAction(projectId, {
      block_id: blockId,
      title: "",
      description: "",
      status: "delivered",
    });
    expect(res.ok).toBe(false);
    expect(c.insert).not.toHaveBeenCalled();
  });

  it("status change binds to (id, project_id)", async () => {
    const c = mockClient();
    const res = await updatePortalCardAction(cardId, projectId, { status: "planned" });
    expect(res.ok).toBe(true);
    expect(c.update).toHaveBeenCalledWith({ status: "planned" });
    expect(c.match).toHaveBeenCalledWith({ id: cardId, project_id: projectId });
  });
});

describe("share link lifecycle (AC-2)", () => {
  beforeEach(() => mockRequireMember.mockResolvedValue(member));

  it("returns the raw token once and stores ONLY its SHA-256", async () => {
    const c = mockClient();
    const res = await createShareLinkAction(projectId);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.token).toMatch(/^[A-Za-z0-9_-]{40,50}$/); // 32 bytes base64url
    const expectedHash = createHash("sha256").update(res.token, "utf8").digest("hex");
    expect(c.insert).toHaveBeenCalledWith(
      expect.objectContaining({ project_id: projectId, token_hash: expectedHash }),
    );
    const inserted = c.insert.mock.calls[0]![0] as Record<string, unknown>;
    expect(JSON.stringify(inserted)).not.toContain(res.token); // raw token never persisted
    // Rotation: any previously active link is revoked first.
    expect(c.update).toHaveBeenCalledWith(
      expect.objectContaining({ revoked_at: expect.any(String) }),
    );
  });

  it("revoke closes the active link", async () => {
    const c = mockClient();
    const res = await revokeShareLinkAction(projectId);
    expect(res.ok).toBe(true);
    expect(c.update).toHaveBeenCalledWith(
      expect.objectContaining({ revoked_at: expect.any(String) }),
    );
    expect(c.eq).toHaveBeenCalledWith("project_id", projectId);
  });
});
