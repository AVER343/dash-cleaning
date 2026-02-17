DO $$ BEGIN
 CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'completed', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"place_id" uuid NOT NULL,
	"service_type" text NOT NULL,
	"bedrooms" integer NOT NULL,
	"bathrooms" integer NOT NULL,
	"sqft" integer NOT NULL,
	"date" text NOT NULL,
	"time" text NOT NULL,
	"appointment_date" date,
	"appointment_time" time,
	"price" integer NOT NULL,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"pricing_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pricing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"base" integer NOT NULL,
	"bed" integer NOT NULL,
	"bath" integer NOT NULL,
	"sqft" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_place_id_locations_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "locations" ADD CONSTRAINT "locations_pricing_id_pricing_id_fk" FOREIGN KEY ("pricing_id") REFERENCES "public"."pricing"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bookings_status_deleted_idx" ON "bookings" USING btree ("status","deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bookings_appointment_deleted_idx" ON "bookings" USING btree ("appointment_date","deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bookings_created_at_idx" ON "bookings" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bookings_place_id_idx" ON "bookings" USING btree ("place_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bookings_lower_email_idx" ON "bookings" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "locations_deleted_at_idx" ON "locations" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pricing_deleted_at_idx" ON "pricing" USING btree ("deleted_at");