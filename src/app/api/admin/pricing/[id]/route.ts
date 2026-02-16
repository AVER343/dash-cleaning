import { and, eq, isNull, sql } from "drizzle-orm";
import { NextRequest } from "next/server";
import { getDb } from "@/lib/db/client";
import { locations, pricing } from "@/lib/db/schema";
import { requireAdminOrThrow } from "@/lib/auth/guard";
import {
  badRequest,
  conflict,
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
        id: pricing.id,
        base: pricing.base,
        bed: pricing.bed,
        bath: pricing.bath,
        sqft: pricing.sqft,
        created_at: pricing.createdAt,
        updated_at: pricing.updatedAt,
        deleted_at: pricing.deletedAt
      })
      .from(pricing)
      .where(eq(pricing.id, id))
      .limit(1);

    if (!row) {
      return notFound("Pricing row not found");
    }

    return ok({
      ...row,
      sqft: Number(row.sqft),
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
      .update(pricing)
      .set({
        base: parsed.data.base,
        bed: parsed.data.bed,
        bath: parsed.data.bath,
        sqft:
          parsed.data.sqft === undefined ? undefined : parsed.data.sqft.toString(),
        updatedAt: new Date()
      })
      .where(eq(pricing.id, id))
      .returning({ id: pricing.id });

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

    const [activeLocations] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(locations)
      .where(and(eq(locations.pricingId, id), isNull(locations.deletedAt)))
      .limit(1);

    if ((activeLocations?.total ?? 0) > 0) {
      return conflict("Cannot delete pricing with active locations");
    }

    const [updated] = await db
      .update(pricing)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(eq(pricing.id, id), isNull(pricing.deletedAt)))
      .returning({ id: pricing.id });

    if (!updated) {
      return notFound("Pricing row not found or already deleted");
    }

    return ok({ id: updated.id, deleted: true });
  } catch {
    return serverError();
  }
}
