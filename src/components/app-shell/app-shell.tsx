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
  clockSlot,
  reportSlot,
  notificationsSlot,
  showMembers,
  children,
}: {
  title: string;
  recent: RecentProject[];
  userSlot?: React.ReactNode;
  clockSlot?: React.ReactNode;
  reportSlot?: React.ReactNode;
  notificationsSlot?: React.ReactNode;
  showMembers?: boolean;
  children: React.ReactNode;
}) {
  return (
    <AppFrame
      title={title}
      recent={recent}
      userSlot={userSlot}
      clockSlot={clockSlot}
      reportSlot={reportSlot}
      notificationsSlot={notificationsSlot}
      showMembers={showMembers}
    >
      {children}
    </AppFrame>
  );
}

export type { RecentProject };
