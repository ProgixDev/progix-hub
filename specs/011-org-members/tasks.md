# Tasks 011 — Org members directory, lead role & GitHub activity

## Phase 0 — setup

- [x] T0 Branch `feat/011-org-members`; migration `0011_org_members.sql`

## Phase 1 — role model (AC-2, AC-4)

- [x] T1 `roles.ts` add read-only `lead`; `session.ts` add `isLead`
- [x] T2 Migration: `is_lead()`, projects read policy, `my_project_role`, creator-as-developer trigger

## Phase 2 — members slice (AC-1, AC-3, AC-5)

- [x] T3 `members/data.ts` (`listOrgMembers`, `getOrgMember`), `members/github.ts` (fetch + pure transform)
- [x] T4 `members/actions.ts` `setMemberLeadAction` (superadmin-gated, admin client)
- [x] T5 `members/components/*` directory + profile + contribution graph; `index.ts`

## Phase 3 — routes + chrome + i18n

- [x] T6 `/members` + `/members/[id]` pages; sidebar `showMembers` link
- [x] T7 i18n `nav.members`, `members.*`, both locales

## Phase 4 — verification

- [x] T8 Unit: roles(lead), github transform, setMemberLead action, directory render
- [x] T9 Offline gates green; appsec review (lead gate + superadmin-only promotion)

## AC coverage

- [x] AC-1 → T3,T5,T6 · [x] AC-2 → T1,T2 · [x] AC-3 → T3,T5 · [x] AC-4 → T2 · [x] AC-5 → T4
