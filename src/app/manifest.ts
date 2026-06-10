import type { MetadataRoute } from "next";

/**
 * Web app manifest (spec 007) — makes progixHub installable as a home-screen shortcut.
 * SVG icon covers Android/Chrome install (sizes "any"); iOS uses the apple-icon route.
 * No service worker — installability via the manifest only.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "progixHub",
    short_name: "progixHub",
    description: "The internal hub for every Progix project.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0d16",
    theme_color: "#0a0d16",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
