// Public API for the platforms slice. Other layers import only from here.
// NOTE: listPlatforms/canManagePlatforms are SERVER-ONLY (data.ts imports "server-only").
export { listPlatforms, canManagePlatforms } from "./data";
export { PlatformsManager } from "./components/platforms-manager";
export type { Platform, AccessPattern } from "./types";
