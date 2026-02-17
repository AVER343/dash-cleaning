import {
  and,
  desc,
  eq,
  ilike,
  isNull,
  or,
  SQL,
  sql
} from "drizzle-orm";
import { NextRequest } from "next/server";
import { getDb } from "@/lib/db/client";
import { bookings, locations, services } from "@/lib/db/schema";
import { requireAdminOrThrow } from "@/lib/auth/guard";
import { badRequest, ok, serverError, unauthorized } from "@/lib/api/json";
import {
  bookingFilterSchema,
  bookingInputSchema
} from "@/lib/validation/booking";
import { zodErrorToFieldErrors } from "@/lib/validation/common";
import { parseAppointment, parseDateText } from "@/lib/dates/parseAppointment";

function serializeBookingRow(
  row: {
    id: string;
    first_name: string;
    last_name: string | null;
    email: string;
    phone: string | null;
    place_id: string; // locationId alias
    location_name: string | null;
    service_id: string; // serviceId alias
    service_name: string | null;
    bedrooms: number;
    bathrooms: number;
    sqft: number;
    appointment_date: string;
    appointment_time: string;
    price: string;
    status: string;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
  }
) {
  return {
    ...row,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
    deleted_at: row.deleted_at ? row.deleted_at.toISOString() : null
  };
}

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await requireAdminOrThrow();
    if (!isAdmin) {
      return unauthorized();
    }

    const db = getDb();

    const parsedFilters = bookingFilterSchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams)
    );

    if (!parsedFilters.success) {
      return badRequest(
        "Invalid query parameters",
        zodErrorToFieldErrors(parsedFilters.error)
      );
    }

    const { status, q, start, end, includeDeleted, page, pageSize } =
      parsedFilters.data;

    const conditions: SQL[] = [];

    if (!includeDeleted) {
      conditions.push(isNull(bookings.deletedAt));
    }

    if (status) {
      conditions.push(eq(bookings.status, status as "pending" | "confirmed" | "completed" | "cancelled" | "rescheduled" | "no_show"));
    }

    if (q) {
      const term = `%${q}%`;
      const queryCondition = or(
        ilike(bookings.firstName, term),
        ilike(bookings.lastName, term),
        ilike(bookings.email, term)
      );

      if (queryCondition) {
        conditions.push(queryCondition);
      }
    }

    if (start) {
      const startDate = parseDateText(start);
      if (!startDate) {
        return badRequest("Invalid start date", {
          start: "Use YYYY-MM-DD, MM/DD/YYYY, or Month DD YYYY"
        });
      }

      conditions.push(
        sql`coalesce(${bookings.appointmentDate}, (${bookings.createdAt})::date) >= ${startDate}`
      );
    }

    if (end) {
      const endDate = parseDateText(end);
      if (!endDate) {
        return badRequest("Invalid end date", {
          end: "Use YYYY-MM-DD, MM/DD/YYYY, or Month DD YYYY"
        });
      }

      conditions.push(
        sql`coalesce(${bookings.appointmentDate}, (${bookings.createdAt})::date) <= ${endDate}`
      );
    }

    const whereClause = conditions.length ? and(...conditions) : undefined;
    const offset = (page - 1) * pageSize;

    const [countResult, rows] = await Promise.all([
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(bookings)
        .where(whereClause),
      db
        .select({
          id: bookings.id,
          first_name: bookings.firstName,
          last_name: bookings.lastName,
          email: bookings.email,
          phone: bookings.phone,
          place_id: bookings.locationId,
          location_name: locations.name,
          service_id: bookings.serviceId,
          service_name: services.name,
          bedrooms: bookings.bedrooms,
          bathrooms: bookings.bathrooms,
          sqft: bookings.sqft,
          appointment_date: bookings.appointmentDate,
          appointment_time: bookings.appointmentTime,
          price: bookings.finalPrice,
          status: bookings.status,
          created_at: bookings.createdAt,
          updated_at: bookings.updatedAt,
          deleted_at: bookings.deletedAt
        })
        .from(bookings)
        .leftJoin(locations, eq(bookings.locationId, locations.id))
        .leftJoin(services, eq(bookings.serviceId, services.id))
        .where(whereClause)
        .orderBy(desc(bookings.createdAt))
        .limit(pageSize)
        .offset(offset)
    ]);

    const total = countResult[0]?.total ?? 0;

    return ok({
      items: rows.map(serializeBookingRow),
      page,
      pageSize,
      total,
      pageCount: Math.max(1, Math.ceil(total / pageSize))
    });
  } catch {
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await requireAdminOrThrow();
    if (!isAdmin) {
      return unauthorized();
    }

    const db = getDb();

    const body = await request.json().catch(() => null);
    const parsed = bookingInputSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Invalid payload", zodErrorToFieldErrors(parsed.error));
    }

    const data = parsed.data;

    const [location] = await db
      .select({ id: locations.id })
      .from(locations)
      .where(and(eq(locations.id, data.place_id), isNull(locations.deletedAt)))
      .limit(1);

    if (!location) {
      return badRequest("Invalid location", {
        place_id: "Location not found or archived"
      });
    }

    const normalizedAppointment = parseAppointment(data.date, data.time);

    if (!normalizedAppointment.appointmentDate || !normalizedAppointment.appointmentTime) {
      return badRequest("Invalid date or time", {
        date: "Invalid date or time format"
      });
    }

    const price = data.price.toString();

    const [inserted] = await db
      .insert(bookings)
      .values({
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        phone: data.phone,
        locationId: data.place_id,
        serviceId: data.service_id!,
        frequency: data.frequency,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        sqft: data.sqft,
        appointmentDate: normalizedAppointment.appointmentDate,
        appointmentTime: normalizedAppointment.appointmentTime,
        basePrice: price,
        finalPrice: price,
        status: data.status,
        updatedAt: new Date()
      })
      .returning({ id: bookings.id });

    return ok({ id: inserted.id }, { status: 201 });
  } catch {
    return serverError();
  }
}
