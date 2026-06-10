import { describe, expect, it } from "vitest";
import { cardsForBlock, formatBytes, validateAttachment } from "./lib";

describe("validateAttachment (AC-5)", () => {
  it("allows a small PDF", () => {
    expect(validateAttachment({ size: 1000, type: "application/pdf" })).toBeNull();
  });
  it("rejects a disallowed type with a reason code", () => {
    expect(validateAttachment({ size: 1000, type: "application/x-msdownload" })).toBe("type");
  });
  it("rejects an oversized file (10 MB cap)", () => {
    expect(validateAttachment({ size: 10 * 1024 * 1024 + 1, type: "application/pdf" })).toBe(
      "size",
    );
  });
});

describe("cardsForBlock", () => {
  const cards = [{ block_id: "a" }, { block_id: "b" }, { block_id: null }, { block_id: "a" }];
  it("filters by block and exposes the unassigned-proposals group", () => {
    expect(cardsForBlock(cards, "a")).toHaveLength(2);
    expect(cardsForBlock(cards, null)).toHaveLength(1);
  });
});

describe("formatBytes", () => {
  it("formats sizes", () => {
    expect(formatBytes(null)).toBe("—");
    expect(formatBytes(2048)).toBe("2 KB");
  });
});
