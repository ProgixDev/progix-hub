import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { decryptWith, encryptWith, parseKeyring } from "./keyring";

const id = "11111111-1111-1111-1111-111111111111";
const k1 = randomBytes(32).toString("base64");
const k2 = randomBytes(32).toString("base64");
const ring1 = JSON.stringify({ "1": k1 });
const ring2 = JSON.stringify({ "1": k1, "2": k2 });

describe("keyring", () => {
  it("round-trips under the active key and version-tags the blob", () => {
    const kr = parseKeyring(ring1, "1");
    const blob = encryptWith(kr, "sk_live", id);
    expect(blob.startsWith("v1:")).toBe(true);
    expect(decryptWith(kr, blob, id)).toBe("sk_live");
  });

  it("still decrypts a v1 blob after the active version advances to v2 (rotation)", () => {
    const blobV1 = encryptWith(parseKeyring(ring1, "1"), "sk_live", id);
    const rotated = parseKeyring(ring2, "2");
    expect(encryptWith(rotated, "new", id).startsWith("v2:")).toBe(true);
    expect(decryptWith(rotated, blobV1, id)).toBe("sk_live");
  });

  it("rejects a key that does not decode to 32 bytes", () => {
    expect(() => parseKeyring(JSON.stringify({ "1": "too-short" }), "1")).toThrow();
  });

  it("fails closed when unconfigured or the active version is missing", () => {
    expect(() => parseKeyring(undefined, undefined)).toThrow();
    expect(() => parseKeyring(ring1, "9")).toThrow();
  });

  it("rejects a value decrypted under a different row id (cross-row swap)", () => {
    const kr = parseKeyring(ring1, "1");
    const blob = encryptWith(kr, "sk_live", id);
    expect(() => decryptWith(kr, blob, "22222222-2222-2222-2222-222222222222")).toThrow();
  });
});
