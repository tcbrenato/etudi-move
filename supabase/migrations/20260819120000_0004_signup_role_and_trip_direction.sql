/*
# Add self-service role selection at signup and trip direction

## Overview
Two independent additions to the Étudi'Move schema:
1. Let a user choose 'user' or 'driver' at signup (previously only admins
   could promote someone to 'driver' by hand, via direct DB access).
2. Add a `direction` field to `trips` so a driver states whether the ride
   goes toward campus or away from it, and expose it on the search view.

## Changes
- `handle_new_user()` now reads `role` from `raw_user_meta_data`, but only
  ever accepts 'user' or 'driver' — 'admin' (or anything else/absent)
  falls back to 'user'. This keeps privilege escalation impossible via the
  public signup form while still letting a real client pick 'driver'.
- New `trip_direction` enum: 'to_campus' | 'from_campus'.
- `trips.direction` (not null, default 'to_campus') stores the driver's choice.
- `trips_with_driver` view recreated to include `direction`.
*/

-- ============================================================
-- 1. TRIP DIRECTION ENUM + COLUMN
-- ============================================================

DO $$ BEGIN
  CREATE TYPE trip_direction AS ENUM ('to_campus', 'from_campus');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE trips ADD COLUMN IF NOT EXISTS direction trip_direction NOT NULL DEFAULT 'to_campus';

CREATE INDEX IF NOT EXISTS idx_trips_direction ON trips(direction);

-- ============================================================
-- 2. RECREATE trips_with_driver VIEW TO INCLUDE direction
-- ============================================================

-- Postgres won't let CREATE OR REPLACE VIEW insert a column in the middle
-- of the existing column list (it would rename "is_available" in place),
-- so the view is dropped and recreated instead.
DROP VIEW IF EXISTS trips_with_driver;

CREATE VIEW trips_with_driver AS
SELECT
  t.id,
  t.driver_id,
  t.origin_address,
  t.origin_lat,
  t.origin_lng,
  t.destination_address,
  t.destination_lat,
  t.destination_lng,
  t.departure_time,
  t.direction,
  t.is_available,
  t.created_at,
  p.first_name AS driver_first_name,
  p.last_name AS driver_last_name,
  p.phone AS driver_phone,
  p.profile_photo AS driver_photo
FROM trips t
JOIN profiles p ON p.id = t.driver_id;

GRANT SELECT ON trips_with_driver TO authenticated;

-- ============================================================
-- 3. SELF-SERVICE ROLE CHOICE AT SIGNUP (user/driver only, never admin)
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  requested_role text := NEW.raw_user_meta_data->>'role';
  final_role user_role := 'user';
BEGIN
  IF requested_role = 'driver' THEN
    final_role := 'driver';
  END IF;

  INSERT INTO profiles (id, first_name, last_name, email, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    final_role
  );
  RETURN NEW;
END;
$$;
