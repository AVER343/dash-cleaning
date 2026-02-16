-- Add booking status enum if it does not exist.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
    CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
  END IF;
END $$;

-- Ensure status exists and is enum-backed.
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS status booking_status DEFAULT 'pending'::booking_status;

ALTER TABLE bookings
  ALTER COLUMN status TYPE booking_status
  USING (
    CASE lower(status::text)
      WHEN 'pending' THEN 'pending'::booking_status
      WHEN 'confirmed' THEN 'confirmed'::booking_status
      WHEN 'completed' THEN 'completed'::booking_status
      WHEN 'cancelled' THEN 'cancelled'::booking_status
      ELSE 'pending'::booking_status
    END
  );

ALTER TABLE bookings ALTER COLUMN status SET DEFAULT 'pending'::booking_status;
ALTER TABLE bookings ALTER COLUMN status SET NOT NULL;

-- Soft delete columns.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
ALTER TABLE pricing ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

-- Typed appointment columns.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS appointment_date DATE NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS appointment_time TIME NULL;

-- created_at and updated_at support for all tables.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE locations ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE locations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE pricing ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE pricing ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Safe parser helpers for backfill.
CREATE OR REPLACE FUNCTION dashboard_parse_date(raw text)
RETURNS date
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  cleaned text;
  month_token text;
  day_token text;
  year_token text;
  month_num int;
BEGIN
  IF raw IS NULL THEN
    RETURN NULL;
  END IF;

  cleaned := trim(raw);

  IF cleaned ~ '^\d{4}-\d{1,2}-\d{1,2}$' THEN
    RETURN to_date(cleaned, 'YYYY-MM-DD');
  END IF;

  IF cleaned ~ '^\d{1,2}/\d{1,2}/\d{4}$' THEN
    RETURN to_date(cleaned, 'MM/DD/YYYY');
  END IF;

  IF cleaned ~ '^\d{1,2}-\d{1,2}-\d{4}$' THEN
    RETURN to_date(cleaned, 'MM-DD-YYYY');
  END IF;

  IF cleaned ~ '^[A-Za-z]+\s+\d{1,2},?\s+\d{4}$' THEN
    month_token := lower(split_part(cleaned, ' ', 1));
    day_token := regexp_replace(split_part(cleaned, ' ', 2), ',', '', 'g');
    year_token := split_part(cleaned, ' ', 3);

    month_num := CASE month_token
      WHEN 'jan' THEN 1 WHEN 'january' THEN 1
      WHEN 'feb' THEN 2 WHEN 'february' THEN 2
      WHEN 'mar' THEN 3 WHEN 'march' THEN 3
      WHEN 'apr' THEN 4 WHEN 'april' THEN 4
      WHEN 'may' THEN 5
      WHEN 'jun' THEN 6 WHEN 'june' THEN 6
      WHEN 'jul' THEN 7 WHEN 'july' THEN 7
      WHEN 'aug' THEN 8 WHEN 'august' THEN 8
      WHEN 'sep' THEN 9 WHEN 'sept' THEN 9 WHEN 'september' THEN 9
      WHEN 'oct' THEN 10 WHEN 'october' THEN 10
      WHEN 'nov' THEN 11 WHEN 'november' THEN 11
      WHEN 'dec' THEN 12 WHEN 'december' THEN 12
      ELSE NULL
    END;

    IF month_num IS NOT NULL THEN
      RETURN make_date(year_token::int, month_num, day_token::int);
    END IF;
  END IF;

  RETURN NULL;
EXCEPTION
  WHEN others THEN
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION dashboard_parse_time(raw text)
RETURNS time
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  cleaned text;
  hh int;
  mm int;
  sec int;
  ampm text;
BEGIN
  IF raw IS NULL THEN
    RETURN NULL;
  END IF;

  cleaned := trim(raw);

  IF cleaned ~ '^([01]?\d|2[0-3]):[0-5]\d$' THEN
    RETURN (cleaned || ':00')::time;
  END IF;

  IF cleaned ~ '^([01]?\d|2[0-3]):[0-5]\d:[0-5]\d$' THEN
    RETURN cleaned::time;
  END IF;

  IF cleaned ~ '^\d{1,2}(:[0-5]\d)?\s*([AaPp][Mm])$' THEN
    hh := split_part(regexp_replace(cleaned, '\s*[AaPp][Mm]$', '', ''), ':', 1)::int;
    mm := COALESCE(NULLIF(split_part(regexp_replace(cleaned, '\s*[AaPp][Mm]$', '', ''), ':', 2), ''), '0')::int;
    ampm := lower(substring(cleaned FROM '([AaPp][Mm])$'));

    IF hh < 1 OR hh > 12 THEN
      RETURN NULL;
    END IF;

    IF ampm = 'pm' AND hh < 12 THEN
      hh := hh + 12;
    ELSIF ampm = 'am' AND hh = 12 THEN
      hh := 0;
    END IF;

    RETURN make_time(hh, mm, 0);
  END IF;

  RETURN NULL;
EXCEPTION
  WHEN others THEN
    RETURN NULL;
END;
$$;

-- Backfill typed date/time from legacy text fields.
UPDATE bookings
SET
  appointment_date = COALESCE(appointment_date, dashboard_parse_date(date)),
  appointment_time = COALESCE(appointment_time, dashboard_parse_time(time));

-- Required indexes for dashboard performance.
CREATE INDEX IF NOT EXISTS bookings_status_deleted_idx
  ON bookings (status, deleted_at);

CREATE INDEX IF NOT EXISTS bookings_appointment_deleted_idx
  ON bookings (appointment_date, deleted_at);

CREATE INDEX IF NOT EXISTS bookings_created_at_idx
  ON bookings (created_at DESC);

CREATE INDEX IF NOT EXISTS bookings_place_id_idx
  ON bookings (place_id);

CREATE INDEX IF NOT EXISTS bookings_lower_email_idx
  ON bookings (lower(email));

CREATE INDEX IF NOT EXISTS locations_deleted_at_idx
  ON locations (deleted_at);

CREATE INDEX IF NOT EXISTS pricing_deleted_at_idx
  ON pricing (deleted_at);
