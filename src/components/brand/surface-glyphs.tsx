/**
 * Brand glyphs for the four project surfaces, ported from the approved design
 * (docs/design/mockups/progixhub/icons.jsx). Used on project cards and the
 * project detail header. Pure SVG, server-safe.
 */
type GlyphProps = { size?: number; className?: string };

export function NotionGlyph({ size = 16, className }: GlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <rect
        x="2.5"
        y="2.5"
        width="19"
        height="19"
        rx="3.2"
        fill="#fff"
        stroke="#0a0d16"
        strokeWidth="0.6"
      />
      <path
        d="M8 8.1v7.6c0 .4.2.55.65.5l.7-.06V10.6l4 5.2c.2.27.36.35.7.33l1.1-.07c.3-.02.42-.18.42-.45V8.1c0-.27-.13-.4-.45-.38l-.85.05c-.3.02-.42.16-.42.44v4.85L10.2 8c-.18-.25-.35-.33-.7-.31l-1 .06c-.32.02-.5.16-.5.36Z"
        fill="#0a0d16"
      />
    </svg>
  );
}

export function SlackGlyph({ size = 16, className }: GlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <path d="M6.2 14.7a1.85 1.85 0 1 1-1.85-1.85H6.2v1.85Z" fill="#E01E5A" />
      <path d="M7.15 14.7a1.85 1.85 0 0 1 3.7 0v4.6a1.85 1.85 0 1 1-3.7 0v-4.6Z" fill="#E01E5A" />
      <path d="M9 6.15A1.85 1.85 0 1 1 10.85 4.3v1.85H9Z" fill="#36C5F0" />
      <path d="M9 7.1a1.85 1.85 0 0 1 0 3.7H4.4a1.85 1.85 0 1 1 0-3.7H9Z" fill="#36C5F0" />
      <path d="M17.55 9a1.85 1.85 0 1 1 1.85 1.85h-1.85V9Z" fill="#2EB67D" />
      <path d="M16.6 9a1.85 1.85 0 0 1-3.7 0V4.4a1.85 1.85 0 1 1 3.7 0V9Z" fill="#2EB67D" />
      <path d="M14.75 17.55a1.85 1.85 0 1 1-1.85 1.85v-1.85h1.85Z" fill="#ECB22E" />
      <path d="M14.75 16.6a1.85 1.85 0 0 1 0-3.7h4.6a1.85 1.85 0 1 1 0 3.7h-4.6Z" fill="#ECB22E" />
    </svg>
  );
}

export function GitHubGlyph({ size = 16, className }: GlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2.6A9.4 9.4 0 0 0 9 21c.47.09.64-.2.64-.45v-1.6c-2.6.57-3.16-1.25-3.16-1.25-.43-1.08-1.04-1.37-1.04-1.37-.85-.58.06-.57.06-.57.94.07 1.43.97 1.43.97.84 1.43 2.2 1.02 2.73.78.08-.6.33-1.02.6-1.25-2.08-.24-4.27-1.04-4.27-4.64 0-1.02.37-1.86.96-2.52-.1-.24-.42-1.2.09-2.5 0 0 .78-.25 2.56.96a8.9 8.9 0 0 1 4.66 0c1.78-1.21 2.56-.96 2.56-.96.51 1.3.19 2.26.09 2.5.6.66.96 1.5.96 2.52 0 3.61-2.2 4.4-4.29 4.63.34.3.64.87.64 1.76v2.6c0 .26.17.55.65.45A9.4 9.4 0 0 0 12 2.6Z"
        fill="#E8ECF6"
      />
    </svg>
  );
}

export function LiveGlyph({ size = 16, className }: GlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#4C82FB"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3Z" />
    </svg>
  );
}
