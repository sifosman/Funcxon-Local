-- Fix: vendor photo_count CHECK constraint throws a raw error to the user
-- whenever a vendor record is written with photo_count higher than the limit
-- for its (possibly downgraded) subscription_tier.
--
-- The original constraint:
--   CHECK (photo_count <= get_vendor_photo_limit(subscription_tier))
-- aborts INSERT/UPDATE with "new row for relation vendors violates check
-- constraint check_photo_count_limit", which surfaces as an opaque error pop-up
-- during vendor application/portfolio editing.
--
-- We replace it with a trigger that clamps photo_count to the tier's allowed
-- maximum instead of failing, so the write always succeeds and over-limit
-- counts self-heal down to the limit. This matches the product's intent that
-- a tier limits how many photos count toward the profile.

-- Drop the hard constraint if it exists (created outside tracked migrations).
ALTER TABLE public.vendors
  DROP CONSTRAINT IF EXISTS check_photo_count_limit;

-- Backfill any rows already exceeding their tier limit before the trigger takes
-- over, so the clamp has a clean starting point.
UPDATE public.vendors v
SET photo_count = LEAST(
  COALESCE(v.photo_count, 0),
  public.get_vendor_photo_limit(COALESCE(v.subscription_tier, 'get_started'))
)
WHERE COALESCE(v.photo_count, 0) > public.get_vendor_photo_limit(COALESCE(v.subscription_tier, 'get_started'));

-- Trigger function: clamp photo_count to the tier's allowed maximum on every
-- insert/update, instead of raising a check-constraint violation.
CREATE OR REPLACE FUNCTION public.clamp_vendor_photo_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_limit integer;
BEGIN
  -- Normalize the tier just like the application does so unknown/legacy tiers
  -- fall back to the free tier limit (5) instead of erroring.
  v_limit := public.get_vendor_photo_limit(COALESCE(NEW.subscription_tier, 'get_started'));

  IF NEW.photo_count IS NULL THEN
    NEW.photo_count := 0;
  END IF;

  IF NEW.photo_count < 0 THEN
    NEW.photo_count := 0;
  END IF;

  IF NEW.photo_count > v_limit THEN
    NEW.photo_count := v_limit;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clamp_vendor_photo_count ON public.vendors;

CREATE TRIGGER trg_clamp_vendor_photo_count
BEFORE INSERT OR UPDATE OF photo_count, subscription_tier ON public.vendors
FOR EACH ROW
EXECUTE FUNCTION public.clamp_vendor_photo_count();
