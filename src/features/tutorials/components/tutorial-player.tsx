import { embedUrlFor } from "../lib";
import type { Tutorial } from "../types";

/**
 * Plays a tutorial. Embeds render ONLY a computed embed src (YouTube/Loom/Vimeo) — never raw input.
 * Uploads render a <video> from a short-lived signed URL (resolved server-side; members only).
 */
export function TutorialPlayer({ tutorial, videoUrl }: { tutorial: Tutorial; videoUrl?: string }) {
  if (tutorial.source_type === "upload") {
    if (!videoUrl) return null;
    return (
      <div className="border-line-1 aspect-video w-full overflow-hidden rounded-lg border bg-black">
        <video src={videoUrl} controls className="size-full" />
      </div>
    );
  }
  const src = embedUrlFor(tutorial.embed_url ?? "");
  if (!src) return null;
  return (
    <div className="border-line-1 aspect-video w-full overflow-hidden rounded-lg border bg-black">
      <iframe
        src={src}
        title={tutorial.title}
        className="size-full"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
