-- ==============================================================================
-- MOTION NODE EDITS - HELPER SQL SNIPPETS
-- ==============================================================================

-- 1. PROMOTE A USER TO ADMIN:
-- Replace 'your-user-email@example.com' with the email of the user you want to be Admin
UPDATE public.profiles
SET role = 'admin', status = 'approved'
WHERE email = 'your-user-email@example.com';

-- 2. APPROVE AN EDITOR:
-- Replace 'editor@example.com' with the editor's email
UPDATE public.profiles
SET role = 'editor', status = 'approved', editor_title = 'Senior Video Editor'
WHERE email = 'editor@example.com';

-- 3. APPROVE A CLIENT:
-- Replace 'client@example.com' with the client's email
UPDATE public.profiles
SET role = 'client', status = 'approved', company_name = 'Acme Productions'
WHERE email = 'client@example.com';

-- 4. VIEW ALL USERS AND ROLES:
SELECT id, full_name, email, role, status, editor_title, company_name, created_at
FROM public.profiles
ORDER BY created_at DESC;

-- 5. SETUP TESTIMONIALS & RATINGS TABLE:
ALTER TABLE public.ratings
ADD COLUMN IF NOT EXISTS is_testimonial BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_ratings_order_id ON public.ratings(order_id);
CREATE INDEX IF NOT EXISTS idx_ratings_testimonial ON public.ratings(is_testimonial) WHERE is_testimonial = TRUE;

-- 6. PERMISSIONS & RLS FOR RATINGS & TESTIMONIALS:
DROP POLICY IF EXISTS "Admin full access on ratings" ON public.ratings;
DROP POLICY IF EXISTS "Clients can insert rating for delivered orders" ON public.ratings;
DROP POLICY IF EXISTS "Clients can select own ratings" ON public.ratings;
DROP POLICY IF EXISTS "Clients can update own ratings" ON public.ratings;
DROP POLICY IF EXISTS "Editors can select own ratings" ON public.ratings;
DROP POLICY IF EXISTS "Public can view approved testimonials" ON public.ratings;

CREATE POLICY "Admin full access on ratings"
  ON public.ratings FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

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

CREATE POLICY "Clients can select own ratings"
  ON public.ratings FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

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
  USING (is_testimonial = TRUE OR feedback_note LIKE '%[TESTIMONIAL:true]%');

-- 7. VIEW ALL 5-STAR TESTIMONIALS READY FOR SHOWCASE:
SELECT
  r.id,
  r.rating,
  REPLACE(r.feedback_note, ' [TESTIMONIAL:true]', '') AS feedback,
  r.is_testimonial,
  r.created_at,
  p.full_name AS client_name,
  p.company_name,
  o.order_name AS project_title
FROM public.ratings r
JOIN public.profiles p ON p.id = r.client_id
JOIN public.orders o ON o.id = r.order_id
WHERE r.rating = 5
  AND (r.is_testimonial = TRUE OR r.feedback_note LIKE '%[TESTIMONIAL:true]%')
ORDER BY r.created_at DESC;

-- 8. CUSTOM ORDER CODE FORMAT (MNE-YYYYMMDD-XXXX):
-- Run this in Supabase SQL Editor if you wish to store order_code directly in its own column:
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS order_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_code 
ON public.orders(order_code) 
WHERE order_code IS NOT NULL;
