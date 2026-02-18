-- Quote Revisions Table for tracking quote history
-- Stores each version of a quote as vendors make changes

CREATE TABLE IF NOT EXISTS public.quote_revisions (
  id BIGSERIAL PRIMARY KEY,
  quote_request_id BIGINT NOT NULL REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  vendor_id BIGINT REFERENCES public.vendors(id) ON DELETE SET NULL,
  
  -- Quote details for this revision
  quote_amount NUMERIC,
  description TEXT,
  validity_days INTEGER DEFAULT 7, -- How many days the quote is valid
  terms TEXT, -- Payment terms, delivery details, etc.
  
  -- Revision metadata
  revision_number INTEGER NOT NULL DEFAULT 1,
  created_by VARCHAR(50) NOT NULL DEFAULT 'vendor', -- 'vendor', 'system', 'admin'
  notes TEXT, -- Internal notes about the change
  
  -- Status at time of this revision
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft', 'sent', 'accepted', 'rejected', 'expired'
  
  -- Client response (if applicable)
  client_notes TEXT,
  responded_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_quote_revisions_quote_request_id ON public.quote_revisions(quote_request_id);
CREATE INDEX IF NOT EXISTS idx_quote_revisions_vendor_id ON public.quote_revisions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_quote_revisions_status ON public.quote_revisions(status);

-- Get the latest revision for a quote request
CREATE OR REPLACE FUNCTION public.get_latest_quote_revision(p_quote_request_id BIGINT)
RETURNS public.quote_revisions AS $$
  SELECT *
  FROM public.quote_revisions
  WHERE quote_request_id = p_quote_request_id
  ORDER BY revision_number DESC, created_at DESC
  LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Automatically increment revision number
CREATE OR REPLACE FUNCTION public.increment_quote_revision_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the max revision number for this quote request
  SELECT COALESCE(MAX(revision_number), 0) + 1
  INTO NEW.revision_number
  FROM public.quote_revisions
  WHERE quote_request_id = NEW.quote_request_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_quote_revision_number ON public.quote_revisions;
CREATE TRIGGER trg_quote_revision_number
  BEFORE INSERT ON public.quote_revisions
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_quote_revision_number();

-- Update quote_requests when a revision is marked as sent
CREATE OR REPLACE FUNCTION public.update_quote_request_on_revision()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'sent' AND OLD.status != 'sent' THEN
    UPDATE public.quote_requests
    SET 
      status = 'quoted',
      quote_amount = NEW.quote_amount,
      updated_at = NOW()
    WHERE id = NEW.quote_request_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_quote_request ON public.quote_revisions;
CREATE TRIGGER trg_update_quote_request
  AFTER UPDATE ON public.quote_revisions
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION public.update_quote_request_on_revision();

-- Row Level Security Policies
ALTER TABLE public.quote_revisions ENABLE ROW LEVEL SECURITY;

-- Vendors can see revisions for their quotes
DROP POLICY IF EXISTS "Vendors can view their quote revisions" ON public.quote_revisions;
CREATE POLICY "Vendors can view their quote revisions"
  ON public.quote_revisions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quote_requests qr
      JOIN public.vendors v ON v.id = qr.vendor_id
      WHERE qr.id = quote_revisions.quote_request_id
      AND v.user_id = auth.uid()
    )
  );

-- Vendors can create revisions for their quotes
DROP POLICY IF EXISTS "Vendors can create quote revisions" ON public.quote_revisions;
CREATE POLICY "Vendors can create quote revisions"
  ON public.quote_revisions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quote_requests qr
      JOIN public.vendors v ON v.id = qr.vendor_id
      WHERE qr.id = quote_revisions.quote_request_id
      AND v.user_id = auth.uid()
    )
  );

-- Vendors can update their own draft revisions
DROP POLICY IF EXISTS "Vendors can update draft revisions" ON public.quote_revisions;
CREATE POLICY "Vendors can update draft revisions"
  ON public.quote_revisions
  FOR UPDATE
  TO authenticated
  USING (
    status = 'draft' AND
    EXISTS (
      SELECT 1 FROM public.quote_requests qr
      JOIN public.vendors v ON v.id = qr.vendor_id
      WHERE qr.id = quote_revisions.quote_request_id
      AND v.user_id = auth.uid()
    )
  );

-- Attendees (quote requesters) can view revisions for their quotes
DROP POLICY IF EXISTS "Attendees can view their quote revisions" ON public.quote_revisions;
CREATE POLICY "Attendees can view their quote revisions"
  ON public.quote_revisions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quote_requests qr
      JOIN public.users u ON u.id = qr.user_id
      WHERE qr.id = quote_revisions.quote_request_id
      AND u.auth_user_id = auth.uid()
    )
  );

-- Attendees can update status to accepted/rejected
DROP POLICY IF EXISTS "Attendees can respond to quotes" ON public.quote_revisions;
CREATE POLICY "Attendees can respond to quotes"
  ON public.quote_revisions
  FOR UPDATE
  TO authenticated
  USING (
    status IN ('sent', 'accepted', 'rejected') AND
    EXISTS (
      SELECT 1 FROM public.quote_requests qr
      JOIN public.users u ON u.id = qr.user_id
      WHERE qr.id = quote_revisions.quote_request_id
      AND u.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    status IN ('accepted', 'rejected') OR
    (status = 'sent' AND NEW.status IN ('accepted', 'rejected'))
  );

-- Comments on quote revisions
CREATE TABLE IF NOT EXISTS public.quote_comments (
  id BIGSERIAL PRIMARY KEY,
  quote_revision_id BIGINT NOT NULL REFERENCES public.quote_revisions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  author_type VARCHAR(20) NOT NULL CHECK (author_type IN ('vendor', 'attendee', 'system')),
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE, -- Internal vendor notes vs client-facing
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quote_comments_revision_id ON public.quote_comments(quote_revision_id);
CREATE INDEX IF NOT EXISTS idx_quote_comments_author_id ON public.quote_comments(author_id);

ALTER TABLE public.quote_comments ENABLE ROW LEVEL SECURITY;

-- Both parties can view comments
DROP POLICY IF EXISTS "Users can view quote comments" ON public.quote_comments;
CREATE POLICY "Users can view quote comments"
  ON public.quote_comments
  FOR SELECT
  TO authenticated
  USING (
    -- Can see non-internal comments if involved in the quote
    (NOT is_internal OR author_id = auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.quote_revisions rev
      JOIN public.quote_requests qr ON qr.id = rev.quote_request_id
      LEFT JOIN public.vendors v ON v.id = qr.vendor_id
      LEFT JOIN public.users u ON u.id = qr.user_id
      WHERE rev.id = quote_comments.quote_revision_id
      AND (v.user_id = auth.uid() OR u.auth_user_id = auth.uid())
    )
  );

-- Users can create comments on their quotes
DROP POLICY IF EXISTS "Users can create quote comments" ON public.quote_comments;
CREATE POLICY "Users can create quote comments"
  ON public.quote_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.quote_revisions rev
      JOIN public.quote_requests qr ON qr.id = rev.quote_request_id
      LEFT JOIN public.vendors v ON v.id = qr.vendor_id
      LEFT JOIN public.users u ON u.id = qr.user_id
      WHERE rev.id = quote_comments.quote_revision_id
      AND (v.user_id = auth.uid() OR u.auth_user_id = auth.uid())
    )
  );
