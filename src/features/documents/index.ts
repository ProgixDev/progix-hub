// Public API for the documents slice. Other layers import only from here.
// NOTE: listProjectDocuments is SERVER-ONLY (data.ts imports "server-only") — import it only from
// Server Components / route handlers. Client islands use relative imports.
export { listProjectDocuments, listArchivedProjectDocuments } from "./data";
export { DocumentsSection } from "./components/documents-section";
export type { ProjectDocument } from "./types";
