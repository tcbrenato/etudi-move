/*
# Create in-app chat between trip participants

## Overview
Adds a lightweight per-trip messaging system so a passenger and a driver
can exchange messages directly in the app, in addition to (not instead
of) the existing WhatsApp contact button.

## New Tables
- `messages`
  - `id` (uuid, primary key)
  - `trip_id` (uuid, references trips.id) — which trip the conversation is about
  - `sender_id` / `receiver_id` (uuid, references profiles.id)
  - `content` (text)
  - `created_at` (timestamptz)
  - `read_at` (timestamptz, nullable) — set when the receiver opens the thread

A "conversation" is identified by (trip_id, the other participant) — there
is no separate conversations table, it's derived from messages.

## Security
- RLS enabled. A user can only see messages where they are sender or receiver.
- A message can only be inserted by its sender, and only if the trip's
  driver is one of the two participants (keeps chat scoped to trip contacts,
  not arbitrary user-to-user messaging).
- Only the receiver can mark a message as read (column-level grant limits
  updates to `read_at`).

## View
- `my_conversations` — one row per (trip, other participant) for the
  current user, with the trip summary, last message, and unread count.
  Used to render the inbox without N+1 queries.
*/

-- ============================================================
-- 1. TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id     uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  sender_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content     text NOT NULL CHECK (char_length(trim(content)) > 0),
  created_at  timestamptz NOT NULL DEFAULT now(),
  read_at     timestamptz,
  CHECK (sender_id <> receiver_id)
);

CREATE INDEX IF NOT EXISTS idx_messages_trip_id ON messages(trip_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- ============================================================
-- 2. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_select_participant" ON messages;
CREATE POLICY "messages_select_participant"
  ON messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "messages_insert_participant" ON messages;
CREATE POLICY "messages_insert_participant"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM trips t
      WHERE t.id = trip_id AND (t.driver_id = sender_id OR t.driver_id = receiver_id)
    )
  );

DROP POLICY IF EXISTS "messages_update_mark_read" ON messages;
CREATE POLICY "messages_update_mark_read"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- Only the receiver can update, and only the read_at column (not content/etc).
REVOKE UPDATE ON messages FROM authenticated;
GRANT UPDATE (read_at) ON messages TO authenticated;

-- ============================================================
-- 3. REALTIME
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END $$;

-- ============================================================
-- 4. INBOX VIEW
-- ============================================================

CREATE OR REPLACE VIEW my_conversations AS
SELECT
  c.trip_id,
  c.peer_id,
  c.origin_address,
  c.destination_address,
  c.departure_time,
  c.driver_id,
  c.last_message,
  c.last_message_at,
  c.unread_count,
  p.first_name AS peer_first_name,
  p.last_name AS peer_last_name,
  p.phone AS peer_phone,
  p.profile_photo AS peer_photo
FROM (
  SELECT
    m.trip_id,
    CASE WHEN m.sender_id = auth.uid() THEN m.receiver_id ELSE m.sender_id END AS peer_id,
    t.origin_address,
    t.destination_address,
    t.departure_time,
    t.driver_id,
    MAX(m.created_at) AS last_message_at,
    (ARRAY_AGG(m.content ORDER BY m.created_at DESC))[1] AS last_message,
    COUNT(*) FILTER (WHERE m.receiver_id = auth.uid() AND m.read_at IS NULL) AS unread_count
  FROM messages m
  JOIN trips t ON t.id = m.trip_id
  WHERE m.sender_id = auth.uid() OR m.receiver_id = auth.uid()
  GROUP BY m.trip_id, 2, t.origin_address, t.destination_address, t.departure_time, t.driver_id
) c
JOIN profiles p ON p.id = c.peer_id;

GRANT SELECT ON my_conversations TO authenticated;
