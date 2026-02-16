import { z } from "zod";
import { nonNegativeInt } from "@/lib/validation/common";

export const pricingInputSchema = z.object({
  base: nonNegativeInt,
  bed: nonNegativeInt,
  bath: nonNegativeInt,
  sqft: z.coerce.number().min(0, "Sqft multiplier must be 0 or greater")
});

export const pricingUpdateSchema = pricingInputSchema.partial();

export const pricingFilterSchema = z.object({
  includeDeleted: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20)
});

export type PricingInput = z.infer<typeof pricingInputSchema>;
