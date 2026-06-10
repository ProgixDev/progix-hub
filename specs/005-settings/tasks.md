# Tasks 005 — Settings (language & theme)

Ordered, executable, checkboxed. `[P]` = parallel-safe (different files). Keep tasks ≤ ~30 min. Tick on commit; never reorder silently.

## Phase 0 — foundation (i18n + theme infra)

- [ ] T0 Branch `feat/005-settings` (exists). Add `next-intl`; wrap `next.config` with `createNextIntlPlugin("./src/i18n/request.ts")` · done: `pnpm lint` green, build picks up the plugin
- [ ] T1 ADR-0009 (i18n + theming) written + indexed · done: `pnpm check:docs` green _(done in planning)_
- [ ] T2 `src/lib/settings/prefs.ts`: `Locale`/`Theme` types + `LOCALES`/`THEMES` + zod enums + `resolvePrefs(cookies, claims)` (precedence cookie → JWT → default) + cookie name constants · done: `prefs.test.ts` green (resolution + fallback)
- [ ] T3 `src/i18n/request.ts`: `getRequestConfig` resolves locale via `resolvePrefs`, loads `src/messages/{locale}.json`, sets `en` as the per-key fallback · done: `i18n.test.ts` green (AC-6 fallback)
- [ ] T4 `src/messages/en.json` + `fr.json`: namespaced catalogs (`common`, `nav`, `auth`, `projects`, `envVars`, `documents`, `settings`, `errors`). Seed with the strings inventoried; `fr` translated · done: both parse; key sets match (a test asserts `fr` keys ⊆ `en`)
- [ ] T5 Root `layout.tsx` → async: read prefs, set `<html lang={locale} data-theme={theme}>`, wrap in `NextIntlClientProvider` (messages + locale) · done: page serves; HTML carries the attributes (AC-5 scaffold)
- [ ] T6 `globals.css`: add `:root[data-theme="light"]` token overrides (surfaces, borders, text, keep brand blue/contrast); dark stays the `:root` default · done: toggling the attribute repaints; no raw-hex regressions

## Phase 1 — externalize copy (mechanical, keep tests green) `[P]`

- [ ] T7 [P] App shell + top-level pages (`components/app-shell/*`, `app/{sign-in,error,loading}`) → `t()` keys · done: render unchanged in EN; unit tests green
- [ ] T8 [P] `projects` slice copy → keys; status labels via a shared map; `types.ts`/`actions.ts` error strings → keys resolved at the boundary · done: `projects` tests green
- [ ] T9 [P] `env-vars` slice copy → keys (section, form, row, audit verbs); `types.ts`/`actions.ts` errors → keys; service names stay literal · done: `env-vars` tests green
- [ ] T10 [P] `documents` slice copy → keys (tabs, forms, rows, empty states, confirms); `types.ts`/`lib.ts`/`actions.ts` errors → keys · done: `documents` tests green
- [ ] T11 [P] `auth` slice copy → keys (sign-in button, user menu) · done: `auth` tests green
- [ ] T12 `src/lib/format.ts`: locale-aware `formatDate`/`formatNumber` (accept/observe the active locale); wire the few date-rendering islands via `useLocale()` · done: `format.test.ts` covers EN + FR formatting

## Phase 2 — Settings page & persistence (AC-1..AC-4)

- [ ] T13 `src/features/settings/`: `prefs` re-export + `actions.ts` `updateSettingsAction({locale?,theme?})` (`requireMember` + zod enum + `updateUser` + set cookie(s) + `revalidatePath("/","layout")`) · done: `actions.test.ts` green (AC-4 unit: `updateUser` called; non-member denied)
- [ ] T14 `components/language-toggle.tsx` + `theme-toggle.tsx` (client islands; accessible radio/segmented control; theme toggle optimistically sets `document.documentElement.dataset.theme`) · done: `*.test.tsx` reflect current value (AC-1)
- [ ] T15 `components/settings-section.tsx` + `index.ts` barrel; `app/settings/{page,loading,error}.tsx` (RSC, `requireMember`, seeds current prefs) · done: `/settings` serves member-gated; nav “Settings” item activated (drop “soon”)

## Phase 3 — verification

- [ ] T16 E2E `e2e/settings.spec.ts` (CUJ-05): open Settings → switch to Français (assert FR chrome + a project name unchanged) → switch to Light (`html[data-theme=light]`) → full reload persists both; raw-HTML assertion for AC-5; signed-out `/settings` → redirect (AC-7). `shot()` `settings-*` · done: `FEATURE=005-settings pnpm e2e:shots` green
- [ ] T17 Re-shoot the major screens (portfolio, project detail, env vars, documents) in **light** + **FR** to inspect contrast/overflow · done: screenshots captured + eyeballed
- [ ] T18 Run `/verify-ui 005`; `pnpm verify` green · done: gate green, screenshots match ACs

## Phase 4 — review & ship

- [ ] T19 `/review` (frontend-architect + a11y + i18n-fallback + appsec on the action/`updateUser`) · fix P0/P1
- [ ] T20 `/feature-report 005`
- [ ] T21 Open PR; merge; deploy `vercel --prod`
- [ ] T22 `/update-docs` — feature doc, register CUJ-05, specs index → shipped, `docs/conventions/copy.md` “externalize copy” rule, styling note “no longer dark-only”

## AC coverage (mirror of plan.md — keep ticked in sync)

- [ ] AC-1 → T14,T15,T16 · [ ] AC-2 → T4,T7–T11,T16 · [ ] AC-3 → T6,T14,T16 · [ ] AC-4 → T13,T16
- [ ] AC-5 → T2,T5,T16 · [ ] AC-6 → T3,T4 · [ ] AC-7 → T15,T16
