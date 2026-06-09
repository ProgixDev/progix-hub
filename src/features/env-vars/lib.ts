// Service-logo detection (AC-1/AC-2): a best-guess service from a variable key, with a manual
// override in the form. First match wins; an unrecognized key falls back to a neutral default.

export type ServiceId =
  | "stripe"
  | "twilio"
  | "supabase"
  | "vercel"
  | "github"
  | "redis"
  | "openai"
  | "anthropic"
  | "aws"
  | "postgres"
  | "sendgrid";

type ServiceDef = { id: ServiceId; label: string; match: string[] };

/** Known services, in detection priority order. `match` tokens are tested against the upper-cased key. */
export const SERVICES: ServiceDef[] = [
  { id: "stripe", label: "Stripe", match: ["STRIPE"] },
  { id: "twilio", label: "Twilio", match: ["TWILIO"] },
  { id: "supabase", label: "Supabase", match: ["SUPABASE"] },
  { id: "vercel", label: "Vercel", match: ["VERCEL"] },
  { id: "github", label: "GitHub", match: ["GITHUB", "GH_"] },
  { id: "redis", label: "Redis", match: ["REDIS", "UPSTASH"] },
  { id: "openai", label: "OpenAI", match: ["OPENAI"] },
  { id: "anthropic", label: "Anthropic", match: ["ANTHROPIC", "CLAUDE"] },
  { id: "aws", label: "AWS", match: ["AWS_"] },
  { id: "postgres", label: "Postgres", match: ["POSTGRES", "DATABASE_URL"] },
  { id: "sendgrid", label: "SendGrid", match: ["SENDGRID"] },
];

/** Best-guess service id for a key (AC-1), or null when nothing matches (AC-2 neutral default). */
export function detectService(key: string): ServiceId | null {
  const upper = key.toUpperCase();
  for (const svc of SERVICES) {
    if (svc.match.some((token) => upper.includes(token))) return svc.id;
  }
  return null;
}

/** Human label for a stored service value (or “Other” for none/unknown). */
export function serviceLabel(id: string | null): string {
  return SERVICES.find((s) => s.id === id)?.label ?? "Other";
}
