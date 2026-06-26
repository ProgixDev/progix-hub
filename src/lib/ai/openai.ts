import "server-only";
import OpenAI from "openai";
import { env } from "@/core/env";

/** The model used for AI text features — overridable via OPENAI_DIGEST_MODEL, defaults to gpt-4o. */
export const AI_MODEL = env.OPENAI_DIGEST_MODEL ?? "gpt-4o";

/** Whether OpenAI is configured (key present). */
export function aiConfigured(): boolean {
  return Boolean(env.OPENAI_API_KEY);
}

/** Run a chat completion and return the text. Throws if unconfigured or empty. */
export async function chatComplete(system: string, user: string, maxTokens = 900): Promise<string> {
  if (!env.OPENAI_API_KEY) throw new Error("OpenAI is not configured");
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const res = await client.chat.completions.create({
    model: AI_MODEL,
    max_completion_tokens: maxTokens,
    temperature: 0.3,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  const text = res.choices[0]?.message?.content?.trim();
  if (!text) throw new Error("Empty AI response");
  return text;
}
