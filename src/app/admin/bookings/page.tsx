import { Suspense } from "react";
import { and, desc, eq, ilike, or, sql, count } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { bookings, locations, type BookingStatus } from "@/lib/db/schema";
import { requireAdminOrThrow } from "@/lib/auth/guard";
import { AdminBookingsClient } from "@/components/admin/AdminBookingsClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  page?: string;
  pageSize?: string;
  q?: string;
  status?: string;
}>;

export default async function AdminBookingsPage(props: {
  searchParams: SearchParams;
}) {
  const isAdmin = await requireAdminOrThrow();
  if (!isAdmin) redirect("/admin/login");

  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const pageSize = Number(searchParams.pageSize) || 10;
  const q = searchParams.q || "";
  const status = searchParams.status || "";

  const db = getDb();

  // Build filters
  const filters = [];

  if (q) {
    const searchFilter = or(
      ilike(bookings.firstName, `%${q}%`),
      ilike(bookings.lastName, `%${q}%`),
      ilike(bookings.email, `%${q}%`),
      ilike(bookings.phone, `%${q}%`)
    );
    filters.push(searchFilter);
  }

  if (status) {
    filters.push(eq(bookings.status, status as BookingStatus));
  }

  const whereClause = filters.length > 0 ? and(...filters) : undefined;

  // Fetch data
  const [bookingRows, totalResult, locationRows] = await Promise.all([
    db
      .select({
        id: bookings.id,
        first_name: bookings.firstName,
        last_name: bookings.lastName,
        email: bookings.email,
        phone: bookings.phone,
        place_id: bookings.placeId,
        location_name: locations.name,
        service_type: bookings.serviceType,
        bedrooms: bookings.bedrooms,
        bathrooms: bookings.bathrooms,
        sqft: bookings.sqft,
        date: bookings.dateText,
        time: bookings.timeText,
        price: bookings.price,
        status: bookings.status,
        created_at: bookings.createdAt,
      })
      .from(bookings)
      .leftJoin(locations, eq(bookings.placeId, locations.id))
      .where(whereClause)
      .orderBy(desc(bookings.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ count: count() })
      .from(bookings)
      .where(whereClause),
    db
      .select({ id: locations.id, name: locations.name })
      .from(locations)
      .orderBy(locations.name),
  ]);

  const total = totalResult[0]?.count ?? 0;
  const pageCount = Math.ceil(total / pageSize);

  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading bookings...</div>}>
      <AdminBookingsClient
        initialBookings={bookingRows}
        locations={locationRows}
        total={total}
        page={page}
        pageCount={pageCount}
      />
    </Suspense>
  );
}
