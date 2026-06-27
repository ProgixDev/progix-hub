/** A project type the wizard offers (spec 045), grouped into a vertical. */
export type ProjectType = {
  id: string;
  slug: string;
  name: string;
  group_name: string;
  description: string | null;
  is_custom: boolean;
  active: boolean;
};

/** essential = free baseline · screen · feature · option (nested under a feature) · crosscutting. */
export type BlockType = "essential" | "screen" | "feature" | "option" | "crosscutting";

export type EstimateStatus = "draft" | "sent" | "accepted" | "rejected";

/** A chosen catalog block, snapshotted onto an estimate (price/effort frozen at estimate time). */
export type EstimateSelection = {
  item_id: string;
  name: string;
  category: string;
  block_type: BlockType;
  unit_price: number;
  unit_days: number;
  qty: number;
  is_free: boolean;
};

/** A saved scope + price for a client project (the wizard's output). */
export type Estimate = {
  id: string;
  name: string;
  client_name: string | null;
  ecosystems: string[];
  project_type: string | null;
  selections: EstimateSelection[];
  buffer_pct: number;
  velocity: number;
  total_price: number;
  total_days: number;
  status: EstimateStatus;
  project_id: string | null;
  created_at: string;
};

/** A priced building block in the catalog (spec 044/045). Options hang under a feature via parent_id;
 *  essentials are documented but free; platforms scopes it to ecosystems (empty = all). */
export type PricingItem = {
  id: string;
  key: string | null;
  category: string;
  name: string;
  description: string | null;
  base_price: number;
  effort_days: number;
  is_custom: boolean;
  active: boolean;
  block_type: BlockType;
  parent_id: string | null;
  is_free: boolean;
  platforms: string[];
};
