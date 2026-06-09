import { describe, expect, it } from "vitest";
import { detectService, serviceLabel } from "./lib";

describe("detectService", () => {
  it("auto-detects the service from the key (AC-1)", () => {
    expect(detectService("STRIPE_SECRET_KEY")).toBe("stripe");
    expect(detectService("TWILIO_AUTH_TOKEN")).toBe("twilio");
    expect(detectService("NEXT_PUBLIC_SUPABASE_URL")).toBe("supabase");
    expect(detectService("UPSTASH_REDIS_REST_URL")).toBe("redis");
    expect(detectService("ANTHROPIC_API_KEY")).toBe("anthropic");
  });

  it("returns null for an unrecognized key (AC-2 default)", () => {
    expect(detectService("MY_CUSTOM_FLAG")).toBeNull();
  });

  it("is case-insensitive", () => {
    expect(detectService("stripe_webhook_secret")).toBe("stripe");
  });
});

describe("serviceLabel", () => {
  it("labels a known service and falls back to Other", () => {
    expect(serviceLabel("stripe")).toBe("Stripe");
    expect(serviceLabel(null)).toBe("Other");
    expect(serviceLabel("unknown")).toBe("Other");
  });
});
