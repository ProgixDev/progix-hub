import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { LOCALE_COOKIE, resolvePrefs, THEME_COOKIE, type Prefs } from "./prefs";

/**
 * The active locale + theme for this request (ADR-0009): cookie mirror first, then the
 * member's `user_metadata` from the validated JWT (no DB call — it's in the token), then
 * the default. `cache()` dedupes the work across the layout and next-intl's request config.
 */
export const getServerPrefs = cache(async (): Promise<Prefs> => {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get(LOCALE_COOKIE)?.value ?? null;
  const themeCookie = cookieStore.get(THEME_COOKIE)?.value ?? null;

  let userMetadata: { locale?: unknown; theme?: unknown } | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    userMetadata = (data?.claims?.user_metadata ?? null) as typeof userMetadata;
  } catch {
    // Signed-out or unavailable session → fall back to cookie/default.
    userMetadata = null;
  }

  return resolvePrefs({ locale: localeCookie, theme: themeCookie }, userMetadata);
});
