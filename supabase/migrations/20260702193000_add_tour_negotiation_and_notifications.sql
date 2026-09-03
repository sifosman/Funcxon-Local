-- Add tour negotiation columns to venue_tour_bookings
ALTER TABLE public.venue_tour_bookings
  ADD COLUMN IF NOT EXISTS countered_date date,
  ADD COLUMN IF NOT EXISTS countered_time text,
  ADD COLUMN IF NOT EXISTS countered_message text;

-- Create notifications table for tour and other user alerts
CREATE TABLE IF NOT EXISTS public.notifications (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running to avoid duplicates
DROP POLICY IF EXISTS notifications_select_own ON public.notifications;
DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
DROP POLICY IF EXISTS notifications_insert_service ON public.notifications;

-- Users can only read their own notifications
CREATE POLICY notifications_select_own
  ON public.notifications
  FOR SELECT
  TO public
  USING (user_id = auth.uid());

-- Users can only mark their own notifications as read
CREATE POLICY notifications_update_own
  ON public.notifications
  FOR UPDATE
  TO public
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Service/edge functions can insert notifications for any user (authenticated only)
CREATE POLICY notifications_insert_service
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Index for fast unread lookups
CREATE INDEX IF NOT EXISTS idx_notifications_user_read
  ON public.notifications(user_id, read, created_at DESC);

-- Index for user notification listing
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications(user_id, created_at DESC);
