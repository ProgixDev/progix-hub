import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// Explicit CSRF protection for the OAuth consent decision (spec 024, appsec). Stateless: the
// consent page renders an HMAC over (authorization_id, user id); the decision route recomputes it
// from the session user and rejects a mismatch. An attacker can't forge it without the secret, and
// can't obtain a valid one without the victim actually visiting their consent screen — so a blind
// cross-site POST can never approve, independent of the cookie's SameSite default.
const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export function signConsent(authorizationId: string, userId: string): string {
  return createHmac("sha256", SECRET).update(`${authorizationId}:${userId}`).digest("hex");
}

export function verifyConsent(token: string, authorizationId: string, userId: string): boolean {
  const expected = signConsent(authorizationId, userId);
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
