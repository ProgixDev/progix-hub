// Public API for the client-dossier slice. Other layers import only from here.
// NOTE: getClientDossier is SERVER-ONLY (data.ts imports "server-only").
export { getClientDossier } from "./data";
export { ClientDossierPanel } from "./components/dossier-panel";
export type { ClientDossier } from "./types";
