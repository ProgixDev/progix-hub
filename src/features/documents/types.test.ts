import { describe, expect, it } from "vitest";
import { fileMetaSchema, linkInputSchema, noteInputSchema } from "./types";

describe("linkInputSchema", () => {
  it("accepts a title + valid URL", () => {
    expect(linkInputSchema.safeParse({ title: "Figma", url: "https://figma.com/x" }).success).toBe(
      true,
    );
  });
  it("rejects a missing title or bad URL", () => {
    expect(linkInputSchema.safeParse({ title: "", url: "https://x.com" }).success).toBe(false);
    expect(linkInputSchema.safeParse({ title: "X", url: "not-a-url" }).success).toBe(false);
  });
});

describe("noteInputSchema", () => {
  it("requires a title and a non-empty body", () => {
    expect(noteInputSchema.safeParse({ title: "Note", body: "# hi" }).success).toBe(true);
    expect(noteInputSchema.safeParse({ title: "Note", body: "" }).success).toBe(false);
  });
});

describe("fileMetaSchema (server re-validation, AC-5)", () => {
  const base = {
    title: "a.pdf",
    file_path: "p/x/a.pdf",
    file_size: 1000,
    file_mime: "application/pdf",
  };
  it("accepts an allowed file", () => {
    expect(fileMetaSchema.safeParse(base).success).toBe(true);
  });
  it("rejects a disallowed MIME type", () => {
    expect(
      fileMetaSchema.safeParse({ ...base, file_mime: "application/x-msdownload" }).success,
    ).toBe(false);
  });
  it("rejects a file over 50 MB", () => {
    expect(fileMetaSchema.safeParse({ ...base, file_size: 50 * 1024 * 1024 + 1 }).success).toBe(
      false,
    );
  });
});
