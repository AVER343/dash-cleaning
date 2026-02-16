import { describe, expect, it } from "vitest";
import {
  bookingFilterSchema,
  bookingInputSchema,
  bookingUpdateSchema
} from "@/lib/validation/booking";

describe("bookingInputSchema", () => {
  const validInput = {
    first_name: "Ada",
    last_name: "Lovelace",
    email: "ada@example.com",
    phone: "555-1234",
    place_id: "550e8400-e29b-41d4-a716-446655440000",
    service_type: "deep_clean",
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1200,
    date: "2026-02-17",
    time: "2:30 PM",
    price: 220,
    status: "pending"
  };

  it("accepts valid booking payload", () => {
    const parsed = bookingInputSchema.safeParse(validInput);
    expect(parsed.success).toBe(true);
  });

  it("defaults status to pending", () => {
    const parsed = bookingInputSchema.parse({
      ...validInput,
      status: undefined
    });

    expect(parsed.status).toBe("pending");
  });

  it("rejects invalid email", () => {
    const parsed = bookingInputSchema.safeParse({
      ...validInput,
      email: "invalid-email"
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects negative integers", () => {
    const parsed = bookingInputSchema.safeParse({
      ...validInput,
      bedrooms: -1
    });

    expect(parsed.success).toBe(false);
  });
});

describe("bookingUpdateSchema", () => {
  it("allows partial payload", () => {
    const parsed = bookingUpdateSchema.safeParse({ status: "completed" });
    expect(parsed.success).toBe(true);
  });
});

describe("bookingFilterSchema", () => {
  it("parses defaults", () => {
    const parsed = bookingFilterSchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(10);
    expect(parsed.includeDeleted).toBe(false);
  });

  it("parses includeDeleted=true", () => {
    const parsed = bookingFilterSchema.parse({ includeDeleted: "true" });
    expect(parsed.includeDeleted).toBe(true);
  });
});
