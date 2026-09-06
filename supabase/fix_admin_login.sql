-- ==============================================================================
-- MOTION NODE EDITS - FIX ADMIN LOGIN & ENABLE CLIENT MODERATION
-- ==============================================================================
-- Run this script in your Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New Query -> Paste & Run
-- ==============================================================================

-- 1. Ensure required columns exist on public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS editor_title TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'client';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

-- 2. Create or replace SECURITY DEFINER helper function to verify admin role
-- This completely avoids PostgreSQL RLS infinite recursion error 42P17
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role::text = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

-- 2.1 Function to check if a user account exists (used by login page to redirect un-registered visitors to signup)
CREATE OR REPLACE FUNCTION public.check_user_exists(target_email TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE LOWER(email) = LOWER(TRIM(target_email))
    UNION
    SELECT 1 FROM public.profiles WHERE LOWER(email) = LOWER(TRIM(target_email))
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.check_user_exists(TEXT) TO anon, authenticated, service_role;

-- 3. Hard-Block Privilege Escalation via Database Triggers
-- Even if an attacker uses Inspect Element / DevTools console to call:
-- supabase.from('profiles').update({ role: 'admin' })
-- This trigger blocks it at the database engine level!
CREATE OR REPLACE FUNCTION public.protect_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Access Denied: You cannot modify user role.';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Access Denied: You cannot modify user approval status.';
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

-- Prevent non-admins from inserting role='admin' on signup, and auto-approve new clients
CREATE OR REPLACE FUNCTION public.enforce_profile_insert_security()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    IF LOWER(COALESCE(NEW.role, '')) = 'admin' THEN
      NEW.role := 'client';
    END IF;
  END IF;

  -- New client accounts are automatically approved to access the client dashboard directly
  IF NEW.status IS NULL OR NEW.status = 'pending' THEN
    NEW.status := 'approved';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_profile_insert_security ON public.profiles;
CREATE TRIGGER trg_enforce_profile_insert_security
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_profile_insert_security();

-- Auto-approve any previously registered clients currently stuck in 'pending'
UPDATE public.profiles
SET status = 'approved'
WHERE status = 'pending' AND (role = 'client' OR role IS NULL);


-- 4. Enable RLS and establish non-recursive policies on public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Admin full access on profiles" ON public.profiles;
  DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Allow user insert on signup" ON public.profiles;
  DROP POLICY IF EXISTS "Admin delete profiles" ON public.profiles;
EXCEPTION WHEN undefined_object THEN null;
END $$;

-- Policy A: Admin has full access (SELECT, INSERT, UPDATE, DELETE) on profiles
CREATE POLICY "Admin full access on profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Policy B: Authenticated users can view their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Policy C: Authenticated users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Policy D: Allow insert on registration
CREATE POLICY "Allow user insert on signup"
  ON public.profiles FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);


-- 4. Grant table permissions
GRANT ALL ON public.profiles TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT ON public.profiles TO anon;

-- 5. Admin User Deletion Function (Deletes from both public.profiles and auth.users)
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify calling user is an administrator
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Only administrators can delete users.';
  END IF;

  -- Prevent admin from deleting themselves
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Action Denied: You cannot delete your own admin account.';
  END IF;

  -- Delete from public.profiles
  DELETE FROM public.profiles WHERE id = target_user_id;

  -- Delete from auth.users (cascades session/identity removal)
  DELETE FROM auth.users WHERE id = target_user_id;

  RETURN jsonb_build_object('success', true, 'deleted_user_id', target_user_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_by_admin(UUID) TO authenticated;

-- 6. Promote your administrator user to 'admin' role & 'approved' status
-- Change 'admin@motionnodeedits.com' to your admin email if different:
DO $$
DECLARE
  v_target_email TEXT := 'admin@motionnodeedits.com'; -- <--- SET YOUR ADMIN EMAIL HERE
  v_found_user_id UUID;
BEGIN
  -- 1. Find user in auth.users
  SELECT id INTO v_found_user_id
  FROM auth.users
  WHERE LOWER(email) = LOWER(TRIM(v_target_email))
  LIMIT 1;

  IF v_found_user_id IS NULL THEN
    RAISE WARNING 'User with email "%" was not found in auth.users. Please sign up or create this user first, then re-run.', v_target_email;
  ELSE
    -- 2. Insert or update in public.profiles
    INSERT INTO public.profiles (id, full_name, email, role, status, username)
    SELECT 
      u.id,
      COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', 'Administrator'),
      u.email,
      'admin',
      'approved',
      COALESCE(u.raw_user_meta_data->>'username', 'admin')
    FROM auth.users u
    WHERE u.id = v_found_user_id
    ON CONFLICT (id) DO UPDATE
    SET 
      role = 'admin',
      status = 'approved',
      username = COALESCE(public.profiles.username, 'admin');

    -- 3. Also update server-controlled metadata in auth.users
    UPDATE auth.users
    SET 
      raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb,
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
    WHERE id = v_found_user_id;

    RAISE NOTICE 'SUCCESS: Administrator privileges successfully granted to % (User ID: %)', v_target_email, v_found_user_id;
  END IF;
END $$;

