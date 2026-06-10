# Settings (language & theme)

**Status:** live · **Slice:** `src/features/settings` · **Routes:** `/settings`
**Spec history:** specs/005-settings (shipped 2026-06-10)

## What it does (user terms)

A signed-in member opens **Settings** from the nav and chooses a **language** (English / Français) and a **theme** (light / dark). The whole app’s own copy — nav, buttons, headings, tab labels, form fields, empty states, and error messages — renders in the chosen language; what a user _typed_ (project names, env-var keys/values, document titles/links/notes) is never translated. Both choices are remembered against the member’s account, so they follow them across sessions and devices, and the app comes up already in the right language and theme with no flash of the wrong one.

## How it works (the non-obvious 20%)

- **i18n is `next-intl` without locale routing** (no `/en|/fr` URL segment, no next-intl middleware). The active locale is resolved per request in `src/i18n/request.ts`; UI strings live in `src/messages/{en,fr}.json` (namespaced). **English is underlaid under French** (`messagesFor` deep-merges), so any untranslated key falls back to English rather than showing blank or a raw key. Full rationale: **[ADR-0009](../../architecture/decisions/0009-i18n-and-theming.md)**.
- **Preferences resolve `cookie → JWT user_metadata → default`** (`src/lib/settings/prefs.ts` `resolvePrefs`). `getServerPrefs` (`src/lib/settings/server.ts`) reads them with **no DB call** — `user_metadata` rides in the validated JWT (`getClaims()`), `cache()`-deduped per request.
- **The cookie is the authoritative per-device store; `user_metadata` is best-effort cross-device sync.** `updateSettingsAction` sets the `NEXT_LOCALE`/`theme` cookies **first and unconditionally**, then writes `user_metadata` inside a `try/catch`. This is deliberate: rapid consecutive toggles rotate the Supabase auth cookie, and a racing `updateUser` can fail — the cookie must still persist the choice. Cross-device sync simply catches up on the next successful write.
- **No flash** because the **async root layout** reads prefs server-side and sets `<html lang data-theme>` on the first paint (`src/app/layout.tsx`). The theme toggle additionally sets `document.documentElement.dataset.theme` optimistically for instant feedback before the server revalidation lands.
- **Theme is hand-rolled, not a library**: `:root` holds the dark palette; `:root[data-theme="light"]` overrides only the raw tokens, and the shadcn semantic tokens (`var()` references) follow automatically (`src/app/globals.css`). A `--red-text` token replaced a hardcoded error-text hex app-wide so error copy is legible in both themes.
- **zod + server-action errors are translated at the boundary.** Schema messages are message _keys_; the action resolves them via `getTranslations()`. The client file-validator returns reason codes (`"type"`/`"size"`) that the component translates. Dates/numbers are locale-aware (`src/lib/format.ts`, locale passed via `useLocale()`).

## Decisions & gotchas

- 2026-06-10 — `user_metadata` is **untrusted on read**: `resolvePrefs` re-validates locale/theme against the enum with type guards, so a member setting an arbitrary `user_metadata.locale` can never push a bad value into `<html lang>`/`data-theme` or the catalog lookup.
- 2026-06-10 — The four **surface labels** (Notion/Slack/GitHub/**Live**) stay literal in both languages — they read as proper nouns for the linked services. Only the surrounding chrome is translated.
- Gotcha (tests): any component using `useTranslations`/`useLocale` must be rendered through `renderWithIntl` (`src/test/intl.tsx`) — a bare `render` throws (no provider).
- Gotcha (e2e): `e2e/settings.spec.ts` mutates the **shared** test user’s `user_metadata`; it resets to en/dark in `afterEach` so the English-asserting specs stay clean. A failed reset would poison the next run — seeding a baseline at `auth.setup` is a logged follow-up.
- Adding a locale = add a `messages/<locale>.json` + extend the `LOCALES` enum; the fallback and parity test handle the rest. System/auto theme and browser-language auto-detect are out of scope.

## CUJs covered

- CUJ-05 — Personalize the app: language + theme, persisted (`e2e/settings.spec.ts`)
