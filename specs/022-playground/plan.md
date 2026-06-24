# Plan 022 — Project planning playground

- **Spec:** [spec.md](spec.md) · Author: Claude (Opus 4.8) · 2026-06-24

## Approach

One `plan_items` table is the spine; Canvas and Board are two renders of the same rows (RLS to
project members). A lightweight custom canvas (CSS transform pan/zoom + absolutely-positioned
cards + pointer-drag) — no heavy dependency. A per-feature zustand store (provider+context) holds
items, selection, lens, and viewport; server actions persist create/update(move,status)/delete.
Full-screen route under `/projects/[id]/playground` renders its own shell (no AppShell chrome).

## Placement

| What  | Where                                                                                   |
| ----- | --------------------------------------------------------------------------------------- |
| DB    | `supabase/migrations/0028_plan_items.sql`                                               |
| Slice | `src/features/playground/{types,data,actions,store,provider,index}.ts` + `components/*` |
| Route | `src/app/projects/[id]/playground/page.tsx` (+ loading/error)                           |
| Entry | button on `ProjectDetail`                                                               |

## AC → verification

- AC-1 canvas add/drag/edit/delete → store + actions; screenshot.
- AC-2 board drag → status update everywhere.
- AC-3 phase frame progress from child task statuses.
- AC-4 RLS `has_project_access`; route gated by `getProjectRole`; no anon.
- AC-5 full-screen shell + Exit.

## Risks

- Canvas pointer math (pan/zoom + drag) — keep transforms simple; desktop-first.
- Disk near-full locally → run gates without build, CI builds.
