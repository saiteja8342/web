-- ==============================================================================
-- MOTION NODE EDITS - TESTIMONIALS & RATINGS SQL SCRIPT
-- Run this script in your Supabase SQL Editor to enable full testimonial support.
-- ==============================================================================

-- 1. ADD TESTIMONIAL COLUMN TO RATINGS TABLE (IF NOT ALREADY PRESENT)
ALTER TABLE public.ratings
ADD COLUMN IF NOT EXISTS is_testimonial BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. CREATE PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_ratings_order_id
ON public.ratings(order_id);

CREATE INDEX IF NOT EXISTS idx_ratings_testimonial
ON public.ratings(is_testimonial)
WHERE is_testimonial = TRUE;

-- 3. DROP OUTDATED RATINGS POLICIES (TO PREVENT DUPLICATES)
DROP POLICY IF EXISTS "Admin full access on ratings" ON public.ratings;
DROP POLICY IF EXISTS "Clients can insert rating for delivered orders" ON public.ratings;
DROP POLICY IF EXISTS "Clients can select own ratings" ON public.ratings;
DROP POLICY IF EXISTS "Clients can update own ratings" ON public.ratings;
DROP POLICY IF EXISTS "Editors can select own ratings" ON public.ratings;
DROP POLICY IF EXISTS "Public can view approved testimonials" ON public.ratings;

-- 4. CREATE PRODUCTION RLS POLICIES FOR RATINGS & TESTIMONIALS

-- A. Admin: full control (read, write, update, delete)
CREATE POLICY "Admin full access on ratings"
  ON public.ratings FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- B. Clients: insert rating for their own delivered orders
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

-- C. Clients: select/read their own submitted ratings
CREATE POLICY "Clients can select own ratings"
  ON public.ratings FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

-- D. Clients: update their own ratings (e.g. adjust review or toggle testimonial consent)
CREATE POLICY "Clients can update own ratings"
  ON public.ratings FOR UPDATE
  TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

-- E. Editors: read ratings left on projects they edited
CREATE POLICY "Editors can select own ratings"
  ON public.ratings FOR SELECT
  TO authenticated
  USING (editor_id = auth.uid());

-- F. Public / Showcase: view approved testimonials (for landing page showcase)
CREATE POLICY "Public can view approved testimonials"
  ON public.ratings FOR SELECT
  TO anon, authenticated
  USING (is_testimonial = TRUE OR feedback_note LIKE '%[TESTIMONIAL:true]%');

-- ==============================================================================
-- 5. HELPER VIEW: v_approved_testimonials
-- Convenient view for displaying testimonials on marketing and showcase pages
-- ==============================================================================
CREATE OR REPLACE VIEW public.v_approved_testimonials AS
SELECT
  r.id AS rating_id,
  r.order_id,
  r.rating,
  REPLACE(r.feedback_note, ' [TESTIMONIAL:true]', '') AS feedback,
  r.is_testimonial,
  r.created_at AS review_date,
  c.full_name AS client_name,
  c.company_name,
  c.avatar_url AS client_avatar,
  e.full_name AS editor_name,
  o.order_name AS project_title,
  o.video_type
FROM public.ratings r
JOIN public.profiles c ON c.id = r.client_id
LEFT JOIN public.profiles e ON e.id = r.editor_id
JOIN public.orders o ON o.id = r.order_id
WHERE r.rating = 5
  AND (r.is_testimonial = TRUE OR r.feedback_note LIKE '%[TESTIMONIAL:true]%')
ORDER BY r.created_at DESC;

-- Grant select permission on the view
GRANT SELECT ON public.v_approved_testimonials TO anon, authenticated;

-- ==============================================================================
-- 6. HELPER MANAGEMENT SNIPPETS (RUN AS NEEDED)
-- ==============================================================================

-- Snippet A: View all delivered orders with their real UUIDs
SELECT 
  o.id AS order_uuid, 
  o.order_name, 
  p.full_name AS client_name,
  r.rating,
  r.is_testimonial
FROM public.orders o
JOIN public.profiles p ON p.id = o.client_id
LEFT JOIN public.ratings r ON r.order_id = o.id
WHERE o.status = 'delivered';

-- Snippet B: Mark an order as a featured testimonial BY PROJECT NAME (No need to copy UUID):
-- UPDATE public.ratings
-- SET is_testimonial = TRUE
-- WHERE order_id = (SELECT id FROM public.orders WHERE order_name = 'Type Your Order Name Here' LIMIT 1);

-- Snippet C: Mark an order as a featured testimonial BY REAL UUID:
-- (Replace the sample uuid with your actual order UUID from Snippet A above)
-- UPDATE public.ratings
-- SET is_testimonial = TRUE
-- WHERE order_id = (SELECT id FROM public.orders LIMIT 1);
