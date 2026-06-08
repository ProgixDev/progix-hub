import { describe, expect, it } from "vitest";
import { projectInputSchema } from "./types";

describe("projectInputSchema (AC-4)", () => {
  it("rejects a blank name", () => {
    const result = projectInputSchema.safeParse({ name: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed link", () => {
    const result = projectInputSchema.safeParse({ name: "Atlas", github_url: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("accepts a name with empty links (links become undefined)", () => {
    const result = projectInputSchema.safeParse({ name: "Atlas", notion_url: "", slack_url: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notion_url).toBeUndefined();
      expect(result.data.status).toBe("active");
    }
  });

  it("accepts valid links", () => {
    const result = projectInputSchema.safeParse({
      name: "Atlas",
      github_url: "https://github.com/DigitariaWebs/atlas",
      live_url: "https://atlas.example.com",
    });
    expect(result.success).toBe(true);
  });
});
