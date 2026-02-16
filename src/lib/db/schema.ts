import {
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uuid
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "completed",
  "cancelled"
]);

export const pricing = pgTable(
  "pricing",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    base: integer("base").notNull(),
    bed: integer("bed").notNull(),
    bath: integer("bath").notNull(),
    sqft: numeric("sqft", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true })
  },
  (table) => ({
    deletedAtIdx: index("pricing_deleted_at_idx").on(table.deletedAt)
  })
);

export const locations = pgTable(
  "locations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    pricingId: uuid("pricing_id")
      .notNull()
      .references(() => pricing.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true })
  },
  (table) => ({
    deletedAtIdx: index("locations_deleted_at_idx").on(table.deletedAt)
  })
);

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    placeId: uuid("place_id")
      .notNull()
      .references(() => locations.id),
    serviceType: text("service_type").notNull(),
    bedrooms: integer("bedrooms").notNull(),
    bathrooms: integer("bathrooms").notNull(),
    sqft: integer("sqft").notNull(),
    dateText: text("date").notNull(),
    timeText: text("time").notNull(),
    appointmentDate: date("appointment_date"),
    appointmentTime: time("appointment_time", { withTimezone: false }),
    price: integer("price").notNull(),
    status: bookingStatusEnum("status").default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true })
  },
  (table) => ({
    statusDeletedIdx: index("bookings_status_deleted_idx").on(
      table.status,
      table.deletedAt
    ),
    appointmentDeletedIdx: index("bookings_appointment_deleted_idx").on(
      table.appointmentDate,
      table.deletedAt
    ),
    createdAtIdx: index("bookings_created_at_idx").on(table.createdAt),
    placeIdIdx: index("bookings_place_id_idx").on(table.placeId),
    lowerEmailIdx: index("bookings_lower_email_idx").on(sql`lower(${table.email})`)
  })
);

export const pricingRelations = relations(pricing, ({ many }) => ({
  locations: many(locations)
}));

export const locationRelations = relations(locations, ({ one, many }) => ({
  pricing: one(pricing, {
    fields: [locations.pricingId],
    references: [pricing.id]
  }),
  bookings: many(bookings)
}));

export const bookingRelations = relations(bookings, ({ one }) => ({
  location: one(locations, {
    fields: [bookings.placeId],
    references: [locations.id]
  })
}));

export type BookingStatus = (typeof bookingStatusEnum.enumValues)[number];
export const BOOKING_STATUSES = bookingStatusEnum.enumValues;
