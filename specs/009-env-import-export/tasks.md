# Tasks 009 — Env vars: bulk import, scope, and `.env` export

## Phase 0 — setup

- [x] T0 Branch `feat/009-env-import-export`; migration `0009_env_var_scope_and_export.sql`

## Phase 1 — core (AC-1, AC-2)

- [x] T1 `types.ts`: `EnvScope`/`ENV_SCOPES`, `scope` on meta + schemas, import schemas, result types, export scopes
- [x] T2 `lib.ts`: `parseDotenv`, `detectScope`, `scopeFromFilename`, `serializeDotenv` · done: `lib.test.ts` green
- [x] T3 `data.ts`: add `scope` to the select

## Phase 2 — actions (AC-3, AC-4, AC-5, AC-6)

- [x] T4 `actions.ts`: thread `p_scope`; `importEnvVarsAction`; `exportEnvFileAction` · done: `actions.test.ts` green

## Phase 3 — UI (AC-1, AC-3, AC-4)

- [x] T5 `store.ts`: `importOpen` + `openImport/closeImport`
- [x] T6 `env-var-form.tsx` scope select; `env-var-row.tsx` scope badge
- [x] T7 `env-import-dialog.tsx`; `env-export-menu.tsx`
- [x] T8 `env-vars-section.tsx`: group by scope, header controls, `export` audit label
- [x] T9 i18n: `envVars.*` + `common.close`, both locales

## Phase 4 — verification

- [x] T10 Unit: lib + import/export actions + scope grouping
- [x] T11 E2E: import + export leg in `e2e/env-vars.spec.ts`; update CUJ-03 doc
- [x] T12 `pnpm verify` green; appsec review (export audited + gated)

## AC coverage

- [x] AC-1 → T2,T6,T8 · [x] AC-2 → T2 · [x] AC-3 → T4,T7 · [x] AC-4 → T4,T7 · [x] AC-5 → T4 · [x] AC-6 → T4
