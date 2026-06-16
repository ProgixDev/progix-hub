import { describe, expect, it } from "vitest";
import { envImportSchema, envVarEditSchema, envVarInputSchema } from "./types";

describe("envVarInputSchema", () => {
  it("accepts a valid entry and defaults scope to backend (AC-1)", () => {
    const r = envVarInputSchema.safeParse({
      key: "STRIPE_SECRET_KEY",
      value: "sk_live_abc",
      service: "stripe",
    });
    expect(r.success).toBe(true);
    expect(r.success && r.data.scope).toBe("backend");
  });

  it("accepts an explicit frontend scope", () => {
    const r = envVarInputSchema.safeParse({ key: "K", value: "v", scope: "frontend" });
    expect(r.success && r.data.scope).toBe("frontend");
  });

  it("rejects an unknown scope", () => {
    expect(envVarInputSchema.safeParse({ key: "K", value: "v", scope: "weird" }).success).toBe(
      false,
    );
  });

  it("requires a key", () => {
    expect(envVarInputSchema.safeParse({ key: "", value: "x" }).success).toBe(false);
  });

  it("requires a value on create", () => {
    expect(envVarInputSchema.safeParse({ key: "K", value: "" }).success).toBe(false);
  });

  it("treats a blank service as undefined", () => {
    const r = envVarInputSchema.safeParse({ key: "K", value: "v", service: "" });
    expect(r.success && r.data.service).toBeUndefined();
  });
});

describe("envVarEditSchema", () => {
  it("allows a blank value (keep the stored secret) but still requires a key", () => {
    expect(envVarEditSchema.safeParse({ key: "K", value: "" }).success).toBe(true);
    expect(envVarEditSchema.safeParse({ key: "", value: "" }).success).toBe(false);
  });
});

describe("envImportSchema (spec 009 AC-3)", () => {
  it("accepts a non-empty list and defaults each item's scope", () => {
    const r = envImportSchema.safeParse([{ key: "A", value: "1" }]);
    expect(r.success).toBe(true);
    expect(r.success && r.data[0]!.scope).toBe("backend");
  });

  it("rejects an empty list", () => {
    expect(envImportSchema.safeParse([]).success).toBe(false);
  });

  it("rejects more than 200 items", () => {
    const many = Array.from({ length: 201 }, (_, i) => ({ key: `K${i}`, value: "v" }));
    expect(envImportSchema.safeParse(many).success).toBe(false);
  });
});
