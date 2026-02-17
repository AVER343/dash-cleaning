import { Suspense } from "react";
import { and, asc, desc, eq, gte, isNull, lte } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { basePricing, services, locations } from "@/lib/db/schema";
import { requireAdminOrThrow } from "@/lib/auth/guard";
import { AdminPricingClient } from "@/components/admin/AdminPricingClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  service_id?: string;
  location_id?: string;
  frequency?: string;
  min_price?: string;
  max_price?: string;
}>;

export default async function AdminPricingPage(props: {
  searchParams: SearchParams;
}) {
  const isAdmin = await requireAdminOrThrow();
  if (!isAdmin) redirect("/admin/login");

  const { service_id, location_id, frequency, min_price, max_price } = await props.searchParams;
  const db = getDb();

  const filters = [isNull(basePricing.deletedAt)];
  if (service_id) filters.push(eq(basePricing.serviceId, service_id));
  if (location_id) filters.push(eq(basePricing.locationId, location_id));
  if (frequency && ["one_time", "weekly", "bi_weekly", "monthly"].includes(frequency)) {
    filters.push(eq(basePricing.frequency, frequency as "one_time" | "weekly" | "bi_weekly" | "monthly"));
  }
  if (min_price) filters.push(gte(basePricing.basePrice, min_price));
  if (max_price) filters.push(lte(basePricing.basePrice, max_price));

  const [pricingRows, serviceRows, locationRows] = await Promise.all([
    db
      .select({
        id: basePricing.id,
        service_id: basePricing.serviceId,
        service_name: services.name,
        location_id: basePricing.locationId,
        location_name: locations.name,
        bedrooms: basePricing.bedrooms,
        bathrooms: basePricing.bathrooms,
        frequency: basePricing.frequency,
        base_price: basePricing.basePrice,
        created_at: basePricing.createdAt,
        updated_at: basePricing.updatedAt,
      })
      .from(basePricing)
      .leftJoin(services, eq(basePricing.serviceId, services.id))
      .leftJoin(locations, eq(basePricing.locationId, locations.id))
      .where(and(...filters))
      .orderBy(desc(basePricing.createdAt)),
    db
      .select({ id: services.id, name: services.name })
      .from(services)
      .where(isNull(services.deletedAt))
      .orderBy(asc(services.name)),
    db
      .select({ id: locations.id, name: locations.name })
      .from(locations)
      .where(isNull(locations.deletedAt))
      .orderBy(asc(locations.name)),
  ]);

  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading pricing...</div>}>
      <AdminPricingClient
        pricing={pricingRows.map(p => ({
          ...p,
          base_price: Number(p.base_price),
          location_name: p.location_name ?? "All Locations"
        }))}
        services={serviceRows}
        locations={locationRows}
      />
    </Suspense>
  );
}
