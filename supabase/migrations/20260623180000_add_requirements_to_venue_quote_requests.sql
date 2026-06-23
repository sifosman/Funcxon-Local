-- Add requirements column to venue_quote_requests so QuoteDetailScreen
-- can select and update notes/requirements for venue quotes, matching quote_requests.
ALTER TABLE public.venue_quote_requests
ADD COLUMN IF NOT EXISTS requirements TEXT DEFAULT NULL;
