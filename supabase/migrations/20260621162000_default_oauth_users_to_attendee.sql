-- Ensure social/OAuth sign-ups (Google, Facebook, etc.) default to the attendee role.
-- Email sign-ups that explicitly pass a role in auth metadata continue to be respected.

-- Update the public.users role default so any code-path that omits the role also gets attendee.
ALTER TABLE public.users
ALTER COLUMN role SET DEFAULT 'attendee';

-- Replace the auth user creation trigger to:
-- 1. Default role to 'attendee' when no role is provided in raw_user_meta_data (OAuth case).
-- 2. Look for 'name' as well as 'full_name' in metadata when building the display name.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.users (auth_user_id, username, password, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    '',  -- password stored in auth.users; leave this empty
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'attendee')
  );
  RETURN NEW;
END;
$$;
