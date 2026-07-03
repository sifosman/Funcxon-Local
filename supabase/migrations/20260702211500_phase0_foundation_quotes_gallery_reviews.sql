-- Phase 0 — Foundation: quote workflow, gallery media, app reviews, marketing prefs, RLS audit

-- 1. Extend quote_requests status and metadata --------------------------------
ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS end_date timestamp without time zone,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS quoted_amount double precision,
  ADD COLUMN IF NOT EXISTS response_message text,
  ADD COLUMN IF NOT EXISTS amended_message text,
  ADD COLUMN IF NOT EXISTS amended_at timestamp without time zone,
  ADD COLUMN IF NOT EXISTS accepted_at timestamp without time zone,
  ADD COLUMN IF NOT EXISTS rejected_at timestamp without time zone,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamp without time zone,
  ADD COLUMN IF NOT EXISTS finalised_at timestamp without time zone;

-- Normalise legacy status values before adding the new constraint
UPDATE public.quote_requests
  SET status = 'pending'
  WHERE status IN ('in_progress', 'draft', 'new');

UPDATE public.quote_requests
  SET status = 'quoted'
  WHERE status = 'sent';

-- Enforce unified status vocabulary for the new quote workflow
ALTER TABLE public.quote_requests
  DROP CONSTRAINT IF EXISTS quote_requests_status_check;
ALTER TABLE public.quote_requests
  ADD CONSTRAINT quote_requests_status_check
  CHECK (status IN ('pending', 'quoted', 'amended', 'accepted', 'rejected', 'finalised', 'cancelled'));

-- 2. Extend venue_quote_requests status and metadata --------------------------
ALTER TABLE public.venue_quote_requests
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS quoted_amount numeric,
  ADD COLUMN IF NOT EXISTS response_message text,
  ADD COLUMN IF NOT EXISTS amended_message text,
  ADD COLUMN IF NOT EXISTS amended_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS accepted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS rejected_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS finalised_at timestamp with time zone;

-- Normalise legacy 'new' status to the shared vocabulary
UPDATE public.venue_quote_requests
  SET status = 'pending'
  WHERE status = 'new';

ALTER TABLE public.venue_quote_requests
  DROP CONSTRAINT IF EXISTS venue_quote_requests_status_check;
ALTER TABLE public.venue_quote_requests
  ADD CONSTRAINT venue_quote_requests_status_check
  CHECK (status IN ('pending', 'quoted', 'amended', 'accepted', 'rejected', 'finalised', 'cancelled'));

-- 3. Gallery media table (images + videos) -------------------------------------
CREATE TABLE IF NOT EXISTS public.gallery_media (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  vendor_id bigint REFERENCES public.vendors(id) ON DELETE CASCADE,
  venue_id bigint REFERENCES public.venue_listings(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  caption text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT gallery_media_vendor_or_venue CHECK (
    (vendor_id IS NOT NULL AND venue_id IS NULL) OR
    (vendor_id IS NULL AND venue_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_gallery_media_vendor ON public.gallery_media(vendor_id);
CREATE INDEX IF NOT EXISTS idx_gallery_media_venue ON public.gallery_media(venue_id);
CREATE INDEX IF NOT EXISTS idx_gallery_media_type ON public.gallery_media(media_type);

DROP TRIGGER IF EXISTS set_gallery_media_updated_at ON public.gallery_media;
CREATE TRIGGER set_gallery_media_updated_at
  BEFORE UPDATE ON public.gallery_media
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 4. Marketing opt-in: WhatsApp ---------------------------------------------
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS marketing_opt_whatsapp boolean NOT NULL DEFAULT false;

-- 5. App reviews indexes (table already exists) -------------------------------
CREATE INDEX IF NOT EXISTS idx_app_reviews_status ON public.app_reviews(status);
CREATE INDEX IF NOT EXISTS idx_app_reviews_created_at ON public.app_reviews(created_at DESC);

-- 6. Review source flag (public vs post-booking) ------------------------------
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS review_source text NOT NULL DEFAULT 'public';
ALTER TABLE public.venue_reviews
  ADD COLUMN IF NOT EXISTS review_source text NOT NULL DEFAULT 'public';

-- 7. RLS audit -----------------------------------------------------------------

-- gallery_media
ALTER TABLE public.gallery_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS gallery_media_select_public ON public.gallery_media;
CREATE POLICY gallery_media_select_public
  ON public.gallery_media
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS gallery_media_insert_owner ON public.gallery_media;
CREATE POLICY gallery_media_insert_owner
  ON public.gallery_media
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (vendor_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid()))
    OR
    (venue_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.venue_listings vl WHERE vl.id = venue_id AND vl.user_id = auth.uid()))
  );

DROP POLICY IF EXISTS gallery_media_update_owner ON public.gallery_media;
CREATE POLICY gallery_media_update_owner
  ON public.gallery_media
  FOR UPDATE
  TO authenticated
  USING (
    (vendor_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid()))
    OR
    (venue_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.venue_listings vl WHERE vl.id = venue_id AND vl.user_id = auth.uid()))
  );

DROP POLICY IF EXISTS gallery_media_delete_owner ON public.gallery_media;
CREATE POLICY gallery_media_delete_owner
  ON public.gallery_media
  FOR DELETE
  TO authenticated
  USING (
    (vendor_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid()))
    OR
    (venue_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.venue_listings vl WHERE vl.id = venue_id AND vl.user_id = auth.uid()))
  );

-- quote_requests (currently had RLS disabled)
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quote_requests_select_requester ON public.quote_requests;
CREATE POLICY quote_requests_select_requester
  ON public.quote_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = quote_requests.user_id AND u.auth_user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = quote_requests.vendor_id AND v.user_id = auth.uid())
  );

DROP POLICY IF EXISTS quote_requests_insert_authenticated ON public.quote_requests;
CREATE POLICY quote_requests_insert_authenticated
  ON public.quote_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS quote_requests_update_parties ON public.quote_requests;
CREATE POLICY quote_requests_update_parties
  ON public.quote_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = quote_requests.user_id AND u.auth_user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = quote_requests.vendor_id AND v.user_id = auth.uid())
  );

DROP POLICY IF EXISTS quote_requests_delete_requester ON public.quote_requests;
CREATE POLICY quote_requests_delete_requester
  ON public.quote_requests
  FOR DELETE
  TO authenticated
  USING (
    status = 'cancelled'
    AND
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = quote_requests.user_id AND u.auth_user_id = auth.uid())
  );

-- venue_quote_requests (RLS already enabled, ensure it stays on)
ALTER TABLE public.venue_quote_requests ENABLE ROW LEVEL SECURITY;

-- reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reviews_select_public ON public.reviews;
CREATE POLICY reviews_select_public
  ON public.reviews
  FOR SELECT
  TO public
  USING (status IS NULL OR status IN ('published', 'approved'));

DROP POLICY IF EXISTS reviews_select_own ON public.reviews;
CREATE POLICY reviews_select_own
  ON public.reviews
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = reviews.user_id AND u.auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS reviews_insert_own ON public.reviews;
CREATE POLICY reviews_insert_own
  ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = reviews.user_id AND u.auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS reviews_update_own ON public.reviews;
CREATE POLICY reviews_update_own
  ON public.reviews
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = reviews.user_id AND u.auth_user_id = auth.uid())
  );

-- venue_reviews
ALTER TABLE public.venue_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS venue_reviews_select_public ON public.venue_reviews;
CREATE POLICY venue_reviews_select_public
  ON public.venue_reviews
  FOR SELECT
  TO public
  USING (status IS NULL OR status IN ('published', 'approved'));

DROP POLICY IF EXISTS venue_reviews_select_own ON public.venue_reviews;
CREATE POLICY venue_reviews_select_own
  ON public.venue_reviews
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS venue_reviews_insert_own ON public.venue_reviews;
CREATE POLICY venue_reviews_insert_own
  ON public.venue_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS venue_reviews_update_own ON public.venue_reviews;
CREATE POLICY venue_reviews_update_own
  ON public.venue_reviews
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- 8. Storage buckets for new media uploads -------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery-media', 'gallery-media', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('catalogue-items', 'catalogue-items', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for gallery-media
DROP POLICY IF EXISTS "Allow authenticated uploads to gallery-media" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to gallery-media"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'gallery-media');

DROP POLICY IF EXISTS "Allow authenticated select from gallery-media" ON storage.objects;
CREATE POLICY "Allow authenticated select from gallery-media"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'gallery-media');

DROP POLICY IF EXISTS "Allow public select from gallery-media" ON storage.objects;
CREATE POLICY "Allow public select from gallery-media"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'gallery-media');

DROP POLICY IF EXISTS "Allow authenticated delete own from gallery-media" ON storage.objects;
CREATE POLICY "Allow authenticated delete own from gallery-media"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'gallery-media' AND owner = auth.uid());

-- Storage policies for catalogue-items
DROP POLICY IF EXISTS "Allow authenticated uploads to catalogue-items" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to catalogue-items"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'catalogue-items');

DROP POLICY IF EXISTS "Allow authenticated select from catalogue-items" ON storage.objects;
CREATE POLICY "Allow authenticated select from catalogue-items"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'catalogue-items');

DROP POLICY IF EXISTS "Allow public select from catalogue-items" ON storage.objects;
CREATE POLICY "Allow public select from catalogue-items"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'catalogue-items');

DROP POLICY IF EXISTS "Allow authenticated delete own from catalogue-items" ON storage.objects;
CREATE POLICY "Allow authenticated delete own from catalogue-items"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'catalogue-items' AND owner = auth.uid());

-- 9. Performance indexes -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON public.quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_user_id ON public.quote_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_vendor_id ON public.quote_requests(vendor_id);
CREATE INDEX IF NOT EXISTS idx_venue_quote_requests_status ON public.venue_quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_venue_quote_requests_listing_id ON public.venue_quote_requests(listing_id);
CREATE INDEX IF NOT EXISTS idx_reviews_review_source ON public.reviews(review_source);
CREATE INDEX IF NOT EXISTS idx_venue_reviews_review_source ON public.venue_reviews(review_source);
