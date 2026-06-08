---
name: design-prompt
description: Generate the Claude Design prompt as a clean, copy-paste .md from the filled project context (PRD, intake, brand). Use as /progix step 7, or when the user says "design prompt", "prompt for Claude Design", or is about to start the UI/UX pass. The prompt contains NO code — design only; coding stays in Claude Code.
argument-hint: [project name]
allowed-tools: Read Write Glob Grep AskUserQuestion WebSearch
---

## Task

Write `docs/design/<project>-design-prompt.md` for **$ARGUMENTS**, ready to paste straight into Claude Design.

1. **Source the context:** `docs/product/prd.md`, `docs/product/overview.md`, the intake answers, brand/logo notes. The design prompt is a brief, not a spec — it describes the experience to design, never how to build it.
2. **Research the moving parts (2026).** If the project names fast-changing tech that affects UX or feasibility (Expo SDK capabilities, platform UI conventions, new component patterns), do a quick `WebSearch` pass so the brief is current — this is the rule that prevents compatibility surprises later in the frontend prompt.
3. **Fill the template** `docs/templates/claude-design-prompt.md`: product · users & primary journeys · surfaces to design (mobile/landing/admin + key screens) · visual direction (personality, brand, references) · expected result & quality bar (real states: empty/loading/error/success) · out of scope.
4. **Cue the visual references.** The prompt should explicitly expect attached images from Pinterest / Behance / Dribbble, with a line per reference on what to borrow (the visual, not the function). Remind the user to attach them when pasting.
5. **No code rule (hard):** if you catch yourself writing component names, props, or snippets, stop — that belongs to Claude Code. The output is pure design intent.
6. **Output hygiene:** clean Markdown, copy-paste-able as a single block, no repo-internal jargon. End with the reminder: paste into Claude Design, attach references, export the result as a ZIP back to Cowork for `/progix` step-4 handoff to Claude Code.
