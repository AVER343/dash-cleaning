import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const nonNegativeInt = z.coerce
  .number()
  .int("Must be an integer")
  .min(0, "Must be 0 or greater");

export function zodErrorToFieldErrors(error: z.ZodError) {
  return error.issues.reduce<Record<string, string>>((acc, issue) => {
    const key = issue.path.join(".") || "root";
    if (!acc[key]) {
      acc[key] = issue.message;
    }
    return acc;
  }, {});
}
