import { redirect } from "next/navigation";
import { canManagePricing, DocBar, EstimateDocument, getEstimate } from "@/features/pricing";
import { getCurrentUser } from "@/lib/auth/session";

export default async function SpecPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!(await canManagePricing())) redirect("/");
  const { id } = await params;
  const estimate = await getEstimate(id);
  if (!estimate) redirect("/pricing/estimates");
  return (
    <main className="min-h-screen bg-zinc-100">
      <DocBar />
      <div className="px-3 py-6 print:p-0">
        <div className="mx-auto max-w-[820px] bg-white shadow-sm print:shadow-none">
          <EstimateDocument estimate={estimate} variant="spec" />
        </div>
      </div>
    </main>
  );
}
