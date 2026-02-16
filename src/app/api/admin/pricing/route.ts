import { and, asc, isNull, sql, SQL } from "drizzle-orm";
import { NextRequest } from "next/server";
import { getDb } from "@/lib/db/client";
import { pricing } from "@/lib/db/schema";
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

    const { includeDeleted, page, pageSize } = parsedFilters.data;
    const conditions: SQL[] = [];

    if (!includeDeleted) {
      conditions.push(isNull(pricing.deletedAt));
    }

    const whereClause = conditions.length ? and(...conditions) : undefined;
    const offset = (page - 1) * pageSize;

    const [countRows, rows] = await Promise.all([
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(pricing)
        .where(whereClause),
      db
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
        .where(whereClause)
        .orderBy(asc(pricing.createdAt))
        .limit(pageSize)
        .offset(offset)
    ]);

    const total = countRows[0]?.total ?? 0;

    return ok({
      items: rows.map((row) => ({
        ...row,
        sqft: Number(row.sqft),
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

    const [inserted] = await db
      .insert(pricing)
      .values({
        base: parsed.data.base,
        bed: parsed.data.bed,
        bath: parsed.data.bath,
        sqft: parsed.data.sqft.toString(),
        updatedAt: new Date()
      })
      .returning({ id: pricing.id });

    return ok({ id: inserted.id }, { status: 201 });
  } catch {
    return serverError();
  }
}
