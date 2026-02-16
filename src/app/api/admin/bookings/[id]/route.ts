import { and, eq, isNull } from "drizzle-orm";
import { NextRequest } from "next/server";
import { getDb } from "@/lib/db/client";
import { bookings, locations } from "@/lib/db/schema";
import { requireAdminOrThrow } from "@/lib/auth/guard";
import {
  badRequest,
  notFound,
  ok,
  serverError,
  unauthorized
} from "@/lib/api/json";
import { bookingUpdateSchema } from "@/lib/validation/booking";
import { zodErrorToFieldErrors } from "@/lib/validation/common";
import { parseAppointment } from "@/lib/dates/parseAppointment";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: Params) {
  try {
    const isAdmin = await requireAdminOrThrow();
    if (!isAdmin) {
      return unauthorized();
    }

    const db = getDb();

    const { id } = await context.params;

    const [row] = await db
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
        appointment_date: bookings.appointmentDate,
        appointment_time: bookings.appointmentTime,
        price: bookings.price,
        status: bookings.status,
        created_at: bookings.createdAt,
        updated_at: bookings.updatedAt,
        deleted_at: bookings.deletedAt
      })
      .from(bookings)
      .leftJoin(locations, eq(bookings.placeId, locations.id))
      .where(eq(bookings.id, id))
      .limit(1);

    if (!row) {
      return notFound("Booking not found");
    }

    return ok({
      ...row,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
      deleted_at: row.deleted_at ? row.deleted_at.toISOString() : null
    });
  } catch {
    return serverError();
  }
}

export async function PATCH(request: NextRequest, context: Params) {
  try {
    const isAdmin = await requireAdminOrThrow();
    if (!isAdmin) {
      return unauthorized();
    }

    const db = getDb();

    const { id } = await context.params;

    const body = await request.json().catch(() => null);
    const parsed = bookingUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Invalid payload", zodErrorToFieldErrors(parsed.error));
    }

    if (Object.keys(parsed.data).length === 0) {
      return badRequest("No fields were provided");
    }

    const [existing] = await db
      .select({
        id: bookings.id,
        date: bookings.dateText,
        time: bookings.timeText
      })
      .from(bookings)
      .where(eq(bookings.id, id))
      .limit(1);

    if (!existing) {
      return notFound("Booking not found");
    }

    if (parsed.data.place_id) {
      const [location] = await db
        .select({ id: locations.id })
        .from(locations)
        .where(and(eq(locations.id, parsed.data.place_id), isNull(locations.deletedAt)))
        .limit(1);

      if (!location) {
        return badRequest("Invalid location", {
          place_id: "Location not found or archived"
        });
      }
    }

    const mergedDate = parsed.data.date ?? existing.date;
    const mergedTime = parsed.data.time ?? existing.time;
    const normalizedAppointment = parseAppointment(mergedDate, mergedTime);

    const [updated] = await db
      .update(bookings)
      .set({
        firstName: parsed.data.first_name,
        lastName: parsed.data.last_name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        placeId: parsed.data.place_id,
        serviceType: parsed.data.service_type,
        bedrooms: parsed.data.bedrooms,
        bathrooms: parsed.data.bathrooms,
        sqft: parsed.data.sqft,
        dateText: parsed.data.date,
        timeText: parsed.data.time,
        appointmentDate: normalizedAppointment.appointmentDate,
        appointmentTime: normalizedAppointment.appointmentTime,
        price: parsed.data.price,
        status: parsed.data.status,
        updatedAt: new Date()
      })
      .where(eq(bookings.id, id))
      .returning({ id: bookings.id });

    return ok({ id: updated.id });
  } catch {
    return serverError();
  }
}

export async function DELETE(_request: NextRequest, context: Params) {
  try {
    const isAdmin = await requireAdminOrThrow();
    if (!isAdmin) {
      return unauthorized();
    }

    const db = getDb();

    const { id } = await context.params;

    const [updated] = await db
      .update(bookings)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(eq(bookings.id, id), isNull(bookings.deletedAt)))
      .returning({ id: bookings.id });

    if (!updated) {
      return notFound("Booking not found or already deleted");
    }

    return ok({ id: updated.id, deleted: true });
  } catch {
    return serverError();
  }
}
