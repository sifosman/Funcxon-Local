-- Allow attendees to delete their own cancelled quote requests from the Quotes screen.
-- These policies only apply when Row Level Security is already enabled on the tables.

-- Vendor quote requests (quote_requests) are linked to the internal users table.
DROP POLICY IF EXISTS "Attendees can delete their own cancelled quote requests" ON public.quote_requests;
CREATE POLICY "Attendees can delete their own cancelled quote requests"
  ON public.quote_requests
  FOR DELETE
  TO authenticated
  USING (
    status = 'cancelled' AND
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = quote_requests.user_id
      AND u.auth_user_id = auth.uid()
    )
  );

-- Venue quote requests use the Supabase auth user id directly.
DROP POLICY IF EXISTS "Attendees can delete their own cancelled venue quote requests" ON public.venue_quote_requests;
CREATE POLICY "Attendees can delete their own cancelled venue quote requests"
  ON public.venue_quote_requests
  FOR DELETE
  TO authenticated
  USING (
    status = 'cancelled' AND
    requester_user_id = auth.uid()
  );
