/** A priced building block in the catalog (spec 044). base_price + effort_days are the "standard"
 *  baseline; the Scoping & Pricing wizard later applies complexity/quantity multipliers. */
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
};
