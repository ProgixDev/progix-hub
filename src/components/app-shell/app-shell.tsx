import { Sidebar, type RecentProject } from "./sidebar";
import { TopBar } from "./top-bar";

/**
 * The authenticated app chrome: fixed sidebar + top bar around a scrollable main.
 * Generic shell — it knows nothing about a specific feature; pages compose into it.
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
    <div className="bg-bg flex h-dvh overflow-hidden">
      <Sidebar recent={recent} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar title={title} userSlot={userSlot} />
        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

export type { RecentProject };
