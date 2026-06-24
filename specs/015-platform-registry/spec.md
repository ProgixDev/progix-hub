# Spec 015 — Platform registry (org-wide)

- **Status:** draft
- **Type:** feature
- **Requested by / owner:** Achref Arabi, founder
- **Date:** 2026-06-24
- **Slice / areas touched:** new `src/features/platforms`; a "Platforms" area under Settings (route `/settings/platforms`); migration (org-wide `platforms` table + RLS); reuses spec-003 service glyphs. Foundation for the client-onboarding epic — see [PRD](../../docs/product/prd-client-onboarding.md). Builds on specs 005 (settings), 014 (roles).

## Problem (the why)

Every client project needs the client to set up the same handful of platforms (Stripe, Vercel, Supabase, a domain, email…) and grant Progix access. The how-to is identical across projects, but it lives in people's heads and gets re-explained each time. Before we can build a client-facing onboarding flow (epic feature ③), we need one place to describe each platform once: what it is, how the client gives us access, and the steps to follow. This spec builds that catalog — the reusable source the onboarding page will compose from. On its own it has no client-facing surface; it's the team's configuration.

## Desired behavior (the what)

In Settings, an authorized team member opens **Platforms** and sees the org's catalog of configured platforms. They can **add a platform**: give it a name, pick a recognizable logo, mark whether it's **critical** (sensitive — access is granted by invitation, never by sharing credentials), write the **ordered steps** a client follows, optionally attach a **tutorial video link**, and choose exactly one **access pattern**:

- **Invite us as a collaborator** — for critical platforms: capture the link to the client's invite/team settings, the role the client should grant, and the team email to invite. (The onboarding page will later turn this into a one-click "invite this email" action.)
- **Store a key with us** — the client will later paste a value (e.g. an API key) into the project's secured env-vars store; here we just capture the label/name of the value expected.
- **Do it yourself** — steps (and the optional video) only; no access is exchanged.

They can **edit** any platform, **disable** one (keeps it configured but hides it from new onboarding pages), or **delete** one that isn't in use. **Superadmins and global PMs** can add/edit/disable/delete; every other signed-in member can **view** the catalog but not change it. The area is bilingual (EN/FR) like the rest of Settings.

## Acceptance criteria

- **AC-1 (configure a platform):** An authorized member can add a platform with a name, logo, critical flag, ordered steps, optional video link, and one access pattern with that pattern's fields filled; it then appears in the catalog and persists.
- **AC-2 (access-pattern fields):** Choosing "invite us as a collaborator" requires the invite-settings link, the role, and the team email; "store a key" requires the value label; "do it yourself" requires none of those. Each platform has exactly one access pattern.
- **AC-3 (edit / disable / delete):** An authorized member can edit any field, disable a platform (it stays in the catalog, flagged disabled), and delete a platform; a disabled platform is excluded from the set offered to future onboarding pages.
- **AC-4 (view vs edit permission — non-happy):** A signed-in member who is not a superadmin or global PM can open and read the catalog but cannot add/edit/disable/delete; the change is refused server-side (RLS / action guard), not merely hidden in the UI.
- **AC-5 (validation — non-happy):** Saving with a missing required field for the chosen access pattern (e.g. invite-collaborator with no invite link) or a malformed video/invite URL is rejected with a clear, per-field message and nothing is written.

## Out of scope

- The Tutorials library itself (feature ②) — here a video is just an optional URL reference.
- The per-project client onboarding / Setup page (feature ③) and the client dossier (feature ④).
- Any automated calls to the platforms' APIs (no programmatic provisioning or invites — the registry only describes the manual flow).
- Per-project overrides of a platform's config (the registry is org-wide; per-project selection happens in feature ③).
- Storing actual client keys/credentials here (keys live in the existing per-project encrypted env-vars store).

## CUJ impact

- Registers a new CUJ — **Configure a platform:** open Settings → Platforms → add a platform with an access pattern + steps → edit/disable it; a non-admin sees it read-only. (Add to `docs/product/critical-user-journeys.md` at ship.)

## Open questions

Resolved in planning (2026-06-24): **delete** is a hard delete and **disable** is a separate flag; both are available in v1 (no onboarding pages reference platforms yet — feature ③ will add a referential guard when it lands). **Logo** is chosen from the fixed spec-003 service set (Stripe, Vercel, Supabase, GitHub, …) with a neutral lettered fallback for anything outside it; a custom icon upload is out of scope for v1.
