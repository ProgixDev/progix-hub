import "server-only";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { toCsv } from "./csv";
import type { PricingItem, ProjectType } from "./types";

/** All project types, grouped by vertical (the wizard's project-type step). */
export async function listProjectTypes(): Promise<ProjectType[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_types")
    .select("id,slug,name,group_name,description,is_custom,active")
    .order("group_name", { ascending: true })
    .order("sort", { ascending: true })
    .order("name", { ascending: true });
  if (error) return [];
  return (data ?? []) as ProjectType[];
}

const COLS =
  "id,key,category,name,description,base_price,effort_days,is_custom,active,block_type,parent_id,is_free,platforms";

/** Leadership (superadmin / global-PM / lead) manage the catalog and run the wizard. */
export async function canManagePricing(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user && (user.isSuperadmin || user.isLead || user.isGlobalPm);
}

type Row = Omit<PricingItem, "base_price" | "effort_days"> & {
  base_price: number | string;
  effort_days: number | string;
};

/** The whole catalog, ordered by category then name (numeric prices coerced from Postgres text). */
export async function listPricingItems(): Promise<PricingItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pricing_catalog_items")
    .select(COLS)
    .order("category", { ascending: true })
    .order("sort", { ascending: true })
    .order("name", { ascending: true });
  if (error) return [];
  return ((data ?? []) as Row[]).map((r) => ({
    ...r,
    base_price: Number(r.base_price),
    effort_days: Number(r.effort_days),
  }));
}

const CSV_HEADER = [
  "key",
  "category",
  "name",
  "block_type",
  "base_price",
  "effort_days",
  "is_free",
  "platforms",
  "parent",
];

/** The whole catalog as a CSV string (for the export download). Options carry their parent's name. */
export async function pricingCatalogCsv(): Promise<string> {
  const items = await listPricingItems();
  const nameById = new Map(items.map((i) => [i.id, i.name]));
  const rows = items.map((i) => [
    i.key ?? "",
    i.category,
    i.name,
    i.block_type,
    i.base_price,
    i.effort_days,
    i.is_free,
    i.platforms.join(";"),
    i.parent_id ? (nameById.get(i.parent_id) ?? "") : "",
  ]);
  return toCsv(CSV_HEADER, rows);
}
