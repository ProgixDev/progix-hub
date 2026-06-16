# Spec 010 — PM email/password login + superadmin above roles

- **Status:** active
- **Type:** feature
- **Requested by / owner:** Achref Arabi, founder
- **Date:** 2026-06-16
- **Slice / areas touched:** `src/features/auth`, new `src/features/team`; routes `/sign-in`, `/settings`; migration `0010`. Extends spec 008 (roles).

## Problem (the why)

Today the only way into progixHub is GitHub OAuth, gated on org membership. But not everyone we want in the tool has (or should use) a GitHub identity — a PM, a contractor — and we don't want public sign-up. We need superadmin-created email/password accounts, and we need superadmins to sit clearly above per-project roles: a superadmin is not a PM of every project, isn't listed on rosters, and can't be added to one.

## Desired behavior (the what)

On the sign-in screen, below the existing GitHub button and an "or" divider, a member can sign in with email and password. On success they land on the home page fully signed in.

A superadmin (and only a superadmin) sees a "create account" card in Settings: they enter a name, email, and password, and an account is created that can sign in immediately as an org member. The password is never shown back or logged.

Superadmins are above per-project roles: creating a project does not make a superadmin its PM; superadmins are removed from any roster they were on; and a PM can't add a superadmin to a project. The membership sign-in gate is unchanged.

## Acceptance criteria

- **AC-1 (email sign-in):** Given a member account, when they enter the right email + password on the sign-in screen, then they are signed in and taken to the home page; a wrong password shows a clear error.
- **AC-2 (superadmin-only creation — permission):** Given the Settings page, when the viewer is a superadmin they see the create-account card; a non-superadmin member does not.
- **AC-3 (create account):** Given a superadmin, when they submit a valid name/email/password, then an org member account is created (email confirmed, `is_member` true) and can sign in; the password is never returned or logged.
- **AC-4 (no superadmin auto-PM):** Given a superadmin, when they create a project, then they are not added to it as PM (it may have zero PMs).
- **AC-5 (superadmin off rosters):** Superadmins are not present in any project roster, and a PM adding a superadmin by email is rejected with a clear message.
- **AC-6 (gate unchanged — non-happy):** A signed-out visitor still can't reach any gated page; the `is_member` middleware gate is unchanged, and account creation is refused for a non-superadmin before any admin call.

## Out of scope

- Password reset / forgot-password flows, email verification emails (accounts are created already-confirmed).
- Self-service sign-up.
- Changing the GitHub OAuth path or the membership gate.

## CUJ impact

- Extends the sign-in journey (CUJ-01) with an email/password path; superadmin account creation is a Settings affordance.

## Open questions

Resolved: accounts are superadmin-created (no public sign-up); superadmins are above per-project roles (not auto-PM'd, removed from rosters, not addable); the `is_member` gate is unchanged.
