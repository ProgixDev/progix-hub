// Public API for the setup slice. Other layers import only from here.
// NOTE: getProjectSetup/canManageSetup/getPublicSetup are SERVER-ONLY (data layers import "server-only").
export { getProjectSetup, canManageSetup } from "./data";
export { getPublicSetup } from "./public-data";
export { SetupPanel, type PlatformOption } from "./components/setup-panel";
export { SetupClientView } from "./components/setup-client-view";
export { SetupPasscodeForm } from "./components/passcode-form";
export type { PublicSetup, ProjectSetup, TeamSetupStep } from "./types";
