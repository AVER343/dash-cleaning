import { z } from "zod";
import { uuidSchema } from "@/lib/validation/common";

export const locationInputSchema = z.object({
  name: z.string().trim().min(1, "Location name is required"),
  pricing_id: uuidSchema
});

export const locationUpdateSchema = locationInputSchema.partial();

export const locationFilterSchema = z.object({
  includeDeleted: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20)
});

export type LocationInput = z.infer<typeof locationInputSchema>;
