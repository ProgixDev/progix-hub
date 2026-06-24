import { describe, expect, it } from "vitest";
import { generatePasscode, generateToken, isPasscodeShaped, isTokenShaped } from "./lib";

describe("setup token/passcode (spec 017 AC-2)", () => {
  it("generates token-shaped, unique tokens", () => {
    const a = generateToken();
    const b = generateToken();
    expect(isTokenShaped(a)).toBe(true);
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(40);
  });

  it("generates passcodes from the unambiguous alphabet", () => {
    const p = generatePasscode();
    expect(p).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
    expect(isPasscodeShaped(p)).toBe(true);
  });

  it("rejects mis-shaped tokens and passcodes", () => {
    expect(isTokenShaped("short")).toBe(false);
    expect(isTokenShaped("bad token!")).toBe(false);
    expect(isPasscodeShaped("")).toBe(false);
    expect(isPasscodeShaped("has space")).toBe(false);
  });
});
