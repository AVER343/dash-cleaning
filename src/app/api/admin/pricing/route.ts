import { and, isNull, sql, SQL, eq, desc } from "drizzle-orm";
import { NextRequest } from "next/server";
import { getDb } from "@/lib/db/client";
import { basePricing, services, locations } from "@/lib/db/schema";
import { requireAdminOrThrow } from "@/lib/auth/guard";
import { badRequest, ok, serverError, unauthorized } from "@/lib/api/json";
import { pricingFilterSchema, pricingInputSchema } from "@/lib/validation/pricing";
import { zodErrorToFieldErrors } from "@/lib/validation/common";

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await requireAdminOrThrow();
    if (!isAdmin) {
      return unauthorized();
    }

    const db = getDb();

    const parsedFilters = pricingFilterSchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams)
    );

    if (!parsedFilters.success) {
      return badRequest(
        "Invalid query parameters",
        zodErrorToFieldErrors(parsedFilters.error)
      );
    }

    const { includeDeleted, page, pageSize, service_id, location_id } = parsedFilters.data;
    const conditions: SQL[] = [];

    if (!includeDeleted) {
      conditions.push(isNull(basePricing.deletedAt));
    }

    if (service_id) {
      conditions.push(eq(basePricing.serviceId, service_id));
    }

    if (location_id) {
      conditions.push(eq(basePricing.locationId, location_id));
    }

    const whereClause = conditions.length ? and(...conditions) : undefined;
    const offset = (page - 1) * pageSize;

    const [countRows, rows] = await Promise.all([
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(basePricing)
        .where(whereClause),
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
          deleted_at: basePricing.deletedAt
        })
        .from(basePricing)
        .leftJoin(services, eq(basePricing.serviceId, services.id))
        .leftJoin(locations, eq(basePricing.locationId, locations.id))
        .where(whereClause)
        .orderBy(desc(basePricing.createdAt))
        .limit(pageSize)
        .offset(offset)
    ]);

    const total = countRows[0]?.total ?? 0;

    return ok({
      items: rows.map((row) => ({
        ...row,
        base_price: Number(row.base_price),
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at.toISOString(),
        deleted_at: row.deleted_at ? row.deleted_at.toISOString() : null
      })),
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
    const parsed = pricingInputSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Invalid payload", zodErrorToFieldErrors(parsed.error));
    }

    const data = parsed.data;

    // Verify service exists
    const [service] = await db
      .select({ id: services.id })
      .from(services)
      .where(and(eq(services.id, data.service_id), isNull(services.deletedAt)))
      .limit(1);

    if (!service) {
      return badRequest("Invalid service_id");
    }

    // Verify location if provided
    if (data.location_id) {
      const [location] = await db
        .select({ id: locations.id })
        .from(locations)
        .where(and(eq(locations.id, data.location_id), isNull(locations.deletedAt)))
        .limit(1);

      if (!location) {
        return badRequest("Invalid location_id");
      }
    }

    const [inserted] = await db
      .insert(basePricing)
      .values({
        serviceId: data.service_id,
        locationId: data.location_id,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        frequency: data.frequency,
        basePrice: data.base_price.toString(),
        updatedAt: new Date()
      })
      .returning({ id: basePricing.id });

    return ok({ id: inserted.id }, { status: 201 });
  } catch {
    return serverError();
  }
}
