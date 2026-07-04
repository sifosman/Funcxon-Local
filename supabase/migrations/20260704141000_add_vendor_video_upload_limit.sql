-- Add video_upload_limit column to subscription_tiers
ALTER TABLE public.subscription_tiers
  ADD COLUMN IF NOT EXISTS video_upload_limit integer NOT NULL DEFAULT 0;

-- Set values based on existing features JSON
UPDATE public.subscription_tiers SET video_upload_limit = 0 WHERE tier_name = 'get_started';
UPDATE public.subscription_tiers SET video_upload_limit = 1 WHERE tier_name = 'basic';
UPDATE public.subscription_tiers SET video_upload_limit = 5 WHERE tier_name = 'premium';
UPDATE public.subscription_tiers SET video_upload_limit = 10 WHERE tier_name = 'premium_plus';

-- Create get_vendor_video_limit RPC (mirrors get_vendor_photo_limit)
CREATE OR REPLACE FUNCTION public.get_vendor_video_limit(vendor_tier text)
RETURNS integer
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT video_upload_limit FROM subscription_tiers WHERE tier_name = vendor_tier AND is_active = true),
    0
  );
END;
$$;
