# Tasks — Spec 045 (scoping & pricing wizard)

- [x] Design doc (wizard.md): steps, pricing model, ~2000-block catalog, build plan
- [x] Step: ECOSYSTEM (decided — web/mobile/desktop multi-select; built in the wizard step later)
- [x] Step: PROJECT TYPES — project_types table (migration 0052) + ~106 seeded types across 15 groups
- [x] pricing slice: ProjectType type, listProjectTypes, create/update/delete actions (leadership-gated)
- [x] ProjectTypesManager (grouped chips, toggle active, add/delete custom) + PricingTabs; /pricing/types page
- [ ] NEXT: catalog v2 (block_type, options nested under features, essentials-free, screens, platform tags)
- [ ] NEXT: the wizard UI (ecosystem → type → screens → features → review), exports (quote + cahier des charges)
