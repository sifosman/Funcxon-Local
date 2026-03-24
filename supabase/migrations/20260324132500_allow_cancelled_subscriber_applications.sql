alter table public.subscriber_applications
  drop constraint if exists subscriber_applications_status_check;

alter table public.subscriber_applications
  add constraint subscriber_applications_status_check
  check (
    status = any (
      array[
        'pending'::character varying,
        'under_review'::character varying,
        'approved'::character varying,
        'rejected'::character varying,
        'needs_changes'::character varying,
        'cancelled'::character varying
      ]::text[]
    )
  );

drop policy if exists "Users can update own applications" on public.subscriber_applications;

create policy "Users can update own applications"
  on public.subscriber_applications
  for update
  to authenticated
  using (
    auth.uid() = user_id
    and status = 'pending'
  )
  with check (
    auth.uid() = user_id
    and status = any (array['pending', 'cancelled'])
  );
