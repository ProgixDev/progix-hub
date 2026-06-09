import { decryptValue, encryptValue } from "./aes-gcm";

// Pure keyring (env-free, so it unit-tests without `server-only`). Maps a key version to its 32-byte
// key and encrypts/decrypts version-tagged blobs, binding the row id as AAD (ADR-0007). The
// server-only wrapper that reads the keyring from the environment lives in `secrets.ts`.

const KEY_BYTES = 32;

export type Keyring = { active: string; keys: Map<string, Buffer> };

/** Parse a JSON `{ "<version>": "<base64 32-byte key>" }` map + active version into a validated keyring. */
export function parseKeyring(
  rawKeysJson: string | undefined,
  activeVersion: string | undefined,
): Keyring {
  if (!rawKeysJson || !activeVersion) {
    throw new Error("env-var encryption keyring is not configured");
  }
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(rawKeysJson) as Record<string, unknown>;
  } catch {
    throw new Error('ENV_VAR_ENCRYPTION_KEYS must be JSON, e.g. {"1":"<base64 key>"}');
  }
  const keys = new Map<string, Buffer>();
  for (const [version, value] of Object.entries(parsed)) {
    if (typeof value !== "string") {
      throw new Error(`ENV_VAR_ENCRYPTION_KEYS["${version}"] must be a base64 string`);
    }
    const buf = Buffer.from(value, "base64");
    if (buf.length !== KEY_BYTES) {
      throw new Error(
        `ENV_VAR_ENCRYPTION_KEYS["${version}"] must decode to ${KEY_BYTES} bytes, got ${buf.length}`,
      );
    }
    keys.set(version, buf);
  }
  if (!keys.has(activeVersion)) {
    throw new Error(`active key version "${activeVersion}" has no matching key`);
  }
  return { active: activeVersion, keys };
}

function aadFor(version: string, envVarId: string): Buffer {
  return Buffer.from(`${version}:${envVarId}`);
}

/** Encrypt under the active key; returns `v<version>:<blob>` with the row id bound as AAD. */
export function encryptWith(keyring: Keyring, plaintext: string, envVarId: string): string {
  const key = keyring.keys.get(keyring.active)!;
  return `v${keyring.active}:${encryptValue(plaintext, key, aadFor(keyring.active, envVarId))}`;
}

/** Decrypt a `v<version>:<blob>` value, selecting the key by its version prefix. */
export function decryptWith(keyring: Keyring, stored: string, envVarId: string): string {
  const sep = stored.indexOf(":");
  if (sep < 1 || stored[0] !== "v") {
    throw new Error("malformed secret (missing version prefix)");
  }
  const version = stored.slice(1, sep);
  const blob = stored.slice(sep + 1);
  const key = keyring.keys.get(version);
  if (!key) {
    throw new Error(`no key for version "${version}" — the encryption key may have changed`);
  }
  return decryptValue(blob, key, aadFor(version, envVarId));
}
