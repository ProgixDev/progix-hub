import { LoadingScreen } from "@/components/brand/loading-screen";

// App-level loading screen — the animated Progix logo. Deeper routes keep their own
// lightweight spinners; this branded splash shows on initial entry.
export default function Loading() {
  return <LoadingScreen />;
}
