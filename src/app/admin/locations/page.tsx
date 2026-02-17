import { Suspense } from "react";
import { asc, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { locations } from "@/lib/db/schema";
import { requireAdminOrThrow } from "@/lib/auth/guard";
import { AdminLocationsClient } from "@/components/admin/AdminLocationsClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLocationsPage() {
  const isAdmin = await requireAdminOrThrow();
  if (!isAdmin) redirect("/admin/login");

  const db = getDb();

  const locationRows = await db
    .select({
      id: locations.id,
      name: locations.name,
      created_at: locations.createdAt,
      updated_at: locations.updatedAt,
    })
    .from(locations)
    .where(isNull(locations.deletedAt))
    .orderBy(asc(locations.name));

  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading locations...</div>}>
      <AdminLocationsClient
        locations={locationRows}
      />
    </Suspense>
  );
}
