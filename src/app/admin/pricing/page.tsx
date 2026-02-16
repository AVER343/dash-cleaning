import { Suspense } from "react";
import { asc, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { pricing } from "@/lib/db/schema";
import { requireAdminOrThrow } from "@/lib/auth/guard";
import { AdminPricingClient } from "@/components/admin/AdminPricingClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminPricingPage() {
  const isAdmin = await requireAdminOrThrow();
  if (!isAdmin) redirect("/admin/login");

  const db = getDb();

  const pricingRows = await db
    .select()
    .from(pricing)
    .where(isNull(pricing.deletedAt))
    .orderBy(asc(pricing.base));

  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading pricing...</div>}>
      <AdminPricingClient
        pricing={pricingRows.map(p => ({ ...p, sqft: Number(p.sqft) }))}
      />
    </Suspense>
  );
}
