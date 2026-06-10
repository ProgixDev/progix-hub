import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import { deepMerge, messagesFor } from "./messages";

function leafPaths(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object") return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    leafPaths(v, prefix ? `${prefix}.${k}` : k),
  );
}

describe("messagesFor (AC-6 English fallback)", () => {
  it("uses the locale's own strings when present", () => {
    expect(messagesFor("fr").nav.projects).toBe("Projets");
    expect(messagesFor("en").nav.projects).toBe("Projects");
  });

  it("falls back to English per key when a translation is missing", () => {
    // deepMerge is the fallback engine: English base, locale overlay.
    const merged = deepMerge({ a: { x: "EN-x", y: "EN-y" }, b: "EN-b" }, { a: { x: "FR-x" } });
    expect(merged).toEqual({ a: { x: "FR-x", y: "EN-y" }, b: "EN-b" });
  });

  it("never drops an English key for the French locale (no blanks/raw keys)", () => {
    const enPaths = new Set(leafPaths(en));
    const mergedPaths = new Set(leafPaths(messagesFor("fr")));
    for (const path of enPaths) expect(mergedPaths.has(path)).toBe(true);
  });
});

describe("catalog parity", () => {
  it("has no French key that doesn't exist in English (typo guard)", () => {
    const enPaths = new Set(leafPaths(en));
    const extra = leafPaths(fr).filter((p) => !enPaths.has(p));
    expect(extra).toEqual([]);
  });
});
