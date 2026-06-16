# Plan 009 — Env vars: bulk import, scope, and `.env` export

- **Spec:** [spec.md](spec.md) (all open questions resolved: yes)
- **Author:** agent · **Date:** 2026-06-16

## Approach

Extend the existing `env-vars` slice rather than add a new one. The risky surface is the secret path, so import reuses `create_env_var` (encrypt app-side, one RPC per row) and export reuses `reveal_env_var` with a new `export` intent — both keep the spec-008 `has_project_access(project, ['pm','developer'])` gate and the same-transaction audit. Parsing/serialization is pure and client-safe (unit-tested in `lib.ts`); the actions stay thin. No new dependency, no boundary change, so no ADR.

## Placement (per `docs/architecture/module-boundaries.md`)

| What      | Where                                                   | Notes                                       |
| --------- | ------------------------------------------------------- | ------------------------------------------- |
| Migration | `supabase/migrations/0009_env_var_scope_and_export.sql` | scope column, export action, RPC + scope    |
| Pure lib  | `src/features/env-vars/lib.ts`                          | parseDotenv / detectScope / serializeDotenv |
| Actions   | `src/features/env-vars/actions.ts`                      | import + export, member-gated               |
| UI        | `src/features/env-vars/components/*`                    | import dialog, export menu, scope badge     |
| i18n      | `src/messages/{en,fr}.json`                             | `envVars.*`, `common.close`                 |

## Data & state

- Server data: `data.ts` adds `scope` to the metadata select. Export queries `from('env_vars').select('id,key,scope')` inline in the action (never imports `data.ts` — `server-only` isn't stubbed in vitest).
- Client state: `store.ts` gains `importOpen` + `openImport/closeImport`. Revealed plaintext stays in memory only.
- Actions: `importEnvVarsAction(projectId, {items})` validates with `envImportSchema`, encrypts each value app-side, loops `create_env_var`, collects created/skipped(23505)/failed, one `revalidatePath`. `exportEnvFileAction(projectId, scope)` decrypts each matching row via `reveal_env_var(id,'export')`, serializes, returns `{filename, content}`; maps `42501` to a friendly error.

## Acceptance criteria → verification mapping

| AC   | Proven by                                                                                       |
| ---- | ----------------------------------------------------------------------------------------------- |
| AC-1 | unit: `lib.test.ts` (detectScope) + `env-vars-section.test.tsx` grouping; e2e auto-scope assert |
| AC-2 | unit: `lib.test.ts` parseDotenv cases                                                           |
| AC-3 | unit: `actions.test.ts` import; e2e import leg                                                  |
| AC-4 | unit: `actions.test.ts` export (reveal called per row, serialized); e2e export leg              |
| AC-5 | unit: `actions.test.ts` non-member refused before RPC; migration gate review                    |
| AC-6 | unit: `actions.test.ts` empty-scope export returns error                                        |

## Risks & unknowns

- Per-row RPC on import is N round-trips; bounded by `envImportSchema.max(200)`. Acceptable for MVP.
- Export decrypts in a loop server-side; values never touch logs and the response is a download blob.

## Overlap check

Active specs touching the same areas: none. Spec 003 is shipped; this extends its slice.
