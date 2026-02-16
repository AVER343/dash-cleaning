import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { bookings, locations } from "@/lib/db/schema";
import { unauthorized, serverError, ok } from "@/lib/api/json";
import { requireAdminOrThrow } from "@/lib/auth/guard";

export async function GET() {
  try {
    const isAdmin = await requireAdminOrThrow();
    if (!isAdmin) {
      return unauthorized();
    }

    const db = getDb();

    const visibleBookingFilter = isNull(bookings.deletedAt);

    const [totalResult, pendingResult, completedResult, revenueResult, statusRows, recentRows] =
      await Promise.all([
        db
          .select({ total: sql<number>`count(*)::int` })
          .from(bookings)
          .where(visibleBookingFilter),
        db
          .select({ total: sql<number>`count(*)::int` })
          .from(bookings)
          .where(and(visibleBookingFilter, eq(bookings.status, "pending"))),
        db
          .select({ total: sql<number>`count(*)::int` })
          .from(bookings)
          .where(and(visibleBookingFilter, eq(bookings.status, "completed"))),
        db
          .select({ total: sql<number>`coalesce(sum(${bookings.price}), 0)::int` })
          .from(bookings)
          .where(and(visibleBookingFilter, eq(bookings.status, "completed"))),
        db
          .select({
            status: bookings.status,
            total: sql<number>`count(*)::int`
          })
          .from(bookings)
          .where(visibleBookingFilter)
          .groupBy(bookings.status),
        db
          .select({
            id: bookings.id,
            first_name: bookings.firstName,
            last_name: bookings.lastName,
            email: bookings.email,
            service_type: bookings.serviceType,
            status: bookings.status,
            price: bookings.price,
            date: bookings.dateText,
            time: bookings.timeText,
            created_at: bookings.createdAt,
            location_name: locations.name
          })
          .from(bookings)
          .leftJoin(locations, eq(bookings.placeId, locations.id))
          .where(visibleBookingFilter)
          .orderBy(desc(bookings.createdAt))
          .limit(10)
      ]);

    return ok({
      kpis: {
        totalBookings: totalResult[0]?.total ?? 0,
        pendingBookings: pendingResult[0]?.total ?? 0,
        completedBookings: completedResult[0]?.total ?? 0,
        revenue: revenueResult[0]?.total ?? 0
      },
      statusBreakdown: statusRows,
      recentBookings: recentRows
    });
  } catch {
    return serverError();
  }
}
