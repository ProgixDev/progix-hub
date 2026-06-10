# Critical User Journeys (CUJs)

The journeys that must never break. Each CUJ has: an owner, an e2e spec in `e2e/`, and labeled screenshots captured by `pnpm e2e:shots`. CI runs all of them on every PR; `/verify-ui` re-runs the ones a change touches.

Adding or changing a CUJ is a product decision — PR must be approved by the product owner.

## Registry

| ID     | Journey          | Steps (user's words)                                                                                                                | E2E spec                | Screenshots                |
| ------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | -------------------------- |
| CUJ-01 | Land and orient  | Open `/` → see the projects portfolio in the app shell → read each project’s status at a glance                                     | `e2e/home.spec.ts`      | `home-*`                   |
| CUJ-02 | Create a project | Sign in → New project → fill name + links → see it in the portfolio → open it → archive it                                          | `e2e/projects.spec.ts`  | `portfolio-*`, `project-*` |
| CUJ-03 | Manage env vars  | Open a project → add a variable (logo auto-fills) → reveal → copy → edit → delete; the audit trail records it and survives deletion | `e2e/env-vars.spec.ts`  | `env-*`                    |
| CUJ-04 | Manage documents | Open a project → Documents → upload a file → add a link → write a note → switch tabs → edit → archive → restore                     | `e2e/documents.spec.ts` | `doc-*`                    |

## Rules

- A new feature with user-visible surface MUST either extend an existing CUJ or register a new one in this table (the `/create-spec` template asks).
- Each step in a journey asserts something the _user_ can see (text, role, state) — not implementation details.
- Screenshot names are stable (`<cuj>-<step>`), so reports and reviews can diff them release over release.
- When a CUJ changes intentionally, update the spec, this table, and the screenshots in the same PR — `/update-docs` walks you through it.
