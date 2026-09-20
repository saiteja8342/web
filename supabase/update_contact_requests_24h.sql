-- ==============================================================================
-- MOTION NODE EDITS - CONTACT REQUESTS: 24-HOUR COOLDOWN LIMIT
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/yipfxibyzqsxqhhiwotk/sql/new
-- ==============================================================================

-- 1. Drop the permanent unique index that blocked the same email forever
DROP INDEX IF EXISTS public.idx_contact_requests_unique_email;

-- 2. Create an index for checking submissions within 24 hours quickly
CREATE INDEX IF NOT EXISTS idx_contact_requests_email_created_at 
  ON public.contact_requests(LOWER(email), created_at DESC);

-- 3. Update the RPC function to check if the email was submitted within the LAST 24 HOURS
CREATE OR REPLACE FUNCTION public.has_already_submitted_contact(p_email TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.contact_requests
    WHERE LOWER(email) = LOWER(TRIM(p_email))
    AND created_at > (NOW() - INTERVAL '24 hours')
  );
$$ LANGUAGE sql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.has_already_submitted_contact(TEXT) TO anon, authenticated, service_role;
