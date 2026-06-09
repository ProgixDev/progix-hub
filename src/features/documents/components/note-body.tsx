"use client";

import Markdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";

// Renders a note's Markdown read-only. rehype-sanitize strips any raw HTML/scripts (ADR-0008),
// so a note body can never execute markup. Basic typographic styling via Tailwind child selectors.
const cls =
  "text-text-2 text-[13px] leading-relaxed [&_a]:text-blue-text [&_a]:underline [&_h1]:mt-2 [&_h1]:text-[15px] [&_h1]:font-semibold [&_h1]:text-text [&_h2]:mt-2 [&_h2]:text-[14px] [&_h2]:font-semibold [&_h2]:text-text [&_h3]:mt-2 [&_h3]:font-semibold [&_h3]:text-text [&_p]:my-1 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_code]:font-mono [&_code]:text-[12px] [&_strong]:font-semibold [&_strong]:text-text [&_blockquote]:border-line-1 [&_blockquote]:border-l-2 [&_blockquote]:pl-3";

export function NoteBody({ body }: { body: string }) {
  return (
    <div className={cls}>
      <Markdown rehypePlugins={[rehypeSanitize]}>{body}</Markdown>
    </div>
  );
}
