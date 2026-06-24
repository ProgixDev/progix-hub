import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isPasscodeShaped, isTokenShaped } from "./lib";
import type { PublicSetup } from "./types";

/**
 * The client's read surface: one anon RPC, token + passcode validated inside the function (spec 017
 * AC-2/AC-6). Invalid token or wrong passcode → null → the passcode form / inactive screen. Never
 * touches the tables directly (they have no anon RLS policy).
 */
export async function getPublicSetup(token: string, passcode: string): Promise<PublicSetup | null> {
  if (!isTokenShaped(token) || !isPasscodeShaped(passcode)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("setup_public_view", {
    p_token: token,
    p_passcode: passcode,
  });
  if (error || !data) return null;
  return data as PublicSetup;
}
