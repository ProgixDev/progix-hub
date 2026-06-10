import { AppFrame } from "./app-frame";
import type { RecentProject } from "./sidebar";

/**
 * The authenticated app chrome: sidebar + top bar around a scrollable main. On desktop the
 * sidebar is fixed; on mobile it collapses to a drawer (state lives in AppFrame). Generic
 * shell — it knows nothing about a specific feature; pages compose into it.
 */
export function AppShell({
  title,
  recent,
  userSlot,
  children,
}: {
  title: string;
  recent: RecentProject[];
  userSlot?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <AppFrame title={title} recent={recent} userSlot={userSlot}>
      {children}
    </AppFrame>
  );
}

export type { RecentProject };
