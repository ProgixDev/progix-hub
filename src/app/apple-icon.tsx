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
      <svg width="180" height="180" viewBox="0 0 512 512" fill="none">
        <path d="M168 196 L332 344" stroke="#e8ecf6" strokeWidth="46" strokeLinecap="round" />
        <path
          d="M168 344 L344 172"
          stroke="#4fd6f2"
          strokeWidth="46"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M286 172 L344 172 L344 230"
          stroke="#4fd6f2"
          strokeWidth="46"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>,
    { ...size },
  );
}
