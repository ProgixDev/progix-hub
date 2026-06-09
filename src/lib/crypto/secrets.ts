import "server-only";
import { env } from "@/core/env";
import { decryptWith, encryptWith, parseKeyring, type Keyring } from "./keyring";

// Server-only wrapper: reads + validates the keyring from the environment once, then encrypts/
// decrypts env-var values. The pure crypto lives in aes-gcm.ts / keyring.ts (unit-tested); this
// thin layer is exercised via integration. Fails closed — never persists without a valid key.

let cached: Keyring | null = null;

function keyring(): Keyring {
  cached ??= parseKeyring(env.ENV_VAR_ENCRYPTION_KEYS, env.ENV_VAR_ENCRYPTION_ACTIVE_VERSION);
  return cached;
}

/** Encrypt a value for storage, binding the env-var id as AAD. Throws (never returns) without a key. */
export function encryptSecret(plaintext: string, envVarId: string): string {
  return encryptWith(keyring(), plaintext, envVarId);
}

/** Decrypt a stored value; throws a distinct “key may have changed” error if its version is missing. */
export function decryptSecret(stored: string, envVarId: string): string {
  return decryptWith(keyring(), stored, envVarId);
}

/** Throws if the keyring isn't configured/valid — the health-check canary (T7). */
export function assertSecretsConfigured(): void {
  keyring();
}
