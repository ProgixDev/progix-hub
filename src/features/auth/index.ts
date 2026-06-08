// Public API for the auth slice. Other layers import only from here.
// Server session reads (requireMember/getCurrentUser) live in @/lib/auth/session so
// other features can authorize without importing this feature (boundary rule).
export { signOutAction } from "./actions";
export { isAllowedMember, fetchOrgMembership, PROGIX_ORG, type OrgMembership } from "./membership";
export { SignInButton } from "./components/sign-in-button";
export { UserMenu } from "./components/user-menu";
