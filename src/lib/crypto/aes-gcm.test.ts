import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { decryptValue, encryptValue } from "./aes-gcm";

const key = randomBytes(32);
const aad = Buffer.from("v1:11111111-1111-1111-1111-111111111111");

describe("aes-gcm", () => {
  it("round-trips a value", () => {
    const blob = encryptValue("sk_live_secret", key, aad);
    expect(decryptValue(blob, key, aad)).toBe("sk_live_secret");
  });

  it("stores ciphertext, not the plaintext", () => {
    const blob = encryptValue("sk_live_secret", key, aad);
    expect(blob).not.toContain("sk_live_secret");
  });

  it("uses a fresh IV every call (no static-IV regression)", () => {
    expect(encryptValue("same", key, aad)).not.toBe(encryptValue("same", key, aad));
  });

  it("rejects decryption under a different AAD (cross-row swap)", () => {
    const blob = encryptValue("sk_live_secret", key, aad);
    const otherRow = Buffer.from("v1:22222222-2222-2222-2222-222222222222");
    expect(() => decryptValue(blob, key, otherRow)).toThrow();
  });

  it("rejects a tampered ciphertext", () => {
    const blob = encryptValue("sk_live_secret", key, aad);
    const [iv, tag] = blob.split(":");
    const tampered = `${iv}:${tag}:${Buffer.from("evil").toString("base64")}`;
    expect(() => decryptValue(tampered, key, aad)).toThrow();
  });

  it("rejects the wrong key", () => {
    const blob = encryptValue("sk_live_secret", key, aad);
    expect(() => decryptValue(blob, randomBytes(32), aad)).toThrow();
  });

  it("rejects a malformed blob", () => {
    expect(() => decryptValue("not-a-blob", key, aad)).toThrow();
    expect(() => decryptValue("a:b", key, aad)).toThrow();
  });
});
