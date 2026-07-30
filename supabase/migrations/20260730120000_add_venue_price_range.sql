-- Migration: Add price_range column to venue_listings
-- Date: 2026-07-30
-- Purpose: Enable venues to store and display a price range on their public profile.
ALTER TABLE public.venue_listings ADD COLUMN IF NOT EXISTS price_range text;
