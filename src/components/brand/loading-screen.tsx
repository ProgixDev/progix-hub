"use client";

import dynamic from "next/dynamic";

// The animated logo pulls in three + WebGL, so load it client-only and lazily — it stays
// out of the main bundle and only downloads when a loading screen actually shows.
const ProgixLoader = dynamic(() => import("./progix-loader").then((m) => m.ProgixLoader), {
  ssr: false,
});

/** Full-screen branded loading splash — the Progix logo, animated. */
export function LoadingScreen() {
  return (
    <div className="bg-bg grid h-dvh place-items-center" role="status" aria-label="Loading">
      <ProgixLoader size={150} />
    </div>
  );
}
