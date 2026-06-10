# Spec 007 — Mobile responsiveness + installable PWA

- **Status:** draft
- **Type:** enhancement
- **Requested by / owner:** Achref Arabi (owner)
- **Date:** 2026-06-10
- **Slice / areas touched:** app shell (`src/components/app-shell/*`), every feature slice's components (presentation only), `src/app/layout.tsx` + a web manifest route, global styles; e2e adds a mobile project. **No data-model, action, or RLS changes.**

## Problem (the why)

progixHub was built desktop-first: a fixed 240px sidebar, multi-column rows, and modals sized for wide screens. On a phone the sidebar eats the screen, rows overflow horizontally, and forms are cramped. This matters most for the **client portal** — external clients open a share link on their phone, and a broken first impression reflects on Progix. The app also can't be “installed” to a home screen, so it never feels like an app. We want every screen to work cleanly from ~320px up, and the app to be addable as a home-screen shortcut.

## Desired behavior (the what)

- **Phones are first-class.** From ~320px wide to desktop, every screen is usable with **no horizontal scrolling** and no clipped/overlapping content: text wraps, rows stack, tap targets are finger-sized, and nothing requires a mouse.
- **The app shell adapts.** On a narrow screen the sidebar is hidden behind a menu control (hamburger) that opens it as an overlay/drawer and closes on selection or tap-outside; the top bar and its actions stay reachable. On wide screens the sidebar stays exactly as today.
- **Content reflows, it doesn’t shrink-to-fit.** Env-var rows, document rows, portal blocks/cards, and the audit trail stack their columns vertically on small screens instead of overflowing. Forms and dialogs fill the small viewport (full-width, scrollable) and never push controls off-screen.
- **The client portal is mobile-first.** `/share/[token]` reads and works beautifully on a phone — the project, blocks, cards, comment/attach/propose, and the inactive-link screen all look intentional on a small screen.
- **It installs like an app.** From a mobile browser, “Add to Home Screen” produces a standalone shortcut with the progix icon, name, and brand color — launching it opens the app chrome without the browser UI. (No offline mode required.)
- **Desktop is unchanged.** Nothing about the existing desktop layout regresses.

## Acceptance criteria

- **AC-1 (no overflow):** Given any primary screen (portfolio, project detail with env-vars + documents, settings, member portal, public share page) at a 320–414px viewport, when it renders, then there is no horizontal scroll and no content is clipped or overlapping.
- **AC-2 (mobile nav):** Given a narrow viewport, when a member opens the app, then the sidebar is collapsed behind a visible menu control; opening it shows the nav as an overlay, and choosing a destination (or tapping outside) closes it. On a wide viewport the sidebar is always visible and there is no menu control.
- **AC-3 (rows reflow):** Given the env-vars and documents lists on a narrow viewport, when they render, then each row’s controls and metadata stack/wrap to fit width — no horizontal scrollbar — while staying fully functional (reveal/copy/edit/delete, download/edit/archive).
- **AC-4 (forms & dialogs fit):** Given any add/edit dialog (project, env var, document, portal card, share/propose forms) on a narrow viewport, when it opens, then it fits within the screen, is vertically scrollable if tall, and all inputs and the submit/cancel actions are reachable.
- **AC-5 (client portal on a phone):** Given a client opening `/share/[token]` on a 320–414px viewport, then the portal is clean and fully usable — read cards, comment, attach a file, and propose — with no layout breakage.
- **AC-6 (installable):** Given a mobile browser, when the user views the site, then a valid web manifest is served (name, icons ≥192px & 512px, `display: standalone`, `theme_color`, `start_url`) and the apple-touch-icon + theme-color metas are present, so “Add to Home Screen” yields a standalone, branded shortcut.
- **AC-7 (desktop unchanged — non-happy/regression):** Given the existing desktop viewport (≥1024px), when each screen renders, then the layout matches today’s (sidebar visible, multi-column rows) with no visual regression.

## Out of scope

- **Offline support / service worker / caching / push notifications** — installability via the manifest only.
- **A separate mobile design language or app** — same components, responsive; not a rebuilt mobile UI.
- **Native app store packaging** (Capacitor/TWA) — a browser-installable PWA only.
- **Roles/permissions** and any behavior, data, action, or RLS change — those are spec 008 and unrelated.
- **New features or copy** — purely making existing screens responsive + installable (new strings, if any, limited to a mobile menu label, shipped EN+FR).

## CUJ impact

- No new CUJ. The existing CUJs must pass **at a mobile viewport** too — add a mobile Playwright project that re-runs (a subset of) the CUJs on a phone descriptor and captures `*-mobile` screenshots. Note in `docs/product/critical-user-journeys.md` that CUJs are verified at desktop and mobile widths.

## Open questions

_None blocking — baked in per the owner’s autonomy grant: breakpoint at Tailwind’s `md` (768px); sidebar becomes a hamburger drawer on `< md`; manifest-only PWA (no service worker); verify with Playwright iPhone + Pixel descriptors. Deferred for later: offline/service-worker, push notifications, native packaging._
