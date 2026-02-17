import { and, eq, isNull } from "drizzle-orm";
import { NextRequest } from "next/server";
import { getDb } from "@/lib/db/client";
import { basePricing, services, locations } from "@/lib/db/schema";
import { requireAdminOrThrow } from "@/lib/auth/guard";
import {
  badRequest,
  notFound,
  ok,
  serverError,
  unauthorized
} from "@/lib/api/json";
import { pricingUpdateSchema } from "@/lib/validation/pricing";
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
        deleted_at: basePricing.deletedAt
      })
      .from(basePricing)
      .leftJoin(services, eq(basePricing.serviceId, services.id))
      .leftJoin(locations, eq(basePricing.locationId, locations.id))
      .where(eq(basePricing.id, id))
      .limit(1);

    if (!row) {
      return notFound("Pricing row not found");
    }

    return ok({
      ...row,
      base_price: Number(row.base_price),
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
    const parsed = pricingUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Invalid payload", zodErrorToFieldErrors(parsed.error));
    }

    if (Object.keys(parsed.data).length === 0) {
      return badRequest("No fields were provided");
    }

    const [updated] = await db
      .update(basePricing)
      .set({
        serviceId: parsed.data.service_id,
        locationId: parsed.data.location_id,
        bedrooms: parsed.data.bedrooms,
        bathrooms: parsed.data.bathrooms,
        frequency: parsed.data.frequency,
        basePrice: parsed.data.base_price?.toString(),
        updatedAt: new Date()
      })
      .where(eq(basePricing.id, id))
      .returning({ id: basePricing.id });

    if (!updated) {
      return notFound("Pricing row not found");
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

    const [updated] = await db
      .update(basePricing)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(eq(basePricing.id, id), isNull(basePricing.deletedAt)))
      .returning({ id: basePricing.id });

    if (!updated) {
      return notFound("Pricing row not found or already deleted");
    }

    return ok({ id: updated.id, deleted: true });
  } catch {
    return serverError();
  }
}
