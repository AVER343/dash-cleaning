"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { bookings, locations } from "@/lib/db/schema";
import { requireAdminOrThrow } from "@/lib/auth/guard";
import { bookingInputSchema, bookingUpdateSchema } from "@/lib/validation/booking";
import { parseAppointment } from "@/lib/dates/parseAppointment";

export type ActionState = {
    success?: boolean;
    error?: string;
    fieldErrors?: Record<string, string[]>;
};

export async function createBookingAction(
    _prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    try {
        const isAdmin = await requireAdminOrThrow();
        if (!isAdmin) {
            return { error: "Unauthorized" };
        }

        const rawData = Object.fromEntries(formData.entries());
        const parsed = bookingInputSchema.safeParse(rawData);

        if (!parsed.success) {
            return {
                error: "Invalid input",
                fieldErrors: parsed.error.flatten().fieldErrors,
            };
        }

        const data = parsed.data;
        const db = getDb();

        // Verify location exists
        const [location] = await db
            .select({ id: locations.id })
            .from(locations)
            .where(and(eq(locations.id, data.place_id), isNull(locations.deletedAt)))
            .limit(1);

        if (!location) {
            return { error: "Location not found or archived" };
        }

        const normalized = parseAppointment(data.date, data.time);

        await db.insert(bookings).values({
            firstName: data.first_name,
            lastName: data.last_name,
            email: data.email,
            phone: data.phone,
            placeId: data.place_id,
            serviceType: data.service_type,
            bedrooms: data.bedrooms,
            bathrooms: data.bathrooms,
            sqft: data.sqft,
            dateText: data.date,
            timeText: data.time,
            appointmentDate: normalized.appointmentDate,
            appointmentTime: normalized.appointmentTime,
            price: data.price,
            status: data.status,
            updatedAt: new Date(),
        });

        revalidatePath("/admin/bookings");
        return { success: true };
    } catch (error) {
        console.error("Create booking error:", error);
        return { error: "Failed to create booking" };
    }
}

export async function updateBookingAction(
    id: string,
    _prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    try {
        const isAdmin = await requireAdminOrThrow();
        if (!isAdmin) {
            return { error: "Unauthorized" };
        }

        const rawData = Object.fromEntries(formData.entries());
        const parsed = bookingUpdateSchema.safeParse(rawData);

        if (!parsed.success) {
            return {
                error: "Invalid input",
                fieldErrors: parsed.error.flatten().fieldErrors,
            };
        }

        const data = parsed.data;
        const db = getDb();

        const normalized =
            data.date && data.time ? parseAppointment(data.date, data.time) : null;

        await db
            .update(bookings)
            .set({
                firstName: data.first_name,
                lastName: data.last_name,
                email: data.email,
                phone: data.phone,
                placeId: data.place_id,
                serviceType: data.service_type,
                bedrooms: data.bedrooms,
                bathrooms: data.bathrooms,
                sqft: data.sqft,
                dateText: data.date,
                timeText: data.time,
                appointmentDate: normalized?.appointmentDate,
                appointmentTime: normalized?.appointmentTime,
                price: data.price,
                status: data.status,
                updatedAt: new Date(),
            })
            .where(eq(bookings.id, id));

        revalidatePath("/admin/bookings");
        return { success: true };
    } catch (error) {
        console.error("Update booking error:", error);
        return { error: "Failed to update booking" };
    }
}

export async function deleteBookingAction(id: string): Promise<ActionState> {
    try {
        const isAdmin = await requireAdminOrThrow();
        if (!isAdmin) {
            return { error: "Unauthorized" };
        }

        const db = getDb();
        await db
            .update(bookings)
            .set({ deletedAt: new Date() })
            .where(eq(bookings.id, id));

        revalidatePath("/admin/bookings");
        return { success: true };
    } catch (error) {
        console.error("Delete booking error:", error);
        return { error: "Failed to delete booking" };
    }
}
