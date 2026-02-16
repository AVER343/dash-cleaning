import { z } from "zod";
import { BOOKING_STATUSES } from "@/lib/db/schema";
import { nonNegativeInt, uuidSchema } from "@/lib/validation/common";

export const bookingStatusSchema = z.enum(BOOKING_STATUSES);

export const bookingInputSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required"),
  last_name: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("Must be a valid email"),
  phone: z.string().trim().min(5, "Phone is required"),
  place_id: uuidSchema,
  service_type: z.string().trim().min(1, "Service type is required"),
  bedrooms: nonNegativeInt,
  bathrooms: nonNegativeInt,
  sqft: nonNegativeInt,
  date: z.string().trim().min(1, "Date is required"),
  time: z.string().trim().min(1, "Time is required"),
  price: nonNegativeInt,
  status: bookingStatusSchema.default("pending")
});

export const bookingUpdateSchema = bookingInputSchema.partial();

export const bookingFilterSchema = z.object({
  status: bookingStatusSchema.optional(),
  q: z.string().trim().optional(),
  start: z.string().trim().optional(),
  end: z.string().trim().optional(),
  includeDeleted: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(10)
});

export type BookingInput = z.infer<typeof bookingInputSchema>;
export type BookingUpdateInput = z.infer<typeof bookingUpdateSchema>;
