# Spec 018 — Client dossier (team-only)

- **Status:** shipped
- **Type:** feature
- **Requested by / owner:** Achref Arabi, founder
- **Date:** 2026-06-24
- **Slice / areas touched:** new `src/features/client-dossier`; a panel on the project detail page; migration (`client_dossiers` table + RLS). Feature ④ of the epic — see [PRD](../../docs/product/prd-client-onboarding.md). Builds on 008 (roles).

## Problem (the why)

Whoever picks up a project needs to know who the client is and how to handle them — are they technical or not, calm or anxious, hands-on or hands-off. Today that lives in people's heads and Slack DMs. We want one team-only place per project to record it, so communication is consistent and nobody re-learns the client cold. This is sensitive and must never reach the client.

## Desired behavior (the what)

On a project, the team sees a **Client** panel (team-only) holding the client's details: contact name, email, phone, company, and role; the **client type** (e.g. technical / non-technical / business); an **IT-savviness** read (a 1–5 scale); a short **temperament** note (how they communicate / their state); and freeform **notes**. Any member with access to the project can read and edit it. It is plain text the team maintains — there is no client-facing surface for it anywhere.

## Acceptance criteria

- **AC-1 (record & edit):** A team member on the project can fill and save the dossier fields (contact details, client type, IT-savviness 1–5, temperament, notes); reopening shows the saved values.
- **AC-2 (per project):** Each project has its own single dossier; editing one project's dossier never affects another's.
- **AC-3 (team-only — non-happy):** The dossier is readable/editable only by members with access to that project; a member with no access to the project cannot read or write it (enforced at the database), and it appears on no client-facing surface (not the portal, not the setup page).
- **AC-4 (validation — non-happy):** Saving an out-of-range IT-savviness (not 1–5) or a malformed email is rejected with a clear message and nothing is written.

## Out of scope

- A CRM / pipeline, deal stages, or cross-project client records (one dossier per project).
- Surfacing any of this to the client (it's internal only).
- File attachments or structured contact lists (single primary contact for v1).
- Audit history of edits (just the current values + who last updated).

## CUJ impact

- Extends the project CUJs — a new team-only panel on the project page. No new standalone CUJ; covered by unit + the project-page e2e.

## Open questions

Resolved in planning (2026-06-24): read + write are open to any member with access to the project (the whole project team), since it's shared context; it is never exposed on a client surface. IT-savviness is a 1–5 scale; client type is free text (a small suggested set in the UI).
