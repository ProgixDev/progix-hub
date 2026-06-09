import { describe, expect, it } from "vitest";
import { isAllowedMember } from "./membership";

describe("isAllowedMember (AC-2)", () => {
  it("allows an active ProgixDev member", () => {
    expect(isAllowedMember({ state: "active" })).toBe(true);
  });

  it("denies a pending invite", () => {
    expect(isAllowedMember({ state: "pending" })).toBe(false);
  });

  it("denies a non-member (no membership / 404)", () => {
    expect(isAllowedMember(null)).toBe(false);
  });

  it("denies when state is missing", () => {
    expect(isAllowedMember({})).toBe(false);
  });
});
