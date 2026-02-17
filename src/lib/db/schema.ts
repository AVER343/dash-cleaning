import {
  pgTable,
  uuid,
  text,
  timestamp,
  decimal,
  integer,
  boolean,
  pgEnum,
  date,
  time,
  index,
  uniqueIndex
} from "drizzle-orm/pg-core";
import { sql, isNull } from "drizzle-orm";



/* =========================
   ENUMS
========================= */

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "rescheduled",
  "no_show"
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "authorized",
  "paid",
  "failed",
  "refunded"
]);

export const frequencyEnum = pgEnum("cleaning_frequency", [
  "one_time",
  "weekly",
  "bi_weekly",
  "monthly"
]);

export const priceTypeEnum = pgEnum("price_type", [
  "flat",
  "per_unit",
  "range",
  "rule_based"
]);

export const promoTypeEnum = pgEnum("promo_type", [
  "popup",
  "seasonal",
  "manual_override"
]);

export const adjustmentTypeEnum = pgEnum("adjustment_type", [
  "percentage",
  "flat"
]);



/* =========================
   CORE TABLES
========================= */

export const locations = pgTable("locations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const services = pgTable("services", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});



/* =========================
   BASE PRICING MATRIX
   (bed/bath/frequency/service)
========================= */

export const basePricing = pgTable("base_pricing", {
  id: uuid("id").defaultRandom().primaryKey(),
  serviceId: uuid("service_id")
    .references(() => services.id, { onDelete: "cascade" })
    .notNull(),
  locationId: uuid("location_id")
    .references(() => locations.id, { onDelete: "cascade" }),

  bedrooms: integer("bedrooms").notNull(),
  bathrooms: integer("bathrooms").notNull(),
  frequency: frequencyEnum("frequency").notNull(),

  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),

  promoPrice: decimal("promo_price", { precision: 10, scale: 2 }),
  promoType: promoTypeEnum("promo_type"),
  promoStart: timestamp("promo_start", { withTimezone: true }),
  promoEnd: timestamp("promo_end", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  uniqueIdx: uniqueIndex("base_pricing_unique_idx")
    .on(table.serviceId, table.locationId, table.bedrooms, table.bathrooms, table.frequency)
    .where(isNull(table.deletedAt)),

  frequencyIdx: index("base_pricing_frequency_idx")
    .on(table.frequency)
    .where(isNull(table.deletedAt)),
}));



/* =========================
   ADD ONS
========================= */

export const addOns = pgTable("add_ons", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  priceType: priceTypeEnum("price_type").default("flat").notNull(),

  basePrice: decimal("base_price", { precision: 10, scale: 2 }),
  unitLabel: text("unit_label"),

  isActive: boolean("is_active").default(true).notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});



/* =========================
   ADD-ON RULE ENGINE
   (bedroom / sqft based logic)
========================= */

export const addOnPricingRules = pgTable("add_on_pricing_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  addOnId: uuid("add_on_id")
    .references(() => addOns.id, { onDelete: "cascade" })
    .notNull(),

  minBedrooms: integer("min_bedrooms"),
  maxBedrooms: integer("max_bedrooms"),

  minSqft: integer("min_sqft"),
  maxSqft: integer("max_sqft"),

  adjustmentType: adjustmentTypeEnum("adjustment_type").default("flat").notNull(),
  flatAmount: decimal("flat_amount", { precision: 10, scale: 2 }),
  percentage: decimal("percentage", { precision: 5, scale: 2 }),

  minPrice: decimal("min_price", { precision: 10, scale: 2 }),
  maxPrice: decimal("max_price", { precision: 10, scale: 2 }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  addOnRuleIdx: index("addon_rule_idx").on(table.addOnId),
}));



/* =========================
   BOOKINGS
========================= */

export const bookings = pgTable("bookings", {
  id: uuid("id").defaultRandom().primaryKey(),

  serviceId: uuid("service_id")
    .references(() => services.id)
    .notNull(),

  locationId: uuid("location_id")
    .references(() => locations.id)
    .notNull(),

  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  email: text("email").notNull(),
  phone: text("phone"),

  frequency: frequencyEnum("frequency").notNull(),

  bedrooms: integer("bedrooms").notNull(),
  bathrooms: integer("bathrooms").notNull(),
  sqft: integer("sqft").notNull(),

  appointmentDate: date("appointment_date").notNull(),
  appointmentTime: time("appointment_time").notNull(),

  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  addOnTotal: decimal("addon_total", { precision: 10, scale: 2 }).default("0").notNull(),
  finalPrice: decimal("final_price", { precision: 10, scale: 2 }).notNull(),

  status: bookingStatusEnum("status").default("pending").notNull(),
  paymentStatus: paymentStatusEnum("payment_status").default("pending").notNull(),

  notes: text("notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  slotUniqueIdx: uniqueIndex("booking_slot_unique_idx")
    .on(table.locationId, table.appointmentDate, table.appointmentTime)
    .where(sql`${table.deletedAt} IS NULL AND ${table.status} IN ('pending','confirmed')`),

  statusIdx: index("booking_status_idx")
    .on(table.status)
    .where(isNull(table.deletedAt)),
}));



/* =========================
   BOOKING ADD ONS
========================= */

export const bookingAddOns = pgTable("booking_add_ons", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookingId: uuid("booking_id")
    .references(() => bookings.id, { onDelete: "cascade" })
    .notNull(),
  addOnId: uuid("add_on_id")
    .references(() => addOns.id)
    .notNull(),

  quantity: integer("quantity").default(1).notNull(),
  calculatedPrice: decimal("calculated_price", { precision: 10, scale: 2 }).notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});



/* =========================
   PAYMENTS
========================= */

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookingId: uuid("booking_id")
    .references(() => bookings.id, { onDelete: "cascade" })
    .notNull(),

  provider: text("provider").notNull(),
  providerPaymentId: text("provider_payment_id"),

  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD").notNull(),

  status: paymentStatusEnum("status").default("pending").notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});
