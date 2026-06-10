import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next 16 renamed the `middleware` convention to `proxy`. Auth gate lives in updateSession.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Run on everything except static assets, image files, and the public PWA assets
  // (manifest + generated icons must be reachable without auth — the OS/browser fetches
  // them with no cookies when installing the app; spec 007).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|apple-icon|icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
