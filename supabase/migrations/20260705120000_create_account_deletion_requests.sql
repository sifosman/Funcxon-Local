-- Account deletion requests table
-- Allows listers to request account deletion, which admin must approve before execution.

CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  reason text,
  admin_notes text,
  processed_by uuid REFERENCES auth.users(id),
  processed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_user ON public.account_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_status ON public.account_deletion_requests(status);

-- RLS
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
DROP POLICY IF EXISTS account_deletion_requests_select_owner ON public.account_deletion_requests;
CREATE POLICY account_deletion_requests_select_owner
  ON public.account_deletion_requests
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own requests
DROP POLICY IF EXISTS account_deletion_requests_insert_owner ON public.account_deletion_requests;
CREATE POLICY account_deletion_requests_insert_owner
  ON public.account_deletion_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins (service role) can do everything
DROP POLICY IF EXISTS account_deletion_requests_all_admin ON public.account_deletion_requests;
CREATE POLICY account_deletion_requests_all_admin
  ON public.account_deletion_requests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- updated_at trigger
DROP TRIGGER IF EXISTS set_account_deletion_requests_updated_at ON public.account_deletion_requests;
CREATE TRIGGER set_account_deletion_requests_updated_at
  BEFORE UPDATE ON public.account_deletion_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
