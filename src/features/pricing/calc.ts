// Pure pricing math — shared by the wizard (live preview) and the save action (authoritative store).
// Mirrors specs/045-scoping-wizard/wizard.md §4. Currency-agnostic; numbers only.
import type { EstimateSelection } from "./types";

/** Each extra front-end platform adds 60% to the build (shared backend counted once). Tunable. */
export const PLATFORM_FACTOR_PER_EXTRA = 0.6;

/** Where a total lands vs the $10k–$20k target band. */
export const TARGET_MIN = 10_000;
export const TARGET_MAX = 20_000;

export function platformFactor(ecosystems: string[]): number {
  return 1 + PLATFORM_FACTOR_PER_EXTRA * Math.max(0, ecosystems.length - 1);
}

export type Totals = {
  subtotal: number;
  platformFactor: number;
  buffer: number;
  totalPrice: number;
  totalDays: number;
  weeks: number;
  band: "below" | "in" | "above";
};

export function computeTotals(
  selections: EstimateSelection[],
  ecosystems: string[],
  bufferPct: number,
  velocity: number,
): Totals {
  const pf = platformFactor(ecosystems);
  const subtotal = selections.reduce((a, s) => a + (s.is_free ? 0 : s.unit_price * s.qty), 0);
  const baseDays = selections.reduce((a, s) => a + s.unit_days * s.qty, 0);
  const withPlatform = subtotal * pf;
  const buffer = withPlatform * (Math.max(0, bufferPct) / 100);
  const totalPrice = Math.round(withPlatform + buffer);
  const totalDays = Math.round(baseDays * pf * 10) / 10;
  const weeks = velocity > 0 ? Math.round((totalDays / velocity) * 10) / 10 : 0;
  const band = totalPrice < TARGET_MIN ? "below" : totalPrice > TARGET_MAX ? "above" : "in";
  return { subtotal, platformFactor: pf, buffer, totalPrice, totalDays, weeks, band };
}
