import "server-only";
import OpenAI from "openai";
import { env } from "@/core/env";

/** The model used for digests — overridable via OPENAI_DIGEST_MODEL, defaults to gpt-4o. */
export const DIGEST_MODEL = env.OPENAI_DIGEST_MODEL ?? "gpt-4o";

export type DigestInput = {
  projectName: string;
  reports: { author: string; date: string; body: string }[];
  activity: { kind: string; summary: string; date: string }[];
  taskTotal: number;
  taskDone: number;
};

/** Whether the digest generator is wired up (OpenAI key present). */
export function digestConfigured(): boolean {
  return Boolean(env.OPENAI_API_KEY);
}

const SYSTEM = [
  "You are a project-management assistant for a software studio.",
  "Write a concise weekly digest of one project for its team and stakeholders.",
  "Use GitHub-flavored markdown with these short sections, in order:",
  "## Highlights, ## Progress, ## Risks & blockers, ## Next week.",
  "Ground every statement ONLY in the data provided — never invent facts, names, or numbers.",
  "If a section has nothing to report, write one brief honest line.",
  "Keep the whole digest under ~250 words. Use sentence case and curly quotes (“ ” ’).",
].join(" ");

function clip(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function buildUserPrompt(i: DigestInput): string {
  const lines: string[] = [
    `Project: ${i.projectName}`,
    `Tasks: ${i.taskDone} of ${i.taskTotal} done.`,
    "",
    "Daily reports this week:",
  ];
  if (i.reports.length === 0) lines.push("(none)");
  for (const r of i.reports) lines.push(`- [${r.date}] ${r.author}: ${clip(r.body, 700)}`);
  lines.push("", "Activity this week:");
  if (i.activity.length === 0) lines.push("(none)");
  for (const a of i.activity) lines.push(`- [${a.date}] ${a.kind}: ${clip(a.summary, 200)}`);
  return lines.join("\n");
}

/** Call OpenAI to turn a week of project signal into a markdown digest. Throws if unconfigured. */
export async function generateDigestContent(input: DigestInput): Promise<string> {
  if (!env.OPENAI_API_KEY) throw new Error("OpenAI is not configured");
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const res = await client.chat.completions.create({
    model: DIGEST_MODEL,
    max_completion_tokens: 900,
    temperature: 0.3,
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: buildUserPrompt(input) },
    ],
  });
  const text = res.choices[0]?.message?.content?.trim();
  if (!text) throw new Error("Empty digest response");
  return text;
}
