/**
 * Shared Intl-based formatters (docs/conventions/copy.md): user-visible dates and
 * numbers always go through these — never hand-rolled string math. The active locale
 * (spec 005) is passed in by callers — `useLocale()` in client islands, `getLocale()`
 * on the server — defaulting to English.
 */

const dateFormatters = new Map<string, Intl.DateTimeFormat>();
const numberFormatters = new Map<string, Intl.NumberFormat>();

function dateFormatter(locale: string): Intl.DateTimeFormat {
  let formatter = dateFormatters.get(locale);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
    dateFormatters.set(locale, formatter);
  }
  return formatter;
}

function numberFormatter(locale: string): Intl.NumberFormat {
  let formatter = numberFormatters.get(locale);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale);
    numberFormatters.set(locale, formatter);
  }
  return formatter;
}

export function formatDate(date: Date | number, locale: string = "en"): string {
  return dateFormatter(locale).format(date);
}

export function formatNumber(value: number, locale: string = "en"): string {
  return numberFormatter(locale).format(value);
}
