import { z } from "zod";

export const locationInputSchema = z.object({
  name: z.string().trim().min(1, "Location name is required"),
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
export type LocationFilter = z.infer<typeof locationFilterSchema>;
