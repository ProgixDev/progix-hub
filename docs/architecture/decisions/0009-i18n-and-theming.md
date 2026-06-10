# 0009 — Internationalization (EN/FR) and light/dark theming, sourced per-user from the JWT

- **Status:** Accepted
- **Date:** 2026-06-10
- **Deciders:** Achref Arabi (owner), Claude (agent)

## Context

[Spec 005](../../../specs/005-settings/spec.md) requires the whole app chrome to be available in English **and** French, and in a light **or** dark theme, with each member’s choice persisted across sessions and devices and **no flash** of the wrong language/theme on first paint. The app shipped 002–004 English-only and dark-only, with ~167 hardcoded UI strings across 26 files and design tokens on `:root`. We need an i18n approach that works with React Server Components, a theming approach that paints correctly on the server, and a per-user persistence story that doesn’t add a round-trip per request. The membership JWT (`getClaims()`) is already read in middleware and carries `user_metadata`.

## Decision

- **i18n: `next-intl`, without locale routing.** No `[locale]` URL segment and no next-intl middleware; the active locale is resolved per-request in `src/i18n/request.ts`. Messages live in `src/messages/{en,fr}.json` (namespaced); `fr` falls back to `en` for any missing key. Server code uses `getTranslations`, client islands use `useTranslations`; `src/lib/format.ts` becomes locale-aware.
- **Theme: hand-rolled via a `data-theme` attribute on `<html>` + CSS tokens** (`:root` = dark default, `:root[data-theme="light"]` overrides). No theme library — the async root layout sets the attribute server-side so the first paint is correct.
- **Persistence: `user_metadata` (`{ locale, theme }`) is the durable, cross-device source of truth**, written via `supabase.auth.updateUser`. It rides in the JWT, so the server reads it with **no extra DB call**. A per-device cookie (`NEXT_LOCALE`, `theme`) mirrors it for instant, JWT-refresh-free updates. **Precedence: cookie → JWT `user_metadata` → default (`en`/`dark`).**

## Alternatives considered

| Option                                 | Why not                                                                                                                                                                         |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| next-intl **with** `[locale]` routing  | Per-user (not per-URL) preference; locale-prefixed routes add a segment, a middleware, and link-rewriting for zero benefit here.                                                |
| `next-themes` for theming              | Client/localStorage-based → flashes without its inline script and does **not** sync cross-device; our JWT-sourced server render is flash-free and cross-device by construction. |
| Cookie/localStorage **only** for prefs | Doesn’t follow the user to a new device (fails AC-4). The JWT carries the durable value; the cookie is only a fast mirror.                                                      |
| Roll our own dictionary/`t()`          | Reinvents pluralization, interpolation, RSC/client split, and fallback that next-intl already solves correctly.                                                                 |

## Consequences

- Positive: first paint is correct (no FOUC/FOUL) with no extra query — locale/theme come from the already-validated JWT. Per-user, cross-device by construction. One catalog pair to translate; `fr`→`en` fallback satisfies AC-6.
- Negative / accepted trade-offs: every UI string must be externalized (a large but mechanical one-time migration across 26 files); zod-schema and server-action error messages move to keys resolved at the boundary; `next.config` is wrapped by `createNextIntlPlugin`; the root layout becomes `async`.
- Follow-ups required: add `next-intl` (ADR-weight dep); add the light palette to `globals.css` (`docs/conventions/styling.md` note that the app is no longer dark-only); document the “externalize copy, don’t hardcode” rule in `docs/conventions/copy.md`; future locales = add a catalog.
