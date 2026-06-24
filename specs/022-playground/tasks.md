# Tasks 022 — Project planning playground

- [x] T1 Migration `0028_plan_items.sql`: `plan_items` (type/title/status/assignee/estimate/parent/pos/board_order/body/color) + RLS members rw, no anon
- [x] T2 Slice: types, data (listPlanItems), actions (create/update/move/delete), store/provider (items, selection, lens)
- [x] T3 Full-screen route `/projects/[id]/playground` (team-gated) + Exit; entry button on project page
- [x] T4 Canvas lens: pan/zoom, cards (task/note) + phase frames, drag-move (persist), select, add, phase progress, focus
- [x] T5 Inspector (edit title/status/assignee/estimate/body/delete) + glass floating toolbar + lens toggle
- [x] T6 Board lens: status columns, drag card to change status
- [ ] T7 Copy EN/FR; `pnpm` gates green (build on CI)
- [x] T8 `/review` appsec (RLS members-only, no anon, action authz); fix P0/P1
- [x] T9 PR; CI; merge; deploy; `/update-docs` (spec shipped + CUJ)
