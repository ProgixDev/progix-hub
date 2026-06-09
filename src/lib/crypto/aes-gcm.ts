import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// Pure AES-256-GCM, deliberately env-free so it unit-tests without tripping `server-only`.
// The key and the AAD are always passed in; this module never reads process.env.

const IV_BYTES = 12;
const TAG_BYTES = 16;
const KEY_BYTES = 32;

function assertKey(key: Buffer): void {
  if (key.length !== KEY_BYTES) {
    throw new Error(`encryption key must be ${KEY_BYTES} bytes, got ${key.length}`);
  }
}

/**
 * Encrypt with AES-256-GCM, authenticating `aad` (the row binding — see ADR-0007).
 * Returns `base64(iv):base64(tag):base64(ciphertext)` with a fresh random IV per call.
 */
export function encryptValue(plaintext: string, key: Buffer, aad: Buffer): string {
  assertKey(key);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(aad);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${tag.toString("base64")}:${ciphertext.toString("base64")}`;
}

/**
 * Decrypt + verify. Throws on a wrong key, wrong AAD (cross-row swap), tampered bytes, or a
 * malformed blob — never returns partial plaintext.
 */
export function decryptValue(blob: string, key: Buffer, aad: Buffer): string {
  assertKey(key);
  const parts = blob.split(":");
  if (parts.length !== 3) throw new Error("malformed ciphertext blob");
  const iv = Buffer.from(parts[0]!, "base64");
  const tag = Buffer.from(parts[1]!, "base64");
  const ciphertext = Buffer.from(parts[2]!, "base64");
  if (iv.length !== IV_BYTES) throw new Error("invalid IV length");
  if (tag.length !== TAG_BYTES) throw new Error("invalid auth tag length");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAAD(aad);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
