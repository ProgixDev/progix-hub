---
paths:
  - "docs/templates/**"
  - "docs/product/prd.md"
  - "docs/reports/daily/**"
---

# Human-facing artifacts (digest — full rules: docs/process/notion-workspace.md, docs/process/r2r.md)

- These are read by the PM, Ilyes, and the client — write plain language, short, dated, honest. No code, no repo jargon.
- Four-surface rule: the PRD and PM page have their human original in **Notion**; what's here is the repo mirror agents read. Don't let the mirror become a second source of truth — `/update-docs`, `/meeting-intake`, and `/daily-report` keep them in sync.
- The PM page narrates the project (problem → status → decisions → risks → next). If a line only an engineer would understand, it belongs in Technical Notes, not the PM page.
- Daily reports translate GitHub activity into outcomes, not commit hashes; be honest about milestone risk.
