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
