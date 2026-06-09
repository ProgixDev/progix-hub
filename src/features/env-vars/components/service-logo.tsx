import type { ServiceId } from "../lib";

// MVP logos: brand-coloured monogram badges (dependency-free). Real marks via `simple-icons`
// are a deferred follow-up (would be its own ADR). Unknown/none renders a neutral default.
const BRAND: Record<ServiceId, { mark: string; bg: string; fg: string }> = {
  stripe: { mark: "S", bg: "#635BFF", fg: "#fff" },
  twilio: { mark: "T", bg: "#F22F46", fg: "#fff" },
  supabase: { mark: "S", bg: "#3ECF8E", fg: "#0b1f17" },
  vercel: { mark: "▲", bg: "#000", fg: "#fff" },
  github: { mark: "GH", bg: "#24292f", fg: "#fff" },
  redis: { mark: "R", bg: "#FF4438", fg: "#fff" },
  openai: { mark: "AI", bg: "#10A37F", fg: "#fff" },
  anthropic: { mark: "A", bg: "#D97757", fg: "#fff" },
  aws: { mark: "AWS", bg: "#FF9900", fg: "#111" },
  postgres: { mark: "PG", bg: "#336791", fg: "#fff" },
  sendgrid: { mark: "SG", bg: "#1A82E2", fg: "#fff" },
};

export function ServiceLogo({ service, size = 24 }: { service: string | null; size?: number }) {
  const brand = service && service in BRAND ? BRAND[service as ServiceId] : null;
  if (!brand) {
    return (
      <span
        className="text-text-3 bg-bg-2 border-line-1 inline-flex flex-none items-center justify-center rounded-md border"
        style={{ width: size, height: size, fontSize: size * 0.5 }}
        aria-hidden
        data-testid="service-logo"
        data-service="none"
      >
        ·
      </span>
    );
  }
  return (
    <span
      className="inline-flex flex-none items-center justify-center rounded-md font-semibold"
      style={{
        width: size,
        height: size,
        background: brand.bg,
        color: brand.fg,
        fontSize: size * 0.4,
      }}
      aria-hidden
      data-testid="service-logo"
      data-service={service}
    >
      {brand.mark}
    </span>
  );
}
