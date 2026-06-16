import { describe, expect, it } from "vitest";
import { isIdentityAlreadyLinked, linkCallbackUrl } from "./connect";

describe("linkCallbackUrl (spec 012 AC-1)", () => {
  it("points GitHub back at the shared callback, tagged as a link flow", () => {
    expect(linkCallbackUrl("https://hub.progix.com")).toBe(
      "https://hub.progix.com/auth/callback?flow=link",
    );
  });
});

describe("isIdentityAlreadyLinked (spec 012 AC-7)", () => {
  it("detects the conflict by error code", () => {
    expect(isIdentityAlreadyLinked({ code: "identity_already_exists" })).toBe(true);
  });

  it("detects the conflict by message fallback", () => {
    expect(isIdentityAlreadyLinked({ message: "Identity is already linked to another user" })).toBe(
      true,
    );
  });

  it("is false for no error or an unrelated error", () => {
    expect(isIdentityAlreadyLinked(null)).toBe(false);
    expect(isIdentityAlreadyLinked({ code: "validation_failed", message: "bad request" })).toBe(
      false,
    );
  });
});
