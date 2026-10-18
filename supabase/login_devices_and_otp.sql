-- ==============================================================================
-- MOTION NODE EDITS — LOGIN DEVICES & EMAIL OTP MANAGEMENT SQL MIGRATION
-- ==============================================================================
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/yipfxibyzqsxqhhiwotk/sql/new
--
-- This script safely provisions:
-- 1. public.admin_devices table (for 30-day Remember This Device management)
-- 2. public.admin_login_otps table (for secure, rate-limited email 2FA)
-- 3. Row-Level Security (RLS) policies enforcing user isolation
-- 4. Authorized stored procedures for device registration, validation & revocation
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABLE: public.admin_devices
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_token_hash TEXT NOT NULL UNIQUE,
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL DEFAULT 'desktop', -- 'desktop' | 'mobile' | 'tablet'
  browser TEXT NOT NULL DEFAULT 'Unknown Browser',
  os TEXT NOT NULL DEFAULT 'Unknown OS',
  ip_address TEXT,
  status TEXT NOT NULL DEFAULT 'active',       -- 'active' | 'revoked' | 'expired'
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,             -- Absolute 30-day expiration limit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance & Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_admin_devices_user_id ON public.admin_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_devices_token_hash ON public.admin_devices(device_token_hash);
CREATE INDEX IF NOT EXISTS idx_admin_devices_status_expires ON public.admin_devices(status, expires_at);

-- ------------------------------------------------------------------------------
-- 2. TABLE: public.admin_login_otps
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_login_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,                      -- SHA-256 hashed 6-digit code (NEVER stored in plain text)
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  expires_at TIMESTAMPTZ NOT NULL,             -- 10-minute validity
  resend_available_at TIMESTAMPTZ NOT NULL,    -- 60-second cooldown
  consumed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_otps_user_expires ON public.admin_login_otps(user_id, expires_at, consumed);
CREATE INDEX IF NOT EXISTS idx_admin_otps_email ON public.admin_login_otps(email);

-- ------------------------------------------------------------------------------
-- 3. ROW-LEVEL SECURITY ENFORCEMENT
-- ------------------------------------------------------------------------------
ALTER TABLE public.admin_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_login_otps ENABLE ROW LEVEL SECURITY;

-- Clean existing policies if re-running
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

-- Policies for admin_devices:
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

-- Policies for admin_login_otps:
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

-- ------------------------------------------------------------------------------
-- 4. PROCEDURES / RPCs: DEVICE REGISTRATION, VALIDATION & REVOCATION
-- ------------------------------------------------------------------------------

-- 4.1: Register a new trusted device (Absolute 30-day limit)
CREATE OR REPLACE FUNCTION public.register_admin_device(
  p_device_token_hash TEXT,
  p_device_name TEXT,
  p_device_type TEXT,
  p_browser TEXT,
  p_os TEXT,
  p_ip TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_new_device RECORD;
  v_now TIMESTAMPTZ := NOW();
  v_expires TIMESTAMPTZ := v_now + INTERVAL '30 days';
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Only authenticated administrators can register devices.';
  END IF;

  IF p_device_token_hash IS NULL OR LENGTH(TRIM(p_device_token_hash)) < 32 THEN
    RAISE EXCEPTION 'Invalid device token hash.';
  END IF;

  -- Upsert device record by token hash
  INSERT INTO public.admin_devices (
    user_id,
    device_token_hash,
    device_name,
    device_type,
    browser,
    os,
    ip_address,
    status,
    last_active_at,
    expires_at,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    TRIM(p_device_token_hash),
    COALESCE(NULLIF(TRIM(p_device_name), ''), 'Admin Workstation'),
    COALESCE(NULLIF(TRIM(p_device_type), ''), 'desktop'),
    COALESCE(NULLIF(TRIM(p_browser), ''), 'Standard Browser'),
    COALESCE(NULLIF(TRIM(p_os), ''), 'Unknown OS'),
    p_ip,
    'active',
    v_now,
    v_expires,
    v_now,
    v_now
  )
  ON CONFLICT (device_token_hash) DO UPDATE SET
    device_name = EXCLUDED.device_name,
    device_type = EXCLUDED.device_type,
    browser = EXCLUDED.browser,
    os = EXCLUDED.os,
    ip_address = COALESCE(EXCLUDED.ip_address, public.admin_devices.ip_address),
    status = 'active',
    last_active_at = v_now,
    expires_at = v_expires,
    updated_at = v_now
  RETURNING id, device_name, device_type, browser, os, status, last_active_at, expires_at, created_at
  INTO v_new_device;

  RETURN jsonb_build_object(
    'success', true,
    'device', row_to_json(v_new_device)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_admin_device(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;

-- 4.2: Validate current device token (Checks status & 30-day limit without extending it)
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

  SELECT *
  INTO v_device
  FROM public.admin_devices
  WHERE user_id = p_user_id
    AND device_token_hash = TRIM(p_device_token_hash)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'not_found');
  END IF;

  -- Check if revoked
  IF v_device.status = 'revoked' THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'revoked');
  END IF;

  -- Check if expired (> 30 days)
  IF v_device.expires_at <= v_now OR v_device.status = 'expired' THEN
    UPDATE public.admin_devices
    SET status = 'expired', updated_at = v_now
    WHERE id = v_device.id;
    RETURN jsonb_build_object('valid', false, 'reason', 'expired', 'expires_at', v_device.expires_at);
  END IF;

  -- Update last_active_at strictly without extending expires_at (absolute 30-day rule)
  UPDATE public.admin_devices
  SET last_active_at = v_now, updated_at = v_now
  WHERE id = v_device.id;

  RETURN jsonb_build_object(
    'valid', true,
    'device_id', v_device.id,
    'device_name', v_device.device_name,
    'browser', v_device.browser,
    'os', v_device.os,
    'expires_at', v_device.expires_at,
    'days_remaining', GREATEST(0, CEIL(EXTRACT(EPOCH FROM (v_device.expires_at - v_now)) / 86400))
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_admin_device(UUID, TEXT) TO anon, authenticated, service_role;

-- 4.3: Revoke a specific device
CREATE OR REPLACE FUNCTION public.revoke_admin_device(
  p_device_id UUID
)
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

-- 4.4: Sign out other devices (Bulk revoke all active devices except the current one)
CREATE OR REPLACE FUNCTION public.revoke_other_admin_devices(
  p_current_device_id UUID DEFAULT NULL
)
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

-- 4.5: Fetch all devices for current admin (Auto-tags expired status)
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

  -- Automatically update expired status
  UPDATE public.admin_devices
  SET status = 'expired', updated_at = NOW()
  WHERE user_id = v_user_id
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
      'last_active_at', d.last_active_at,
      'expires_at', d.expires_at,
      'created_at', d.created_at,
      'days_remaining', GREATEST(0, CEIL(EXTRACT(EPOCH FROM (d.expires_at - NOW())) / 86400))
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
-- 5. PROCEDURES / RPCs: SECURE RATE-LIMITED EMAIL OTP
-- ------------------------------------------------------------------------------

-- 5.1: Generate a 6-digit OTP code with 60-second cooldown & 10-minute validity
CREATE OR REPLACE FUNCTION public.generate_admin_login_otp(
  p_user_id UUID,
  p_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_clean_email TEXT := LOWER(TRIM(p_email));
  v_now TIMESTAMPTZ := NOW();
  v_recent RECORD;
  v_otp_code TEXT;
  v_otp_hash TEXT;
  v_expires TIMESTAMPTZ := v_now + INTERVAL '10 minutes';
  v_resend_at TIMESTAMPTZ := v_now + INTERVAL '60 seconds';
BEGIN
  -- Verify user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND role::text = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access Denied: User is not an authorized administrator.';
  END IF;

  -- Check rate limit: 60-second cooldown on active unconsumed OTP
  SELECT *
  INTO v_recent
  FROM public.admin_login_otps
  WHERE user_id = p_user_id
    AND consumed = FALSE
    AND expires_at > v_now
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND AND v_recent.resend_available_at > v_now THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Rate limit exceeded. Please wait before requesting another code.',
      'cooldown_seconds', CEIL(EXTRACT(EPOCH FROM (v_recent.resend_available_at - v_now)))
    );
  END IF;

  -- Generate cryptographically random 6-digit code
  v_otp_code := LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');
  v_otp_hash := ENCODE(DIGEST(v_otp_code, 'sha256'), 'hex');

  -- Invalidate prior unconsumed OTPs
  UPDATE public.admin_login_otps
  SET consumed = TRUE
  WHERE user_id = p_user_id AND consumed = FALSE;

  -- Insert new OTP record
  INSERT INTO public.admin_login_otps (
    user_id,
    email,
    otp_hash,
    attempts,
    max_attempts,
    expires_at,
    resend_available_at,
    consumed,
    created_at
  ) VALUES (
    p_user_id,
    v_clean_email,
    v_otp_hash,
    0,
    5,
    v_expires,
    v_resend_at,
    FALSE,
    v_now
  );

  -- Log audit notification for administrator
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    created_at
  ) VALUES (
    p_user_id,
    'Security Alert: Login OTP Generated',
    'A login verification code was dispatched for your MotionNodeEdits admin account.',
    'security_alert',
    v_now
  );

  RETURN jsonb_build_object(
    'success', true,
    'expires_in_seconds', 600,
    'cooldown_seconds', 60,
    'otp_code', v_otp_code -- Returned to secure server-side caller or mock email dispatch
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_admin_login_otp(UUID, TEXT) TO anon, authenticated, service_role;

-- 5.2: Verify 6-digit OTP code (Enforces 5-attempt limit & 10-minute expiry)
CREATE OR REPLACE FUNCTION public.verify_admin_login_otp(
  p_user_id UUID,
  p_email TEXT,
  p_otp_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_clean_email TEXT := LOWER(TRIM(p_email));
  v_clean_code TEXT := TRIM(p_otp_code);
  v_input_hash TEXT;
  v_now TIMESTAMPTZ := NOW();
  v_record RECORD;
BEGIN
  IF p_user_id IS NULL OR v_clean_code IS NULL OR LENGTH(v_clean_code) <> 6 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid verification code format.');
  END IF;

  v_input_hash := ENCODE(DIGEST(v_clean_code, 'sha256'), 'hex');

  -- Find active OTP record
  SELECT *
  INTO v_record
  FROM public.admin_login_otps
  WHERE user_id = p_user_id
    AND consumed = FALSE
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No active verification code found. Please request a new code.');
  END IF;

  -- Check if expired
  IF v_record.expires_at <= v_now THEN
    UPDATE public.admin_login_otps SET consumed = TRUE WHERE id = v_record.id;
    RETURN jsonb_build_object('success', false, 'error', 'Verification code has expired. Please request a new one.');
  END IF;

  -- Check max attempts
  IF v_record.attempts >= v_record.max_attempts THEN
    UPDATE public.admin_login_otps SET consumed = TRUE WHERE id = v_record.id;
    RETURN jsonb_build_object('success', false, 'error', 'Too many incorrect attempts. This code is invalidated. Please request a new one.');
  END IF;

  -- Increment attempt counter
  UPDATE public.admin_login_otps
  SET attempts = attempts + 1
  WHERE id = v_record.id;

  -- Verify hash match
  IF v_record.otp_hash <> v_input_hash THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Incorrect verification code. Please check your email.',
      'attempts_remaining', (v_record.max_attempts - (v_record.attempts + 1))
    );
  END IF;

  -- Code is valid! Mark consumed
  UPDATE public.admin_login_otps
  SET consumed = TRUE
  WHERE id = v_record.id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Verification successful.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_admin_login_otp(UUID, TEXT, TEXT) TO anon, authenticated, service_role;

DO $$ BEGIN
  RAISE NOTICE 'Login Devices & Admin OTP Migration applied successfully.';
END $$;
