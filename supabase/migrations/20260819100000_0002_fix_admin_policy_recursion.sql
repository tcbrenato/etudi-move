/*
# Fix infinite recursion in profiles admin SELECT policy

## Problem
The "profiles_select_admin" policy queries the `profiles` table from within
a policy defined ON `profiles`, causing Postgres to re-evaluate RLS on every
recursive lookup — infinite recursion.

## Fix
Replace the self-referencing subquery with a SECURITY DEFINER helper function
`is_admin()` that reads the caller's role while bypassing RLS (safe because
it only ever checks auth.uid()'s own row and returns a boolean, never rows).
*/

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
CREATE POLICY "profiles_select_admin"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_admin());
