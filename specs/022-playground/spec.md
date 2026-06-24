# Spec 022 — Project planning playground

- **Status:** shipped
- **Type:** feature
- **Owner:** Achref Arabi, founder · **Date:** 2026-06-24
- **Slice:** new `src/features/playground`; a full-screen route `/projects/[id]/playground`; an entry button on the project page; migration (`plan_items`).

## Problem (the why)

A project lives in progixHub, and the work gets tracked — but there's no space to **plan** it: break down scope, lay out phases, see who owns what. The team needs a fast, visual, full-screen workspace per project.

## Desired behavior (the what)

From a project, the team opens a **full-screen Playground** (app chrome hidden). It holds one plan as two **lenses over the same items**:

- **Canvas** — an infinite, pan/zoom space with **cards** (tasks, notes) and **phase frames**. Drag cards anywhere; a card dropped in a phase frame belongs to it. Select a card → a right **inspector** edits its details. A phase frame shows a **progress bar** (its done tasks). Double-click a phase to **focus** (zoom in, dim the rest).
- **Board** — the same tasks as **status columns** (Backlog · In progress · In review · Done); drag a card between columns to change its status — reflected everywhere.

A card carries: title, status, assignee (a project member), estimate (hours), optional note body. Team-only, per-project. Switching lens is instant; nothing leaves the playground.

## Acceptance criteria

- **AC-1 (canvas):** A member can add task/note cards and phase frames on the canvas, drag to reposition (persisted), select a card and edit it in the inspector, and delete it.
- **AC-2 (board):** The same tasks appear as status columns; dragging a card to another column changes its status, reflected in the canvas/inspector.
- **AC-3 (phases):** A task placed in a phase frame belongs to that phase; the frame shows a progress bar of its done tasks.
- **AC-4 (access — non-happy):** Only members with access to the project can open the playground or read/write its items (RLS); no anon path; a removed member can't reach it.
- **AC-5 (full-screen):** The playground is a focused full-screen surface (chrome hidden) reachable from the project; Escape/Exit returns to the project.

## Out of scope (designed-for, later)

- Dependency arrows, lasso→make-phase, snapshots/branches, multiplayer/presence, the clocked-in glow, timeline lens, client-facing publish, milestones, quick-capture, touch/mobile canvas (board is responsive; canvas is desktop-first).

## CUJ impact

- New CUJ — "Plan a project in the playground" (open → add phases/tasks on the canvas → move on the board).

## Open questions

Resolved: statuses = Backlog/In progress/In review/Done; v1 has phases (frames) not milestones; one `plan_items` table renders both lenses; RLS to project members (all roles), no anon; lightweight custom canvas (no heavy dep).
