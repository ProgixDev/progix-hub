# progixHub

The internal hub for every Progix project. Create a project, link its Notion page, Slack channel, and GitHub repo, and keep its environment variables (secured) and documents in one place — it’s to Progix projects what GitHub is to repos. Built on the company skeleton: **AI agents write most of the code, the repository itself guarantees the quality.**

> Agents: your entry point is [AGENTS.md](AGENTS.md). Humans: keep reading.

## Stack

Next.js 16 (App Router, RSC) · TypeScript strict · Tailwind CSS v4 + shadcn/ui · Zustand 5 · Motion · Vitest + Testing Library · Playwright · pnpm · ESLint 9 (+ enforced module boundaries) · Prettier · Husky + commitlint.

## Quickstart

```bash
corepack enable                       # or: npm i -g pnpm
pnpm install
pnpm exec playwright install chromium # once, for e2e + PDF rendering
pnpm dev                              # http://localhost:3000
pnpm verify                           # the full local gate (same as CI)
pnpm e2e:shots                        # CUJ tests + screenshot evidence
```

For AI-driven work, open the repo in Claude Code (or any agent that reads `AGENTS.md`) and start with `/create-spec`.

## How work happens here

| You want to…                | Do                                                                                                                           |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Start a new project         | **`/progix`** — one front door: interview → Notion → GitHub → init → design prompt                                           |
| Fix a bug / small change    | branch → implement → `pnpm verify` → PR (quick track)                                                                        |
| Ship a feature              | `/create-spec` → `/plan-feature` → `/implement-feature` → `/verify-ui` → `/review` → `/feature-report` → PR → `/update-docs` |
| Process a meeting (R2R)     | `/meeting-intake` → requirement diff + grill → feeds the tracks                                                              |
| Add a feature module        | `/new-module <name>`                                                                                                         |
| Make a correction permanent | `/encode-lesson`                                                                                                             |

The four surfaces — **Notion explains · GitHub tracks · Slack coordinates · the repo enforces** ([ADR-0005](docs/architecture/decisions/0005-progix-operating-system.md)). Process, roles, and the R2R loop: [docs/process/workflow.md](docs/process/workflow.md) · [docs/process/notion-workspace.md](docs/process/notion-workspace.md) · [docs/process/r2r.md](docs/process/r2r.md).

## Map

```
AGENTS.md            agent operating model (CLAUDE.md imports it)
docs/                the knowledge tree — INDEX.md is the map
specs/               constitution + feature specs (SDD)
.claude/             skills, reviewer subagents, hooks, path rules
src/app|features|components|hooks|lib|core   layered code (ESLint-enforced)
e2e/                 Playwright CUJ tests → artifacts/screenshots evidence
docs/reports/        generated feature reports (diff + screenshots + verdicts)
scripts/             repo gates (docs links, typography) + report-to-PDF
.github/             CI: quality gates, e2e + evidence upload, AI persona review
```

## CI

Three workflows run on every PR: **CI** (lint/types/format/docs/typography/tests/build), **E2E** (Playwright + screenshot artifacts), and **Claude persona review** (AI review board against `docs/personas/` — needs the `ANTHROPIC_API_KEY` secret; set it up with `/install-github-app` from Claude Code). Branch protection on `main` should require the first two.

## Cloning this skeleton for a new project

1. Create the repo from this template (GitHub "Use this template", or `npx degit DigitariaWebs/nextjs-skeleton my-project`).
2. Open it in Claude Code and run **`/progix`** — the one front door. It interviews you, fills the Notion project, creates the GitHub repo under DigitariaWebs, initializes the clone (via `/setup-project`), writes the PRD, and emits the Claude Design prompt. (`/setup-project <name>` still works standalone if you only want the repo init.) First time? Rehearse safely with **`/progix <name> --dry-run`** — it plans everything and creates nothing.
3. Do the two steps only a human can: protect `main` (require CI + E2E) and add the `ANTHROPIC_API_KEY` secret (`/install-github-app`).
4. Write your first spec: `/create-spec`.

## Why it's built this way

Every structural decision has an ADR in [docs/architecture/decisions/](docs/architecture/decisions/README.md). The two-page version: [docs/architecture/overview.md](docs/architecture/overview.md) and the engineering [constitution](specs/constitution.md).
