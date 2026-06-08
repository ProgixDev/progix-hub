# Spec 002 — Sign-in & project registry

- **Status:** draft
- **Type:** feature
- **Requested by / owner:** Progix team
- **Date:** 2026-06-08
- **Slice / areas touched:** `src/features/auth`, `src/features/projects`, routes `/` (protected portfolio), `/sign-in`, `/projects/[id]` (header only), app-wide auth gate (middleware), `src/core` (Supabase env)

## Problem (the why)

progixHub today is a painted-door portfolio with hard-coded projects and no sign-in — anyone reaching the URL sees fake data, and no project can actually be created or stored. To become the real home base, the team needs to sign in (only Progix people) and create real projects that persist, each carrying its four surface links. This is the foundation every other feature (env vars, documents, feedback) hangs off, so it goes first.

## Desired behavior (the what)

**Signing in.** A visitor who is not signed in only ever sees a sign-in screen, regardless of which URL they open. They can sign in two ways: “Continue with GitHub”, or “Email me a magic link” and click the link in their inbox. Only members of the **DigitariaWebs** GitHub organization may enter; anyone who authenticates but isn’t an org member is signed out and told they don’t have access. Once signed in, they land on the projects portfolio and stay signed in across visits until they sign out.

**Seeing projects.** A signed-in member sees the portfolio of real projects (replacing the placeholder data) — each as a card with its name, status, description, and the surface links that are set. When there are no projects yet, they see a designed empty state inviting them to create the first one. They can filter by status (All / Active / At risk / Archived).

**Creating a project.** From “New project”, a member enters a name (required), an optional description, a status (defaults to Active), and optionally pastes up to four links — Notion, Slack, GitHub, and Live (deployed site). Each link, if filled, must be a valid URL; a link left blank is fine and shows as an empty/“add” slot. On save, the project appears in the portfolio immediately and persists.

**Editing & archiving.** A member can edit any project’s name, description, status, and links. Setting status to Archived moves it to the Archived filter; there is no permanent delete in this spec. Archiving is reversible (set status back).

**Project header.** Opening a project shows its header: name, status, description, and the four links as shortcuts that open in a new tab (an unset link shows as an empty slot). The env-vars / documents / feedback tabs are out of scope here.

## Acceptance criteria

- **AC-1:** Given a signed-out visitor, when they open any app URL, then they see only the sign-in screen and cannot reach the portfolio or any project.
- **AC-2:** Given a person who authenticates (GitHub or magic link) but is **not** a DigitariaWebs org member, when sign-in completes, then they are signed out and shown an “access denied / not a Progix member” message — no project data is exposed.
- **AC-3:** Given a signed-in member on an empty account, when they view the portfolio, then they see the empty state; when they create a project with a name, then it appears in the portfolio and is still there after a reload.
- **AC-4:** Given the create form, when the name is blank, then save is blocked with a clear message; when any filled link is not a valid URL, then that field shows a validation error and the project is not saved.
- **AC-5:** Given an existing project, when a member edits its fields and saves, then the changes persist; when status is set to Archived, then it leaves the Active list and appears under the Archived filter.
- **AC-6:** Given a project with only some links set, when viewing its card and header, then set links render as working shortcuts (open in a new tab) and unset links render as empty “add” slots — never as broken links.

## Out of scope

- Environment variables, documents, and the client feedback page (their own specs).
- Project members / owners / roles and the avatar stacks (flat access: any signed-in member can do everything).
- The ⌘K command menu behavior, global search, and Settings.
- Permanent project deletion (archive only).
- Live syncing of the linked surfaces (links are stored URLs, not synced).
- Internationalization of this feature’s copy beyond what the shared i18n setup provides.

## CUJ impact

- **Extends CUJ-01** (Land and orient): the portfolio is now behind sign-in and shows real projects — the e2e must authenticate (or use a seeded test session) before asserting the portfolio.
- **Registers CUJ-02** (Create a project): sign in → New project → fill name + links → see it in the portfolio. Update `docs/product/critical-user-journeys.md` at ship.

## Open questions

Resolved before `/plan-feature` proceeds (it will interview you). Delete when empty.

- [ ] Magic-link sign-ins also need the DigitariaWebs-membership check — confirm how a magic-link user’s GitHub org membership is established (link GitHub identity, or maintain an allowlist synced from the org). Plan-feature decides the mechanism.
- [ ] e2e auth strategy: real OAuth is not testable in CI — confirm a seeded/test-session approach for CUJ-01/02.
