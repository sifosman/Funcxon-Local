-- Add additional_photos array to venue_listings for portfolio image editing
ALTER TABLE public.venue_listings
ADD COLUMN IF NOT EXISTS additional_photos text[];
