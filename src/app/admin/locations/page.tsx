import { Suspense } from "react";
import { and, asc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { locations, pricing } from "@/lib/db/schema";
import { requireAdminOrThrow } from "@/lib/auth/guard";
import { AdminLocationsClient } from "@/components/admin/AdminLocationsClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLocationsPage() {
  const isAdmin = await requireAdminOrThrow();
  if (!isAdmin) redirect("/admin/login");

  const db = getDb();

  const [locationRows, pricingRows] = await Promise.all([
    db
      .select({
        id: locations.id,
        name: locations.name,
        pricing_id: locations.pricingId,
        created_at: locations.createdAt,
        updated_at: locations.updatedAt,
        pricing_base: pricing.base,
      })
      .from(locations)
      .leftJoin(pricing, eq(locations.pricingId, pricing.id))
      .where(isNull(locations.deletedAt))
      .orderBy(asc(locations.name)),
    db
      .select()
      .from(pricing)
      .where(isNull(pricing.deletedAt))
      .orderBy(asc(pricing.base)),
  ]);

  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading locations...</div>}>
      <AdminLocationsClient
        locations={locationRows.map(l => ({ ...l, pricing_base: l.pricing_base ?? 0 }))}
        pricingOptions={pricingRows.map(p => ({ ...p, sqft: Number(p.sqft) }))}
      />
    </Suspense>
  );
}
