"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { basePricing } from "@/lib/db/schema";
import { requireAdminOrThrow } from "@/lib/auth/guard";

export type ActionState = {
    success?: boolean;
    error?: string;
};

export async function createPricingAction(
    _prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    try {
        const isAdmin = await requireAdminOrThrow();
        if (!isAdmin) return { error: "Unauthorized" };

        const service_id = formData.get("service_id") as string;
        const location_id = formData.get("location_id") as string; // Optional (empty string if not selected)
        const bedrooms = Number(formData.get("bedrooms"));
        const bathrooms = Number(formData.get("bathrooms"));
        const frequency = formData.get("frequency") as "one_time" | "weekly" | "bi_weekly" | "monthly";
        const base_price = Number(formData.get("base_price"));

        if (!service_id || isNaN(bedrooms) || isNaN(bathrooms) || isNaN(base_price) || !frequency) {
            return { error: "Missing required fields" };
        }

        const db = getDb();
        await db.insert(basePricing).values({
            serviceId: service_id,
            locationId: location_id || null, // Handle empty string as null
            bedrooms,
            bathrooms,
            frequency,
            basePrice: base_price.toString(),
            updatedAt: new Date(),
        });

        revalidatePath("/admin/pricing");
        return { success: true };
    } catch (error) {
        console.error("Create pricing error:", error);
        return { error: "Failed to create pricing rule" };
    }
}

export async function updatePricingAction(
    id: string,
    _prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    try {
        const isAdmin = await requireAdminOrThrow();
        if (!isAdmin) return { error: "Unauthorized" };

        const service_id = formData.get("service_id") as string;
        const location_id = formData.get("location_id") as string;
        const bedrooms = Number(formData.get("bedrooms"));
        const bathrooms = Number(formData.get("bathrooms"));
        const frequency = formData.get("frequency") as "one_time" | "weekly" | "bi_weekly" | "monthly";
        const base_price = Number(formData.get("base_price"));

        if (!service_id || isNaN(bedrooms) || isNaN(bathrooms) || isNaN(base_price) || !frequency) {
            return { error: "Missing required fields" };
        }

        const db = getDb();
        await db
            .update(basePricing)
            .set({
                serviceId: service_id,
                locationId: location_id || null,
                bedrooms,
                bathrooms,
                frequency,
                basePrice: base_price.toString(),
                updatedAt: new Date(),
            })
            .where(eq(basePricing.id, id));

        revalidatePath("/admin/pricing");
        return { success: true };
    } catch (error) {
        console.error("Update pricing error:", error);
        return { error: "Failed to update pricing rule" };
    }
}

export async function deletePricingAction(id: string): Promise<ActionState> {
    try {
        const isAdmin = await requireAdminOrThrow();
        if (!isAdmin) return { error: "Unauthorized" };

        const db = getDb();
        await db
            .update(basePricing)
            .set({ deletedAt: new Date() })
            .where(eq(basePricing.id, id));

        revalidatePath("/admin/pricing");
        return { success: true };
    } catch (error) {
        console.error("Delete pricing error:", error);
        return { error: "Failed to delete pricing rule" };
    }
}
