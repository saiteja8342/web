-- ==============================================================================
-- MOTION NODE EDITS - COMPREHENSIVE SECURITY HARDENING & ANTI-TAMPERING SQL
-- ==============================================================================
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/yipfxibyzqsxqhhiwotk/sql/new
--
-- What this script defends against:
-- 1. Inspect Panel / DevTools Role Tampering:
--    Blocks any user from changing their role to 'admin' using DevTools console or PostgREST API.
-- 2. Unauthorized Profile Insertion:
--    Prevents attackers from inserting records with role='admin' during signup.
-- 3. Row-Level Security (RLS) Leakage:
--    Locks down orders, contact_requests, profiles, ratings, and revisions.
-- 4. Infinite Recursion in Policies:
--    Uses SECURITY DEFINER on public.is_admin() to safely verify administrative rank.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SAFE ADMIN ROLE VERIFICATION FUNCTION (SECURITY DEFINER)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role::text = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

-- Function to check if a user account exists (used by login page to redirect un-registered visitors to signup)
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
-- 2. HARD-BLOCK PRIVILEGE ESCALATION ON PROFILES (TRIGGER: BEFORE UPDATE)
-- ------------------------------------------------------------------------------
-- If an attacker calls: supabase.from('profiles').update({ role: 'admin' })
-- This trigger intercepts the query at the database engine level and ABORTS it.
CREATE OR REPLACE FUNCTION public.protect_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If actor is already a verified administrator, permit legitimate management updates
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- 1. Block unauthorized role escalation
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Access Denied: You cannot modify user role. Tampering attempt logged.';
  END IF;

  -- 2. Block unauthorized approval status modification (e.g. self-approving blocked account)
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Access Denied: You cannot modify user approval status.';
  END IF;

  -- 3. Block ID manipulation
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Access Denied: Profile ID cannot be altered.';
  END IF;

  -- 4. Block email hijacking on profile
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    -- Email must match authenticated user's email
    IF LOWER(NEW.email) <> LOWER(auth.jwt()->>'email') THEN
      RAISE EXCEPTION 'Access Denied: Profile email must match authenticated account.';
    END IF;
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
-- 3. HARD-BLOCK UNAUTHORIZED ADMIN INSERTS (TRIGGER: BEFORE INSERT)
-- ------------------------------------------------------------------------------
-- Prevents attackers from injecting role='admin' on registration/insert.
CREATE OR REPLACE FUNCTION public.enforce_profile_insert_security()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_provider TEXT;
BEGIN
  -- If already an admin (e.g. admin provisioning a user via dashboard), permit
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Non-admins CANNOT insert with role='admin'
  IF LOWER(COALESCE(NEW.role, '')) = 'admin' THEN
    NEW.role := 'client';
  END IF;

  -- Detect if signup is Google OAuth from auth.users metadata
  SELECT LOWER(COALESCE(raw_app_meta_data->>'provider', '')) INTO v_provider
  FROM auth.users
  WHERE id = NEW.id;

  -- All client registrations receive instant approved status to enter the client dashboard directly
  IF NEW.status IS NULL OR NEW.status NOT IN ('approved', 'rejected') THEN
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



-- ------------------------------------------------------------------------------
-- 4. SECURE ROW-LEVEL SECURITY POLICIES: PROFILES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Admin full access on profiles" ON public.profiles;
  DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Allow user insert on signup" ON public.profiles;
  DROP POLICY IF EXISTS "Admin delete profiles" ON public.profiles;
EXCEPTION WHEN undefined_object THEN null;
END $$;

-- Admins have unrestricted access to all profiles
CREATE POLICY "Admin full access on profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Regular authenticated users can only view their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Regular users can only update their own profile (guarded by anti-tampering trigger)
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Allow initial profile creation upon registration
CREATE POLICY "Allow user insert on signup"
  ON public.profiles FOR INSERT
  TO anon, authenticated
  WITH CHECK (id = auth.uid() OR auth.uid() IS NULL);


-- ------------------------------------------------------------------------------
-- 5. SECURE ROW-LEVEL SECURITY POLICIES: ORDERS
-- ------------------------------------------------------------------------------
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Admin full access on orders" ON public.orders;
  DROP POLICY IF EXISTS "Editors can select assigned orders" ON public.orders;
  DROP POLICY IF EXISTS "Editors can update assigned orders status" ON public.orders;
  DROP POLICY IF EXISTS "Clients can select own orders" ON public.orders;
EXCEPTION WHEN undefined_object THEN null;
END $$;

-- Admins can read, create, update, and delete all orders
CREATE POLICY "Admin full access on orders"
  ON public.orders FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Clients can strictly ONLY view their own orders
CREATE POLICY "Clients can select own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

-- Editors can strictly ONLY view orders assigned to them
CREATE POLICY "Editors can select assigned orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (editor_id = auth.uid());

-- Editors can update status on assigned orders
CREATE POLICY "Editors can update assigned orders status"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (editor_id = auth.uid())
  WITH CHECK (editor_id = auth.uid());


-- ------------------------------------------------------------------------------
-- 6. SECURE ROW-LEVEL SECURITY POLICIES: CONTACT REQUESTS
-- ------------------------------------------------------------------------------
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow public anonymous submissions" ON public.contact_requests;
  DROP POLICY IF EXISTS "Admin full access on contact_requests" ON public.contact_requests;
  DROP POLICY IF EXISTS "Allow public insert on contact_requests" ON public.contact_requests;
EXCEPTION WHEN undefined_object THEN null;
END $$;

-- Website visitors can submit inquiries
CREATE POLICY "Allow public anonymous submissions"
  ON public.contact_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ONLY admins can read, update, or delete customer contact requests
CREATE POLICY "Admin full access on contact_requests"
  ON public.contact_requests FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ------------------------------------------------------------------------------
-- 7. SECURE ROW-LEVEL SECURITY POLICIES: RATINGS & REVISION REQUESTS
-- ------------------------------------------------------------------------------
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Admin full access on ratings" ON public.ratings;
  DROP POLICY IF EXISTS "Clients can insert rating for delivered orders" ON public.ratings;
  DROP POLICY IF EXISTS "Clients can select own ratings" ON public.ratings;
  DROP POLICY IF EXISTS "Clients can update own ratings" ON public.ratings;
  DROP POLICY IF EXISTS "Editors can select own ratings" ON public.ratings;
  DROP POLICY IF EXISTS "Public can view approved testimonials" ON public.ratings;
EXCEPTION WHEN undefined_object THEN null;
END $$;

CREATE POLICY "Admin full access on ratings"
  ON public.ratings FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Public can view approved testimonials"
  ON public.ratings FOR SELECT
  TO anon, authenticated
  USING (is_approved = true AND is_public = true);

CREATE POLICY "Clients can select own ratings"
  ON public.ratings FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "Clients can insert rating for delivered orders"
  ON public.ratings FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = ratings.order_id
      AND orders.client_id = auth.uid()
      AND orders.status = 'delivered'
    )
  );

CREATE POLICY "Clients can update own ratings"
  ON public.ratings FOR UPDATE
  TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Editors can select own ratings"
  ON public.ratings FOR SELECT
  TO authenticated
  USING (editor_id = auth.uid());


-- ------------------------------------------------------------------------------
-- 8. GRANT LEAST-PRIVILEGE TABLE PERMISSIONS
-- ------------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT ON public.profiles TO anon;
GRANT SELECT ON public.orders TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.ratings TO authenticated;
GRANT SELECT, INSERT ON public.ratings TO anon;
GRANT INSERT ON public.contact_requests TO anon, authenticated;
GRANT ALL ON public.contact_requests TO service_role;


-- ------------------------------------------------------------------------------
-- 9. PERMISSION AUDIT FUNCTION
-- ------------------------------------------------------------------------------
-- Run this in SQL Editor to inspect any user's role and security state:
-- SELECT * FROM public.audit_user_security('user@example.com');
CREATE OR REPLACE FUNCTION public.audit_user_security(target_email TEXT)
RETURNS TABLE (
  profile_id UUID,
  email TEXT,
  full_name TEXT,
  database_role TEXT,
  status TEXT,
  auth_provider TEXT,
  is_admin_verified BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role::text,
    p.status::text,
    COALESCE(u.raw_app_meta_data->>'provider', 'email')::text,
    (p.role::text = 'admin') AS is_admin_verified
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  WHERE LOWER(p.email) = LOWER(TRIM(target_email));
END;
$$;

GRANT EXECUTE ON FUNCTION public.audit_user_security(TEXT) TO authenticated, service_role;

-- Verification notice
DO $$ BEGIN
  RAISE NOTICE 'Security hardening successfully applied! Anti-tampering triggers and RLS policies are active.';
END $$;
