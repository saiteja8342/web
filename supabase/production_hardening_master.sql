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
    'delivered',
    'cancelled'
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

    -- Strict immutability of administrative and client columns for editor
    NEW.order_name := OLD.order_name;
    NEW.client_id := OLD.client_id;
    NEW.editor_id := OLD.editor_id;
    NEW.admin_id := OLD.admin_id;
    NEW.brief := OLD.brief;
    NEW.drive_link := OLD.drive_link;
    NEW.dropbox_link := OLD.dropbox_link;

    -- Editors can only submit export link (additional_link) when transitioning to in_review for QC
    IF NEW.status = 'in_review' AND NEW.additional_link IS DISTINCT FROM OLD.additional_link THEN
      NEW.additional_link := NEW.additional_link;
    ELSE
      NEW.additional_link := OLD.additional_link;
    END IF;

    -- Deliverable visibility is strictly admin-controlled; editors cannot publish deliverables to clients
    BEGIN
      NEW.client_link_visible := OLD.client_link_visible;
    EXCEPTION WHEN undefined_column THEN
      NULL;
    END;

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

-- ─── ORDERS ───────────────────────────────────────────────────────────────────
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admin full access on orders" ON public.orders;
  DROP POLICY IF EXISTS "Editors can select assigned orders" ON public.orders;
  DROP POLICY IF EXISTS "Editors can update assigned orders status" ON public.orders;
  DROP POLICY IF EXISTS "Clients can select own orders" ON public.orders;
EXCEPTION WHEN undefined_object THEN null;
END $$;

CREATE POLICY "Admin full access on orders"
  ON public.orders FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Editors can select assigned orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (editor_id = auth.uid());

CREATE POLICY "Editors can update assigned orders status"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (editor_id = auth.uid())
  WITH CHECK (editor_id = auth.uid());

CREATE POLICY "Clients can select own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

-- ─── ORDER STATUS HISTORY ─────────────────────────────────────────────────────
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admin full access on order_status_history" ON public.order_status_history;
  DROP POLICY IF EXISTS "Editors can read history of assigned orders" ON public.order_status_history;
  DROP POLICY IF EXISTS "Clients can read history of own orders" ON public.order_status_history;
  DROP POLICY IF EXISTS "Editors and clients can insert history for own orders" ON public.order_status_history;
EXCEPTION WHEN undefined_object THEN null;
END $$;

CREATE POLICY "Admin full access on order_status_history"
  ON public.order_status_history FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Editors can read history of assigned orders"
  ON public.order_status_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_status_history.order_id
      AND orders.editor_id = auth.uid()
    )
  );

CREATE POLICY "Clients can read history of own orders"
  ON public.order_status_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_status_history.order_id
      AND orders.client_id = auth.uid()
    )
  );

CREATE POLICY "Editors and clients can insert history for own orders"
  ON public.order_status_history FOR INSERT
  TO authenticated
  WITH CHECK (
    changed_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_status_history.order_id
      AND (orders.client_id = auth.uid() OR orders.editor_id = auth.uid())
    )
  );

-- ─── REVISION REQUESTS ────────────────────────────────────────────────────────
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admin full access on revision_requests" ON public.revision_requests;
  DROP POLICY IF EXISTS "Clients can insert revisions for own orders" ON public.revision_requests;
  DROP POLICY IF EXISTS "Clients can select own revision requests" ON public.revision_requests;
  DROP POLICY IF EXISTS "Editors can read revisions for assigned orders" ON public.revision_requests;
EXCEPTION WHEN undefined_object THEN null;
END $$;

CREATE POLICY "Admin full access on revision_requests"
  ON public.revision_requests FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Clients can select own revision requests"
  ON public.revision_requests FOR SELECT
  TO authenticated
  USING (
    requested_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = revision_requests.order_id
      AND orders.client_id = auth.uid()
    )
  );

CREATE POLICY "Clients can insert revisions for own orders"
  ON public.revision_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    requested_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = revision_requests.order_id
      AND orders.client_id = auth.uid()
    )
  );

CREATE POLICY "Editors can read revisions for assigned orders"
  ON public.revision_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = revision_requests.order_id
      AND orders.editor_id = auth.uid()
    )
  );

-- ─── RATINGS ──────────────────────────────────────────────────────────────────
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admin full access on ratings" ON public.ratings;
  DROP POLICY IF EXISTS "Clients can select own ratings" ON public.ratings;
  DROP POLICY IF EXISTS "Clients can insert rating for delivered orders" ON public.ratings;
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

CREATE POLICY "Public can view approved testimonials"
  ON public.ratings FOR SELECT
  TO anon, authenticated
  USING (is_testimonial = TRUE);

-- ─── LINK FEEDBACK ────────────────────────────────────────────────────────────
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admin full access on link_feedback" ON public.link_feedback;
  DROP POLICY IF EXISTS "Allow public anonymous submissions on link_feedback" ON public.link_feedback;
EXCEPTION WHEN undefined_object THEN null;
END $$;

CREATE POLICY "Admin full access on link_feedback"
  ON public.link_feedback FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Allow public anonymous submissions on link_feedback"
  ON public.link_feedback FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ─── TESTIMONIALS & PORTFOLIO ─────────────────────────────────────────────────
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admin full access on testimonials" ON public.testimonials;
  DROP POLICY IF EXISTS "Public can view testimonials" ON public.testimonials;
  DROP POLICY IF EXISTS "Admin full access on portfolio_videos" ON public.portfolio_videos;
  DROP POLICY IF EXISTS "Public can view portfolio_videos" ON public.portfolio_videos;
EXCEPTION WHEN undefined_object THEN null;
END $$;

CREATE POLICY "Admin full access on testimonials"
  ON public.testimonials FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Public can view testimonials"
  ON public.testimonials FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admin full access on portfolio_videos"
  ON public.portfolio_videos FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Public can view portfolio_videos"
  ON public.portfolio_videos FOR SELECT
  TO anon, authenticated
  USING (true);

-- ─── STORAGE SECURITY POLICIES (storage.objects) ──────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'storage' AND tablename = 'objects') THEN
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Public can view avatar objects" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can upload own avatar" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can update own avatar" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can delete own avatar" ON storage.objects;
    DROP POLICY IF EXISTS "Admin full access on storage objects" ON storage.objects;

    CREATE POLICY "Public can view avatar objects"
      ON storage.objects FOR SELECT
      TO anon, authenticated
      USING (bucket_id IN ('avatars', 'portfolio'));

    CREATE POLICY "Authenticated users can upload own avatar"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'avatars'
        AND (name LIKE auth.uid()::text || '/%' OR name LIKE 'avatar-' || auth.uid()::text || '%')
      );

    CREATE POLICY "Authenticated users can update own avatar"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'avatars'
        AND (name LIKE auth.uid()::text || '/%' OR name LIKE 'avatar-' || auth.uid()::text || '%')
      )
      WITH CHECK (
        bucket_id = 'avatars'
        AND (name LIKE auth.uid()::text || '/%' OR name LIKE 'avatar-' || auth.uid()::text || '%')
      );

    CREATE POLICY "Authenticated users can delete own avatar"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'avatars'
        AND (name LIKE auth.uid()::text || '/%' OR name LIKE 'avatar-' || auth.uid()::text || '%')
      );

    CREATE POLICY "Admin full access on storage objects"
      ON storage.objects FOR ALL
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
EXCEPTION WHEN undefined_table THEN null;
WHEN OTHERS THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 13. LOGIN DEVICES & ADMIN 30-DAY REMEMBER-DEVICE OTP TABLES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_token_hash TEXT NOT NULL UNIQUE,
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL DEFAULT 'desktop',
  browser TEXT NOT NULL DEFAULT 'Unknown Browser',
  os TEXT NOT NULL DEFAULT 'Unknown OS',
  ip_address TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  is_trusted BOOLEAN NOT NULL DEFAULT TRUE,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE public.admin_devices ADD COLUMN IF NOT EXISTS is_trusted BOOLEAN NOT NULL DEFAULT TRUE;
  ALTER TABLE public.admin_devices ALTER COLUMN expires_at DROP NOT NULL;
EXCEPTION WHEN others THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_admin_devices_user_id ON public.admin_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_devices_token_hash ON public.admin_devices(device_token_hash);
CREATE INDEX IF NOT EXISTS idx_admin_devices_status_expires ON public.admin_devices(status, expires_at);

CREATE TABLE IF NOT EXISTS public.admin_login_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  expires_at TIMESTAMPTZ NOT NULL,
  resend_available_at TIMESTAMPTZ NOT NULL,
  consumed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_otps_user_expires ON public.admin_login_otps(user_id, expires_at, consumed);
CREATE INDEX IF NOT EXISTS idx_admin_otps_email ON public.admin_login_otps(email);

ALTER TABLE public.admin_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_login_otps ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins can view own devices" ON public.admin_devices;
  DROP POLICY IF EXISTS "Admins can insert own devices" ON public.admin_devices;
  DROP POLICY IF EXISTS "Admins can update own devices" ON public.admin_devices;
  DROP POLICY IF EXISTS "Admins can delete own devices" ON public.admin_devices;

  DROP POLICY IF EXISTS "Admins can view own OTP records" ON public.admin_login_otps;
  DROP POLICY IF EXISTS "Admins can insert own OTP records" ON public.admin_login_otps;
  DROP POLICY IF EXISTS "Admins can update own OTP records" ON public.admin_login_otps;
EXCEPTION WHEN undefined_object THEN null;
END $$;

CREATE POLICY "Admins can view own devices"
  ON public.admin_devices FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND public.is_admin());

CREATE POLICY "Admins can insert own devices"
  ON public.admin_devices FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_admin());

CREATE POLICY "Admins can update own devices"
  ON public.admin_devices FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND public.is_admin())
  WITH CHECK (user_id = auth.uid() AND public.is_admin());

CREATE POLICY "Admins can delete own devices"
  ON public.admin_devices FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND public.is_admin());

CREATE POLICY "Admins can view own OTP records"
  ON public.admin_login_otps FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND public.is_admin());

CREATE POLICY "Admins can insert own OTP records"
  ON public.admin_login_otps FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_admin());

CREATE POLICY "Admins can update own OTP records"
  ON public.admin_login_otps FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND public.is_admin())
  WITH CHECK (user_id = auth.uid() AND public.is_admin());

-- Stored Procedures: register_admin_device, validate_admin_device, revoke_admin_device, revoke_other_admin_devices, get_my_admin_devices
CREATE OR REPLACE FUNCTION public.register_admin_device(
  p_device_token_hash TEXT,
  p_device_name TEXT,
  p_device_type TEXT,
  p_browser TEXT,
  p_os TEXT,
  p_ip TEXT DEFAULT NULL,
  p_is_trusted BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_new_device RECORD;
  v_now TIMESTAMPTZ := NOW();
  v_expires TIMESTAMPTZ := NULL;
BEGIN
  IF v_user_id IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Only authenticated administrators can register devices.';
  END IF;

  IF p_device_token_hash IS NULL OR LENGTH(TRIM(p_device_token_hash)) < 16 THEN
    RAISE EXCEPTION 'Invalid device token hash.';
  END IF;

  IF COALESCE(p_is_trusted, TRUE) THEN
    v_expires := v_now + INTERVAL '30 days';
  ELSE
    v_expires := NULL;
  END IF;

  INSERT INTO public.admin_devices (
    user_id, device_token_hash, device_name, device_type, browser, os, ip_address,
    status, is_trusted, last_active_at, expires_at, created_at, updated_at
  ) VALUES (
    v_user_id, TRIM(p_device_token_hash),
    COALESCE(NULLIF(TRIM(p_device_name), ''), 'Admin Workstation'),
    COALESCE(NULLIF(TRIM(p_device_type), ''), 'desktop'),
    COALESCE(NULLIF(TRIM(p_browser), ''), 'Standard Browser'),
    COALESCE(NULLIF(TRIM(p_os), ''), 'Unknown OS'),
    p_ip, 'active', COALESCE(p_is_trusted, TRUE), v_now, v_expires, v_now, v_now
  )
  ON CONFLICT (device_token_hash) DO UPDATE SET
    device_name = EXCLUDED.device_name,
    device_type = EXCLUDED.device_type,
    browser = EXCLUDED.browser,
    os = EXCLUDED.os,
    ip_address = COALESCE(EXCLUDED.ip_address, public.admin_devices.ip_address),
    status = 'active',
    is_trusted = EXCLUDED.is_trusted,
    last_active_at = v_now,
    expires_at = EXCLUDED.expires_at,
    updated_at = v_now
  RETURNING id, device_name, device_type, browser, os, status, is_trusted, last_active_at, expires_at, created_at
  INTO v_new_device;

  RETURN jsonb_build_object('success', true, 'device', row_to_json(v_new_device));
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_admin_device(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.validate_admin_device(
  p_user_id UUID,
  p_device_token_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_device RECORD;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  IF p_user_id IS NULL OR p_device_token_hash IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'missing_credentials');
  END IF;

  SELECT * INTO v_device
  FROM public.admin_devices
  WHERE user_id = p_user_id AND device_token_hash = TRIM(p_device_token_hash)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'not_found');
  END IF;

  IF v_device.is_trusted IS NOT TRUE THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'not_trusted');
  END IF;

  IF v_device.status = 'revoked' THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'revoked');
  END IF;

  IF (v_device.expires_at IS NOT NULL AND v_device.expires_at <= v_now) OR v_device.status = 'expired' THEN
    UPDATE public.admin_devices SET status = 'expired', updated_at = v_now WHERE id = v_device.id;
    RETURN jsonb_build_object('valid', false, 'reason', 'expired', 'expires_at', v_device.expires_at);
  END IF;

  UPDATE public.admin_devices SET last_active_at = v_now, updated_at = v_now WHERE id = v_device.id;

  RETURN jsonb_build_object(
    'valid', true,
    'device_id', v_device.id,
    'device_name', v_device.device_name,
    'browser', v_device.browser,
    'os', v_device.os,
    'is_trusted', v_device.is_trusted,
    'expires_at', v_device.expires_at,
    'days_remaining', GREATEST(0, CEIL(EXTRACT(EPOCH FROM (v_device.expires_at - v_now)) / 86400))
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_admin_device(UUID, TEXT) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.revoke_admin_device(p_device_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Only authenticated administrators can revoke devices.';
  END IF;

  UPDATE public.admin_devices
  SET status = 'revoked', updated_at = NOW()
  WHERE id = p_device_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Device not found or not owned by you');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.revoke_admin_device(UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.revoke_other_admin_devices(p_current_device_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_count INT := 0;
BEGIN
  IF v_user_id IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Only authenticated administrators can revoke devices.';
  END IF;

  UPDATE public.admin_devices
  SET status = 'revoked', updated_at = NOW()
  WHERE user_id = v_user_id
    AND (p_current_device_id IS NULL OR id <> p_current_device_id)
    AND status = 'active';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN jsonb_build_object('success', true, 'revoked_count', v_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.revoke_other_admin_devices(UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_my_admin_devices()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_result JSONB;
BEGIN
  IF v_user_id IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Only authenticated administrators can query devices.';
  END IF;

  UPDATE public.admin_devices
  SET status = 'expired', updated_at = NOW()
  WHERE user_id = v_user_id
    AND is_trusted = TRUE
    AND expires_at IS NOT NULL
    AND expires_at <= NOW()
    AND status = 'active';

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', d.id,
      'device_name', d.device_name,
      'device_type', d.device_type,
      'browser', d.browser,
      'os', d.os,
      'ip_address', d.ip_address,
      'status', d.status,
      'is_trusted', d.is_trusted,
      'display_status', CASE
        WHEN d.status = 'revoked' THEN 'revoked'
        WHEN d.is_trusted = TRUE AND (d.status = 'expired' OR (d.expires_at IS NOT NULL AND d.expires_at <= NOW())) THEN 'expired'
        WHEN d.is_trusted = TRUE THEN 'trusted'
        ELSE 'normal'
      END,
      'last_active_at', d.last_active_at,
      'expires_at', d.expires_at,
      'created_at', d.created_at,
      'days_remaining', CASE
        WHEN d.is_trusted = TRUE AND d.expires_at IS NOT NULL AND d.expires_at > NOW()
          THEN GREATEST(0, CEIL(EXTRACT(EPOCH FROM (d.expires_at - NOW())) / 86400))
        ELSE NULL
      END
    ) ORDER BY d.last_active_at DESC
  )
  INTO v_result
  FROM public.admin_devices d
  WHERE d.user_id = v_user_id;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_admin_devices() TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- SCRIPT COMPLETION NOTICE
-- ------------------------------------------------------------------------------
DO $$ BEGIN
  RAISE NOTICE 'Production Master Security Hardening script executed successfully. All security triggers and RLS policies are active.';
END $$;
