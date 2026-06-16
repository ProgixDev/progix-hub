import { describe, expect, it } from "vitest";
import { githubLoginFromIdentities, isIdentityAlreadyLinked, linkCallbackUrl } from "./connect";

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

describe("githubLoginFromIdentities (spec 012 AC-1)", () => {
  it("reads the GitHub username from the linked identity", () => {
    expect(
      githubLoginFromIdentities([
        { provider: "email", identity_data: { email: "a@b.c" } },
        { provider: "github", identity_data: { user_name: "octocat" } },
      ]),
    ).toBe("octocat");
  });

  it("falls back to preferred_username", () => {
    expect(
      githubLoginFromIdentities([
        { provider: "github", identity_data: { preferred_username: "mona" } },
      ]),
    ).toBe("mona");
  });

  it("returns null when no GitHub identity is linked", () => {
    expect(githubLoginFromIdentities([{ provider: "email", identity_data: {} }])).toBeNull();
    expect(githubLoginFromIdentities(null)).toBeNull();
  });
});
