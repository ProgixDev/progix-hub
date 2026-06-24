import { z } from "zod";
import { LANGUAGES } from "./types";

/**
 * Resolve a pasted video link to a canonical, embeddable iframe src — for YouTube, Loom, and Vimeo
 * only (spec 016 AC-5). Returns null for anything else, so the schema rejects it and the player
 * never embeds an arbitrary/unsafe source. The DB keeps the original link; the player recomputes
 * the embed src each render.
 */
export function embedUrlFor(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.replace(/^(www\.|m\.)/, "").toLowerCase();
  const safeId = (s: string | null | undefined) => (s && /^[A-Za-z0-9_-]+$/.test(s) ? s : null);

  // YouTube
  if (host === "youtu.be") {
    const v = safeId(u.pathname.slice(1).split("/")[0]);
    return v ? `https://www.youtube.com/embed/${v}` : null;
  }
  if (host === "youtube.com") {
    if (u.pathname === "/watch") {
      const v = safeId(u.searchParams.get("v"));
      return v ? `https://www.youtube.com/embed/${v}` : null;
    }
    const m = u.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/);
    const v = m ? safeId(m[1]) : null;
    return v ? `https://www.youtube.com/embed/${v}` : null;
  }
  // Vimeo
  if (host === "vimeo.com") {
    const m = u.pathname.match(/^\/(\d+)/);
    return m ? `https://player.vimeo.com/video/${m[1]}` : null;
  }
  if (host === "player.vimeo.com") {
    const m = u.pathname.match(/^\/video\/(\d+)/);
    return m ? `https://player.vimeo.com/video/${m[1]}` : null;
  }
  // Loom
  if (host === "loom.com") {
    const m = u.pathname.match(/^\/(?:share|embed)\/([A-Za-z0-9]+)/);
    return m ? `https://www.loom.com/embed/${m[1]}` : null;
  }
  return null;
}

const optionalTrimmed = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : null));

export const tutorialInputSchema = z
  .object({
    title: z.string().trim().min(1, "tutorials.errorTitle"),
    description: optionalTrimmed,
    platform_service_id: optionalTrimmed,
    embed_url: z.string().trim().min(1, "tutorials.errorLink"),
    language: z
      .string()
      .optional()
      .transform((v) => (v === "en" || v === "fr" ? v : null)),
    visible_to_clients: z.boolean().default(false),
  })
  .superRefine((val, ctx) => {
    if (!embedUrlFor(val.embed_url)) {
      ctx.addIssue({ code: "custom", path: ["embed_url"], message: "tutorials.errorLink" });
    }
  });

export type TutorialInput = z.infer<typeof tutorialInputSchema>;
export { LANGUAGES };
