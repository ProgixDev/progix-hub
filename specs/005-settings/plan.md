# Plan 005 — Settings (language & theme)

- **Spec:** [spec.md](spec.md) (all open questions resolved: yes)
- **Author:** Claude (agent) · **Date:** 2026-06-10

## Approach

Retrofit i18n + theming, then add the Settings page that drives them. **i18n** is `next-intl` _without_ locale routing ([ADR-0009](../../docs/architecture/decisions/0009-i18n-and-theming.md)): the active locale is resolved per-request in `src/i18n/request.ts`; ~167 hardcoded UI strings move into `src/messages/{en,fr}.json` (namespaced); `fr` falls back to `en` per key (AC-6). **Theme** is hand-rolled — a `data-theme` attribute on `<html>` plus a light token set in `globals.css` (`:root` stays dark by default). **Persistence** is `user_metadata.{locale,theme}` (durable, cross-device, rides in the JWT so the server reads it with no DB call) mirrored to per-device cookies for instant, flash-free updates; precedence **cookie → JWT → default**. The async root layout reads both and sets `<html lang=… data-theme=…>` so first paint is correct (AC-5). The key trade-off: a large but mechanical string-externalization migration across 26 files, accepted to get correct RSC i18n and a flash-free per-user experience. No locale routing, no theme library, no new table.

## Placement (per `docs/architecture/module-boundaries.md`)

| What              | Where                                                                      | Notes                                                                             |
| ----------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| i18n config       | `src/i18n/request.ts`, `src/messages/{en,fr}.json`                         | app infra; locale resolution + catalogs (next-intl plugin in `next.config`)       |
| Theme tokens      | `src/app/globals.css`                                                      | add `:root[data-theme="light"]` overrides; dark stays the `:root` default         |
| Route             | `src/app/settings/{page,loading,error}.tsx`                                | thin RSC, member-gated by existing middleware (AC-7)                              |
| Slice             | `src/features/settings/`                                                   | toggles (client islands) + `actions.ts` (persist) + `lib.ts` (locale/theme types) |
| Shared            | `src/lib/format.ts`, `src/lib/settings/cookies.ts`                         | locale-aware formatters; cookie read/write helpers (server)                       |
| Externalized copy | every `src/features/*/components`, `src/components/app-shell`, `src/app/*` | replace literals with `t("…")` keys                                               |

## Data & state

- **Server data:** locale + theme resolved per-request from `cookie → claims.user_metadata → default`. `getRequestConfig` loads the matching catalog (with `en` fallback). The root layout reads the same values to set `<html>` attributes and wrap children in `NextIntlClientProvider`.
- **Client state:** none beyond the toggles’ pending state. The theme toggle also optimistically sets `document.documentElement.dataset.theme` for instant feedback before the server confirms.
- **Actions:** `updateSettingsAction({ locale?, theme? })` — `requireMember`, zod-validate the enum(s), `supabase.auth.updateUser({ data })`, set the mirror cookie(s), `revalidatePath("/", "layout")`. No secret/admin client; `user_metadata` is the user’s own, so writing it is in-scope for the member.

## Acceptance criteria → verification mapping

| AC                                   | Proven by                                                                                                                                                |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1 see current settings            | unit `settings/components/*.test.tsx` (toggles reflect the provided locale/theme) · e2e `settings.spec.ts` opens `/settings` and sees both controls      |
| AC-2 switch language                 | e2e: set Français → a known nav/heading renders FR, while a created **project name stays as typed** · unit: a component renders via `next-intl` messages |
| AC-3 switch theme                    | e2e: set Light → `html[data-theme="light"]`; back to Dark → attribute flips · screenshot `settings-light`                                                |
| AC-4 persist across sessions/devices | unit `actions.test.ts` (`updateUser` called with `{ locale/theme }`) · e2e: set prefs → full reload → still FR/Light (read back from the JWT)            |
| AC-5 no flash on load                | e2e: request the raw HTML of `/settings` and assert `<html lang="fr" … data-theme="light">` is present in the **server response** (pre-hydration)        |
| AC-6 missing translation → English   | unit `i18n.test.ts`: a key absent from `fr` resolves to the `en` value (fallback config), never blank/raw key                                            |
| AC-7 auth gate (non-happy)           | e2e: signed-out `goto('/settings')` → redirected to `/sign-in` (existing middleware) · the page also calls `requireMember`                               |

## Risks & unknowns

- **JWT staleness after `updateUser`.** A new device login has no cookie yet; the JWT carries the durable value, so the layout still paints right. Same-session updates use the cookie mirror (+ `router.refresh()`/`revalidatePath`) so they don’t wait on a token refresh. De-risked by the **cookie → JWT → default** precedence.
- **String-externalization blast radius (26 files).** Mechanical but large; done per-area in parallel-safe tasks ([P]). Each area’s tests stay green as its strings move (keys + provider), catching regressions early.
- **Zod / server-action errors are outside components.** Schema messages become keys; the action’s `fieldErrorsOf` + returned errors resolve via `getTranslations` at the boundary. Contained to each `actions.ts`/`types.ts`.
- **Light palette contrast.** New token set risks low-contrast areas; `/verify-ui` inspects `settings-light` + a re-shot of each major screen in light before ship.
- **Brand strings stay literal.** Service names (Notion/Slack/GitHub, Stripe/Twilio/…) are **not** translated; only surrounding UI copy is.

## Overlap check

No other spec is `active` (001 abandoned; 002/003/004 shipped). This spec is cross-cutting by design — it edits every shipped slice’s **copy** (not its logic) and the root layout. No behavioral conflict; the shipped features’ tests guard their behavior while strings move.
