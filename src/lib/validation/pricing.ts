import { z } from "zod";
import { uuidSchema, nonNegativeInt } from "@/lib/validation/common";

export const pricingInputSchema = z.object({
  service_id: uuidSchema,
  location_id: uuidSchema.optional().nullable(),
  bedrooms: nonNegativeInt,
  bathrooms: nonNegativeInt,
  frequency: z.enum(["one_time", "weekly", "bi_weekly", "monthly"]),
  base_price: z.coerce.number().min(0, "Price must be 0 or greater"),
});

export const pricingUpdateSchema = pricingInputSchema.partial();

export const pricingFilterSchema = z.object({
  includeDeleted: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  service_id: uuidSchema.optional(),
  location_id: uuidSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20)
});

export type PricingInput = z.infer<typeof pricingInputSchema>;
export type PricingFilter = z.infer<typeof pricingFilterSchema>;
