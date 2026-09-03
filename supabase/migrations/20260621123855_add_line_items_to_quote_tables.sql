-- Add line_items JSONB column to quote request tables for catalogue-style requested items
ALTER TABLE public.quote_requests
ADD COLUMN IF NOT EXISTS line_items JSONB DEFAULT NULL;

ALTER TABLE public.venue_quote_requests
ADD COLUMN IF NOT EXISTS line_items JSONB DEFAULT NULL;
