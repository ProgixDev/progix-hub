import type { Locale } from "@/lib/settings/prefs";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";

type Messages = typeof en;

const catalogs: Record<Locale, Messages> = { en, fr: fr as Messages };

/** Recursively overlay `override` onto `base`, so any key missing in `override` keeps `base`. */
export function deepMerge<T>(base: T, override: unknown): T {
  if (
    base === null ||
    typeof base !== "object" ||
    Array.isArray(base) ||
    override === null ||
    typeof override !== "object"
  ) {
    return (override === undefined ? base : (override as T)) ?? base;
  }
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  const ov = override as Record<string, unknown>;
  for (const key of Object.keys(out)) {
    if (key in ov) out[key] = deepMerge(out[key], ov[key]);
  }
  return out as T;
}

/**
 * Messages for `locale`, with English underlaid so any untranslated key falls back to
 * English instead of showing blank or a raw key (spec 005 AC-6).
 */
export function messagesFor(locale: Locale): Messages {
  return locale === "en" ? en : deepMerge(en, catalogs[locale]);
}
