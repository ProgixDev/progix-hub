import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, DEFAULT_THEME, resolvePrefs } from "./prefs";

describe("resolvePrefs (precedence cookie → JWT → default)", () => {
  it("defaults when nothing is set (AC-5 first-load default)", () => {
    expect(resolvePrefs({}, null)).toEqual({ locale: DEFAULT_LOCALE, theme: DEFAULT_THEME });
  });

  it("uses the JWT user_metadata when there is no cookie (AC-4 cross-device)", () => {
    expect(resolvePrefs({}, { locale: "fr", theme: "light" })).toEqual({
      locale: "fr",
      theme: "light",
    });
  });

  it("prefers the cookie over the JWT (same-device fast path)", () => {
    expect(resolvePrefs({ locale: "en", theme: "dark" }, { locale: "fr", theme: "light" })).toEqual(
      {
        locale: "en",
        theme: "dark",
      },
    );
  });

  it("ignores invalid values and falls through to the next source", () => {
    expect(resolvePrefs({ locale: "de", theme: "neon" }, { locale: "fr", theme: "light" })).toEqual(
      {
        locale: "fr",
        theme: "light",
      },
    );
    expect(resolvePrefs({ locale: "de" }, { locale: "xx" })).toEqual({
      locale: DEFAULT_LOCALE,
      theme: DEFAULT_THEME,
    });
  });
});
