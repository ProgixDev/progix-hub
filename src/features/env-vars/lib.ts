// Service-logo detection (AC-1/AC-2): a best-guess service from a variable key, with a manual
// override in the form. First match wins; an unrecognized key falls back to a neutral default.
import type { EnvScope } from "./types";

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

// ============================== scope (spec 009) ==============================

// Key prefixes that a build tool ships to the browser ⇒ the variable is frontend-scoped.
const PUBLIC_PREFIXES = [
  "NEXT_PUBLIC_",
  "VITE_",
  "REACT_APP_",
  "EXPO_PUBLIC_",
  "PUBLIC_",
  "NUXT_PUBLIC_",
  "GATSBY_",
  "STORYBOOK_",
  "NG_APP_",
];

/** Best-guess scope for a key (AC-1): public-prefixed ⇒ frontend, else the file hint, else backend. */
export function detectScope(key: string, fileHint?: EnvScope | null): EnvScope {
  const upper = key.toUpperCase();
  if (PUBLIC_PREFIXES.some((p) => upper.startsWith(p))) return "frontend";
  return fileHint ?? "backend";
}

/** A scope hinted by a filename (`.env.frontend`, `.env.server`, …), or null when ambiguous. */
export function scopeFromFilename(name: string): EnvScope | null {
  const lower = name.toLowerCase();
  if (/front|client|public|browser/.test(lower)) return "frontend";
  if (/back|server|api/.test(lower)) return "backend";
  return null;
}

// ============================== .env parse / serialize (spec 009) ==============================

export type ParsedEnvEntry = { key: string; value: string };
export type SerializeEntry = { key: string; value: string; scope?: EnvScope };

const KEY_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

function readQuoted(s: string, quote: '"' | "'"): string | null {
  let inner = "";
  for (let i = 1; i < s.length; i++) {
    const ch = s[i]!;
    if (quote === '"' && ch === "\\" && i + 1 < s.length) {
      inner += ch + s[i + 1]!; // keep the escape pair; unescaped below
      i++;
      continue;
    }
    if (ch === quote) return inner;
    inner += ch;
  }
  return null; // unterminated
}

function unescapeDouble(s: string): string {
  return s.replace(/\\(.)/g, (_, c: string) => {
    switch (c) {
      case "n":
        return "\n";
      case "t":
        return "\t";
      case "r":
        return "\r";
      case '"':
        return '"';
      case "\\":
        return "\\";
      default:
        return c;
    }
  });
}

function stripInlineComment(s: string): string {
  const idx = s.search(/\s#/);
  return idx === -1 ? s : s.slice(0, idx);
}

/**
 * Parse `.env` text into key/value pairs (AC-2). Handles blank lines, `#` comments, an optional
 * `export ` prefix, double-quoted (with `\n \t \" \\` unescaping), single-quoted (literal), and
 * unquoted values (with a trailing ` # inline comment` stripped). Only valid keys are kept, empty
 * values are dropped, duplicates keep the last value, and a leading BOM is stripped.
 */
export function parseDotenv(text: string): ParsedEnvEntry[] {
  if (!text) return [];
  let src = text;
  if (src.charCodeAt(0) === 0xfeff) src = src.slice(1);
  const out = new Map<string, string>(); // insertion order + last-wins
  for (const rawLine of src.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) continue;
    let body = line;
    if (body.startsWith("export ")) body = body.slice(7).trimStart();
    const eq = body.indexOf("=");
    if (eq === -1) continue;
    const key = body.slice(0, eq).trim();
    if (!KEY_RE.test(key)) continue;
    const rest = body.slice(eq + 1).trim();
    let value: string;
    if (rest.startsWith('"')) {
      const closed = readQuoted(rest, '"');
      if (closed === null) continue;
      value = unescapeDouble(closed);
    } else if (rest.startsWith("'")) {
      const closed = readQuoted(rest, "'");
      if (closed === null) continue;
      value = closed;
    } else {
      value = stripInlineComment(rest).trim();
    }
    if (value === "") {
      out.delete(key); // an empty value drops the key (and overrides an earlier non-empty one)
      continue;
    }
    out.set(key, value);
  }
  return [...out.entries()].map(([key, value]) => ({ key, value }));
}

// A value is safe to write bare when it has no whitespace or shell-significant characters.
const SAFE_VALUE_RE = /^[A-Za-z0-9_@%+,.:/=-]*$/;

function quoteValue(v: string): string {
  if (SAFE_VALUE_RE.test(v)) return v;
  const escaped = v
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t")
    .replace(/"/g, '\\"');
  return `"${escaped}"`;
}

/**
 * Serialize entries to `.env` text (AC-4): `KEY=VALUE`, quoting any value that isn't bare-safe.
 * With `groupByScope`, emit `# Backend` / `# Frontend` sections (empty sections omitted).
 */
export function serializeDotenv(
  entries: SerializeEntry[],
  opts: { groupByScope?: boolean } = {},
): string {
  const line = (e: SerializeEntry) => `${e.key}=${quoteValue(e.value)}`;
  if (!opts.groupByScope) {
    return entries.length ? entries.map(line).join("\n") + "\n" : "";
  }
  const sections: string[] = [];
  for (const [scope, label] of [
    ["backend", "# Backend"],
    ["frontend", "# Frontend"],
  ] as const) {
    const inScope = entries.filter((e) => (e.scope ?? "backend") === scope);
    if (inScope.length === 0) continue;
    sections.push(`${label}\n${inScope.map(line).join("\n")}`);
  }
  return sections.length ? sections.join("\n\n") + "\n" : "";
}
