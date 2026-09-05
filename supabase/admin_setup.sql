-- ==============================================================================
-- MOTION NODE EDITS - ADMIN USER SETUP & MANAGEMENT SQL
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PREPARATION: ENSURE USERNAME COLUMN EXISTS ON PROFILES TABLE
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- ------------------------------------------------------------------------------
-- METHOD 1: PROMOTE AN EXISTING REGISTERED USER TO ADMIN WITH USERNAME
-- ------------------------------------------------------------------------------
-- NOTE: If running both ALTER TABLE and UPDATE together in the same query window,
-- use dynamic execution so PostgreSQL does not throw "column does not exist" error:

DO $$
BEGIN
  -- 1. Ensure column exists
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;

  -- 2. Update existing user's role and username
  EXECUTE '
    UPDATE public.profiles
    SET 
      role = ''admin'',
      status = ''approved'',
      username = ''example ''
    WHERE email = ''admin@motionnodeedits.com'';
  ';
END $$;


-- ------------------------------------------------------------------------------
-- METHOD 2: CREATE A BRAND NEW ADMIN USER DIRECTLY VIA SQL
-- ------------------------------------------------------------------------------
-- If you want to create a fresh admin user from scratch with email & password:
-- Customize the email, password, and full name below, then run the entire block:

DO $$
DECLARE
  v_user_id UUID := gen_random_uuid();
  v_email TEXT := 'admin@motionnodeedits.com';  -- <--- Set your admin email
  v_password TEXT := 'AdminSecurePass2026!';     -- <--- Set your admin password
  v_full_name TEXT := 'MotionNode Administrator';-- <--- Set your admin display name
BEGIN
  -- 1. Check if user already exists in auth.users
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
    -- Ensure profile has admin role and approved status
    UPDATE public.profiles
    SET role = 'admin', status = 'approved'
    WHERE email = v_email;

    -- Update password in auth.users
    UPDATE auth.users
    SET 
      encrypted_password = crypt(v_password, gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      raw_user_meta_data = jsonb_build_object('full_name', v_full_name, 'role', 'admin')
    WHERE email = v_email;

    RAISE NOTICE 'User % already exists. Updated to admin role with new password.', v_email;
  ELSE
    -- 2. Insert into auth.users (Supabase Authentication table)
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud,
      confirmation_token
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      v_email,
      crypt(v_password, gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', v_full_name, 'role', 'admin'),
      NOW(),
      NOW(),
      'authenticated',
      'authenticated',
      ''
    );

    -- 3. Insert or update public.profiles
    INSERT INTO public.profiles (
      id,
      full_name,
      email,
      role,
      status,
      created_at
    ) VALUES (
      v_user_id,
      v_full_name,
      v_email,
      'admin',
      'approved',
      NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin', status = 'approved';

    RAISE NOTICE 'Successfully created new Admin user % with ID %', v_email, v_user_id;
  END IF;
END $$;


-- ------------------------------------------------------------------------------
-- METHOD 3: RESET AN ADMIN'S PASSWORD DIRECTLY VIA SQL
-- ------------------------------------------------------------------------------
-- If you need to change or reset an admin's password:

UPDATE auth.users
SET 
  encrypted_password = crypt('YourNewPasswordHere', gen_salt('bf')),
  updated_at = NOW()
WHERE email = 'admin@motionnodeedits.com'; -- <--- Replace with admin email


-- ------------------------------------------------------------------------------
-- METHOD 4: VERIFY ALL ACTIVE ADMINS
-- ------------------------------------------------------------------------------
-- Run this query to view all administrators in your database:

SELECT 
  p.id,
  p.full_name,
  p.email,
  p.role,
  p.status,
  p.created_at,
  u.email_confirmed_at
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE p.role = 'admin'
ORDER BY p.created_at DESC;


-- ------------------------------------------------------------------------------
-- METHOD 5: DATABASE-LEVEL TRIGGER TO HARD-BLOCK PUBLIC SIGNUP WITH ADMIN EMAILS
-- ------------------------------------------------------------------------------
-- Run this optional trigger in Supabase SQL Editor to enforce at the PostgreSQL level
-- that no public sign-up can ever be registered for an existing administrator email:

CREATE OR REPLACE FUNCTION public.block_admin_email_signup()
RETURNS TRIGGER AS $$
DECLARE
  v_existing_role TEXT;
BEGIN
  SELECT role INTO v_existing_role
  FROM public.profiles
  WHERE LOWER(email) = LOWER(TRIM(NEW.email));

  IF v_existing_role = 'admin' AND (NEW.raw_user_meta_data->>'role') IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Access Denied: Registration is strictly blocked for this email address.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_block_admin_email_signup ON auth.users;
CREATE TRIGGER trg_block_admin_email_signup
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.block_admin_email_signup();

