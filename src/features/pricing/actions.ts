"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { FEATURE_BLOCKS } from "@/lib/playground/feature-catalog";
import { createClient } from "@/lib/supabase/server";

export type PricingResult = { ok: true } | { ok: false; error: string };
type SessionUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

async function leadership(): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  return user && (user.isSuperadmin || user.isLead || user.isGlobalPm) ? user : null;
}

/** Seed the catalog from the 141 feature blocks (idempotent — never overwrites prices). */
export async function syncFeatureBlocksAction(): Promise<PricingResult> {
  const t = await getTranslations("pricing");
  const user = await leadership();
  if (!user) return { ok: false, error: t("errorNotAuthorized") };
  const supabase = await createClient();
  const rows = FEATURE_BLOCKS.map((b, i) => ({
    key: b.key,
    category: b.category,
    name: b.name,
    sort: i,
  }));
  const { error } = await supabase
    .from("pricing_catalog_items")
    .upsert(rows, { onConflict: "key", ignoreDuplicates: true });
  if (error) return { ok: false, error: t("errorFailed") };
  revalidatePath("/pricing");
  return { ok: true };
}

const updateSchema = z
  .object({
    base_price: z.number().min(0).max(10_000_000),
    effort_days: z.number().min(0).max(100_000),
    name: z.string().trim().min(1).max(120),
    category: z.string().trim().min(1).max(60),
    active: z.boolean(),
  })
  .partial();

export async function updatePricingItemAction(id: string, input: unknown): Promise<PricingResult> {
  const t = await getTranslations("pricing");
  const user = await leadership();
  if (!user) return { ok: false, error: t("errorNotAuthorized") };
  const pid = z.string().uuid().safeParse(id);
  const parsed = updateSchema.safeParse(input);
  if (!pid.success || !parsed.success || Object.keys(parsed.data).length === 0) {
    return { ok: false, error: t("errorInvalid") };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("pricing_catalog_items")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", pid.data);
  if (error) return { ok: false, error: t("errorFailed") };
  revalidatePath("/pricing");
  return { ok: true };
}

const createSchema = z.object({
  category: z.string().trim().min(1).max(60),
  name: z.string().trim().min(1).max(120),
  base_price: z.number().min(0).max(10_000_000).default(0),
  effort_days: z.number().min(0).max(100_000).default(0),
});

export async function createPricingItemAction(input: unknown): Promise<PricingResult> {
  const t = await getTranslations("pricing");
  const user = await leadership();
  if (!user) return { ok: false, error: t("errorNotAuthorized") };
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: t("errorInvalid") };
  const supabase = await createClient();
  const { error } = await supabase
    .from("pricing_catalog_items")
    .insert({ ...parsed.data, is_custom: true, created_by: user.id });
  if (error) return { ok: false, error: t("errorFailed") };
  revalidatePath("/pricing");
  return { ok: true };
}

export async function deletePricingItemAction(id: string): Promise<PricingResult> {
  const t = await getTranslations("pricing");
  const user = await leadership();
  if (!user) return { ok: false, error: t("errorNotAuthorized") };
  const pid = z.string().uuid().safeParse(id);
  if (!pid.success) return { ok: false, error: t("errorInvalid") };
  const supabase = await createClient();
  const { error } = await supabase.from("pricing_catalog_items").delete().eq("id", pid.data);
  if (error) return { ok: false, error: t("errorFailed") };
  revalidatePath("/pricing");
  return { ok: true };
}
