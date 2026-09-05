-- ==============================================================================
-- MOTION NODE EDITS - CONTACT REQUESTS TABLE SETUP
-- Run this in your Supabase SQL Editor:
-- (Make sure no text is highlighted when clicking Run)
-- ==============================================================================

-- 1. Create the contact_requests table
CREATE TABLE IF NOT EXISTS public.contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  project_type TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new', -- 'new', 'contacted', 'in_discussion', 'closed'
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_contact_requests_created_at ON public.contact_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON public.contact_requests(status);
CREATE INDEX IF NOT EXISTS idx_contact_requests_email ON public.contact_requests(email);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

-- 4. Clean up any existing policies safely
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contact_requests') THEN
    DROP POLICY IF EXISTS "Allow public anonymous submissions" ON public.contact_requests;
    DROP POLICY IF EXISTS "Allow public insert on contact_requests" ON public.contact_requests;
    DROP POLICY IF EXISTS "Admin full access on contact_requests" ON public.contact_requests;
    DROP POLICY IF EXISTS "Authenticated admin access on contact_requests" ON public.contact_requests;
  END IF;
END $$;

-- 5. Policy: Allow anyone (website visitors) to submit contact requests
CREATE POLICY "Allow public anonymous submissions"
  ON public.contact_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 6. Policy: Allow admins to view, update, and delete contact requests
CREATE POLICY "Admin full access on contact_requests"
  ON public.contact_requests
  FOR ALL
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

-- 7. Grant Permissions to Database Roles
GRANT ALL ON public.contact_requests TO postgres, service_role;
GRANT INSERT ON public.contact_requests TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.contact_requests TO authenticated;

-- 8. Add to Realtime Publication safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'contact_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_requests;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
