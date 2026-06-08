# Documentation Index

The docs tree is the repository's long-term memory. Agents and humans ground their work here. Every file is intentionally short; if a file grows past ~200 lines, split it.

## Architecture

| File                                                                   | What it answers                                              |
| ---------------------------------------------------------------------- | ------------------------------------------------------------ |
| [architecture/overview.md](architecture/overview.md)                   | What the system is, rendering model, data flow               |
| [architecture/module-boundaries.md](architecture/module-boundaries.md) | Where code may live and what it may import (ESLint-enforced) |
| [architecture/decisions/](architecture/decisions/README.md)            | ADRs — why the stack and structure are what they are         |

## Conventions (how we write code)

| File                                                   | Scope                                            |
| ------------------------------------------------------ | ------------------------------------------------ |
| [conventions/typescript.md](conventions/typescript.md) | Types, strictness, naming                        |
| [conventions/react.md](conventions/react.md)           | Components, RSC vs client, props, files          |
| [conventions/styling.md](conventions/styling.md)       | Tailwind v4, design tokens, shadcn/ui            |
| [conventions/state.md](conventions/state.md)           | Zustand patterns, server vs client state         |
| [conventions/motion.md](conventions/motion.md)         | Animation with Motion, reduced-motion            |
| [conventions/testing.md](conventions/testing.md)       | Unit (Vitest) and E2E (Playwright) strategy      |
| [conventions/git.md](conventions/git.md)               | Branching, conventional commits, PR rules        |
| [conventions/copy.md](conventions/copy.md)             | User-facing text: typography, tone (CI-enforced) |

## Process (how the team works)

| File                                                           | What it answers                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------- |
| [process/workflow.md](process/workflow.md)                     | Roles, the two work tracks, conflict-free collaboration             |
| [process/notion-workspace.md](process/notion-workspace.md)     | The four surfaces, the Notion project structure, the human PM page  |
| [process/r2r.md](process/r2r.md)                               | Requirement-to-Review — the meeting → diff → grill → spec loop      |
| [process/definition-of-done.md](process/definition-of-done.md) | The checklist that gates every merge                                |
| [process/painted-door.md](process/painted-door.md)             | How designers/PMs ship UI experiments safely                        |
| [process/kickoff-prompt.md](process/kickoff-prompt.md)         | The first prompt to send in a fresh clone, before the project brief |

## Templates (artifacts skills instantiate)

| File                                                                         | Filled by                                     |
| ---------------------------------------------------------------------------- | --------------------------------------------- |
| [templates/](templates/README.md)                                            | Index of all project artifacts                |
| [templates/notion-project-template.md](templates/notion-project-template.md) | `/progix`                                     |
| [templates/pm-page.md](templates/pm-page.md)                                 | `/progix`, `/daily-report`, `/meeting-intake` |
| [templates/prd.md](templates/prd.md)                                         | `/write-prd`                                  |
| [templates/claude-design-prompt.md](templates/claude-design-prompt.md)       | `/design-prompt`                              |
| [templates/daily-report.md](templates/daily-report.md)                       | `/daily-report`                               |
| [templates/meeting-notes.md](templates/meeting-notes.md)                     | `/meeting-intake`                             |

## Product (what we are building)

| File                                                                   | What it answers                                      |
| ---------------------------------------------------------------------- | ---------------------------------------------------- |
| [product/overview.md](product/overview.md)                             | Product identity — fill in when cloning the skeleton |
| [product/critical-user-journeys.md](product/critical-user-journeys.md) | The CUJs that must never break; screenshot targets   |
| [product/features/](product/features/README.md)                        | Living docs, one per shipped feature                 |

## Review personas

[personas/](personas/) — the lenses used by `/review` and CI: [frontend-architect](personas/frontend-architect.md), [appsec-engineer](personas/appsec-engineer.md), [qa-engineer](personas/qa-engineer.md), [ux-reviewer](personas/ux-reviewer.md), [product-reviewer](personas/product-reviewer.md).

## Generated

- [reports/](reports/README.md) — feature reports produced by `/feature-report` (diff + screenshots + spec)
- [references/](references/README.md) — vendored `llms.txt` docs for key dependencies

## Related (outside docs/)

- [/AGENTS.md](../AGENTS.md) — agent operating model · [/specs/constitution.md](../specs/constitution.md) — engineering principles · [/specs/](../specs/README.md) — feature specs (SDD)
