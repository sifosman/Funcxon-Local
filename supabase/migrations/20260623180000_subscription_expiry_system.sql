-- Migration: subscription_expiry_system
-- 1. Add reminder tracking columns to venues
-- 2. Add get_expiring_venues RPC (mirrors get_expiring_vendors for venues)
-- 3. Add pg_cron job to run expire-subscriptions daily

-- ── 1. Reminder columns on venues ──────────────────────────────────────────
ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS reminder_5day_sent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_1day_sent boolean DEFAULT false;

-- ── 2. get_expiring_venues RPC ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_expiring_venues(days_ahead integer, reminder_type text)
RETURNS TABLE(
  venue_id      integer,
  venue_name    text,
  billing_email text,
  plan_key      text,
  subscription_expires_at timestamp with time zone,
  billing_period text,
  days_until_expiry integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id                                                        AS venue_id,
    v.name                                                      AS venue_name,
    v.billing_email,
    v.subscription_plan_key                                     AS plan_key,
    v.subscription_expires_at,
    v.billing_period,
    EXTRACT(DAY FROM v.subscription_expires_at - now())::integer AS days_until_expiry
  FROM venues v
  WHERE v.subscription_status = 'active'
    AND v.subscription_plan_key != 'get_started'
    AND v.subscription_expires_at IS NOT NULL
    AND v.subscription_expires_at > now()
    AND v.subscription_expires_at <= now() + (days_ahead || ' days')::interval
    AND (
      (reminder_type = '5day' AND COALESCE(v.reminder_5day_sent, false) = false)
      OR
      (reminder_type = '1day' AND COALESCE(v.reminder_1day_sent, false) = false)
    );
END;
$$;

-- ── 3. pg_cron job: expire-subscriptions runs daily at 07:00 UTC ───────────
-- (reminder job runs at 08:00, so expiry fires first)
SELECT cron.schedule(
  'expire-subscriptions',
  '0 7 * * *',
  $$
    SELECT net.http_post(
      url := 'https://fhlocaqndxawkbztncwo.supabase.co/functions/v1/expire-subscriptions',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZobG9jYXFuZHhhd2tienRuY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyOTQ1NzksImV4cCI6MjA3ODg3MDU3OX0.8vDYyxqe7AfHsvNnd2csFNIFaotjdcbUp9Tr2J3V9As'
      ),
      body := '{}'::jsonb
    );
  $$
);
