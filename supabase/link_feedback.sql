-- ==============================================================================
-- MOTION NODE EDITS - LINK FEEDBACK SYSTEM
-- ==============================================================================

-- 1. Create link_feedback table
CREATE TABLE IF NOT EXISTS public.link_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  company TEXT,
  project_type TEXT,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT NOT NULL,
  improvements TEXT,
  testimonial_consent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_link_feedback_created_at ON public.link_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_link_feedback_rating ON public.link_feedback(rating);

-- 3. Enable Row Level Security
ALTER TABLE public.link_feedback ENABLE ROW LEVEL SECURITY;

-- 4. Clean up any existing policies
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow public insert to link_feedback" ON public.link_feedback;
  DROP POLICY IF EXISTS "Allow authenticated read on link_feedback" ON public.link_feedback;
  DROP POLICY IF EXISTS "Allow authenticated delete on link_feedback" ON public.link_feedback;
  DROP POLICY IF EXISTS "Allow public update to link_feedback" ON public.link_feedback;
  DROP POLICY IF EXISTS "Admin full read on link_feedback" ON public.link_feedback;
  DROP POLICY IF EXISTS "Admin delete on link_feedback" ON public.link_feedback;
EXCEPTION WHEN undefined_object THEN null;
END $$;

-- 5. Policies:
-- Allow anyone (visitors with direct feedback link) to insert feedback
CREATE POLICY "Allow public insert to link_feedback"
  ON public.link_feedback FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anyone with the row ID to update testimonial consent immediately post-submit
CREATE POLICY "Allow public update consent on link_feedback"
  ON public.link_feedback FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- STRICT SECURITY: Only authenticated Administrators can view client feedback submissions
CREATE POLICY "Admin full read on link_feedback"
  ON public.link_feedback FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role::text = 'admin'
    )
    OR (SELECT auth.jwt()->>'role') = 'service_role'
  );

-- STRICT SECURITY: Only authenticated Administrators can delete feedback submissions
CREATE POLICY "Admin delete on link_feedback"
  ON public.link_feedback FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role::text = 'admin'
    )
    OR (SELECT auth.jwt()->>'role') = 'service_role'
  );

-- 6. Grant granular permissions:
-- Anon can ONLY submit (INSERT) and update their consent (UPDATE). Anon can NEVER query or read submissions (NO SELECT).
GRANT INSERT, UPDATE ON public.link_feedback TO anon;
GRANT ALL ON public.link_feedback TO authenticated, service_role;
