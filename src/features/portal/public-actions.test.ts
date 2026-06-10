import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
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

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  submitPortalAttachmentAction,
  submitPortalCommentAction,
  submitPortalProposalAction,
} from "./public-actions";

const mockCreateClient = vi.mocked(createClient);
const mockCreateAdmin = vi.mocked(createAdminClient);

const token = "a".repeat(43);
const cardId = "33333333-3333-4333-8333-333333333333";

function mockRpc(error: { message: string } | null = null) {
  const rpc = vi.fn().mockResolvedValue({ data: null, error });
  mockCreateClient.mockResolvedValue({ rpc } as unknown as Awaited<
    ReturnType<typeof createClient>
  >);
  return rpc;
}

beforeEach(() => vi.clearAllMocks());

describe("honeypot (AC-8)", () => {
  it("silently drops a bot comment without touching the database", async () => {
    const rpc = mockRpc();
    const res = await submitPortalCommentAction(token, cardId, {
      author_name: "Bot",
      body: "spam",
      website: "https://bot.example",
    });
    expect(res.ok).toBe(true); // looks like success to the bot
    expect(rpc).not.toHaveBeenCalled();
  });

  it("silently drops a bot proposal", async () => {
    const rpc = mockRpc();
    const res = await submitPortalProposalAction(token, {
      author_name: "Bot",
      title: "spam",
      website: "x",
    });
    expect(res.ok).toBe(true);
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe("token shape gate (AC-7)", () => {
  it("rejects a malformed token before any database call", async () => {
    const rpc = mockRpc();
    const res = await submitPortalCommentAction("short", cardId, {
      author_name: "Eve",
      body: "hi",
    });
    expect(res.ok).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe("comment via RPC (AC-4)", () => {
  it("passes validated input to portal_public_comment", async () => {
    const rpc = mockRpc();
    const res = await submitPortalCommentAction(token, cardId, {
      author_name: "Eve",
      body: "Love it",
    });
    expect(res.ok).toBe(true);
    expect(rpc).toHaveBeenCalledWith("portal_public_comment", {
      p_token: token,
      p_card_id: cardId,
      p_author: "Eve",
      p_body: "Love it",
    });
  });

  it("maps a rate-limit raise to friendly copy (AC-8)", async () => {
    mockRpc({ message: "portal_rate_limited" });
    const res = await submitPortalCommentAction(token, cardId, {
      author_name: "Eve",
      body: "x",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/too many submissions/i);
  });

  it("maps an invalid-token raise to the inactive-link copy (AC-7)", async () => {
    mockRpc({ message: "portal_invalid_token" });
    const res = await submitPortalCommentAction(token, cardId, {
      author_name: "Eve",
      body: "x",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/no longer active/i);
  });
});

describe("attachment upload (AC-5)", () => {
  it("rejects a disallowed file type before any upload", async () => {
    const rpc = mockRpc();
    const fd = new FormData();
    fd.set("file", new File(["x"], "evil.exe", { type: "application/x-msdownload" }));
    fd.set("author_name", "Eve");
    const res = await submitPortalAttachmentAction(token, cardId, fd);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/unsupported file type/i);
    expect(mockCreateAdmin).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("uploads via the admin client only AFTER the token resolves, then records via RPC", async () => {
    const rpc = mockRpc();
    const upload = vi.fn().mockResolvedValue({ error: null });
    const remove = vi.fn().mockResolvedValue({ error: null });
    const maybeSingle = vi
      .fn()
      .mockResolvedValue({ data: { project_id: "44444444-4444-4444-8444-444444444444" } });
    const is = vi.fn(() => ({ maybeSingle }));
    const eq = vi.fn(() => ({ is }));
    const select = vi.fn(() => ({ eq }));
    mockCreateAdmin.mockReturnValue({
      from: vi.fn(() => ({ select })),
      storage: { from: vi.fn(() => ({ upload, remove })) },
    } as unknown as ReturnType<typeof createAdminClient>);

    const fd = new FormData();
    fd.set("file", new File(["%PDF-1.4"], "spec.pdf", { type: "application/pdf" }));
    fd.set("author_name", "Eve");
    const res = await submitPortalAttachmentAction(token, cardId, fd);
    expect(res.ok).toBe(true);
    expect(upload).toHaveBeenCalledWith(
      expect.stringMatching(/^44444444-4444-4444-8444-444444444444\/.+\/spec\.pdf$/),
      expect.any(File),
      { contentType: "application/pdf" },
    );
    expect(rpc).toHaveBeenCalledWith(
      "portal_public_record_attachment",
      expect.objectContaining({ p_token: token, p_card_id: cardId, p_file_name: "spec.pdf" }),
    );
  });

  it("cleans up the uploaded blob when the RPC rejects the record", async () => {
    mockRpc({ message: "portal_cap_reached" });
    const upload = vi.fn().mockResolvedValue({ error: null });
    const remove = vi.fn().mockResolvedValue({ error: null });
    const maybeSingle = vi
      .fn()
      .mockResolvedValue({ data: { project_id: "44444444-4444-4444-8444-444444444444" } });
    const is = vi.fn(() => ({ maybeSingle }));
    const eq = vi.fn(() => ({ is }));
    const select = vi.fn(() => ({ eq }));
    mockCreateAdmin.mockReturnValue({
      from: vi.fn(() => ({ select })),
      storage: { from: vi.fn(() => ({ upload, remove })) },
    } as unknown as ReturnType<typeof createAdminClient>);

    const fd = new FormData();
    fd.set("file", new File(["%PDF-1.4"], "spec.pdf", { type: "application/pdf" }));
    fd.set("author_name", "Eve");
    const res = await submitPortalAttachmentAction(token, cardId, fd);
    expect(res.ok).toBe(false);
    expect(remove).toHaveBeenCalled();
  });
});
