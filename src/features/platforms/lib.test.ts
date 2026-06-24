import { describe, expect, it } from "vitest";
import { platformInputSchema, requiredFieldsFor } from "./lib";

const base = { name: "Stripe", steps: ["Create an account"], critical: true };

describe("requiredFieldsFor (spec 015 AC-2)", () => {
  it("lists the fields each access pattern needs", () => {
    expect(requiredFieldsFor("invite_collaborator")).toEqual([
      "invite_url",
      "invite_role",
      "invite_email",
    ]);
    expect(requiredFieldsFor("store_key")).toEqual(["key_label"]);
    expect(requiredFieldsFor("diy")).toEqual([]);
  });
});

describe("platformInputSchema (spec 015 AC-2 / AC-5)", () => {
  it("accepts a complete invite-collaborator platform", () => {
    const r = platformInputSchema.safeParse({
      ...base,
      access_pattern: "invite_collaborator",
      invite_url: "https://dashboard.stripe.com/settings/team",
      invite_role: "Developer",
      invite_email: "dev@progix.com",
    });
    expect(r.success).toBe(true);
  });

  it("rejects invite-collaborator missing the invite link / role / email", () => {
    const r = platformInputSchema.safeParse({ ...base, access_pattern: "invite_collaborator" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.map((i) => i.path[0]);
      expect(paths).toEqual(expect.arrayContaining(["invite_url", "invite_role", "invite_email"]));
    }
  });

  it("rejects a malformed invite email and a non-http video URL", () => {
    const r = platformInputSchema.safeParse({
      ...base,
      access_pattern: "invite_collaborator",
      invite_url: "https://x.com",
      invite_role: "Dev",
      invite_email: "not-an-email",
      video_url: "ftp://nope",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.map((i) => i.path[0]);
      expect(paths).toEqual(expect.arrayContaining(["invite_email", "video_url"]));
    }
  });

  it("requires a key label for store-key", () => {
    expect(platformInputSchema.safeParse({ ...base, access_pattern: "store_key" }).success).toBe(
      false,
    );
    expect(
      platformInputSchema.safeParse({
        ...base,
        access_pattern: "store_key",
        key_label: "STRIPE_SECRET_KEY",
      }).success,
    ).toBe(true);
  });

  it("accepts a diy platform with just steps", () => {
    const r = platformInputSchema.safeParse({ ...base, access_pattern: "diy", critical: false });
    expect(r.success).toBe(true);
  });

  it("normalizes empty optional strings to null", () => {
    const r = platformInputSchema.safeParse({ ...base, access_pattern: "diy", video_url: "" });
    expect(r.success && r.data.video_url).toBeNull();
  });
});
