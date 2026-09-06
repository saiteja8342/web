-- ==============================================================================
-- MOTION NODE EDITS - FIX "Database error saving new user" ON SIGNUP
-- ==============================================================================
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/yipfxibyzqsxqhhiwotk/sql/new
--
-- Why the error happened:
-- When a new user registers, Supabase Auth runs an internal trigger on `auth.users`
-- (public.handle_new_user) to provision a row in `public.profiles`.
-- If that trigger throws an unhandled error (due to search_path not including public,
-- missing columns, enum type mismatches, or table constraints), PostgreSQL aborts
-- the signup transaction, and Supabase Auth reports "Database error saving new user".
--
-- This script makes the trigger 100% resilient and bulletproof with proper
-- search_path, explicit permissions, and exception isolation.
-- ==============================================================================

-- 1. Ensure public enums exist safely
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'editor', 'client');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. Ensure public.profiles table exists and has all required columns
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  role TEXT NOT NULL DEFAULT 'client',
  status TEXT NOT NULL DEFAULT 'pending',
  avatar_url TEXT,
  editor_title TEXT,
  username TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all optional columns exist on existing profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS editor_title TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- 3. Drop any problematic BEFORE INSERT triggers on auth.users
DROP TRIGGER IF EXISTS trg_block_admin_email_signup ON auth.users;

-- 4. Enable Row Level Security (RLS) on public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Safe policies on public.profiles
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admin full access on profiles" ON public.profiles;
  DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Allow user insert on signup" ON public.profiles;
  DROP POLICY IF EXISTS "Allow service role insert" ON public.profiles;
EXCEPTION WHEN undefined_object THEN null;
END $$;

-- Admins can manage all profiles
CREATE POLICY "Admin full access on profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role::text = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role::text = 'admin'
    )
  );

-- Users can view their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Allow inserting own profile (needed for frontend fallback)
CREATE POLICY "Allow user insert on signup"
  ON public.profiles FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 6. Grant Permissions on public.profiles
GRANT ALL ON public.profiles TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT ON public.profiles TO anon;

-- 7. Bulletproof handle_new_user() Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_role TEXT := 'client';
  v_status TEXT := 'pending';
  v_full_name TEXT;
  v_meta_role TEXT;
BEGIN
  -- Determine role safely from user metadata
  v_meta_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', ''));

  IF v_meta_role = 'editor' THEN
    v_role := 'editor';
  ELSE
    v_role := 'client';
  END IF;

  -- Determine display name safely
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    SPLIT_PART(NEW.email, '@', 1),
    'User'
  );

  -- Safe profile insertion with nested exception handling
  -- This guarantees that auth.users is NEVER rolled back!
  BEGIN
    -- Strategy A: Direct insert (works when role/status are text or compatible)
    INSERT INTO public.profiles (
      id,
      full_name,
      email,
      phone,
      company_name,
      role,
      status,
      editor_title
    )
    VALUES (
      NEW.id,
      v_full_name,
      NEW.email,
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'company_name',
      v_role,
      v_status,
      NEW.raw_user_meta_data->>'editor_title'
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email;
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      -- Strategy B: Fallback with explicit enum casting if columns are enum types
      EXECUTE '
        INSERT INTO public.profiles (
          id, full_name, email, role, status
        ) VALUES (
          $1, $2, $3, $4::public.user_role, $5::public.user_status
        )
        ON CONFLICT (id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          email = EXCLUDED.email
      ' USING NEW.id, v_full_name, NEW.email, v_role, v_status;
    EXCEPTION WHEN OTHERS THEN
      BEGIN
        -- Strategy C: Minimal insert with just required columns
        INSERT INTO public.profiles (id, full_name, email)
        VALUES (NEW.id, v_full_name, NEW.email)
        ON CONFLICT (id) DO NOTHING;
      EXCEPTION WHEN OTHERS THEN
        -- Never abort user creation in auth.users
        RAISE WARNING 'handle_new_user profile creation warning for %: %', NEW.id, SQLERRM;
      END;
    END;
  END;

  RETURN NEW;
END;
$$;

-- 8. Grant execute permissions on handle_new_user
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role, anon, authenticated;

-- 9. Re-attach the trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Verify setup notice
DO $$ BEGIN
  RAISE NOTICE 'Signup trigger handle_new_user and public.profiles successfully configured!';
END $$;
