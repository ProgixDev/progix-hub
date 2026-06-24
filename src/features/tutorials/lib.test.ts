import { describe, expect, it } from "vitest";
import { embedUrlFor, tutorialInputSchema } from "./lib";

describe("embedUrlFor (spec 016 AC-1 / AC-5)", () => {
  it("resolves YouTube share, watch, embed and shorts links", () => {
    const yt = "https://www.youtube.com/embed/8VLGMiM-mm8";
    expect(embedUrlFor("https://youtu.be/8VLGMiM-mm8")).toBe(yt);
    expect(embedUrlFor("https://www.youtube.com/watch?v=8VLGMiM-mm8&t=10s")).toBe(yt);
    expect(embedUrlFor("https://youtube.com/embed/8VLGMiM-mm8")).toBe(yt);
    expect(embedUrlFor("https://m.youtube.com/shorts/8VLGMiM-mm8")).toBe(yt);
  });

  it("resolves Vimeo and Loom links", () => {
    expect(embedUrlFor("https://vimeo.com/123456789")).toBe(
      "https://player.vimeo.com/video/123456789",
    );
    expect(embedUrlFor("https://www.loom.com/share/abc123DEF")).toBe(
      "https://www.loom.com/embed/abc123DEF",
    );
  });

  it("rejects unknown hosts, non-http schemes, and junk", () => {
    expect(embedUrlFor("https://evil.example.com/embed/x")).toBeNull();
    expect(embedUrlFor("javascript:alert(1)")).toBeNull();
    expect(embedUrlFor("data:text/html,<script>")).toBeNull();
    expect(embedUrlFor("not a url")).toBeNull();
    expect(embedUrlFor("https://youtu.be/")).toBeNull();
  });
});

describe("tutorialInputSchema (spec 016)", () => {
  const ok = { title: "How to set up Stripe", embed_url: "https://youtu.be/8VLGMiM-mm8" };

  it("accepts a valid tutorial and normalizes language/empty fields", () => {
    const r = tutorialInputSchema.safeParse({ ...ok, language: "fr", description: "" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.language).toBe("fr");
      expect(r.data.description).toBeNull();
    }
  });

  it("coerces an unknown language to null (both)", () => {
    const r = tutorialInputSchema.safeParse({ ...ok, language: "" });
    expect(r.success && r.data.language).toBeNull();
  });

  it("rejects a missing title and an unembeddable link (AC-5)", () => {
    expect(tutorialInputSchema.safeParse({ ...ok, title: "" }).success).toBe(false);
    const r = tutorialInputSchema.safeParse({ title: "x", embed_url: "https://example.com/v/1" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.path[0] === "embed_url")).toBe(true);
  });

  it("accepts an upload source with a storage path (spec 019 AC-1/AC-2)", () => {
    const r = tutorialInputSchema.safeParse({
      title: "Recorded walkthrough",
      source_type: "upload",
      storage_path: "0f8fad5b-d9cb-469f-a165-70867728950e/clip.mp4",
    });
    expect(r.success).toBe(true);
    if (r.success)
      expect(r.data.storage_path).toBe("0f8fad5b-d9cb-469f-a165-70867728950e/clip.mp4");
  });

  it("rejects an upload with no file and an embed with no link (AC-4)", () => {
    expect(tutorialInputSchema.safeParse({ title: "x", source_type: "upload" }).success).toBe(
      false,
    );
    expect(tutorialInputSchema.safeParse({ title: "x", source_type: "embed" }).success).toBe(false);
  });
});
