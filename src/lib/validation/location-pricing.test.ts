import { describe, expect, it } from "vitest";
import { locationInputSchema } from "@/lib/validation/location";
import { pricingInputSchema } from "@/lib/validation/pricing";

describe("locationInputSchema", () => {
  it("accepts valid location payload", () => {
    const parsed = locationInputSchema.safeParse({
      name: "Downtown",
      pricing_id: "550e8400-e29b-41d4-a716-446655440000"
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid uuid", () => {
    const parsed = locationInputSchema.safeParse({
      name: "Downtown",
      pricing_id: "bad-id"
    });

    expect(parsed.success).toBe(false);
  });
});

describe("pricingInputSchema", () => {
  it("accepts valid pricing payload", () => {
    const parsed = pricingInputSchema.safeParse({
      base: 100,
      bed: 20,
      bath: 15,
      sqft: 0.1
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects negative values", () => {
    const parsed = pricingInputSchema.safeParse({
      base: -1,
      bed: 20,
      bath: 15,
      sqft: 0.1
    });

    expect(parsed.success).toBe(false);
  });
});
