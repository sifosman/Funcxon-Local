create or replace function public.notify_subscriber_application_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile record;
  application_url text := 'vibeventz://application-status';
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  select
    coalesce(u.email, new.company_details ->> 'email', new.company_details ->> 'userEmail') as email,
    coalesce(nullif(u.full_name, ''), nullif(new.company_details ->> 'ownersName', ''), 'Valued Applicant') as full_name,
    coalesce(nullif(new.company_details ->> 'tradingName', ''), nullif(new.company_details ->> 'registeredBusinessName', '')) as business_name
  into profile
  from public.users u
  where u.auth_user_id = new.user_id
  limit 1;

  if coalesce(profile.email, '') = '' then
    return new;
  end if;

  perform net.http_post(
    url := 'https://fhlocaqndxawkbztncwo.supabase.co/functions/v1/send-application-status-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZobG9jYXFuZHhhd2tienRuY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyOTQ1NzksImV4cCI6MjA3ODg3MDU3OX0.8vDYyxqe7AfHsvNnd2csFNIFaotjdcbUp9Tr2J3V9As'
    ),
    body := jsonb_build_object(
      'email', profile.email,
      'fullName', profile.full_name,
      'businessName', profile.business_name,
      'tierName', coalesce(new.subscription_tier, initcap(new.portfolio_type)),
      'applicationUrl', application_url,
      'status', new.status,
      'adminNotes', new.admin_notes
    ),
    timeout_milliseconds := 5000
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_subscriber_application_status_change on public.subscriber_applications;

create trigger trg_notify_subscriber_application_status_change
  after update on public.subscriber_applications
  for each row
  execute function public.notify_subscriber_application_status_change();
