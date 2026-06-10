# Plan 007 — Mobile responsiveness + installable PWA

- **Spec:** [spec.md](spec.md) (all open questions resolved: yes — autonomy grant)
- **Author:** Claude (agent) · **Date:** 2026-06-10

## Approach

Pure presentation + a manifest — no data, action, or RLS change. Breakpoint is Tailwind **`md` (768px)**: `< md` = phone/tablet, `≥ md` = today’s desktop layout untouched. The one piece of new behavior is the **mobile nav drawer**: `AppShell` (server) wraps a small client `AppFrame` that owns `navOpen` state; the `Sidebar`’s nav markup is extracted to a shared `SidebarNav` rendered both as the static `hidden md:flex` aside (desktop, unchanged) and as a `md:hidden` slide-in overlay drawer (mobile), and `TopBar` gets a `md:hidden` hamburger that opens it. Everything else is responsive utility classes: section padding `px-6 → px-4 sm:px-6`, rows already use `flex-wrap`/stacking (audit + fix stragglers so nothing overflows < 360px), dialogs already `w-full max-w-lg` (fit by construction). **PWA** = a Next `MetadataRoute.Manifest` (`src/app/manifest.ts`) + a maskable `public/icon.svg` (from `LogoMark`) + an `apple-icon.tsx`/`icon.tsx` (`next/og` `ImageResponse`, PNG) + `themeColor` viewport — no service worker. New copy (a menu aria-label) ships EN+FR.

## Placement (per `docs/architecture/module-boundaries.md`)

| What              | Where                                                                                                         | Notes                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Mobile shell      | `src/components/app-shell/{app-shell,app-frame,sidebar,top-bar}.tsx`                                          | new client `app-frame.tsx` (drawer state); Sidebar → drawer/static |
| Responsive polish | feature slices’ components (class-only edits)                                                                 | env-vars, documents, portal, projects rows/sections/grids          |
| PWA               | `src/app/manifest.ts`, `src/app/apple-icon.tsx`, `src/app/icon.tsx`, `public/icon.svg`, `layout.tsx` viewport | manifest + icons + theme-color                                     |
| i18n              | `src/messages/{en,fr}.json`                                                                                   | `nav.openMenu` / `nav.closeMenu`                                   |
| Verify            | `playwright.config.ts` (mobile project), `e2e/mobile.spec.ts`                                                 | iPhone 13 + Pixel 5 descriptors                                    |

## Data & state

- **Server data:** none new.
- **Client state:** `navOpen` boolean in `AppFrame` (drawer); closes on route change, nav click, Escape, and backdrop tap. No store needed.
- **Actions:** none.

## Acceptance criteria → verification mapping

| AC                          | Proven by                                                                                                                                                                           |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1 no overflow            | e2e `mobile.spec.ts`: for each key screen assert `document.scrollingElement.scrollWidth <= innerWidth` at 320/390px                                                                 |
| AC-2 mobile nav drawer      | e2e: at mobile width the hamburger is visible + sidebar hidden; open → nav visible; click a link/backdrop → closed; at desktop width no hamburger                                   |
| AC-3 rows reflow            | e2e: env-vars + documents lists at 360px have no horizontal scroll and controls remain clickable                                                                                    |
| AC-4 forms & dialogs fit    | e2e: open the new-project / add-variable / add-card dialog at 360px → within viewport, submit button reachable                                                                      |
| AC-5 client portal on phone | e2e (mobile project) opens `/share/<token>` → reads cards, comment box reachable, no overflow · screenshot                                                                          |
| AC-6 installable            | e2e: `GET /manifest.webmanifest` parses with name + ≥1 icon + `display:standalone` + `start_url` + `theme_color`; `<link rel=manifest>` + apple-touch-icon present in the page head |
| AC-7 desktop unchanged      | the existing desktop CUJ suite still green (no class change alters `≥ md` layout); spot screenshot diff                                                                             |

## Risks & unknowns

- **Drawer + RSC composition.** `AppShell` is server; the drawer needs client state. Resolved by a thin `AppFrame` client wrapper that receives `children`/`userSlot` as already-rendered nodes — no business logic leaves the server.
- **Regression on desktop.** Every responsive class is additive at `< md`; desktop (`md:`) keeps current values. The desktop e2e suite is the guard.
- **PWA icon generation.** No binary PNG tooling — use a hand-authored maskable `icon.svg` (manifest, Android install) + `next/og` `ImageResponse` for the iOS apple-touch PNG. Both render the existing `LogoMark`.
- **Horizontal overflow is sneaky.** Long unbroken strings (env-var keys, share URLs, file names) — audit for `break-all`/`truncate`/`min-w-0`; the e2e scrollWidth assertion catches the rest.

## Overlap check

No other spec is `active` (008-roles not yet started). This is presentation-only and touches the same component files roles (008) will later add UI to — sequenced before 008 so the new People/roles UI is built on the now-responsive shell. No behavioral conflict.
