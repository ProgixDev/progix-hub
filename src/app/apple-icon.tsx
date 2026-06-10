import { ImageResponse } from "next/og";

// iOS home-screen icon (spec 007). Rendered as a PNG via next/og so we need no binary asset.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0d16",
      }}
    >
      <svg width="132" height="132" viewBox="0 0 28 28" fill="none">
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
    </div>,
    { ...size },
  );
}
