"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { locations, pricing } from "@/lib/db/schema";
import { requireAdminOrThrow } from "@/lib/auth/guard";

export type ActionState = {
    success?: boolean;
    error?: string;
};

export async function createLocationAction(
    _prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    try {
        const isAdmin = await requireAdminOrThrow();
        if (!isAdmin) return { error: "Unauthorized" };

        const name = formData.get("name") as string;
        const pricingId = formData.get("pricing_id") as string;

        if (!name || !pricingId) {
            return { error: "Name and Pricing are required" };
        }

        const db = getDb();

        // Verify pricing exists
        const [pricingRow] = await db
            .select({ id: pricing.id })
            .from(pricing)
            .where(and(eq(pricing.id, pricingId), isNull(pricing.deletedAt)))
            .limit(1);

        if (!pricingRow) {
            return { error: "Pricing not found" };
        }

        await db.insert(locations).values({
            name,
            pricingId,
            updatedAt: new Date(),
        });

        revalidatePath("/admin/locations");
        return { success: true };
    } catch (error) {
        console.error("Create location error:", error);
        return { error: "Failed to create location" };
    }
}

export async function updateLocationAction(
    id: string,
    _prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    try {
        const isAdmin = await requireAdminOrThrow();
        if (!isAdmin) return { error: "Unauthorized" };

        const name = formData.get("name") as string;
        const pricingId = formData.get("pricing_id") as string;

        if (!name || !pricingId) {
            return { error: "Name and Pricing are required" };
        }

        const db = getDb();

        await db
            .update(locations)
            .set({
                name,
                pricingId,
                updatedAt: new Date(),
            })
            .where(eq(locations.id, id));

        revalidatePath("/admin/locations");
        return { success: true };
    } catch (error) {
        console.error("Update location error:", error);
        return { error: "Failed to update location" };
    }
}

export async function deleteLocationAction(id: string): Promise<ActionState> {
    try {
        const isAdmin = await requireAdminOrThrow();
        if (!isAdmin) return { error: "Unauthorized" };

        const db = getDb();
        await db
            .update(locations)
            .set({ deletedAt: new Date() })
            .where(eq(locations.id, id));

        revalidatePath("/admin/locations");
        return { success: true };
    } catch (error) {
        console.error("Delete location error:", error);
        return { error: "Failed to delete location" };
    }
}
