import { readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";

// Live-DB integration tests (security invariants) — they hit a real Supabase project, so they are
// excluded from `pnpm test` and run via `pnpm test:integration`. They skip cleanly when the
// Supabase env is absent. Locally the keys are read from `.env.local`; in CI they come from repo
// secrets (ideally a DISPOSABLE project, not prod) — there this parser returns {} and vitest merges
// test.env over the existing process.env.
function dotEnvLocal(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    for (const line of readFileSync(".env.local", "utf8").split("\n")) {
      const match = /^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/.exec(line);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (!key) continue;
      let value = (rawValue ?? "").trim();
      if (/^".*"$/.test(value) || /^'.*'$/.test(value)) value = value.slice(1, -1);
      out[key] = value;
    }
  } catch {
    // no .env.local (e.g. CI) — env comes from the process
  }
  return out;
}

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.integration.test.ts"],
    env: dotEnvLocal(),
    testTimeout: 30_000,
    hookTimeout: 40_000,
    fileParallelism: false,
  },
});
