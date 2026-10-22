-- ==============================================================================
-- MOTION NODE EDITS - OFFLINE CLIENTS & AUTO-CLAIM ON REGISTRATION
-- ==============================================================================
-- Run this script in the Supabase SQL Editor.
-- 1. Adds offline client columns to orders.
-- 2. Creates the auto-claim trigger on profiles for when an offline client registers in future.
-- 3. Updates RLS policies so clients can view orders matching their user ID or email.
-- ==============================================================================

-- 1. Support offline client fields in orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS client_email TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS client_phone TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_client_email ON public.orders(LOWER(client_email));

-- 2. Auto-claim trigger function
-- When a user registers (or a profile is created with an email), automatically
-- re-assign any matching offline orders to their new account UUID.
CREATE OR REPLACE FUNCTION public.auto_claim_offline_orders()
RETURNS TRIGGER AS $$
DECLARE
  v_email TEXT;
  v_count INT := 0;
BEGIN
  v_email := LOWER(TRIM(COALESCE(NEW.email, '')));
  
  IF v_email <> '' THEN
    UPDATE public.orders
    SET client_id = NEW.id,
        updated_at = NOW()
    WHERE (
      LOWER(client_email) = v_email
      OR admin_notes ILIKE '%[OFFLINE_CLIENT_EMAIL:' || v_email || ']%'
    )
    AND (
      client_id IS DISTINCT FROM NEW.id
    );

    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count > 0 THEN
      RAISE NOTICE 'Auto-claimed % offline order(s) for newly registered user % (%)', v_count, NEW.id, v_email;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'auto_claim_offline_orders error for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth, pg_temp;

-- 3. Trigger on public.profiles
DROP TRIGGER IF EXISTS trg_auto_claim_offline_orders ON public.profiles;
CREATE TRIGGER trg_auto_claim_offline_orders
  AFTER INSERT OR UPDATE OF email ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_claim_offline_orders();

-- 4. RPC for Client Dashboard to safely trigger auto-claim on login
CREATE OR REPLACE FUNCTION public.claim_my_offline_orders()
RETURNS INT AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_email TEXT;
  v_claimed_count INT := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN 0;
  END IF;

  SELECT LOWER(TRIM(email)) INTO v_email
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_email IS NOT NULL AND v_email <> '' THEN
    UPDATE public.orders
    SET client_id = v_user_id,
        updated_at = NOW()
    WHERE (
      LOWER(client_email) = v_email
      OR admin_notes ILIKE '%[OFFLINE_CLIENT_EMAIL:' || v_email || ']%'
    )
    AND client_id IS DISTINCT FROM v_user_id;

    GET DIAGNOSTICS v_claimed_count = ROW_COUNT;
  END IF;

  RETURN v_claimed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth, pg_temp;

-- 5. Update RLS policy on orders so clients can select their orders by UUID or email
DROP POLICY IF EXISTS "Clients can select own orders" ON public.orders;
CREATE POLICY "Clients can select own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (
    client_id = auth.uid()
    OR (
      client_email IS NOT NULL 
      AND LOWER(client_email) = LOWER(COALESCE(auth.jwt()->>'email', ''))
    )
  );
