import { describe, expect, it } from "vitest";
import { byTab, formatBytes, mimeLabel, validateFile } from "./lib";
import type { ProjectDocument } from "./types";

const doc = (kind: ProjectDocument["kind"], id: string): ProjectDocument => ({
  id,
  project_id: "p",
  kind,
  title: id,
  file_path: null,
  file_size: null,
  file_mime: null,
  url: null,
  body: null,
  created_by: null,
  created_by_email: null,
  archived_at: null,
  created_at: "2026-06-09T00:00:00Z",
  updated_at: "2026-06-09T00:00:00Z",
});

describe("validateFile (AC-5)", () => {
  it("allows a small PDF", () => {
    expect(validateFile({ size: 1000, type: "application/pdf" })).toBeNull();
  });
  it("rejects a disallowed type with the 'type' code", () => {
    expect(validateFile({ size: 1000, type: "text/x-shellscript" })).toBe("type");
  });
  it("rejects an oversized file with the 'size' code", () => {
    expect(validateFile({ size: 60 * 1024 * 1024, type: "application/pdf" })).toBe("size");
  });
});

describe("byTab (AC-4)", () => {
  const docs = [doc("file", "f"), doc("link", "l"), doc("note", "n")];
  it("returns everything for 'all' and the right subset per kind", () => {
    expect(byTab(docs, "all")).toHaveLength(3);
    expect(byTab(docs, "file").map((d) => d.id)).toEqual(["f"]);
    expect(byTab(docs, "link").map((d) => d.id)).toEqual(["l"]);
    expect(byTab(docs, "note").map((d) => d.id)).toEqual(["n"]);
  });
});

describe("formatBytes / mimeLabel", () => {
  it("formats sizes", () => {
    expect(formatBytes(null)).toBe("—");
    expect(formatBytes(500)).toBe("500 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });
  it("labels known MIME types and returns null for unknown ones", () => {
    expect(mimeLabel("application/pdf")).toBe("PDF");
    expect(mimeLabel(null)).toBeNull();
  });
});
