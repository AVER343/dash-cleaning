"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
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

        if (!normalized.appointmentDate || !normalized.appointmentTime) {
            return { error: "Invalid date or time format" };
        }

        // Default basePrice to finalPrice for now if not calculated separately
        const price = data.price.toString();

        await db.insert(bookings).values({
            firstName: data.first_name,
            lastName: data.last_name,
            email: data.email,
            phone: data.phone,
            locationId: data.place_id,
            serviceId: data.service_id!,
            frequency: data.frequency,
            bedrooms: data.bedrooms,
            bathrooms: data.bathrooms,
            sqft: data.sqft,
            appointmentDate: normalized.appointmentDate,
            appointmentTime: normalized.appointmentTime,
            basePrice: price,
            finalPrice: price,
            addOnTotal: "0",
            status: data.status,
            paymentStatus: data.payment_status as "pending" | "paid" | "failed" | "refunded",
            notes: data.notes,
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

        if ((data.date || data.time) && (!normalized?.appointmentDate || !normalized?.appointmentTime)) {
            return { error: "Invalid date or time format" };
        }

        const price = data.price?.toString();

        await db
            .update(bookings)
            .set({
                firstName: data.first_name,
                lastName: data.last_name,
                email: data.email,
                phone: data.phone,
                locationId: data.place_id,
                serviceId: data.service_id,
                frequency: data.frequency,
                bedrooms: data.bedrooms,
                bathrooms: data.bathrooms,
                sqft: data.sqft,
                appointmentDate: normalized?.appointmentDate ?? undefined,
                appointmentTime: normalized?.appointmentTime ?? undefined,
                basePrice: price,
                finalPrice: price,
                status: data.status,
                paymentStatus: data.payment_status as "pending" | "paid" | "failed" | "refunded",
                notes: data.notes,
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
            .set({
                status: 'cancelled'
            })
            .where(eq(bookings.id, id));

        revalidatePath("/admin/bookings");
        return { success: true };
    } catch (error) {
        console.error("Delete booking error:", error);
        return { error: "Failed to delete booking" };
    }
}
