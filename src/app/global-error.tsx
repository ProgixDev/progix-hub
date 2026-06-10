"use client";

// Catches errors thrown by the root layout itself (now async — it reads prefs). It renders
// outside the layout and the next-intl provider, so copy is hardcoded English by necessity.
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          background: "#0a0d16",
          color: "#e8ecf6",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "0 24px",
        }}
      >
        <p style={{ fontSize: "15px", fontWeight: 600 }}>Something went wrong</p>
        <button
          type="button"
          onClick={reset}
          style={{
            height: "36px",
            padding: "0 14px",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.16)",
            background: "transparent",
            color: "#b4bcce",
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
