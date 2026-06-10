import { z } from "zod";

/**
 * Per-user UI preferences (ADR-0009). The durable source of truth is the member's
 * `user_metadata` (rides in the JWT, cross-device); a per-device cookie mirrors it for
 * instant, flash-free reads. Resolution precedence: cookie → JWT → default.
 */

export const LOCALES = ["en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];

export const THEMES = ["dark", "light"] as const;
export type Theme = (typeof THEMES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const DEFAULT_THEME: Theme = "dark";

/** Cookie names — `NEXT_LOCALE` is the next-intl convention. */
export const LOCALE_COOKIE = "NEXT_LOCALE";
export const THEME_COOKIE = "theme";

export const localeSchema = z.enum(LOCALES);
export const themeSchema = z.enum(THEMES);

export type Prefs = { locale: Locale; theme: Theme };

const isLocale = (value: unknown): value is Locale => LOCALES.includes(value as Locale);
const isTheme = (value: unknown): value is Theme => THEMES.includes(value as Theme);

/** First candidate that passes the guard, else the fallback. */
function firstValid<T>(guard: (v: unknown) => v is T, candidates: unknown[], fallback: T): T {
  for (const candidate of candidates) if (guard(candidate)) return candidate;
  return fallback;
}

/** Resolve the active locale + theme from the cookie mirror and the JWT user_metadata. */
export function resolvePrefs(
  cookies: { locale?: string | null; theme?: string | null },
  userMetadata?: { locale?: unknown; theme?: unknown } | null,
): Prefs {
  return {
    locale: firstValid(isLocale, [cookies.locale, userMetadata?.locale], DEFAULT_LOCALE),
    theme: firstValid(isTheme, [cookies.theme, userMetadata?.theme], DEFAULT_THEME),
  };
}
