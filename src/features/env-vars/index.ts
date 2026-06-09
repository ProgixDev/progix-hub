// Public API for the env-vars slice. Other layers import only from here.
// NOTE: listProjectEnvVars/listEnvVarAudit will be SERVER-ONLY entry points (added in data.ts, T11):
// import them only from Server Components / route handlers. Client islands use relative imports.
export { EnvVarsSection } from "./components/env-vars-section";
export type { EnvVarMeta, AuditRow } from "./types";
