import { describe, expect, it } from "vitest";
import { envVarEditSchema, envVarInputSchema } from "./types";

describe("envVarInputSchema", () => {
  it("accepts a valid entry (AC-1)", () => {
    const r = envVarInputSchema.safeParse({
      key: "STRIPE_SECRET_KEY",
      value: "sk_live_abc",
      service: "stripe",
    });
    expect(r.success).toBe(true);
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
