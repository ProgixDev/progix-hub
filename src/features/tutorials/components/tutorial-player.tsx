import { embedUrlFor } from "../lib";

/** Inline player. Renders ONLY a computed embed src (YouTube/Loom/Vimeo) — never the raw input. */
export function TutorialPlayer({ url, title }: { url: string; title: string }) {
  const src = embedUrlFor(url);
  if (!src) return null;
  return (
    <div className="border-line-1 aspect-video w-full overflow-hidden rounded-lg border bg-black">
      <iframe
        src={src}
        title={title}
        className="size-full"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
