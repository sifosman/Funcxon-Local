-- Add price_range column to venue_listings (already exists on vendors)
ALTER TABLE public.venue_listings ADD COLUMN IF NOT EXISTS price_range text;
