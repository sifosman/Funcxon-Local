-- Add welcome_email_sent column to public.users for idempotent welcome email tracking.
-- This prevents duplicate welcome emails from being sent if the auth state change
-- fires multiple times or if the OAuth flow triggers the email invocation repeatedly.

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS welcome_email_sent boolean DEFAULT false;
