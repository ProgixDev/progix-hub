"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isPasscodeShaped, isTokenShaped } from "./lib";

const cookieName = (token: string) => `setup_pc_${token}`;

/**
 * Verify the client's passcode for a setup link; on success, set an httpOnly cookie (scoped to that
 * link's path) so they don't re-enter it per action. Returns ok/false only — no project data.
 */
export async function verifyPasscodeAction(
  token: string,
  passcode: string,
): Promise<{ ok: boolean }> {
  const code = passcode.trim();
  if (!isTokenShaped(token) || !isPasscodeShaped(code)) return { ok: false };
  const supabase = await createClient();
  const { data } = await supabase.rpc("setup_public_view", { p_token: token, p_passcode: code });
  if (!data) return { ok: false };
  // Deliberate trade-off: the cookie holds the plaintext passcode (httpOnly/secure/path-scoped) so
  // the low-friction client gate survives reloads without server-side session state. It's a shared,
  // rotatable, low-value onboarding code — not a credential to anything else.
  const jar = await cookies();
  jar.set(cookieName(token), code, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: `/setup/${token}`,
    maxAge: 60 * 60 * 8,
  });
  return { ok: true };
}

/** Client marks one of its steps done/undone — passcode comes from the httpOnly cookie. */
export async function markStepAction(
  token: string,
  stepId: string,
  done: boolean,
): Promise<{ ok: boolean }> {
  if (!isTokenShaped(token)) return { ok: false };
  const jar = await cookies();
  const passcode = jar.get(cookieName(token))?.value;
  if (!passcode) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase.rpc("setup_mark_step", {
    p_token: token,
    p_passcode: passcode,
    p_step_id: stepId,
    p_done: done,
  });
  return { ok: !error };
}
