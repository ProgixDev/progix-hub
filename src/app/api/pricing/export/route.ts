import { NextResponse } from "next/server";
import { canManagePricing, pricingCatalogCsv } from "@/features/pricing";

/** Export the pricing catalog as CSV (leadership only) for bulk editing in a spreadsheet. */
export async function GET() {
  if (!(await canManagePricing()))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const csv = await pricingCatalogCsv();
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="progix-pricing-catalog.csv"',
    },
  });
}
