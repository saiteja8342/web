-- ==============================================================================
-- MOTION NODE EDITS / VELOCITY STUDIO
-- PRODUCTION MASTER SECURITY HARDENING & DATABASE MIGRATION SCRIPT
-- ==============================================================================
-- Execute this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql/new
--
-- This script hardens all 11 tables, triggers, RPC procedures, and RLS policies
-- against unauthorized privilege escalation, tamper attacks, data leakage,
-- and rate-limiting bypasses.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. BASE ENUM TYPES (Created safely if not already present)
-- ------------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'editor', 'client');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE video_type_enum AS ENUM ('youtube_longform', 'short', 'reel', 'ad', 'corporate', 'other');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status_enum AS ENUM (
    'received',
    'accepted',
    'in_editing',
    'in_review',
    'revision_requested',
    'on_hold',
    'delivered'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE revision_status_enum AS ENUM ('pending', 'confirmed', 'assigned', 'completed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 2. SECURE ADMIN VERIFICATION HELPERS (FIXED SEARCH_PATH)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role::text = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public, auth, pg_temp;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_cms_admin()
RETURNS BOOLEAN AS $$
BEGIN
  IF current_user IN ('postgres', 'service_role', 'supabase_admin') THEN
    RETURN TRUE;
  END IF;
  IF (SELECT auth.role()) = 'service_role' THEN
    RETURN TRUE;
  END IF;
  RETURN public.is_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public, auth, pg_temp;

GRANT EXECUTE ON FUNCTION public.is_cms_admin() TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 3. ACCOUNT ENUMERATION & PASSWORD RESET RPC
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_user_exists(target_email TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE LOWER(email) = LOWER(TRIM(target_email))
    UNION
    SELECT 1 FROM public.profiles WHERE LOWER(email) = LOWER(TRIM(target_email))
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public, auth, pg_temp;

REVOKE EXECUTE ON FUNCTION public.check_user_exists(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.check_user_exists(TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.check_can_reset_password(target_email TEXT)
RETURNS JSONB AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role::text INTO v_role
  FROM public.profiles
  WHERE LOWER(email) = LOWER(TRIM(target_email));

  IF v_role = 'admin' THEN
    RETURN jsonb_build_object('allowed', false);
  ELSE
    RETURN jsonb_build_object('allowed', true);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.check_can_reset_password(TEXT) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 4. PRIVILEGE ESCALATION PREVENTION ON PROFILES
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  -- Allow service role or verified administrator
  IF auth.uid() IS NULL 
     OR current_user IN ('postgres', 'service_role', 'supabase_admin') 
     OR (auth.jwt()->>'role') = 'service_role'
     OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Block unauthorized role escalation
  IF NEW.role::text IS DISTINCT FROM OLD.role::text THEN
    RAISE EXCEPTION 'Access Denied: You cannot modify user role.';
  END IF;

  -- Block unauthorized approval status modification
  IF NEW.status::text IS DISTINCT FROM OLD.status::text THEN
    RAISE EXCEPTION 'Access Denied: You cannot modify user approval status.';
  END IF;

  -- Block profile ID manipulation
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Access Denied: Profile ID cannot be altered.';
  END IF;

  -- Block profile email hijacking
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    IF LOWER(NEW.email) <> LOWER(COALESCE(auth.jwt()->>'email', '')) THEN
      RAISE EXCEPTION 'Access Denied: Profile email must match authenticated account.';
    END IF;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER trg_protect_profile_privilege_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_privilege_escalation();

CREATE OR REPLACE FUNCTION public.enforce_profile_insert_security()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  -- Administrators and service role can set arbitrary initial role
  IF public.is_admin() OR current_user IN ('postgres', 'service_role', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  -- Non-admins CANNOT self-insert with role='admin'
  IF LOWER(COALESCE(NEW.role::text, '')) = 'admin' THEN
    NEW.role := 'client'::user_role;
  END IF;

  -- Default client registrations to approved status; editors to pending
  IF NEW.role::text = 'editor' THEN
    NEW.status := 'pending'::user_status;
  ELSIF NEW.status IS NULL OR NEW.status::text NOT IN ('approved', 'rejected') THEN
    NEW.status := 'approved'::user_status;
  END IF;

  NEW.created_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_profile_insert_security ON public.profiles;
CREATE TRIGGER trg_enforce_profile_insert_security
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_profile_insert_security();

-- ------------------------------------------------------------------------------
-- 5. SECURE SIGNUP TRIGGER ON auth.users (handle_new_user)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_role user_role := 'client';
  v_status user_status := 'approved';
  v_full_name TEXT;
  v_username TEXT;
  v_avatar TEXT;
  v_app_role TEXT;
  v_user_role TEXT;
BEGIN
  -- Only server-managed app_metadata can assign admin
  v_app_role := LOWER(COALESCE(NEW.raw_app_meta_data->>'role', ''));
  v_user_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', ''));

  IF v_app_role = 'admin' THEN
    v_role := 'admin'::user_role;
    v_status := 'approved'::user_status;
  ELSIF v_user_role = 'editor' OR v_app_role = 'editor' THEN
    v_role := 'editor'::user_role;
    v_status := 'pending'::user_status;
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 6. ORDER SECURITY: PREVENT EDITOR / CLIENT OVERREACH
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_order_editor_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  -- If actor is an admin or service role, allow full edit
  IF public.is_admin() 
     OR current_user IN ('postgres', 'service_role', 'supabase_admin') 
     OR (auth.jwt()->>'role') = 'service_role'
     OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- If actor is the assigned editor, they can ONLY update status between in_editing and in_review
  IF OLD.editor_id = auth.uid() THEN
    -- Ensure editor can only transition to valid workflow statuses
    IF NEW.status NOT IN ('in_editing', 'in_review') THEN
      RAISE EXCEPTION 'Access Denied: Editors can only update status to in_editing or in_review.';
    END IF;

    -- Strict immutability of all other columns for editor
    NEW.order_name := OLD.order_name;
    NEW.client_id := OLD.client_id;
    NEW.editor_id := OLD.editor_id;
    NEW.admin_id := OLD.admin_id;
    NEW.brief := OLD.brief;
    NEW.drive_link := OLD.drive_link;
    NEW.dropbox_link := OLD.dropbox_link;
    NEW.additional_link := OLD.additional_link;
    NEW.editor_deadline := OLD.editor_deadline;
    NEW.client_deadline := OLD.client_deadline;
    NEW.admin_notes := OLD.admin_notes;
    NEW.video_type := OLD.video_type;
    NEW.created_at := OLD.created_at;
    NEW.updated_at := NOW();
    RETURN NEW;
  END IF;

  -- Other non-admin users cannot update orders
  RAISE EXCEPTION 'Access Denied: You cannot modify this order.';
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_order_editor_tampering ON public.orders;
CREATE TRIGGER trg_protect_order_editor_tampering
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_order_editor_tampering();

-- ------------------------------------------------------------------------------
-- 7. AUDIT TRAIL TRIGGER: IMMUTABLE ORDER STATUS TRANSITION LOGGING
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_order_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  -- Only log if the status actually changed
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.order_status_history (
      order_id,
      changed_by,
      old_status,
      new_status,
      changed_at,
      notes
    ) VALUES (
      NEW.id,
      COALESCE(auth.uid(), NEW.editor_id, NEW.admin_id),
      OLD.status::text,
      NEW.status::text,
      NOW(),
      CASE 
        WHEN public.is_admin() THEN 'Status updated by administrator'
        WHEN auth.uid() = NEW.editor_id THEN 'Status updated by assigned editor'
        ELSE 'Status transition'
      END
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_order_status_history ON public.orders;
CREATE TRIGGER trg_log_order_status_history
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.log_order_status_transition();

-- ------------------------------------------------------------------------------
-- 8. REVISION REQUEST SECURITY TRIGGER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_revision_request_security()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_order_client_id UUID;
BEGIN
  -- Admin or service role bypass
  IF public.is_admin() 
     OR current_user IN ('postgres', 'service_role', 'supabase_admin') 
     OR (auth.jwt()->>'role') = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Verify order exists and belongs to calling client
  SELECT client_id
  INTO v_order_client_id
  FROM public.orders
  WHERE id = NEW.order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found.';
  END IF;

  IF v_order_client_id != auth.uid() THEN
    RAISE EXCEPTION 'Access Denied: You can only request revisions on your own orders.';
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.requested_by := auth.uid();
    NEW.status := 'pending'::revision_status_enum;
    NEW.confirmed_by := NULL;
    NEW.created_at := NOW();
    NEW.updated_at := NOW();
  END IF;

  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'Access Denied: Only administrators can update revision requests.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_revision_request_security ON public.revision_requests;
CREATE TRIGGER trg_protect_revision_request_security
  BEFORE INSERT OR UPDATE ON public.revision_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_revision_request_security();

-- ------------------------------------------------------------------------------
-- 9. RATINGS SECURITY TRIGGER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_rating_security()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_order_editor_id UUID;
  v_order_status order_status_enum;
  v_order_client_id UUID;
BEGIN
  -- Admin bypass
  IF public.is_admin() 
     OR current_user IN ('postgres', 'service_role', 'supabase_admin') 
     OR (auth.jwt()->>'role') = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- 1. Fetch order details to verify ownership and delivery status
  SELECT editor_id, status, client_id
  INTO v_order_editor_id, v_order_status, v_order_client_id
  FROM public.orders
  WHERE id = NEW.order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found.';
  END IF;

  IF v_order_client_id != auth.uid() THEN
    RAISE EXCEPTION 'Access Denied: You can only rate your own orders.';
  END IF;

  IF v_order_status != 'delivered' THEN
    RAISE EXCEPTION 'Access Denied: You can only rate delivered orders.';
  END IF;

  -- 2. On INSERT: enforce valid relationships & force is_testimonial to FALSE
  IF TG_OP = 'INSERT' THEN
    NEW.client_id := auth.uid();
    NEW.editor_id := v_order_editor_id;
    NEW.is_testimonial := FALSE;
    NEW.created_at := NOW();
  END IF;

  -- 3. On UPDATE: prevent tampering with foreign keys and testimonial moderation flag
  IF TG_OP = 'UPDATE' THEN
    IF NEW.order_id IS DISTINCT FROM OLD.order_id 
       OR NEW.client_id IS DISTINCT FROM OLD.client_id
       OR NEW.editor_id IS DISTINCT FROM OLD.editor_id THEN
      RAISE EXCEPTION 'Access Denied: Cannot modify order or user references on rating.';
    END IF;

    -- Non-admin cannot alter testimonial publication status
    NEW.is_testimonial := OLD.is_testimonial;
  END IF;

  -- 4. Validate rating range
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating score must be between 1 and 5.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_rating_security ON public.ratings;
CREATE TRIGGER trg_protect_rating_security
  BEFORE INSERT OR UPDATE ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_rating_security();

-- ------------------------------------------------------------------------------
-- 10. PUBLIC CONTACT REQUEST RATE LIMIT & DATA INTEGRITY TRIGGER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_contact_request_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Normalize email
  NEW.email := LOWER(TRIM(NEW.email));
  
  -- Basic format validation
  IF NEW.email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email address format.';
  END IF;

  -- Validate lengths
  IF LENGTH(TRIM(NEW.name)) < 1 OR LENGTH(TRIM(NEW.name)) > 150 THEN
    RAISE EXCEPTION 'Name length must be between 1 and 150 characters.';
  END IF;

  IF LENGTH(TRIM(NEW.message)) < 2 OR LENGTH(TRIM(NEW.message)) > 5000 THEN
    RAISE EXCEPTION 'Message length must be between 2 and 5000 characters.';
  END IF;

  -- 24-Hour Cooldown rate limit
  IF EXISTS (
    SELECT 1 FROM public.contact_requests
    WHERE LOWER(email) = NEW.email
      AND created_at > (NOW() - INTERVAL '24 hours')
  ) THEN
    RAISE EXCEPTION 'Rate limit exceeded: A contact request from this email was already received in the last 24 hours.';
  END IF;

  -- Lock privileged fields
  NEW.status := 'new';
  NEW.admin_notes := NULL;
  NEW.created_at := NOW();
  NEW.updated_at := NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_contact_request_rate_limit ON public.contact_requests;
CREATE TRIGGER trg_enforce_contact_request_rate_limit
  BEFORE INSERT ON public.contact_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_contact_request_rate_limit();

-- ------------------------------------------------------------------------------
-- 11. PUBLIC FEEDBACK VALIDATION TRIGGER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_link_feedback_security()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Validate rating
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    NEW.rating := 5;
  END IF;

  -- Validate text lengths
  IF LENGTH(TRIM(NEW.name)) < 1 OR LENGTH(TRIM(NEW.name)) > 150 THEN
    RAISE EXCEPTION 'Name must be between 1 and 150 characters.';
  END IF;

  IF LENGTH(TRIM(NEW.feedback)) < 2 OR LENGTH(TRIM(NEW.feedback)) > 5000 THEN
    RAISE EXCEPTION 'Feedback must be between 2 and 5000 characters.';
  END IF;

  -- Normalize email if provided
  IF NEW.email IS NOT NULL THEN
    NEW.email := LOWER(TRIM(NEW.email));
  END IF;

  NEW.created_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_link_feedback_security ON public.link_feedback;
CREATE TRIGGER trg_enforce_link_feedback_security
  BEFORE INSERT ON public.link_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_link_feedback_security();

-- ------------------------------------------------------------------------------
-- 12. ROW LEVEL SECURITY POLICIES CONSOLIDATION
-- ------------------------------------------------------------------------------
-- Ensure RLS is active on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- ─── PROFILES ────────────────────────────────────────────────────────────────
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admin full access on profiles" ON public.profiles;
  DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can read profiles related to their orders" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Allow user insert on signup" ON public.profiles;
EXCEPTION WHEN undefined_object THEN null;
END $$;

CREATE POLICY "Admin full access on profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Users can read profiles related to their orders"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.orders
      WHERE (orders.client_id = auth.uid() AND orders.editor_id = profiles.id)
         OR (orders.editor_id = auth.uid() AND orders.client_id = profiles.id)
    )
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Allow user insert on signup"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    id = auth.uid() AND
    role IN ('client', 'editor')
  );

REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT, UPDATE, INSERT ON public.profiles TO authenticated;

-- ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admin full access on notifications" ON public.notifications;
  DROP POLICY IF EXISTS "Users can select own notifications" ON public.notifications;
  DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
  DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
  DROP POLICY IF EXISTS "Users can insert notifications for related order participants" ON public.notifications;
EXCEPTION WHEN undefined_object THEN null;
END $$;

CREATE POLICY "Admin full access on notifications"
  ON public.notifications FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Users can select own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert notifications for related order participants"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.orders
      WHERE (orders.client_id = auth.uid() AND (orders.editor_id = notifications.user_id OR orders.admin_id = notifications.user_id))
         OR (orders.editor_id = auth.uid() AND (orders.client_id = notifications.user_id OR orders.admin_id = notifications.user_id))
    )
  );

-- ─── SITE SETTINGS ───────────────────────────────────────────────────────────
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public can view site settings" ON public.site_settings;
  DROP POLICY IF EXISTS "Admins can insert site settings" ON public.site_settings;
  DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;
  DROP POLICY IF EXISTS "Admins can delete site settings" ON public.site_settings;
EXCEPTION WHEN undefined_object THEN null;
END $$;

CREATE POLICY "Public can view site settings"
  ON public.site_settings FOR SELECT
  USING (
    key LIKE 'public_%'
    OR key IN ('footer_settings', 'services_section', 'our_work_settings', 'general_cms', 'hero_settings', 'about_settings')
    OR public.is_cms_admin()
  );

CREATE POLICY "Admins can insert site settings"
  ON public.site_settings FOR INSERT
  WITH CHECK (public.is_cms_admin());

CREATE POLICY "Admins can update site settings"
  ON public.site_settings FOR UPDATE
  USING (public.is_cms_admin())
  WITH CHECK (public.is_cms_admin());

CREATE POLICY "Admins can delete site settings"
  ON public.site_settings FOR DELETE
  USING (public.is_cms_admin());

-- ─── CONTACT REQUESTS ─────────────────────────────────────────────────────────
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow public anonymous submissions" ON public.contact_requests;
  DROP POLICY IF EXISTS "Admin full access on contact_requests" ON public.contact_requests;
EXCEPTION WHEN undefined_object THEN null;
END $$;

CREATE POLICY "Allow public anonymous submissions"
  ON public.contact_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admin full access on contact_requests"
  ON public.contact_requests FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

REVOKE SELECT, UPDATE, DELETE ON public.contact_requests FROM anon;
GRANT SELECT, UPDATE, DELETE ON public.contact_requests TO authenticated;

-- ------------------------------------------------------------------------------
-- SCRIPT COMPLETION NOTICE
-- ------------------------------------------------------------------------------
DO $$ BEGIN
  RAISE NOTICE 'Production Master Security Hardening script executed successfully. All security triggers and RLS policies are active.';
END $$;
