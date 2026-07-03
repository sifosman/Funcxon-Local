-- Migration: Phase 5 - Quotes & In-App Catalogue
-- Date: 2026-07-03
-- Purpose: Schema, RLS and helper functions for the Phase 5 amend workflow,
--          in-app catalogue items, and tier-based catalogue limits.

-- 1. Ensure vendor_catalogue_items has an image_url column
ALTER TABLE public.vendor_catalogue_items
  ADD COLUMN IF NOT EXISTS image_url text;

-- 2. Create venue_catalogue_items table (mirrors vendor_catalogue_items)
CREATE TABLE IF NOT EXISTS public.venue_catalogue_items (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  listing_id bigint NOT NULL REFERENCES public.venue_listings(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  price numeric,
  currency text NOT NULL DEFAULT 'ZAR',
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS venue_catalogue_items_listing_id_idx ON public.venue_catalogue_items (listing_id);

DROP TRIGGER IF EXISTS set_venue_catalogue_items_updated_at ON public.venue_catalogue_items;
CREATE TRIGGER set_venue_catalogue_items_updated_at
  BEFORE UPDATE ON public.venue_catalogue_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.venue_catalogue_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read venue catalogue items" ON public.venue_catalogue_items;
CREATE POLICY "Public can read venue catalogue items"
  ON public.venue_catalogue_items
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Venue owners can insert their catalogue items" ON public.venue_catalogue_items;
CREATE POLICY "Venue owners can insert their catalogue items"
  ON public.venue_catalogue_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.venue_listings vl
      WHERE vl.id = venue_catalogue_items.listing_id
        AND vl.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Venue owners can update their catalogue items" ON public.venue_catalogue_items;
CREATE POLICY "Venue owners can update their catalogue items"
  ON public.venue_catalogue_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.venue_listings vl
      WHERE vl.id = venue_catalogue_items.listing_id
        AND vl.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.venue_listings vl
      WHERE vl.id = venue_catalogue_items.listing_id
        AND vl.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Venue owners can delete their catalogue items" ON public.venue_catalogue_items;
CREATE POLICY "Venue owners can delete their catalogue items"
  ON public.venue_catalogue_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.venue_listings vl
      WHERE vl.id = venue_catalogue_items.listing_id
        AND vl.user_id = auth.uid()
    )
  );

-- 3. Add selected_hall to venue_quote_requests so attendees can choose a configured hall
ALTER TABLE public.venue_quote_requests
  ADD COLUMN IF NOT EXISTS selected_hall text;

-- 4. Helper table for catalogue item limits by tier.
--    Defaults are populated below; these can be adjusted via plan metadata or updated directly.
CREATE TABLE IF NOT EXISTS public.catalogue_tier_limits (
  tier text PRIMARY KEY,
  item_limit integer NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Default limits. Free tier is intentionally constrained to encourage upgrades.
INSERT INTO public.catalogue_tier_limits (tier, item_limit)
VALUES
  ('free', 10),
  ('get_started', 10),
  ('starter', 25),
  ('basic', 50),
  ('standard', 100),
  ('premium', 250),
  ('enterprise', 1000)
ON CONFLICT (tier)
DO UPDATE SET item_limit = EXCLUDED.item_limit;

-- Function to resolve item limit for a vendor tier
CREATE OR REPLACE FUNCTION public.get_vendor_catalogue_item_limit(p_tier text)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (SELECT item_limit FROM public.catalogue_tier_limits WHERE LOWER(tier) = LOWER(p_tier) LIMIT 1),
    10
  );
$$;

-- Function to resolve item limit for a venue plan
CREATE OR REPLACE FUNCTION public.get_venue_catalogue_item_limit(p_plan text)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (SELECT item_limit FROM public.catalogue_tier_limits WHERE LOWER(tier) = LOWER(p_plan) LIMIT 1),
    10
  );
$$;

-- 5. Trigger function to keep quote status timestamps accurate for the new workflow
CREATE OR REPLACE FUNCTION public.update_quote_status_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status <> OLD.status THEN
    IF NEW.status = 'accepted' THEN
      NEW.accepted_at = COALESCE(NEW.accepted_at, now());
    ELSIF NEW.status = 'rejected' THEN
      NEW.rejected_at = COALESCE(NEW.rejected_at, now());
    ELSIF NEW.status = 'amended' THEN
      NEW.amended_at = COALESCE(NEW.amended_at, now());
    ELSIF NEW.status = 'cancelled' THEN
      NEW.cancelled_at = COALESCE(NEW.cancelled_at, now());
    ELSIF NEW.status = 'finalised' THEN
      NEW.finalised_at = COALESCE(NEW.finalised_at, now());
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_quote_requests_status_timestamp ON public.quote_requests;
CREATE TRIGGER trg_quote_requests_status_timestamp
  BEFORE UPDATE ON public.quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_quote_status_timestamp();

DROP TRIGGER IF EXISTS trg_venue_quote_requests_status_timestamp ON public.venue_quote_requests;
CREATE TRIGGER trg_venue_quote_requests_status_timestamp
  BEFORE UPDATE ON public.venue_quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_quote_status_timestamp();
