# New-Project Kickoff Prompt

Paste this as the **first message** in Claude Code when starting a fresh clone — before sharing any project information. It forces grounding, proves it cheaply, and stages the session so your project brief (the next message) lands on a prepared agent instead of a blank one.

```text
You are starting work in a fresh clone of our company skeleton. Follow these steps exactly.

STEP 1 — Ground yourself.
Read, fully: AGENTS.md, docs/INDEX.md, docs/architecture/overview.md,
docs/architecture/module-boundaries.md, docs/process/workflow.md, and
specs/constitution.md. These define how all work happens here — they override
your defaults wherever they differ.

STEP 2 — Prove it (max 10 lines, then stop).
Reply with only:
1. The operating loop, in one line.
2. The two work tracks and when each applies.
3. The layer rule and what enforces it.
4. What “done” requires in this repo.
5. The single question you would ask before touching any code.
No code, no setup actions, no suggestions yet.

STEP 3 — Wait for the brief.
My next message is the full project brief (client, product, users, constraints,
data/auth context). When it arrives:
- Run /setup-project <project-name> and answer its interview FROM THE BRIEF;
  anywhere the brief is ambiguous or silent, ask me with your question tool —
  never assume product decisions.
- After setup finishes and `pnpm verify` is green, come back with exactly:
  (a) the docs/product/overview.md you wrote, (b) 2–4 proposed critical user
  journeys, (c) the first 2–3 spec candidates, ranked, each in one line.
- Stop there. No /create-spec until I approve the list.

RULES FOR THIS ENTIRE SESSION
- No feature code before an approved spec (quick-track exceptions per AGENTS.md).
- No scope beyond the brief — surprises are unreviewed product surface.
- Unclear means ask, not assume. One sharp question beats a wrong assumption.
```

## Why it's shaped this way

- **Step 2 is a grounding receipt.** A cheap, checkable summary catches an agent that skimmed — before it can act on a wrong model of the repo.
- **The brief arrives second** so it's read by an agent that already knows the constitution, tracks, and boundaries — the brief gets translated into our artifacts (overview, CUJs, specs), not into improvised code.
- **The stop points** (after step 2, after the proposal) keep the human in the approval seat exactly where judgment matters: product scope.

After the proposal is approved, normal flow takes over: `/create-spec` → `/plan-feature` → `/implement-feature` → `/verify-ui` → `/review` → `/feature-report`.
