# Tasks — Spec 026 Draw mode

- [x] Migration 0036: plan_drawings (members RLS)
- [x] types/data/actions: PlanStroke, listStrokes, createStrokeAction (zod-capped), clearStrokesAction
- [x] store: strokes + addStroke (dedupe) + clearStrokes; provider/page thread strokes
- [x] presence: broadcast/receive stroke + clearstrokes
- [x] canvas: draw gesture (min-distance throttle), render strokes + live temp path, layer pass-through
- [x] playground: Draw toggle + colour palette + Clear/Done toolbar
- [x] Verify 2-user: draw syncs live, clear syncs live
- [ ] appsec + ship
