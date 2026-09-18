/*
# Create bookings (trip reservation requests)

## Overview
Lets a passenger request a seat on a driver's trip. The driver then
accepts or declines the request. Accepting a booking automatically marks
the trip as unavailable (single-passenger moto rides).

## New Types
- `booking_status` enum: 'pending' | 'accepted' | 'declined' | 'cancelled'

## New Tables
- `bookings`
  - `id`, `trip_id`, `passenger_id`, `status`, `created_at`, `updated_at`
  - A passenger can have only one active (pending/accepted) booking per trip
    (partial unique index) — they can re-request after a cancellation/decline.

## Security
- RLS enabled. Passenger can create/select/cancel their own bookings.
  Driver can select/accept/decline bookings on trips they own.
- A passenger cannot book their own trip.

## View
- `bookings_with_details` — joins trip + passenger + driver info, filtered
  to rows the current user participates in (same pattern as
  `my_conversations`, since views run with the owner's RLS-bypassing
  privileges).

## Notification
- `notify_new_booking()` trigger calls the `notify-booking` Edge Function
  so the driver gets an email when a new request comes in.
*/

-- ============================================================
-- 1. ENUM + TABLE
-- ============================================================

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('pending', 'accepted', 'declined', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS bookings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id      uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  passenger_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status       booking_status NOT NULL DEFAULT 'pending',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_bookings_active
  ON bookings(trip_id, passenger_id)
  WHERE status IN ('pending', 'accepted');

CREATE INDEX IF NOT EXISTS idx_bookings_trip_id ON bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_passenger_id ON bookings(passenger_id);

DROP TRIGGER IF EXISTS bookings_updated_at ON bookings;
CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 2. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bookings_select_participant" ON bookings;
CREATE POLICY "bookings_select_participant"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    auth.uid() = passenger_id
    OR EXISTS (SELECT 1 FROM trips WHERE id = trip_id AND driver_id = auth.uid())
  );

DROP POLICY IF EXISTS "bookings_insert_own" ON bookings;
CREATE POLICY "bookings_insert_own"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = passenger_id
    AND EXISTS (SELECT 1 FROM trips WHERE id = trip_id AND driver_id <> passenger_id)
  );

DROP POLICY IF EXISTS "bookings_update_driver" ON bookings;
CREATE POLICY "bookings_update_driver"
  ON bookings FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM trips WHERE id = trip_id AND driver_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM trips WHERE id = trip_id AND driver_id = auth.uid()));

DROP POLICY IF EXISTS "bookings_update_passenger_cancel" ON bookings;
CREATE POLICY "bookings_update_passenger_cancel"
  ON bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = passenger_id)
  WITH CHECK (auth.uid() = passenger_id AND status = 'cancelled');

-- ============================================================
-- 3. AUTO-CLOSE TRIP WHEN A BOOKING IS ACCEPTED
-- ============================================================

CREATE OR REPLACE FUNCTION close_trip_on_booking_accepted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status IS DISTINCT FROM 'accepted' THEN
    UPDATE trips SET is_available = false WHERE id = NEW.trip_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_booking_accepted_close_trip ON bookings;
CREATE TRIGGER on_booking_accepted_close_trip
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION close_trip_on_booking_accepted();

-- ============================================================
-- 4. VIEW: bookings joined with trip + participant details
-- ============================================================

CREATE OR REPLACE VIEW bookings_with_details AS
SELECT
  b.id,
  b.trip_id,
  b.passenger_id,
  t.driver_id,
  b.status,
  b.created_at,
  t.origin_address,
  t.destination_address,
  t.departure_time,
  t.direction,
  pp.first_name AS passenger_first_name,
  pp.last_name AS passenger_last_name,
  pp.phone AS passenger_phone,
  dp.first_name AS driver_first_name,
  dp.last_name AS driver_last_name,
  dp.phone AS driver_phone
FROM bookings b
JOIN trips t ON t.id = b.trip_id
JOIN profiles pp ON pp.id = b.passenger_id
JOIN profiles dp ON dp.id = t.driver_id
WHERE b.passenger_id = auth.uid() OR t.driver_id = auth.uid();

GRANT SELECT ON bookings_with_details TO authenticated;

-- ============================================================
-- 5. NOTIFY DRIVER ON NEW BOOKING REQUEST
-- ============================================================

CREATE OR REPLACE FUNCTION notify_new_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  payload jsonb;
BEGIN
  SELECT jsonb_build_object(
    'driver_email', dp.email,
    'driver_first_name', dp.first_name,
    'passenger_first_name', pp.first_name,
    'passenger_last_name', pp.last_name,
    'passenger_phone', pp.phone,
    'origin_address', t.origin_address,
    'destination_address', t.destination_address,
    'departure_time', t.departure_time
  )
  INTO payload
  FROM trips t
  JOIN profiles dp ON dp.id = t.driver_id
  JOIN profiles pp ON pp.id = NEW.passenger_id
  WHERE t.id = NEW.trip_id;

  PERFORM net.http_post(
    url := 'https://tbmdpahezdskskrkrnpu.supabase.co/functions/v1/notify-booking',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', webhook_secret()
    ),
    body := payload
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_booking_created_notify ON bookings;
CREATE TRIGGER on_booking_created_notify
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_booking();
