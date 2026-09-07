-- ==============================================================================
-- MOTION NODE EDITS - CLIENT PROFILE UPDATE & SECURITY POLICIES
-- Run this script in the Supabase SQL Editor to ensure clients can safely update
-- their own name/profile while strictly preventing unauthorized privilege escalation.
-- ==============================================================================

-- 1. Ensure columns exist on public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS previous_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Safely replace RLS policies for reading and updating own profile
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
EXCEPTION WHEN undefined_object THEN null;
END $$;

-- Policy 1: Authenticated users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Policy 2: Authenticated users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 4. Database Trigger: Strictly block non-admin users from tampering with role, status, or id
CREATE OR REPLACE FUNCTION public.protect_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Allow service role or postgres superuser
  IF auth.uid() IS NULL 
     OR current_user IN ('postgres', 'service_role', 'supabase_admin') 
     OR (auth.jwt()->>'role') = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- If helper public.is_admin() exists and user is admin, allow admin edits
  BEGIN
    IF public.is_admin() THEN
      RETURN NEW;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- If is_admin() function doesn't exist, proceed to checks below
    NULL;
  END;

  -- Block clients/editors from changing their role
  IF NEW.role::text IS DISTINCT FROM OLD.role::text THEN
    RAISE EXCEPTION 'Access Denied: You cannot modify your account role.';
  END IF;

  -- Block clients/editors from changing their account status (e.g., self-approving)
  IF NEW.status::text IS DISTINCT FROM OLD.status::text THEN
    RAISE EXCEPTION 'Access Denied: You cannot modify your account status.';
  END IF;

  -- Block altering user ID
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Access Denied: Account ID cannot be altered.';
  END IF;

  -- Automatically record previous name if full_name is changed
  IF NEW.full_name IS DISTINCT FROM OLD.full_name AND OLD.full_name IS NOT NULL THEN
    NEW.previous_name = OLD.full_name;
  END IF;

  -- Automatically update timestamp
  NEW.updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER trg_protect_profile_privilege_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_privilege_escalation();

-- 5. Grant permissions to authenticated users
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
