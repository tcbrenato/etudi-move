/*
# Create profiles table and role management for Étudi'Move

## Overview
This migration sets up the foundational database schema for the Étudi'Move platform.
It creates a `profiles` table that extends Supabase's built-in `auth.users` with
application-specific fields (name, phone, role, status, profile photo).

## New Tables
- `profiles`
  - `id` (uuid, primary key, references auth.users) — one-to-one with auth.users
  - `first_name` (text, not null) — user's first name
  - `last_name` (text, not null) — user's last name
  - `email` (text, not null, unique) — user's email (mirrored from auth.users)
  - `phone` (text, not null) — user's phone number
  - `role` (user_role enum, not null, default 'user') — one of 'user', 'driver', 'admin'
  - `status` (account_status enum, not null, default 'active') — one of 'active', 'suspended', 'pending'
  - `profile_photo` (text, nullable) — URL to profile photo in storage
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now(), auto-updated via trigger)

## New Types
- `user_role` enum: 'user', 'driver', 'admin'
- `account_status` enum: 'active', 'suspended', 'pending'

## Security
- RLS enabled on `profiles`.
- Users can SELECT and UPDATE their own profile (but NOT their own role or status columns — those are revoked at column level).
- Admins can SELECT all profiles and can suspend/activate accounts via a SECURITY DEFINER function.
- Column-level privileges: `role` and `status` columns are NOT writable by users directly.
- A SECURITY DEFINER function `admin_set_account_status` allows admins to change a user's status.
- A SECURITY DEFINER function `get_admin_stats` returns aggregate counts for the admin dashboard.
- A trigger auto-creates a profile row when a new auth.users row is inserted (on signup).
- A trigger auto-updates `updated_at` on row modification.

## Important Notes
1. The `handle_new_user` trigger reads `first_name`, `last_name`, `phone` from
   `raw_user_meta_data` (set during signup) and defaults role to 'user', status to 'active'.
2. Column-level GRANT/REVOKE ensures users cannot change their own role or status
   even though the UPDATE policy allows row-level access.
3. The admin functions check `auth.uid()` against the profiles table to verify
   the caller is an admin — never a client-supplied parameter.
4. The `get_admin_stats` function is SECURITY DEFINER so it can count all profiles
   regardless of RLS; it verifies admin status before returning data.
*/

-- ============================================================
-- 1. ENUM TYPES
-- ============================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'driver', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE account_status AS ENUM ('active', 'suspended', 'pending');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 2. PROFILES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name  text NOT NULL,
  last_name   text NOT NULL,
  email       text NOT NULL UNIQUE,
  phone       text NOT NULL,
  role        user_role NOT NULL DEFAULT 'user',
  status      account_status NOT NULL DEFAULT 'active',
  profile_photo text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 4. AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, first_name, last_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Admins can read all profiles
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
CREATE POLICY "profiles_select_admin"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Users can update their own profile (row-level; column privileges below narrow this)
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- 6. COLUMN-LEVEL PRIVILEGES
-- Prevent users from changing their own role or status via the data API.
-- ============================================================

REVOKE UPDATE ON profiles FROM authenticated;
GRANT UPDATE (first_name, last_name, phone, profile_photo) ON profiles TO authenticated;

-- ============================================================
-- 7. ADMIN FUNCTIONS
-- ============================================================

-- Admin can change a user's account status (activate/suspend)
CREATE OR REPLACE FUNCTION admin_set_account_status(p_user_id uuid, p_status account_status)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_status NOT IN ('active', 'suspended', 'pending') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  UPDATE profiles SET status = p_status WHERE id = p_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_set_account_status FROM anon;
GRANT EXECUTE ON FUNCTION admin_set_account_status TO authenticated;

-- Admin dashboard stats: counts of users, drivers, admins
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS TABLE(total_users bigint, total_drivers bigint, total_admins bigint)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
    SELECT
      COUNT(*) FILTER (WHERE role = 'user')::bigint,
      COUNT(*) FILTER (WHERE role = 'driver')::bigint,
      COUNT(*) FILTER (WHERE role = 'admin')::bigint
    FROM profiles;
END;
$$;

REVOKE EXECUTE ON FUNCTION get_admin_stats FROM anon;
GRANT EXECUTE ON FUNCTION get_admin_stats TO authenticated;

-- ============================================================
-- 8. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
