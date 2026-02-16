import { and, eq, isNull, sql } from "drizzle-orm";
import { NextRequest } from "next/server";
import { getDb } from "@/lib/db/client";
import { bookings, locations, pricing } from "@/lib/db/schema";
import { requireAdminOrThrow } from "@/lib/auth/guard";
import {
  badRequest,
  conflict,
  notFound,
  ok,
  serverError,
  unauthorized
} from "@/lib/api/json";
import { locationUpdateSchema } from "@/lib/validation/location";
import { zodErrorToFieldErrors } from "@/lib/validation/common";

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
        id: locations.id,
        name: locations.name,
        pricing_id: locations.pricingId,
        created_at: locations.createdAt,
        updated_at: locations.updatedAt,
        deleted_at: locations.deletedAt
      })
      .from(locations)
      .where(eq(locations.id, id))
      .limit(1);

    if (!row) {
      return notFound("Location not found");
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
    const parsed = locationUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Invalid payload", zodErrorToFieldErrors(parsed.error));
    }

    if (Object.keys(parsed.data).length === 0) {
      return badRequest("No fields were provided");
    }

    if (parsed.data.pricing_id) {
      const [pricingRow] = await db
        .select({ id: pricing.id })
        .from(pricing)
        .where(and(eq(pricing.id, parsed.data.pricing_id), isNull(pricing.deletedAt)))
        .limit(1);

      if (!pricingRow) {
        return badRequest("Invalid pricing id", {
          pricing_id: "Pricing record not found or archived"
        });
      }
    }

    const [updated] = await db
      .update(locations)
      .set({
        name: parsed.data.name,
        pricingId: parsed.data.pricing_id,
        updatedAt: new Date()
      })
      .where(eq(locations.id, id))
      .returning({ id: locations.id });

    if (!updated) {
      return notFound("Location not found");
    }

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

    const [activeBookings] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(bookings)
      .where(and(eq(bookings.placeId, id), isNull(bookings.deletedAt)))
      .limit(1);

    if ((activeBookings?.total ?? 0) > 0) {
      return conflict("Cannot delete location with active bookings");
    }

    const [updated] = await db
      .update(locations)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(eq(locations.id, id), isNull(locations.deletedAt)))
      .returning({ id: locations.id });

    if (!updated) {
      return notFound("Location not found or already deleted");
    }

    return ok({ id: updated.id, deleted: true });
  } catch {
    return serverError();
  }
}
