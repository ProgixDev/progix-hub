/**
 * progixHub logo mark + wordmark, ported from the approved design
 * (docs/design/mockups/progixhub/icons.jsx). Pure SVG, server-safe.
 */

export function LogoMark({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      className={className}
      aria-hidden
    >
      <rect
        x="1"
        y="1"
        width="26"
        height="26"
        rx="8"
        fill="#101A33"
        stroke="rgba(76,130,251,0.5)"
        strokeWidth="1"
      />
      <circle cx="14" cy="14" r="3" fill="#4C82FB" />
      <circle cx="14" cy="6.6" r="2" fill="#7CA2FF" />
      <circle cx="20.4" cy="17.7" r="2" fill="#7CA2FF" />
      <circle cx="7.6" cy="17.7" r="2" fill="#7CA2FF" />
      <path
        d="M14 9v2.2M16.4 15.4l1.7 1M11.6 15.4l-1.7 1"
        stroke="#4C82FB"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Wordmark({ size = 17, className }: { size?: number; className?: string }) {
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontSize: size,
        fontWeight: 600,
        letterSpacing: "-0.02em",
      }}
    >
      <LogoMark size={size + 5} />
      <span>
        progix<span className="text-blue">Hub</span>
      </span>
    </span>
  );
}
