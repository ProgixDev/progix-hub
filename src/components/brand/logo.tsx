/**
 * Progix brand marks — the real logo, a flat theme-aware rendition of the 3D wordmark
 * (the X rises into the growth arrow). Letters inherit `currentColor` so the wordmark
 * recolors for light/dark; the arrow keeps the brand cyan. The animated 3D version of
 * this logo lives in `progix-loader.tsx` (loading screens only).
 */

/** Brand cyan — the growth arrow. Fixed (it's the logo's own colour), independent of theme. */
const ARROW = "#4fd6f2";

/** The PROGIX wordmark. `size` is the rendered height in px (aspect ≈ 4:1). */
export function Wordmark({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg
      height={size}
      viewBox="-12 -10 528 132"
      fill="none"
      className={className}
      role="img"
      aria-label="Progix"
    >
      <g stroke="currentColor" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round">
        <g transform="translate(10,0)">
          <path d="M0 20 V100" />
          <path d="M0 20 C48 20 48 64 0 64" />
        </g>
        <g transform="translate(83,0)">
          <path d="M0 20 V100" />
          <path d="M0 20 C46 20 46 60 0 60" />
          <path d="M0 60 L48 100" />
        </g>
        <g transform="translate(165,0)">
          <circle cx="40" cy="60" r="40" />
        </g>
        <g transform="translate(272,0)">
          <path d="M64 30 A40 40 0 1 0 64 90" />
          <path d="M64 60 H40" />
          <path d="M64 60 V90" />
        </g>
        <g transform="translate(385,0)">
          <path d="M0 20 V100" />
        </g>
        <g transform="translate(421,0)">
          <path d="M0 20 L58 100" />
        </g>
      </g>
      <g
        transform="translate(421,0)"
        stroke={ARROW}
        strokeWidth="18"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M0 100 L70 8" />
        <path d="M44 10 L70 8 L66 34" />
      </g>
    </svg>
  );
}

/** The compact square mark (arrow-X on the brand surface) — for avatars / app-icon parity. */
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      className={className}
      aria-hidden
    >
      <rect width="512" height="512" rx="116" fill="#0a0d16" />
      <path d="M168 196 L332 344" stroke="#e8ecf6" strokeWidth="46" strokeLinecap="round" />
      <path
        d="M168 344 L344 172"
        stroke={ARROW}
        strokeWidth="46"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M286 172 L344 172 L344 230"
        stroke={ARROW}
        strokeWidth="46"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
