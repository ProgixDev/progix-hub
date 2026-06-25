# Tasks — Spec 027 MCP expansion

- [x] Move feature-catalog to src/lib/playground (shared by UI + MCP); ChecklistStep in lib
- [x] tools.ts: mcpUpdateItem, mcpDeleteItem (itemProject access gate), mcpAddFeature, mcpListFeatures; meta in COLS
- [x] route.ts: register update_task, delete_item, add_note, list_features, add_feature
- [x] Verify via real MCP client: 12 tools; add_feature (stripe/twilio into phase) + update + delete + note + get_plan
- [ ] appsec + ship
