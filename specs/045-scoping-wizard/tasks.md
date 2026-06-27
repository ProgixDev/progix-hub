# Tasks — Spec 045 (scoping & pricing wizard)

- [x] Design doc (wizard.md): steps, pricing model, ~2000-block catalog, build plan
- [x] Step: ECOSYSTEM (decided — web/mobile/desktop multi-select; built in the wizard step later)
- [x] Step: PROJECT TYPES — project_types table (migration 0052) + ~106 seeded types across 15 groups
- [x] pricing slice: ProjectType type, listProjectTypes, create/update/delete actions (leadership-gated)
- [x] ProjectTypesManager (grouped chips, toggle active, add/delete custom) + PricingTabs; /pricing/types page
- [ ] NEXT: catalog v2 (block_type, options nested under features, essentials-free, screens, platform tags)
- [ ] NEXT: the wizard UI (ecosystem → type → screens → features → review), exports (quote + cahier des charges)

## Catalog v2 (shipped — spec 045)

- [x] Migration 0053: block_type, parent_id (options), is_free, platforms[]
- [x] types/data/actions: v2 fields + create/update accept them
- [x] PricingCatalog rebuilt for scale: collapsed categories + search + nested options + free toggle + block-type select
- [x] Verified: collapse, expand, nested option, search filter
- [ ] NEXT: CSV import/export (bulk-load 2000+ blocks) → then the wizard UI

## CSV import/export (shipped — spec 045)

- [x] csv.ts: parseCsv (RFC4180-ish) + toCsv
- [x] pricingCatalogCsv data fn + /api/pricing/export route (leadership 403-gated)
- [x] importPricingCsvAction: parse, validate (zod, caps 5MB/5000 rows), 2-pass upsert by key (synthetic keys for keyless → idempotent), options resolve parent by name
- [x] Export/Import CSV buttons + result notice; fixed stale-local-state on refresh (PricingCatalog + ProjectTypesManager)
- [x] Verified round-trip: export 140 rows; import "3 added, 1 updated", nested option resolved, rows display
- [ ] NEXT: the wizard UI (ecosystem → type → screens → features → review → quote + cahier des charges)

## The wizard UI — core (shipped — spec 045)

- [x] Migration 0054: estimates table (selections jsonb snapshot, totals, status; leadership RLS)
- [x] calc.ts (pure shared math: platform factor, buffer, target band $10-20k, effort→weeks)
- [x] data: listEstimates, getEstimate; actions: saveEstimateAction (server-recomputes totals), deleteEstimateAction
- [x] EstimateWizard: basics + ecosystem toggles + project-type select + feature picker (collapse/search/nested) + sticky live summary (price, band, timeline, buffer/velocity inputs)
- [x] EstimatesList + Estimates tab; /pricing/estimates, /new, /[id] pages
- [x] Verified: select 3 blocks + mobile → $5,704 (×1.6 platform, 15% buffer), save → list
- [ ] NEXT: exports (quote + cahier des charges w/ scope-control clauses) + accepted estimate → seed project phases/tasks
