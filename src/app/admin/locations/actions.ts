"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { locations } from "@/lib/db/schema";
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

        if (!name) {
            return { error: "Name is required" };
        }

        const db = getDb();

        await db.insert(locations).values({
            name,
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

        if (!name) {
            return { error: "Name is required" };
        }

        const db = getDb();

        await db
            .update(locations)
            .set({
                name,
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
