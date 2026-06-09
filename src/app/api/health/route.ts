import { NextResponse } from "next/server";
import { assertSecretsConfigured } from "@/lib/crypto/secrets";

/**
 * Liveness + secrets-config canary (spec 003, ADR-0007): returns 503 if the env-var encryption
 * keyring is missing or malformed, so a mis-keyed deploy is caught here rather than on a user's
 * first reveal. Exposes no secret material.
 */
export async function GET() {
  try {
    assertSecretsConfigured();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "secrets misconfigured" },
      { status: 503 },
    );
  }
}
