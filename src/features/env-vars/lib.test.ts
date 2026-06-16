import { describe, expect, it } from "vitest";
import {
  detectScope,
  detectService,
  parseDotenv,
  scopeFromFilename,
  serializeDotenv,
  serviceLabel,
} from "./lib";

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

describe("detectScope (spec 009 AC-1)", () => {
  it("maps public-prefixed keys to frontend", () => {
    expect(detectScope("NEXT_PUBLIC_API_URL")).toBe("frontend");
    expect(detectScope("VITE_KEY")).toBe("frontend");
    expect(detectScope("REACT_APP_X")).toBe("frontend");
    expect(detectScope("EXPO_PUBLIC_X")).toBe("frontend");
    expect(detectScope("PUBLIC_X")).toBe("frontend");
    expect(detectScope("NG_APP_X")).toBe("frontend");
  });

  it("falls back to backend, then to the file hint", () => {
    expect(detectScope("DATABASE_URL")).toBe("backend");
    expect(detectScope("SOME_KEY", "frontend")).toBe("frontend");
    expect(detectScope("SOME_KEY", "backend")).toBe("backend");
    // a public prefix always wins over the hint
    expect(detectScope("NEXT_PUBLIC_X", "backend")).toBe("frontend");
  });
});

describe("scopeFromFilename (spec 009)", () => {
  it("reads frontend/backend hints from a filename", () => {
    expect(scopeFromFilename(".env.frontend")).toBe("frontend");
    expect(scopeFromFilename(".env.client")).toBe("frontend");
    expect(scopeFromFilename(".env.public")).toBe("frontend");
    expect(scopeFromFilename(".env.backend")).toBe("backend");
    expect(scopeFromFilename(".env.server")).toBe("backend");
    expect(scopeFromFilename(".env.api")).toBe("backend");
    expect(scopeFromFilename(".env")).toBeNull();
    expect(scopeFromFilename(".env.local")).toBeNull();
  });
});

describe("parseDotenv (spec 009 AC-2)", () => {
  it("parses simple lines, skips blanks and comments", () => {
    expect(parseDotenv("# a comment\n\nFOO=bar\nBAZ=qux")).toEqual([
      { key: "FOO", value: "bar" },
      { key: "BAZ", value: "qux" },
    ]);
  });

  it("strips an optional `export ` prefix", () => {
    expect(parseDotenv("export FOO=bar")).toEqual([{ key: "FOO", value: "bar" }]);
  });

  it("unescapes double-quoted values and keeps single-quoted literal", () => {
    expect(parseDotenv('FOO="a\\nb\\t\\"c\\\\"')).toEqual([{ key: "FOO", value: 'a\nb\t"c\\' }]);
    expect(parseDotenv("FOO='a\\nb'")).toEqual([{ key: "FOO", value: "a\\nb" }]);
  });

  it("strips a trailing inline comment from an unquoted value", () => {
    expect(parseDotenv("FOO=bar # trailing")).toEqual([{ key: "FOO", value: "bar" }]);
    expect(parseDotenv("URL=https://a.com/x#frag")).toEqual([
      { key: "URL", value: "https://a.com/x#frag" },
    ]);
  });

  it("drops invalid keys and empty values, last value wins on dupes", () => {
    expect(parseDotenv("1BAD=x\nGOOD=y\nEMPTY=\nGOOD=z")).toEqual([{ key: "GOOD", value: "z" }]);
  });

  it("strips a leading BOM", () => {
    expect(parseDotenv("﻿FOO=bar")).toEqual([{ key: "FOO", value: "bar" }]);
  });
});

describe("serializeDotenv (spec 009 AC-4)", () => {
  it("writes KEY=VALUE and quotes values that aren't bare-safe", () => {
    expect(
      serializeDotenv([
        { key: "A", value: "simple" },
        { key: "B", value: "needs space" },
      ]),
    ).toBe('A=simple\nB="needs space"\n');
  });

  it("groups by scope with section headers when asked", () => {
    const out = serializeDotenv(
      [
        { key: "PUB", value: "1", scope: "frontend" },
        { key: "SECRET", value: "2", scope: "backend" },
      ],
      { groupByScope: true },
    );
    expect(out).toBe("# Backend\nSECRET=2\n\n# Frontend\nPUB=1\n");
  });

  it("returns an empty string for no entries", () => {
    expect(serializeDotenv([])).toBe("");
  });
});
