import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/session", () => ({ requireMember: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
// Server actions resolve copy through next-intl (spec 005). Back the translator with the
// English catalog so the existing English assertions still hold without a request context.
vi.mock("next-intl/server", async () => {
  const en = (await import("@/messages/en.json")).default as Record<string, Record<string, string>>;
  return {
    getTranslations: async () => (key: string) => {
      const [ns, k] = key.split(".");
      return en[ns!]?.[k!] ?? key;
    },
  };
});

import { requireMember } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  addLinkDocumentAction,
  addNoteDocumentAction,
  archiveDocumentAction,
  getDocumentDownloadUrlAction,
  recordFileDocumentAction,
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
  isLead: false,
  isGlobalPm: false,
};
const projectId = "11111111-1111-4111-8111-111111111111";
const docId = "22222222-2222-4222-8222-222222222222";

function mockClient() {
  const insert = vi.fn().mockResolvedValue({ error: null });
  const match = vi.fn().mockResolvedValue({ error: null });
  const update = vi.fn(() => ({ match }));
  const from = vi.fn(() => ({ insert, update }));
  mockCreateClient.mockResolvedValue({
    from,
  } as unknown as Awaited<ReturnType<typeof createClient>>);
  return { from, insert, update, match };
}

beforeEach(() => vi.clearAllMocks());

describe("documents actions — membership gate (AC-6)", () => {
  it("every mutating action refuses a non-member", async () => {
    mockRequireMember.mockResolvedValue(null);
    const c = mockClient();
    const results = await Promise.all([
      addLinkDocumentAction(projectId, { title: "x", url: "https://x.com" }),
      addNoteDocumentAction(projectId, { title: "x", body: "y" }),
      recordFileDocumentAction(projectId, {
        title: "a.pdf",
        file_path: "p",
        file_size: 1,
        file_mime: "application/pdf",
      }),
      archiveDocumentAction(docId, projectId),
      getDocumentDownloadUrlAction(docId),
    ]);
    for (const res of results) {
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error).toMatch(/authorized/i);
    }
    expect(c.from).not.toHaveBeenCalled();
  });
});

describe("recordFileDocumentAction — server re-validates (AC-5)", () => {
  beforeEach(() => mockRequireMember.mockResolvedValue(member));

  it("rejects a disallowed MIME type without inserting", async () => {
    const c = mockClient();
    const res = await recordFileDocumentAction(projectId, {
      title: "evil.exe",
      file_path: "p",
      file_size: 10,
      file_mime: "application/x-msdownload",
    });
    expect(res.ok).toBe(false);
    expect(c.insert).not.toHaveBeenCalled();
  });

  it("rejects an oversized file without inserting", async () => {
    const c = mockClient();
    const res = await recordFileDocumentAction(projectId, {
      title: "big.pdf",
      file_path: "p",
      file_size: 50 * 1024 * 1024 + 1,
      file_mime: "application/pdf",
    });
    expect(res.ok).toBe(false);
    expect(c.insert).not.toHaveBeenCalled();
  });

  it("records an allowed file", async () => {
    const c = mockClient();
    const res = await recordFileDocumentAction(projectId, {
      title: "spec.pdf",
      file_path: "p/x/spec.pdf",
      file_size: 2048,
      file_mime: "application/pdf",
    });
    expect(res.ok).toBe(true);
    expect(c.insert).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "file", title: "spec.pdf" }),
    );
  });
});

describe("addLinkDocumentAction (AC-2)", () => {
  beforeEach(() => mockRequireMember.mockResolvedValue(member));

  it("rejects a bad URL with a field error", async () => {
    const c = mockClient();
    const res = await addLinkDocumentAction(projectId, { title: "X", url: "not-a-url" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.fieldErrors?.url).toBeTruthy();
    expect(c.insert).not.toHaveBeenCalled();
  });

  it("inserts a valid link and stamps the uploader email (AC-2)", async () => {
    const c = mockClient();
    const res = await addLinkDocumentAction(projectId, {
      title: "Figma",
      url: "https://figma.com",
    });
    expect(res.ok).toBe(true);
    expect(c.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "link",
        url: "https://figma.com",
        created_by_email: "m@progix.test",
      }),
    );
  });

  it("rejects a javascript: URL (stored-XSS guard)", async () => {
    const c = mockClient();
    const res = await addLinkDocumentAction(projectId, {
      title: "evil",
      url: "javascript:alert(document.cookie)",
    });
    expect(res.ok).toBe(false);
    expect(c.insert).not.toHaveBeenCalled();
  });
});

describe("archiveDocumentAction (AC-7)", () => {
  beforeEach(() => mockRequireMember.mockResolvedValue(member));

  it("binds the update to (id, project_id) so it can't touch another project's row", async () => {
    const c = mockClient();
    const res = await archiveDocumentAction(docId, projectId);
    expect(res.ok).toBe(true);
    expect(c.update).toHaveBeenCalledWith(
      expect.objectContaining({ archived_at: expect.any(String) }),
    );
    expect(c.match).toHaveBeenCalledWith({ id: docId, project_id: projectId });
  });
});
