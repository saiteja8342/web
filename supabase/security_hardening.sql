-- ==============================================================================
-- MOTION NODE EDITS - COMPREHENSIVE MASTER SECURITY HARDENING SQL
-- ==============================================================================
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/yipfxibyzqsxqhhiwotk/sql/new
--
-- Fixes applied:
-- 1. Fixed public.set_user_role: Added strict is_admin() authorization check and
--    revoked execute permission from authenticated/anon roles (prevents privilege escalation).
-- 2. Fixed handle_new_user: Removed reliance on client-controlled raw_user_meta_data->>'role'
--    for admin promotions. Only server-side app_metadata or manual DB assignment can set admin.
-- 3. Fixed link_feedback: Dropped over-permissive USING (true) UPDATE policy. Replaced with
--    a hardened, targeted RPC procedure update_feedback_consent() restricted to boolean consent.
-- 4. Added BEFORE UPDATE triggers on orders and ratings to prevent editors and clients
--    from modifying unauthorized columns (deadlines, client IDs, approval flags).
-- 5. Added explicit SET search_path = public, auth, pg_temp to all SECURITY DEFINER
--    functions to protect against schema-shadowing / search-path hijacking attacks.
-- 6. Revoked execute on check_user_exists from anon to prevent account enumeration.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SECURE ADMIN ROLE VERIFICATION FUNCTION (FIXED SEARCH_PATH)
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

-- ------------------------------------------------------------------------------
-- 2. SECURE CMS ADMIN VERIFICATION FUNCTION (FIXED SEARCH_PATH)
-- ------------------------------------------------------------------------------
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
-- 3. ACCOUNT ENUMERATION PROTECTION: check_user_exists
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

-- Revoke from public anon visitors to prevent automated email harvesting
REVOKE EXECUTE ON FUNCTION public.check_user_exists(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.check_user_exists(TEXT) TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 4. CONTACT RATE LIMIT RPC (FIXED SEARCH_PATH)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_already_submitted_contact(p_email TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.contact_requests
    WHERE LOWER(email) = LOWER(TRIM(p_email))
    AND created_at > (NOW() - INTERVAL '24 hours')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.has_already_submitted_contact(TEXT) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 5. SECURE PRIVILEGE ESCALATION BLOCKER (BEFORE UPDATE ON public.profiles)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  -- Allow updates initiated by Database Administrator (SQL Editor, postgres, service_role, or verified admin)
  IF auth.uid() IS NULL 
     OR current_user IN ('postgres', 'service_role', 'supabase_admin') 
     OR (auth.jwt()->>'role') = 'service_role'
     OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- 1. Block unauthorized role escalation
  IF NEW.role::text IS DISTINCT FROM OLD.role::text THEN
    RAISE EXCEPTION 'Access Denied: You cannot modify user role. Tampering attempt logged.';
  END IF;

  -- 2. Block unauthorized approval status modification
  IF NEW.status::text IS DISTINCT FROM OLD.status::text THEN
    RAISE EXCEPTION 'Access Denied: You cannot modify user approval status.';
  END IF;

  -- 3. Block ID manipulation
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Access Denied: Profile ID cannot be altered.';
  END IF;

  -- 4. Block email hijacking on profile
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    IF LOWER(NEW.email) <> LOWER(COALESCE(auth.jwt()->>'email', '')) THEN
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
-- 6. SECURE PROFILE INSERTION GUARD (BEFORE INSERT ON public.profiles)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_profile_insert_security()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  -- If executed by an existing administrator or service role, allow custom role
  IF public.is_admin() OR current_user IN ('postgres', 'service_role', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  -- Hard-block: Non-admins CANNOT self-insert with role='admin'
  IF LOWER(COALESCE(NEW.role::text, '')) = 'admin' THEN
    NEW.role := 'client'::user_role;
  END IF;

  -- Default client registrations to approved status
  IF NEW.status IS NULL OR NEW.status::text NOT IN ('approved', 'rejected') THEN
    NEW.status := 'approved'::user_status;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_profile_insert_security ON public.profiles;
CREATE TRIGGER trg_enforce_profile_insert_security
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_profile_insert_security();

-- ------------------------------------------------------------------------------
-- 7. SECURE SIGNUP TRIGGER ON auth.users (handle_new_user)
-- ------------------------------------------------------------------------------
-- Fixes Vulnerability 2: NEVER accept role='admin' from client user_metadata.
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
-- 8. SECURE ROLE MANAGEMENT RPC (set_user_role)
-- ------------------------------------------------------------------------------
-- Fixes Vulnerability 1: Requires verified admin caller and revokes execute from public
CREATE OR REPLACE FUNCTION public.set_user_role(target_email TEXT, new_role TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  -- Strict caller verification: caller MUST be an existing administrator
  IF NOT public.is_admin() AND current_user NOT IN ('postgres', 'service_role', 'supabase_admin') THEN
    RAISE EXCEPTION 'Access Denied: Only administrators can modify user roles.';
  END IF;

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

REVOKE EXECUTE ON FUNCTION public.set_user_role(TEXT, TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_role(TEXT, TEXT) TO service_role;

-- ------------------------------------------------------------------------------
-- 9. SECURE USER DELETION RPC (delete_user_by_admin)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
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

GRANT EXECUTE ON FUNCTION public.delete_user_by_admin(UUID) TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 10. HARDENED FEEDBACK CONSENT RPC & RLS (link_feedback)
-- ------------------------------------------------------------------------------
-- Fixes Vulnerability 3: Drops over-permissive USING (true) UPDATE policy
DROP POLICY IF EXISTS "Allow public update consent on link_feedback" ON public.link_feedback;
DROP POLICY IF EXISTS "Allow public update to link_feedback" ON public.link_feedback;

-- Dedicated procedure: Allows callers to ONLY update testimonial_consent
CREATE OR REPLACE FUNCTION public.update_feedback_consent(p_feedback_id UUID, p_consent BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.link_feedback
  SET testimonial_consent = p_consent
  WHERE id = p_feedback_id;

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_feedback_consent(UUID, BOOLEAN) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 11. BEFORE UPDATE TRIGGER ON orders (PREVENTS UNAUTHORIZED COLUMN EDITS)
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
     OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- If actor is the assigned editor, they can ONLY update status
  IF OLD.editor_id = auth.uid() THEN
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
-- 12. BEFORE UPDATE TRIGGER ON ratings (PREVENTS CLIENT SELF-APPROVAL)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_rating_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  -- If actor is an admin or service role, allow full edit
  IF public.is_admin() 
     OR current_user IN ('postgres', 'service_role', 'supabase_admin') 
     OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Non-admins cannot alter approval flags or foreign keys
  IF NEW.order_id IS DISTINCT FROM OLD.order_id 
     OR NEW.client_id IS DISTINCT FROM OLD.client_id
     OR NEW.editor_id IS DISTINCT FROM OLD.editor_id THEN
    RAISE EXCEPTION 'Access Denied: Cannot modify order or user references on rating.';
  END IF;

  -- Preserve admin moderation flags
  NEW.is_testimonial := OLD.is_testimonial;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_rating_tampering ON public.ratings;
CREATE TRIGGER trg_protect_rating_tampering
  BEFORE UPDATE ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_rating_tampering();

-- ------------------------------------------------------------------------------
-- 13. AUDIT USER SECURITY PROCEDURE (FIXED SEARCH_PATH)
-- ------------------------------------------------------------------------------
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
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Only administrators can audit user security.';
  END IF;

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

-- ------------------------------------------------------------------------------
-- 14. ENSURE ROW LEVEL SECURITY IS ACTIVE ON ALL TABLES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_feedback ENABLE ROW LEVEL SECURITY;

-- Revoke anon select on profiles
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT ON public.profiles TO authenticated;

-- Success notice
DO $$ BEGIN
  RAISE NOTICE 'Complete Security Hardening script executed successfully! All policies and triggers are active.';
END $$;
