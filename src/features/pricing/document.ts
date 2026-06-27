// Pure builders that turn a saved Estimate into the two client deliverables' data:
// the quote (summarized, a price range) and the cahier des charges (detailed scope).
import { computeTotals, type Totals } from "./calc";
import type { Estimate, EstimateSelection } from "./types";

export type DocCategory = {
  category: string;
  blocks: EstimateSelection[];
  subtotal: number;
  days: number;
};

export type DocModel = {
  totals: Totals;
  byCategory: DocCategory[];
  essentials: EstimateSelection[];
  screens: EstimateSelection[];
  priceLow: number; // with platform factor, before the risk buffer
  priceHigh: number; // with the buffer (the authoritative total)
};

/** Default scope-control terms baked into the documents (the anti-scope-creep clauses). */
export const DOC_TERMS = { revisions: 2, feedbackDays: 3, validityDays: 30 };

export function estimateDocModel(e: Estimate): DocModel {
  const totals = computeTotals(e.selections, e.ecosystems, e.buffer_pct, e.velocity);
  const byCat = new Map<string, EstimateSelection[]>();
  for (const s of e.selections) {
    const g = byCat.get(s.category) ?? [];
    g.push(s);
    byCat.set(s.category, g);
  }
  const byCategory = [...byCat.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([category, blocks]) => ({
      category,
      blocks,
      subtotal: blocks.reduce((a, s) => a + (s.is_free ? 0 : s.unit_price * s.qty), 0),
      days: blocks.reduce((a, s) => a + s.unit_days * s.qty, 0),
    }));
  const essentials = e.selections.filter((s) => s.is_free || s.block_type === "essential");
  const screens = e.selections.filter((s) => s.block_type === "screen");
  return {
    totals,
    byCategory,
    essentials,
    screens,
    priceLow: Math.round(totals.subtotal * totals.platformFactor),
    priceHigh: totals.totalPrice,
  };
}
