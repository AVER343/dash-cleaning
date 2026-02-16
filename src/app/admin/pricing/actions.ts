"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { pricing } from "@/lib/db/schema";
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

        const base = Number(formData.get("base"));
        const bed = Number(formData.get("bed"));
        const bath = Number(formData.get("bath"));
        const sqft = Number(formData.get("sqft"));

        if (isNaN(base) || isNaN(bed) || isNaN(bath) || isNaN(sqft)) {
            return { error: "Invalid numeric values" };
        }

        const db = getDb();
        await db.insert(pricing).values({
            base,
            bed,
            bath,
            sqft: String(sqft), // API expects numeric/decimal but DB schema checks might vary, usually drizzle handles it if mapped correctly. 
            // schema.ts says: sqft: numeric("sqft", { precision: 10, scale: 2 }).notNull()
            // Drizzle usually expects string for numeric/decimal to preserve precision.
            updatedAt: new Date(),
        });

        revalidatePath("/admin/pricing");
        return { success: true };
    } catch (error) {
        console.error("Create pricing error:", error);
        return { error: "Failed to create pricing" };
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

        const base = Number(formData.get("base"));
        const bed = Number(formData.get("bed"));
        const bath = Number(formData.get("bath"));
        const sqft = Number(formData.get("sqft"));

        if (isNaN(base) || isNaN(bed) || isNaN(bath) || isNaN(sqft)) {
            return { error: "Invalid numeric values" };
        }

        const db = getDb();
        await db
            .update(pricing)
            .set({
                base,
                bed,
                bath,
                sqft: String(sqft),
                updatedAt: new Date(),
            })
            .where(eq(pricing.id, id));

        revalidatePath("/admin/pricing");
        return { success: true };
    } catch (error) {
        console.error("Update pricing error:", error);
        return { error: "Failed to update pricing" };
    }
}

export async function deletePricingAction(id: string): Promise<ActionState> {
    try {
        const isAdmin = await requireAdminOrThrow();
        if (!isAdmin) return { error: "Unauthorized" };

        const db = getDb();
        await db
            .update(pricing)
            .set({ deletedAt: new Date() })
            .where(eq(pricing.id, id));

        revalidatePath("/admin/pricing");
        return { success: true };
    } catch (error) {
        console.error("Delete pricing error:", error);
        return { error: "Failed to delete pricing" };
    }
}
