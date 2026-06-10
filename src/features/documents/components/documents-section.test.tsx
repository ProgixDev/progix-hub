import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/intl";
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
  created_by_email: "alice@progix.test",
  archived_at: null,
  created_at: "2026-06-09T00:00:00Z",
  updated_at: "2026-06-09T00:00:00Z",
};

const file: ProjectDocument = {
  id: "22222222-2222-4222-8222-222222222222",
  project_id: "p",
  kind: "file",
  title: "Spec.pdf",
  file_path: "p/spec.pdf",
  file_size: 1024,
  file_mime: "application/pdf",
  url: null,
  body: null,
  created_by: null,
  created_by_email: "alice@progix.test",
  archived_at: null,
  created_at: "2026-06-09T00:00:00Z",
  updated_at: "2026-06-09T00:00:00Z",
};

describe("DocumentsSection", () => {
  it("shows the empty state when there are no documents (AC-9)", () => {
    renderWithIntl(<DocumentsSection projectId="p" documents={[]} archived={[]} />);
    expect(screen.getByText(/no documents yet/i)).toBeTruthy();
  });

  it("renders a link row and the kind tabs (AC-2 / AC-4)", () => {
    renderWithIntl(<DocumentsSection projectId="p" documents={[link]} archived={[]} />);
    expect(screen.getByRole("link", { name: "Figma" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Files/ })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Notes/ })).toBeTruthy();
  });

  it("shows the uploader on each row (AC-1/2/3)", () => {
    renderWithIntl(<DocumentsSection projectId="p" documents={[link]} archived={[]} />);
    expect(screen.getByText(/alice@progix\.test/)).toBeTruthy();
  });

  it("hides mutation controls for a viewer but keeps Download (spec 008)", () => {
    renderWithIntl(
      <DocumentsSection projectId="p" documents={[link, file]} archived={[]} canWrite={false} />,
    );
    expect(screen.queryByRole("button", { name: /upload file/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /add link/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /add note/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /edit figma/i })).toBeNull();
    expect(screen.getByRole("button", { name: /download/i })).toBeTruthy();
  });

  it("wires the active tab to its panel (ARIA tabs)", () => {
    renderWithIntl(<DocumentsSection projectId="p" documents={[link]} archived={[]} />);
    const panel = screen.getByRole("tabpanel");
    const all = screen.getByRole("tab", { name: /All/ });
    expect(all.getAttribute("aria-controls")).toBe(panel.getAttribute("id"));
    expect(all.getAttribute("aria-selected")).toBe("true");
  });
});
