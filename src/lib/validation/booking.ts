import { z } from "zod";
import { bookingStatusEnum, frequencyEnum } from "@/lib/db/schema";

export const bookingStatusSchema = z.enum(bookingStatusEnum.enumValues);
export const frequencySchema = z.enum(frequencyEnum.enumValues);

export const bookingInputSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required"),
  last_name: z.string().trim().optional(),
  email: z.string().trim().email("Must be a valid email"),
  phone: z.string().trim().optional(),
  place_id: z.string().uuid("Invalid location ID"),

  service_type: z.string().trim().optional(),
  service_id: z.string().uuid("Invalid service ID").optional(),
  frequency: frequencySchema.default("one_time"),

  bedrooms: z.coerce.number().int().min(0),
  bathrooms: z.coerce.number().int().min(0),
  sqft: z.coerce.number().int().min(0),

  date: z.string().trim().min(1, "Date is required"),
  time: z.string().trim().min(1, "Time is required"),

  price: z.coerce.number().min(0),
  status: bookingStatusSchema.default("pending"),
  payment_status: z.enum(["pending", "authorized", "paid", "failed", "refunded"]).default("pending"),

  notes: z.string().optional()
});

export const bookingUpdateSchema = bookingInputSchema.partial();

export const bookingFilterSchema = z.object({
  status: bookingStatusSchema.optional(),
  q: z.string().trim().optional(),
  start: z.string().trim().optional(),
  end: z.string().trim().optional(),
  includeDeleted: z.string().optional().transform((val) => val === "true"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});

export type BookingInput = z.infer<typeof bookingInputSchema>;
export type BookingUpdateInput = z.infer<typeof bookingUpdateSchema>;
