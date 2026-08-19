/*
# Create trips table for Étudi'Move ride-sharing

## Overview
Adds the `trips` table that powers the core matching feature: a driver
(role = 'driver') publishes a moto trip (origin, destination, departure
time), and any authenticated student can search available trips.

## New Tables
- `trips`
  - `id` (uuid, primary key)
  - `driver_id` (uuid, references profiles.id) — who published the trip
  - `origin_address` (text) — free-text address typed by the driver
  - `origin_lat` / `origin_lng` (double precision) — geocoded coordinates
  - `destination_address` (text)
  - `destination_lat` / `destination_lng` (double precision)
  - `departure_time` (timestamptz) — precise date/time of departure
  - `is_available` (boolean, default true) — driver can toggle this
  - `created_at`, `updated_at`

## Security
- RLS enabled.
- Any authenticated user can SELECT trips (needed to search/match).
- Only the driver who owns a trip can INSERT/UPDATE/DELETE it.
- A trip's driver_id must belong to a profile with role = 'driver'
  (enforced via CHECK using a helper function, checked at insert time
  in the app layer too).
*/

-- ============================================================
-- 1. TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS trips (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id             uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  origin_address        text NOT NULL,
  origin_lat            double precision NOT NULL,
  origin_lng            double precision NOT NULL,
  destination_address   text NOT NULL,
  destination_lat       double precision NOT NULL,
  destination_lng       double precision NOT NULL,
  departure_time        timestamptz NOT NULL,
  is_available          boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. UPDATED_AT TRIGGER (reuses update_updated_at() from migration 0001)
-- ============================================================

DROP TRIGGER IF EXISTS trips_updated_at ON trips;
CREATE TRIGGER trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can browse trips (to search for a ride)
DROP POLICY IF EXISTS "trips_select_all" ON trips;
CREATE POLICY "trips_select_all"
  ON trips FOR SELECT
  TO authenticated
  USING (true);

-- A driver can publish a trip only under their own id
DROP POLICY IF EXISTS "trips_insert_own" ON trips;
CREATE POLICY "trips_insert_own"
  ON trips FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = driver_id
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'driver')
  );

-- A driver can update only their own trips (e.g. toggle availability)
DROP POLICY IF EXISTS "trips_update_own" ON trips;
CREATE POLICY "trips_update_own"
  ON trips FOR UPDATE
  TO authenticated
  USING (auth.uid() = driver_id)
  WITH CHECK (auth.uid() = driver_id);

-- A driver can delete only their own trips
DROP POLICY IF EXISTS "trips_delete_own" ON trips;
CREATE POLICY "trips_delete_own"
  ON trips FOR DELETE
  TO authenticated
  USING (auth.uid() = driver_id);

-- ============================================================
-- 4. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_departure_time ON trips(departure_time);
CREATE INDEX IF NOT EXISTS idx_trips_is_available ON trips(is_available);

-- ============================================================
-- 5. VIEW: trips joined with driver contact info (for search results)
-- Exposes only what's needed to display + contact a driver — never the
-- driver's own row-level-restricted columns like status/role directly.
-- ============================================================

CREATE OR REPLACE VIEW trips_with_driver AS
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
  t.is_available,
  t.created_at,
  p.first_name AS driver_first_name,
  p.last_name AS driver_last_name,
  p.phone AS driver_phone,
  p.profile_photo AS driver_photo
FROM trips t
JOIN profiles p ON p.id = t.driver_id;

GRANT SELECT ON trips_with_driver TO authenticated;
