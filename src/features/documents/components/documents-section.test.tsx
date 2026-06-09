import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ProjectDocument } from "../types";
import { DocumentsSection } from "./documents-section";

// Stub the server actions + browser client so the section loads in jsdom.
vi.mock("../actions", () => ({
  addLinkDocumentAction: vi.fn(),
  addNoteDocumentAction: vi.fn(),
  recordFileDocumentAction: vi.fn(),
  updateDocumentAction: vi.fn(),
  archiveDocumentAction: vi.fn(),
  restoreDocumentAction: vi.fn(),
  getDocumentDownloadUrlAction: vi.fn(),
}));
vi.mock("@/lib/supabase/client", () => ({ createClient: vi.fn() }));

const link: ProjectDocument = {
  id: "11111111-1111-4111-8111-111111111111",
  project_id: "p",
  kind: "link",
  title: "Figma",
  file_path: null,
  file_size: null,
  file_mime: null,
  url: "https://figma.com",
  body: null,
  created_by: null,
  archived_at: null,
  created_at: "2026-06-09T00:00:00Z",
  updated_at: "2026-06-09T00:00:00Z",
};

describe("DocumentsSection", () => {
  it("shows the empty state when there are no documents (AC-9)", () => {
    render(<DocumentsSection projectId="p" documents={[]} />);
    expect(screen.getByText(/no documents yet/i)).toBeTruthy();
  });

  it("renders a link row and the kind tabs (AC-2 / AC-4)", () => {
    render(<DocumentsSection projectId="p" documents={[link]} />);
    expect(screen.getByRole("link", { name: "Figma" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Files/ })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Notes/ })).toBeTruthy();
  });
});
