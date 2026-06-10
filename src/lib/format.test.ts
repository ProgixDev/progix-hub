import { describe, expect, it } from "vitest";
import { formatDate, formatNumber } from "./format";

describe("formatDate (locale-aware, spec 005)", () => {
  const date = new Date("2026-06-09T00:00:00Z");
  it("defaults to English medium format", () => {
    expect(formatDate(date)).toBe("Jun 9, 2026");
  });
  it("formats in French when asked", () => {
    expect(formatDate(date, "fr")).toBe("9 juin 2026");
  });
});

describe("formatNumber (locale-aware)", () => {
  it("groups by locale", () => {
    expect(formatNumber(1234567, "en")).toBe("1,234,567");
    // French groups with a (narrow) non-breaking space — assert it differs from English.
    expect(formatNumber(1234567, "fr")).not.toBe("1,234,567");
  });
});
