import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/session", () => ({ requireMember: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

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
};
const projectId = "11111111-1111-4111-8111-111111111111";
const docId = "22222222-2222-4222-8222-222222222222";

function mockClient() {
  const insert = vi.fn().mockResolvedValue({ error: null });
  const eq = vi.fn().mockResolvedValue({ error: null });
  const update = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ insert, update }));
  mockCreateClient.mockResolvedValue({
    from,
  } as unknown as Awaited<ReturnType<typeof createClient>>);
  return { from, insert, update, eq };
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

  it("inserts a valid link", async () => {
    const c = mockClient();
    const res = await addLinkDocumentAction(projectId, {
      title: "Figma",
      url: "https://figma.com",
    });
    expect(res.ok).toBe(true);
    expect(c.insert).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "link", url: "https://figma.com" }),
    );
  });
});
