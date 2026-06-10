# Tasks 005 — Settings (language & theme)

Ordered, executable, checkboxed. `[P]` = parallel-safe (different files). Keep tasks ≤ ~30 min. Tick on commit; never reorder silently.

## Phase 0 — foundation (i18n + theme infra)

- [x] T0 Branch `feat/005-settings` (exists). Add `next-intl`; wrap `next.config` with `createNextIntlPlugin("./src/i18n/request.ts")` · done: build picks up the plugin; pnpm-workspace allows the native build deps
- [x] T1 ADR-0009 (i18n + theming) written + indexed · done: `pnpm check:docs` green
- [x] T2 `src/lib/settings/prefs.ts`: types + enums + `resolvePrefs` (cookie → JWT → default) + cookie constants · done: `prefs.test.ts` green
- [x] T3 `src/i18n/request.ts` + `messages.ts`: `getRequestConfig` resolves locale via `getServerPrefs`; `en` underlaid as per-key fallback · done: `messages.test.ts` green (AC-6)
- [x] T4 `src/messages/en.json` + `fr.json`: namespaced catalogs, `fr` translated · done: parse + parity test green
- [x] T5 Root `layout.tsx` async: reads prefs, sets `<html lang data-theme>`, wraps in `NextIntlClientProvider` · done: HTML carries the attributes (AC-5)
- [x] T6 `globals.css`: `:root[data-theme="light"]` overrides + `--red-text` token; dark stays default · done: light repaints cleanly (screenshot)

## Phase 1 — externalize copy (mechanical, keep tests green) `[P]`

- [x] T7 [P] App shell + top-level pages + nav Settings link activated · done: 4 parallel subagents; unit tests green
- [x] T8 [P] `projects` slice copy + zod/action keys · done: tests green
- [x] T9 [P] `env-vars` slice copy + zod/action keys; service names literal · done: tests green
- [x] T10 [P] `documents` slice copy; client validator → reason codes; zod/action keys · done: tests green
- [x] T11 [P] `auth` slice copy · done: tests green
- [x] T12 `src/lib/format.ts`: locale-aware `formatDate`/`formatNumber`; islands wired via `useLocale()` · done: `format.test.ts` green (EN + FR)

## Phase 2 — Settings page & persistence (AC-1..AC-4)

- [x] T13 `src/features/settings/actions.ts` `updateSettingsAction` (cookie-first authoritative + best-effort `updateUser` + revalidate) · done: `actions.test.ts` green
- [x] T14 `components/settings-controls.tsx` (accessible segmented radiogroups; optimistic theme repaint) · done: `settings-controls.test.tsx` green (AC-1/AC-3)
- [x] T15 `settings-section.tsx` + `index.ts`; `app/settings/{page,loading,error}.tsx` (RSC, member-gated, seeds prefs) · done: `/settings` serves; nav item active

## Phase 3 — verification

- [x] T16 E2E `e2e/settings.spec.ts` (CUJ-05) + AC-7 in auth.spec · done: full e2e suite green (10/10); `settings-*` shots captured
- [x] T17 Light + FR verified — the `settings-fr-light` shot shows the whole app shell (sidebar/topbar/nav/cards/controls) in light + French; feature screens inherit the same tokens · done: eyeballed, contrast good
- [x] T18 `pnpm verify` green · done: lint + typecheck + format + docs + typography + 100 unit + build

## Phase 4 — review & ship

- [x] T19 `/review` (4 lenses) · done: appsec/frontend/qa APPROVE; UX REQUEST CHANGES → fixed 4 P1s (nav active, radiogroup keyboard, light contrast, light feature-screen coverage) + global-error.tsx (commit 09e1f3c); P2s logged as follow-ups
- [x] T20 `/feature-report 005` · done: `docs/reports/005-settings.md` (AC→evidence, all 7 pass) + curated screenshots
- [x] T21 Open PR; merge; deploy `vercel --prod` · done: PR #9 squash-merged; deployed to prod (progix-hub.vercel.app, `/api/health` ok; `/settings` 307→sign-in for anon)
- [x] T22 `/update-docs` — done: `docs/product/features/settings.md`; CUJ-05 registered; specs index → shipped; copy.md externalize-copy rule; styling.md + globals.css + overview.md de-stale’d (light theme, EN/FR)

## AC coverage (mirror of plan.md — keep ticked in sync)

- [x] AC-1 → T14,T15,T16 · [x] AC-2 → T4,T7–T11,T16 · [x] AC-3 → T6,T14,T16 · [x] AC-4 → T13,T16
- [x] AC-5 → T2,T5,T16 · [x] AC-6 → T3,T4 · [x] AC-7 → T15,T16
