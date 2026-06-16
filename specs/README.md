# Specs — spec-driven development

Specs are the contract between intent (PM/design) and implementation (agents/devs) for **feature-track** work. They are deliberately lean — one page per artifact — because a spec nobody reviews honestly is process theater (Constitution, Art. II).

## Lifecycle

```
/create-spec  → specs/NNN-slug/spec.md        status: draft → active
/plan-feature → plan.md + tasks.md            (clarifications resolved first)
/implement-feature                            (tasks tick as they complete)
ship → /update-docs                           status: shipped; learnings distilled
                                              into docs/product/features/<slug>.md
```

- Numbering: `NNN` is the next integer; slug is kebab-case (`001-task-list`). Branch name matches: `feat/001-task-list`.
- One active spec per slice at a time — `/plan-feature` flags overlaps ("areas touched") across active specs before any code exists.
- Shipped specs stay in place (history is useful) but the **living truth** moves to `docs/product/features/`. A spec older than its feature doc is expected; never "fix" old specs.
- Experiments use the same flow with `Type: experiment` and learning-goal acceptance criteria (see `docs/process/painted-door.md`).

## Artifacts (templates in [TEMPLATE/](TEMPLATE/))

| File       | Owner        | Answers                                                    |
| ---------- | ------------ | ---------------------------------------------------------- |
| `spec.md`  | PM/requester | What, for whom, why now, acceptance criteria, out of scope |
| `plan.md`  | Dev/agent    | How: design, layer placement, risks, AC→test mapping       |
| `tasks.md` | Dev/agent    | Ordered checkboxed steps an agent can execute and tick     |

## Index

| #                                         | Spec                        | Status    |
| ----------------------------------------- | --------------------------- | --------- |
| [001](001-task-list/spec.md)              | Task list demo feature      | abandoned |
| [002](002-auth-and-projects/spec.md)      | Sign-in & project registry  | shipped   |
| [003](003-secure-env-vars/spec.md)        | Secure env vars per project | shipped   |
| [004](004-documents/spec.md)              | Documents per project       | shipped   |
| [005](005-settings/spec.md)               | Settings — language & theme | shipped   |
| [006](006-client-portal/spec.md)          | Client portal               | shipped   |
| [007](007-mobile-responsive-pwa/spec.md)  | Mobile responsive + PWA     | shipped   |
| [008](008-roles-permissions/spec.md)      | Roles & permissions         | shipped   |
| [009](009-env-import-export/spec.md)      | Env import/export & scope   | active    |
| [010](010-pm-login-superadmin/spec.md)    | PM login & superadmin       | active    |
| [011](011-org-members/spec.md)            | Org members, lead & GitHub  | active    |
| [012](012-github-member-profiles/spec.md) | GitHub profiles & sign-in   | shipped   |
| [013](013-time-tracking/spec.md)          | Work time tracking          | active    |
