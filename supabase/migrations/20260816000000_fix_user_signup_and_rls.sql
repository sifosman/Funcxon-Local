-- Fix user table constraints, RLS policies, and new user auth trigger

-- 1. Make password and username columns nullable and provide defaults
ALTER TABLE public.users ALTER COLUMN password SET DEFAULT '';
ALTER TABLE public.users ALTER COLUMN password DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN username DROP NOT NULL;

-- 2. Drop strict unique constraint on username to prevent collisions
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_username_key;

-- 3. Add RLS INSERT policy for authenticated users so client-side / fallback insertions succeed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'insert_own_user'
  ) THEN
    CREATE POLICY "insert_own_user" ON public.users
    FOR INSERT
    TO authenticated
    WITH CHECK (auth_user_id = auth.uid());
  END IF;
END $$;

-- 4. Add RLS policy for service_role on users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'service_role_all_users'
  ) THEN
    CREATE POLICY "service_role_all_users" ON public.users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- 5. Update handle_new_auth_user trigger function to be robust and conflict-safe
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_base_username text;
  v_username text;
  v_suffix int := 1;
  v_full_name text;
  v_role text;
  v_email text;
BEGIN
  v_email := NULLIF(TRIM(NEW.email), '');
  
  -- Extract role (default to attendee)
  v_role := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'role'), ''), 'attendee');
  
  -- Extract full name
  v_full_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    split_part(v_email, '@', 1),
    'User'
  );

  -- Determine base username
  v_base_username := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), ''),
    NULLIF(TRIM(split_part(v_email, '@', 1)), ''),
    'user'
  );
  
  v_username := v_base_username;

  -- Ensure username does not collide with another user
  WHILE EXISTS (
    SELECT 1 FROM public.users 
    WHERE lower(username) = lower(v_username) 
      AND (auth_user_id IS NULL OR auth_user_id != NEW.id)
  ) LOOP
    v_username := v_base_username || '_' || floor(random() * 8999 + 1000)::text;
    v_suffix := v_suffix + 1;
    IF v_suffix > 10 THEN
      v_username := v_base_username || '_' || substr(replace(NEW.id::text, '-', ''), 1, 6);
      EXIT;
    END IF;
  END LOOP;

  -- Insert or update existing record by auth_user_id or email
  IF EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = NEW.id) THEN
    UPDATE public.users
    SET
      email = COALESCE(v_email, email),
      full_name = COALESCE(v_full_name, full_name),
      role = COALESCE(v_role, role)
    WHERE auth_user_id = NEW.id;
  ELSIF v_email IS NOT NULL AND EXISTS (SELECT 1 FROM public.users WHERE lower(email) = lower(v_email)) THEN
    UPDATE public.users
    SET
      auth_user_id = NEW.id,
      full_name = COALESCE(v_full_name, full_name),
      role = COALESCE(v_role, role)
    WHERE lower(email) = lower(v_email);
  ELSE
    INSERT INTO public.users (
      auth_user_id,
      username,
      password,
      email,
      full_name,
      role
    ) VALUES (
      NEW.id,
      v_username,
      '',
      COALESCE(v_email, ''),
      v_full_name,
      v_role
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Do not block auth.users signup if an unexpected error occurs
  RAISE WARNING 'handle_new_auth_user error: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$;

-- 6. Update check_email_exists to be case-insensitive and whitespace-trimmed
CREATE OR REPLACE FUNCTION public.check_email_exists(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_email IS NULL OR TRIM(p_email) = '' THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM auth.users WHERE lower(trim(email)) = lower(trim(p_email))
  );
END;
$$;
