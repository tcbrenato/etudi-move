/*
# Simulated payment on bookings + distance-based fare

## Pricing
Fare = 100 F per km of straight-line distance between origin and destination,
rounded up to the next 25 F, with a 200 F minimum (moto rides).

## Payment (simulated — no real money moves)
- Mobile Money (MTN MoMo / Moov Money / Celtiis Cash): marked 'paid' at booking time.
- Cash: stays 'unpaid' (paid to the driver on board).
- Declined / cancelled booking that was 'paid' -> 'refunded' automatically.
The fare and payment fields are always computed by the database, never trusted
from the client.

## Webhook secret
The shared secret used by DB -> Edge Function webhooks lives in Supabase Vault
under the name 'webhook_secret' (create it once per environment:
`select vault.create_secret('<value>', 'webhook_secret');`). No secret is
stored in this repository.
*/

-- ============================================================
-- 1. WEBHOOK SECRET HELPER (reads from Vault)
-- ============================================================

CREATE OR REPLACE FUNCTION webhook_secret()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER SET search_path = public, vault
AS $$
  SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'webhook_secret' LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION webhook_secret() FROM PUBLIC, anon, authenticated;

-- Signup notification trigger (previously applied by hand) — now reproducible.
CREATE OR REPLACE FUNCTION notify_new_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://tbmdpahezdskskrkrnpu.supabase.co/functions/v1/notify-signup',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', webhook_secret()
    ),
    body := jsonb_build_object('type', 'INSERT', 'table', 'profiles', 'record', to_jsonb(NEW))
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created_notify ON profiles;
CREATE TRIGGER on_profile_created_notify
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_signup();

-- ============================================================
-- 2. DISTANCE + FARE FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION haversine_km(
  lat1 double precision, lng1 double precision,
  lat2 double precision, lng2 double precision
)
RETURNS double precision
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 6371 * 2 * asin(least(1, sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  )));
$$;

CREATE OR REPLACE FUNCTION fare_for_distance_km(km double precision)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT greatest(200, (ceil(km * 100 / 25) * 25))::integer;
$$;

-- ============================================================
-- 3. TYPES + COLUMNS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('mtn_momo', 'moov_money', 'celtiis_cash', 'cash');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('unpaid', 'paid', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS fare integer NOT NULL DEFAULT 200,
  ADD COLUMN IF NOT EXISTS payment_method payment_method,
  ADD COLUMN IF NOT EXISTS payment_status payment_status NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS payment_phone text,
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- ============================================================
-- 4. SERVER-SIDE FARE + PAYMENT ON INSERT
-- ============================================================

CREATE OR REPLACE FUNCTION bookings_apply_payment()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  t trips%ROWTYPE;
BEGIN
  SELECT * INTO t FROM trips WHERE id = NEW.trip_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trajet introuvable.';
  END IF;
  IF NOT t.is_available THEN
    RAISE EXCEPTION 'Ce trajet n''est plus disponible.';
  END IF;

  NEW.fare := fare_for_distance_km(
    haversine_km(t.origin_lat, t.origin_lng, t.destination_lat, t.destination_lng)
  );
  NEW.payment_method := COALESCE(NEW.payment_method, 'cash');

  IF NEW.payment_method = 'cash' THEN
    NEW.payment_status := 'unpaid';
    NEW.payment_phone := NULL;
    NEW.payment_reference := NULL;
    NEW.paid_at := NULL;
  ELSE
    IF length(regexp_replace(COALESCE(NEW.payment_phone, ''), '\D', '', 'g')) < 8 THEN
      RAISE EXCEPTION 'Numéro Mobile Money invalide.';
    END IF;
    NEW.payment_status := 'paid';
    NEW.paid_at := now();
    NEW.payment_reference := 'EM-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_apply_payment_trg ON bookings;
CREATE TRIGGER bookings_apply_payment_trg
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION bookings_apply_payment();

-- ============================================================
-- 5. AUTOMATIC REFUND ON DECLINE / CANCEL
-- ============================================================

CREATE OR REPLACE FUNCTION bookings_refund_on_cancel()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status IN ('declined', 'cancelled')
     AND OLD.status NOT IN ('declined', 'cancelled')
     AND OLD.payment_status = 'paid' THEN
    NEW.payment_status := 'refunded';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_refund_trg ON bookings;
CREATE TRIGGER bookings_refund_trg
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION bookings_refund_on_cancel();

-- Clients may only change the booking status; fare/payment fields are server-managed.
REVOKE UPDATE ON bookings FROM authenticated;
GRANT UPDATE (status) ON bookings TO authenticated;

-- ============================================================
-- 6. VIEWS (new columns appended at the end)
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
  t.direction,
  t.is_available,
  t.created_at,
  p.first_name AS driver_first_name,
  p.last_name AS driver_last_name,
  p.phone AS driver_phone,
  p.profile_photo AS driver_photo,
  round(haversine_km(t.origin_lat, t.origin_lng, t.destination_lat, t.destination_lng)::numeric, 1)::double precision AS distance_km,
  fare_for_distance_km(haversine_km(t.origin_lat, t.origin_lng, t.destination_lat, t.destination_lng)) AS fare
FROM trips t
JOIN profiles p ON p.id = t.driver_id;

GRANT SELECT ON trips_with_driver TO authenticated;

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
  dp.phone AS driver_phone,
  b.fare,
  b.payment_method,
  b.payment_status,
  b.payment_reference,
  b.paid_at
FROM bookings b
JOIN trips t ON t.id = b.trip_id
JOIN profiles pp ON pp.id = b.passenger_id
JOIN profiles dp ON dp.id = t.driver_id
WHERE b.passenger_id = auth.uid() OR t.driver_id = auth.uid();

GRANT SELECT ON bookings_with_details TO authenticated;

-- ============================================================
-- 7. DRIVER EMAIL NOW INCLUDES FARE + PAYMENT
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
    'departure_time', t.departure_time,
    'fare', NEW.fare,
    'payment_method', NEW.payment_method,
    'payment_status', NEW.payment_status,
    'payment_reference', NEW.payment_reference
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
