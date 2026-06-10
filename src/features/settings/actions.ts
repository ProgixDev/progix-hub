"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { requireMember } from "@/lib/auth/session";
import {
  LOCALE_COOKIE,
  localeSchema,
  THEME_COOKIE,
  themeSchema,
  type Locale,
  type Theme,
} from "@/lib/settings/prefs";
import { createClient } from "@/lib/supabase/server";

export type SettingsResult = { ok: true } | { ok: false; error: string };

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Persist the member's language and/or theme (spec 005). The durable, cross-device source
 * of truth is `user_metadata`; a mirror cookie makes the next render instant and flash-free.
 * Revalidates the root layout so the whole tree re-renders in the new locale/theme.
 */
export async function updateSettingsAction(input: {
  locale?: string;
  theme?: string;
}): Promise<SettingsResult> {
  const t = await getTranslations();
  const member = await requireMember();
  if (!member) return { ok: false, error: t("errors.notAuthorized") };

  const patch: { locale?: Locale; theme?: Theme } = {};
  if (input.locale !== undefined) {
    const parsed = localeSchema.safeParse(input.locale);
    if (!parsed.success) return { ok: false, error: t("settings.saveError") };
    patch.locale = parsed.data;
  }
  if (input.theme !== undefined) {
    const parsed = themeSchema.safeParse(input.theme);
    if (!parsed.success) return { ok: false, error: t("settings.saveError") };
    patch.theme = parsed.data;
  }
  if (patch.locale === undefined && patch.theme === undefined) return { ok: true };

  // The cookie is the authoritative per-device store — set it FIRST and unconditionally, so a
  // preference always persists even if the cross-device metadata write below races (rapid
  // consecutive toggles rotate the Supabase auth cookie, which can make a second write fail).
  const cookieStore = await cookies();
  const options = { maxAge: ONE_YEAR, path: "/", sameSite: "lax" as const };
  if (patch.locale) cookieStore.set(LOCALE_COOKIE, patch.locale, options);
  if (patch.theme) cookieStore.set(THEME_COOKIE, patch.theme, options);

  // Durable, cross-device store (rides the JWT) — best effort; the cookie already persisted.
  // Never let a transient auth-session error (e.g. a rotation race on rapid toggles) fail
  // the action: the per-device cookie is authoritative and is already set.
  try {
    const supabase = await createClient();
    await supabase.auth.updateUser({ data: patch });
  } catch {
    // ignore — cross-device sync will catch up on the next successful write
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
