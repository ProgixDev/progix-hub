# Tasks 017 — Client onboarding ("Setup") page

Ordered, checkboxed. Tick on commit. `[P]` = parallel-safe. ≤ ~30 min each.

## Phase 1 — core

- [x] T1 `types.ts` + `lib.ts`: `SetupStep`/status, `PublicSetup` shape, `generateToken()` + `generatePasscode()` (crypto-random), `isTokenShaped`, `accessActionFor(platform)` (pure) · done: `lib.test.ts` (token/passcode shape, action shaping) (AC-2/AC-3)
- [x] T2 Migration `0021_client_setup.sql`: `project_setups` + `setup_steps` tables; RLS (`has_project_access(project,['pm'])` for team r/w; NO anon policy); anon RPCs `setup_public_view(token,passcode)` + `setup_mark_step(token,passcode,step_id,done)` (sha256 token, bcrypt passcode, whitelisted JSON, joins client-visible tutorial); manager RPCs `create_project_setup` / `rotate_project_setup` / `set_setup_enabled` / `verify_setup_step` · done: applies; wrong passcode → null; anon select denied (AC-2/AC-5/AC-6)
- [x] T3 `data.ts` (team) + `public-data.ts` (anon `getPublicSetup`) server-only · done: typechecks
- [x] T4 `actions.ts` (team: create/rotate/setEnabled/verifyStep — manager-gated, create/rotate return raw token+passcode once) + `public-actions.ts` (client: verifyPasscode sets cookie, markStep reads cookie) · done: `actions.test.ts` (create gen + non-manager refusal) (AC-1/AC-4)
- [x] T5 `store`/`provider` + `components/setup-panel.tsx`: build page (pick platforms), show link+passcode once, progress list, verify/rotate/disable · done: renders on project page for managers
- [x] T6 `components/setup-client-view.tsx` + passcode form: checklist with access action + tutorial embed; client marks steps done · done: renders from PublicSetup
- [x] T7 Public route `src/app/setup/[token]/page.tsx` (+ loading/error, standalone chrome); wire `SetupPanel` into `/projects/[id]`; copy EN/FR · done: routes serve

## Phase 2 — verification

- [x] T8 E2E `e2e/setup.spec.ts`: (member) project page shows the Client setup panel; create a page; open `/setup/[token]` → wrong passcode refused → right passcode shows checklist → mark a step. Capture screenshots · done: green
- [x] T9 `pnpm verify` green

## Phase 3 — review & ship

- [x] T10 `/review` (appsec lens: anon RPC leakage, passcode hashing, RLS no-anon, rotate kills token, no nav leak); fix P0/P1
- [ ] T11 PR; merge; deploy; `/update-docs` (CUJ + spec shipped)

## AC coverage

- [ ] AC-1 → T4,T8 · [ ] AC-2 → T2,T8 · [ ] AC-3 → T1,T6 · [ ] AC-4 → T4,T8 · [ ] AC-5 → T2,T8 · [ ] AC-6 → T2,T10
