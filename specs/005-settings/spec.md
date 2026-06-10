# Spec 005 — Settings (language & theme)

- **Status:** draft
- **Type:** feature
- **Requested by / owner:** Achref Arabi (owner)
- **Date:** 2026-06-10
- **Slice / areas touched:** new `src/features/settings`, route `/settings`; app shell (nav “Settings” item, language + theme providers); `src/lib/format.ts` (locale-aware formatters); `src/app/globals.css` (light palette); UI strings across `projects` / `env-vars` / `documents` / app shell get externalized to message catalogs; per-user persistence via auth.

## Problem (the why)

progixHub shipped English-only and dark-only (002, 003, 004). The team works in both English and French, and not everyone wants a dark UI — today there is no way to change either. The owner wants the whole app to be usable in French and in a light theme, with each person’s choice remembered so they set it once and it follows them. This is the cross-cutting bilingual requirement deferred from spec 004, plus light mode, landed in one place: a Settings page.

## Desired behavior (the what)

A signed-in member opens **Settings** from the nav. They see two controls:

- **Language — English / Français.** Switching re-renders the app’s own copy — nav, buttons, headings, tab labels, form fields, empty states, validation and error messages, across every screen (projects, env vars, documents, sign-in chrome) — in the chosen language. What a user _typed_ is never translated: project names and statuses, env-var keys and values, document titles, links, and note bodies stay exactly as entered. Dates and numbers follow the chosen language’s formatting.
- **Theme — Light / Dark.** Switching repaints the whole app in the chosen palette immediately, with the same brand colors and contrast intact.

Both choices **persist against the user’s account**: after signing out and back in, or signing in on another device, the app comes up already in their language and theme — no re-choosing, and no flash of the wrong language or theme on first paint. A string that hasn’t been translated yet falls back to English rather than showing blank or a raw key.

## Acceptance criteria

- **AC-1 (see current settings):** Given a signed-in member, when they open `/settings`, then they see the currently active language and theme reflected in the controls.
- **AC-2 (switch language):** Given a member on any screen, when they set the language to Français, then the app’s own UI copy (nav, buttons, headings, tab labels, form labels, empty states, error messages) renders in French, while user-authored content (project names, env-var keys/values, document titles/links/notes) is unchanged.
- **AC-3 (switch theme):** Given a member, when they set the theme to Light, then the entire app renders in the light palette; switching back to Dark restores the dark palette — both with no broken/illegible areas.
- **AC-4 (persist across sessions & devices):** Given a member who set Français + Light, when they sign out and back in (or sign in on another device), then the app loads in Français + Light without them re-choosing.
- **AC-5 (no flash on load):** Given a member with Français + Light persisted, when they do a full page load, then the first paint is already Français + Light (no flash of English or Dark).
- **AC-6 (missing translation falls back — non-happy):** Given a UI string with no French translation, when the language is Français, then the English text is shown — never a blank or a raw message key.
- **AC-7 (auth gate — non-happy):** Given a signed-out visitor, when they navigate to `/settings`, then they are redirected to sign-in, the same as the rest of the app.

## Out of scope

- Translating any **user-authored** content — project names/status text, env-var keys/values, document titles, link titles, note bodies. Only the app’s own UI copy is bilingual.
- Languages other than **English** and **French**.
- A **“system/auto”** theme that follows the OS, and **auto-detecting** language from the browser’s `Accept-Language` — first-ever default is English/Dark; the user toggles. (Possible later.)
- **Per-project or per-org** preferences — settings are strictly **per-user**.
- Any other settings surface (profile, account, notifications, avatar) — this page is **language + theme only**.

## CUJ impact

- Registers **CUJ-05** — Personalize the app: open Settings → switch to Français → switch to Light → reload and see both persist. (Add to `docs/product/critical-user-journeys.md` at ship; screenshots `settings-*`.)

## Open questions

_None — decisions are baked in above per the owner’s autonomy grant. Persistence mechanism (user metadata vs a `user_settings` table) and the i18n library choice are `plan.md` decisions, not product questions._
