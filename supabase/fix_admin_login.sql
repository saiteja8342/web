-- ==============================================================================
-- MOTION NODE EDITS - MASTER SUPABASE SQL UPDATE (WORKING WITH ENUMS)
-- ==============================================================================
-- Run this entire script in your Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New Query -> Paste & Click "Run"
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- STEP 1: DROP OLD PROBLEMATIC TRIGGERS ON public.profiles & auth.users
-- (Removes triggers causing 22P02, 0A000, and P0001 prevent_role_tampering errors)
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_enforce_profile_insert_security ON public.profiles;
DROP TRIGGER IF EXISTS trg_protect_profile_privilege_escalation ON public.profiles;
DROP TRIGGER IF EXISTS trg_protect_profile_roles ON public.profiles;
DROP TRIGGER IF EXISTS trg_prevent_role_tampering ON public.profiles;
DROP TRIGGER IF EXISTS prevent_role_tampering ON public.profiles;
DROP TRIGGER IF EXISTS check_role_tampering ON public.profiles;
DROP TRIGGER IF EXISTS trg_check_role_tampering ON public.profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP FUNCTION IF EXISTS public.enforce_profile_insert_security() CASCADE;
DROP FUNCTION IF EXISTS public.protect_profile_privilege_escalation() CASCADE;
DROP FUNCTION IF EXISTS public.protect_profile_roles() CASCADE;
DROP FUNCTION IF EXISTS public.prevent_role_tampering() CASCADE;


-- ------------------------------------------------------------------------------
-- STEP 2: ENSURE ENUM TYPES & PROFILE TABLE COLUMNS EXIST
-- (Does NOT alter column types, avoiding error 0A000 with dependent policies)
-- ------------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'editor', 'client');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Ensure missing columns exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS editor_title TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();


-- ------------------------------------------------------------------------------
-- STEP 3: NON-RECURSIVE ADMIN CHECK FUNCTION (Avoids 42P17 RLS Recursion Error)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role::text = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;


-- ------------------------------------------------------------------------------
-- STEP 4: CHECK USER EXISTS FUNCTION (For Login Page Redirection)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_user_exists(target_email TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE LOWER(email) = LOWER(TRIM(target_email))
    UNION
    SELECT 1 FROM public.profiles WHERE LOWER(email) = LOWER(TRIM(target_email))
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.check_user_exists(TEXT) TO anon, authenticated, service_role;


-- ------------------------------------------------------------------------------
-- STEP 5: AUTOMATIC PROFILE CREATION TRIGGER (handle_new_user on auth.users)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_role user_role := 'client';
  v_status user_status := 'approved';
  v_full_name TEXT;
  v_username TEXT;
  v_avatar TEXT;
  v_meta_role TEXT;
BEGIN
  v_meta_role := LOWER(COALESCE(NEW.raw_app_meta_data->>'role', NEW.raw_user_meta_data->>'role', ''));

  IF v_meta_role = 'admin' OR LOWER(COALESCE(NEW.email, '')) = 'admin@motionnodeedits.com' THEN
    v_role := 'admin'::user_role;
    v_status := 'approved'::user_status;
  ELSIF v_meta_role = 'editor' THEN
    v_role := 'editor'::user_role;
    v_status := 'approved'::user_status;
  ELSE
    v_role := 'client'::user_role;
    v_status := 'approved'::user_status;
  END IF;

  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    SPLIT_PART(NEW.email, '@', 1),
    'User'
  );

  v_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );

  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    LOWER(REGEXP_REPLACE(v_full_name, '[^a-zA-Z0-9]', '', 'g')),
    SPLIT_PART(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (
    id, full_name, email, phone, company_name, avatar_url, role, status, username, created_at, updated_at
  ) VALUES (
    NEW.id, v_full_name, NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'company_name',
    v_avatar, v_role, v_status, v_username, NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = NOW();

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user error for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ------------------------------------------------------------------------------
-- STEP 6: BACKFILL ALL EXISTING USERS FROM auth.users INTO public.profiles
-- (Explicitly casts to user_role and user_status enums)
-- ------------------------------------------------------------------------------
INSERT INTO public.profiles (
  id, full_name, email, avatar_url, role, status, username, created_at, updated_at
)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', SPLIT_PART(u.email, '@', 1), 'User'),
  u.email,
  COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture'),
  (CASE 
    WHEN LOWER(COALESCE(u.raw_app_meta_data->>'role', '')) = 'admin' OR LOWER(u.email) = 'admin@motionnodeedits.com' THEN 'admin'
    WHEN LOWER(COALESCE(u.raw_user_meta_data->>'role', '')) = 'editor' THEN 'editor'
    ELSE 'client'
  END)::user_role,
  'approved'::user_status,
  COALESCE(u.raw_user_meta_data->>'username', SPLIT_PART(u.email, '@', 1)),
  COALESCE(u.created_at, NOW()),
  NOW()
FROM auth.users u
WHERE u.id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO UPDATE SET
  status = 'approved'::user_status,
  full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);


-- ------------------------------------------------------------------------------
-- STEP 7: RPC: ensure_user_profile() (On-demand Profile Auto-Healing)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user auth.users%ROWTYPE;
  v_profile public.profiles%ROWTYPE;
  v_full_name TEXT;
  v_role user_role;
  v_username TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = auth.uid();
  IF FOUND THEN
    RETURN v_profile;
  END IF;

  SELECT * INTO v_user FROM auth.users WHERE id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found in auth.users';
  END IF;

  v_full_name := COALESCE(
    v_user.raw_user_meta_data->>'full_name',
    v_user.raw_user_meta_data->>'name',
    SPLIT_PART(v_user.email, '@', 1),
    'User'
  );

  IF LOWER(COALESCE(v_user.raw_app_meta_data->>'role', '')) = 'admin' 
     OR LOWER(COALESCE(v_user.email, '')) = 'admin@motionnodeedits.com' THEN
    v_role := 'admin'::user_role;
  ELSIF LOWER(COALESCE(v_user.raw_user_meta_data->>'role', '')) = 'editor' THEN
    v_role := 'editor'::user_role;
  ELSE
    v_role := 'client'::user_role;
  END IF;

  v_username := COALESCE(
    v_user.raw_user_meta_data->>'username',
    SPLIT_PART(v_user.email, '@', 1)
  );

  INSERT INTO public.profiles (
    id, full_name, email, role, status, username, created_at, updated_at
  ) VALUES (
    v_user.id, v_full_name, v_user.email, v_role, 'approved'::user_status, v_username, NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET status = 'approved'::user_status
  RETURNING * INTO v_profile;

  RETURN v_profile;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_user_profile() TO authenticated;


-- ------------------------------------------------------------------------------
-- STEP 8: TYPE-SAFE ANTI-TAMPERING PRIVILEGE ESCALATION TRIGGER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Allow updates initiated by the Database Administrator (SQL Editor, postgres, service_role, or existing admins)
  IF auth.uid() IS NULL 
     OR current_user IN ('postgres', 'service_role', 'supabase_admin') 
     OR (auth.jwt()->>'role') = 'service_role'
     OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Block unauthorized changes from regular clients/editors in the browser
  -- Uses ::text so enum comparisons never error
  IF NEW.role::text IS DISTINCT FROM OLD.role::text THEN
    RAISE EXCEPTION 'Access Denied: You cannot modify your role.';
  END IF;
  IF NEW.status::text IS DISTINCT FROM OLD.status::text THEN
    RAISE EXCEPTION 'Access Denied: You cannot modify your account status.';
  END IF;
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Access Denied: Profile ID cannot be altered.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER trg_protect_profile_privilege_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_privilege_escalation();


-- ------------------------------------------------------------------------------
-- STEP 9: ADMIN USER DELETION RPC (Admin Dashboard Client Moderation)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Only administrators can delete users.';
  END IF;

  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Action Denied: You cannot delete your own admin account.';
  END IF;

  DELETE FROM public.profiles WHERE id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;

  RETURN jsonb_build_object('success', true, 'deleted_user_id', target_user_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_by_admin(UUID) TO authenticated;


-- ------------------------------------------------------------------------------
-- STEP 10: ROW LEVEL SECURITY (RLS) POLICIES ON public.profiles
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Admin full access on profiles" ON public.profiles;
  DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Allow user insert on signup" ON public.profiles;
EXCEPTION WHEN undefined_object THEN null;
END $$;

CREATE POLICY "Admin full access on profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Allow user insert on signup"
  ON public.profiles FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

GRANT ALL ON public.profiles TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT ON public.profiles TO anon;


-- ------------------------------------------------------------------------------
-- STEP 10.1: HELPER FUNCTION: set_user_role(email, role)
-- Allows updating any user's role with a single line of SQL!
-- Example: SELECT public.set_user_role('user@example.com', 'admin');
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_user_role(target_email TEXT, new_role TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF LOWER(new_role) NOT IN ('admin', 'editor', 'client') THEN
    RAISE EXCEPTION 'Invalid role: %. Must be admin, editor, or client.', new_role;
  END IF;

  -- 1. Update public.profiles
  UPDATE public.profiles
  SET 
    role = LOWER(new_role)::user_role,
    status = 'approved'::user_status,
    updated_at = NOW()
  WHERE LOWER(TRIM(email)) = LOWER(TRIM(target_email));

  -- 2. Update auth.users metadata
  UPDATE auth.users
  SET 
    raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', LOWER(new_role)),
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', LOWER(new_role)),
    email_confirmed_at = COALESCE(email_confirmed_at, NOW())
  WHERE LOWER(TRIM(email)) = LOWER(TRIM(target_email));

  RETURN 'Role for ' || target_email || ' successfully updated to ' || LOWER(new_role);
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_user_role(TEXT, TEXT) TO postgres, service_role, authenticated;


-- ------------------------------------------------------------------------------
-- STEP 11: MANUAL ROLE UPDATE (CHANGE YOUR ROLE HERE)
-- Set your email address in the variable below:
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  -- >>> PUT YOUR EMAIL ADDRESS HERE <<<
  v_my_email TEXT := 'admin@motionnodeedits.com'; 
BEGIN
  -- 1. Update public.profiles
  UPDATE public.profiles
  SET 
    role = 'admin'::user_role,
    status = 'approved'::user_status,
    username = COALESCE(username, 'admin'),
    updated_at = NOW()
  WHERE LOWER(TRIM(email)) = LOWER(TRIM(v_my_email));

  -- 2. Update auth.users metadata
  UPDATE auth.users
  SET 
    raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb,
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb,
    email_confirmed_at = COALESCE(email_confirmed_at, NOW())
  WHERE LOWER(TRIM(email)) = LOWER(TRIM(v_my_email));

  RAISE NOTICE 'Role successfully updated to admin for %', v_my_email;
END $$;


-- ------------------------------------------------------------------------------
-- STEP 12: VERIFICATION: VIEW ALL USERS AND THEIR CURRENT ROLES
-- ------------------------------------------------------------------------------
SELECT id, full_name, email, role, status, username, created_at
FROM public.profiles
ORDER BY created_at DESC;
