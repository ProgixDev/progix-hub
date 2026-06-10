# Tasks 007 — Mobile responsiveness + installable PWA

Ordered, checkboxed. `[P]` = parallel-safe. Tick on commit.

## Phase 0 — mobile shell

- [x] T0 Branch `feat/007-mobile-responsive-pwa` (exists). Extract `SidebarNav` content + add `AppFrame` (`"use client"`, `navOpen` state) · done: typecheck
- [x] T1 `Sidebar`: static `hidden md:flex` aside (desktop unchanged) + `md:hidden` slide-in drawer overlay (backdrop, close on link/Escape/tap-out) · done: renders both
- [x] T2 `TopBar`: `md:hidden` hamburger button (opens drawer) + the "Commands" label collapses to icon-only `< sm`; `AppShell` wires `AppFrame` · done: hamburger only `< md`
- [x] T3 i18n: `nav.openMenu` / `nav.closeMenu` in `en.json` + `fr.json` · done: parity test green

## Phase 1 — responsive content polish `[P]`

- [x] T4 [P] Section/page padding `px-6 → px-4 sm:px-6` (env-vars, documents, portal, settings, project-detail, portfolio) · done: no class breaks desktop
- [x] T5 [P] Env-vars: rows + audit trail + form reflow at 360px (flex-wrap, `min-w-0`, `break-all` on keys) · done: no horizontal scroll
- [x] T6 [P] Documents: rows + tabs + form reflow; file/link/note meta wraps · done: no horizontal scroll
- [x] T7 [P] Portal: member blocks/cards + share-link manager (long URL `break-all`) + the public `share-view` (mobile-first stacking of comment/attach/propose) · done: no overflow on `/share`
- [x] T8 [P] Projects: portfolio cards + project detail surface grid + the portal entry link row · done: stacks cleanly
- [x] T9 Dialogs: confirm every modal (`max-w-lg`) fits ≥320px and is scrollable when tall (project, env var, document, portal forms) · done: submit reachable at 360px

## Phase 2 — PWA

- [x] T10 `public/icon.svg` (maskable, full-bleed brand bg + `LogoMark` mark) · done: renders
- [x] T11 `src/app/manifest.ts` (`MetadataRoute.Manifest`: name, short_name, icons svg+png, `display:standalone`, `start_url:/`, `theme_color`, `background_color`) · done: `/manifest.webmanifest` valid
- [x] T12 `src/app/apple-icon.tsx` + `src/app/icon.tsx` (`next/og` `ImageResponse`, brand mark) + `themeColor` in `layout.tsx` viewport + `apple-mobile-web-app-*` metas · done: head has manifest + apple-touch-icon + theme-color

## Phase 3 — verification

- [x] T13 `playwright.config.ts`: add a `mobile` project (Pixel 5 / iPhone 13 descriptor, member storageState) running `mobile.spec.ts` · done: project runs
- [x] T14 `e2e/mobile.spec.ts`: per key screen assert no horizontal overflow at 320 + 390px; drawer open/close; dialog fits; manifest valid; `/share` mobile. `shot()` `*-mobile` · done: green
- [x] T15 `/verify-ui 007` + `pnpm verify` + full e2e (desktop unchanged) green · done: screenshots eyeballed at mobile width

## Phase 4 — review & ship

- [x] T16 `/review` (frontend + ux/a11y; appsec light — no data change) · fix P0/P1
- [ ] T17 `/feature-report 007`
- [ ] T18 Open PR; merge; deploy `vercel --prod`; verify on a real phone width
- [ ] T19 `/update-docs` — feature doc, CUJ note (verified mobile too), specs index → shipped

## AC coverage

- [x] AC-1 → T4–T9,T14 · [ ] AC-2 → T0,T1,T2,T14 · [ ] AC-3 → T5,T6,T14 · [ ] AC-4 → T9,T14
- [x] AC-5 → T7,T14 · [ ] AC-6 → T10,T11,T12,T14 · [ ] AC-7 → T15 (desktop suite)
