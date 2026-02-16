import Link from "next/link";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { bookings, locations } from "@/lib/db/schema";
import { requireAdminOrThrow } from "@/lib/auth/guard";
import { formatCurrency } from "@/lib/format/currency";
import { formatDateTime } from "@/lib/format/date";

import { StatusBadge } from "@/components/admin/StatusBadge";
import { StatusChart } from "@/components/admin/StatusChart";
import { redirect } from "next/navigation";

// Force dynamic rendering
export const dynamic = "force-dynamic";

async function getDashboardData() {
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

  return {
    kpis: {
      totalBookings: totalResult[0]?.total ?? 0,
      pendingBookings: pendingResult[0]?.total ?? 0,
      completedBookings: completedResult[0]?.total ?? 0,
      revenue: revenueResult[0]?.total ?? 0
    },
    statusBreakdown: statusRows,
    recentBookings: recentRows
  };
}

export default async function AdminOverviewPage() {
  const isAdmin = await requireAdminOrThrow();
  if (!isAdmin) {
    redirect("/admin/login");
  }

  const data = await getDashboardData();

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Overview of your cleaning business performance.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <dt className="text-sm font-medium text-gray-500 truncate">Total Bookings</dt>
          <dd className="mt-1 text-3xl font-semibold text-foreground">{data.kpis.totalBookings}</dd>
        </div>
        <div className="card">
          <dt className="text-sm font-medium text-gray-500 truncate">Pending Bookings</dt>
          <dd className="mt-1 text-3xl font-semibold text-warning">{data.kpis.pendingBookings}</dd>
        </div>
        <div className="card">
          <dt className="text-sm font-medium text-gray-500 truncate">Completed Bookings</dt>
          <dd className="mt-1 text-3xl font-semibold text-success">{data.kpis.completedBookings}</dd>
        </div>
        <div className="card">
          <dt className="text-sm font-medium text-gray-500 truncate">Revenue (Completed)</dt>
          <dd className="mt-1 text-3xl font-semibold text-foreground">{formatCurrency(data.kpis.revenue)}</dd>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Chart Section */}
        <div className="card lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-foreground">Booking Status</h2>
          </div>
          <div className="h-64">
            <StatusChart data={data.statusBreakdown} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card lg:col-span-2">
          <h2 className="text-lg font-medium text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/admin/bookings" className="flex items-center p-4 bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-colors group">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-indigo-900 group-hover:text-indigo-800">Create New Booking</h3>
                <p className="text-xs text-indigo-700 mt-1">Schedule a service for a customer</p>
              </div>
              <span className="text-indigo-500 text-xl font-bold ml-3">+</span>
            </Link>
            <Link href="/admin/locations" className="flex items-center p-4 bg-gray-50 border border-border rounded-xl hover:bg-gray-100 transition-colors">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-foreground">Manage Locations</h3>
                <p className="text-xs text-gray-500 mt-1">Update service areas and pricing zones</p>
              </div>
            </Link>
            <Link href="/admin/pricing" className="flex items-center p-4 bg-gray-50 border border-border rounded-xl hover:bg-gray-100 transition-colors">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-foreground">Manage Pricing</h3>
                <p className="text-xs text-gray-500 mt-1">Adjust rates per square foot/room</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-gray-50/50">
          <h2 className="text-lg font-medium text-foreground">Recent Bookings</h2>
          <Link href="/admin/bookings" className="text-sm font-medium text-accent hover:text-blue-700">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-gray-50/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Service</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-border">
              {data.recentBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">{booking.first_name} {booking.last_name}</div>
                    <div className="text-xs text-gray-500">{booking.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground">{booking.service_type}</div>
                    <div className="text-xs text-gray-500">{booking.location_name ?? "-"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span suppressHydrationWarning>{booking.date} at {booking.time}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={booking.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    {formatCurrency(booking.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span suppressHydrationWarning>{formatDateTime(booking.created_at)}</span>
                  </td>
                </tr>
              ))}
              {data.recentBookings.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                    No bookings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
