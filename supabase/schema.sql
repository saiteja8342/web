-- ==============================================================================
-- MOTION NODE EDITS - COMPLETE SUPABASE DATABASE SCHEMA
-- Run this script in the Supabase SQL Editor to initialize all tables,
-- enums, RLS security policies, triggers, and Realtime publications.
-- ==============================================================================

-- 1. ENUMS (Created safely if they don't already exist)
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

-- 2. TABLE: profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company_name TEXT, -- clients only
  role user_role NOT NULL DEFAULT 'client',
  status user_status NOT NULL DEFAULT 'pending',
  avatar_url TEXT,
  editor_title TEXT, -- e.g. "Senior Editor"
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABLE: orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_name TEXT NOT NULL,
  video_type video_type_enum NOT NULL DEFAULT 'youtube_longform',
  brief TEXT NOT NULL,
  drive_link TEXT,
  dropbox_link TEXT,
  additional_link TEXT,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  editor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  status order_status_enum NOT NULL DEFAULT 'received',
  editor_deadline TIMESTAMPTZ,
  client_deadline TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABLE: order_status_history
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

-- 5. TABLE: revision_requests
CREATE TABLE IF NOT EXISTS revision_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT, -- client
  request_note TEXT NOT NULL,
  status revision_status_enum NOT NULL DEFAULT 'pending',
  confirmed_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- admin
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TABLE: ratings
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  editor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_note TEXT,
  is_testimonial BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_order_client_rating UNIQUE (order_id, client_id)
);

-- 7. TABLE: notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER ON AUTH SIGNUP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role user_role := 'client';
  v_status user_status := 'approved';
  v_meta_role TEXT;
BEGIN
  v_meta_role := new.raw_user_meta_data->>'role';

  IF v_meta_role = 'admin' THEN
    v_role := 'admin';
    v_status := 'approved';
  ELSIF v_meta_role = 'editor' THEN
    v_role := 'editor';
    v_status := 'approved';
  ELSIF v_meta_role = 'client' THEN
    v_role := 'client';
    v_status := 'approved';
  END IF;

  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    phone,
    company_name,
    role,
    status,
    editor_title
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'company_name',
    v_role,
    v_status,
    new.raw_user_meta_data->>'editor_title'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Helper function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check if a user is eligible for self-service password reset
-- ONLY clients and editors can reset passwords. Admins are blocked for security.
CREATE OR REPLACE FUNCTION public.check_can_reset_password(target_email TEXT)
RETURNS JSONB AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM public.profiles
  WHERE LOWER(email) = LOWER(TRIM(target_email));

  IF v_role IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'not_found');
  ELSIF v_role = 'admin' THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'admin_blocked');
  ELSE
    RETURN jsonb_build_object('allowed', true, 'role', v_role);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.check_can_reset_password(TEXT) TO anon, authenticated;

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE revision_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admin full access on profiles" ON profiles;
  DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  DROP POLICY IF EXISTS "Allow user insert on signup" ON profiles;

  DROP POLICY IF EXISTS "Admin full access on orders" ON orders;
  DROP POLICY IF EXISTS "Editors can select assigned orders" ON orders;
  DROP POLICY IF EXISTS "Clients can select own orders" ON orders;

  DROP POLICY IF EXISTS "Admin full access on order_status_history" ON order_status_history;
  DROP POLICY IF EXISTS "Editors can read history of assigned orders" ON order_status_history;
  DROP POLICY IF EXISTS "Clients can read history of own orders" ON order_status_history;

  DROP POLICY IF EXISTS "Admin full access on revision_requests" ON revision_requests;
  DROP POLICY IF EXISTS "Clients can insert revisions for own orders" ON revision_requests;
  DROP POLICY IF EXISTS "Clients can select own revision requests" ON revision_requests;
  DROP POLICY IF EXISTS "Editors can read revisions for assigned orders" ON revision_requests;

  DROP POLICY IF EXISTS "Admin full access on ratings" ON ratings;
  DROP POLICY IF EXISTS "Clients can insert rating for delivered orders" ON ratings;
  DROP POLICY IF EXISTS "Editors can select own ratings" ON ratings;

  DROP POLICY IF EXISTS "Admin full access on notifications" ON notifications;
  DROP POLICY IF EXISTS "Users can select own notifications" ON notifications;
  DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
  DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON notifications;
EXCEPTION WHEN undefined_object THEN null;
END $$;

-- ─── PROFILES POLICIES ────────────────────────────────────────────────────────
CREATE POLICY "Admin full access on profiles"
  ON profiles FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Allow user insert on signup"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- ─── ORDERS POLICIES ──────────────────────────────────────────────────────────
CREATE POLICY "Admin full access on orders"
  ON orders FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Editors can select assigned orders"
  ON orders FOR SELECT
  TO authenticated
  USING (editor_id = auth.uid());

CREATE POLICY "Clients can select own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

-- ─── ORDER STATUS HISTORY POLICIES ────────────────────────────────────────────
CREATE POLICY "Admin full access on order_status_history"
  ON order_status_history FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Editors can read history of assigned orders"
  ON order_status_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_status_history.order_id
      AND orders.editor_id = auth.uid()
    )
  );

CREATE POLICY "Clients can read history of own orders"
  ON order_status_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_status_history.order_id
      AND orders.client_id = auth.uid()
    )
  );

-- ─── REVISION REQUESTS POLICIES ───────────────────────────────────────────────
CREATE POLICY "Admin full access on revision_requests"
  ON revision_requests FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Clients can insert revisions for own orders"
  ON revision_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    requested_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = revision_requests.order_id
      AND orders.client_id = auth.uid()
    )
  );

CREATE POLICY "Clients can select own revision requests"
  ON revision_requests FOR SELECT
  TO authenticated
  USING (requested_by = auth.uid());

CREATE POLICY "Editors can read revisions for assigned orders"
  ON revision_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = revision_requests.order_id
      AND orders.editor_id = auth.uid()
    )
  );

-- ─── RATINGS POLICIES ─────────────────────────────────────────────────────────
CREATE POLICY "Admin full access on ratings"
  ON ratings FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Clients can insert rating for delivered orders"
  ON ratings FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = ratings.order_id
      AND orders.client_id = auth.uid()
      AND orders.status = 'delivered'
    )
  );

CREATE POLICY "Clients can select own ratings"
  ON ratings FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "Clients can update own ratings"
  ON ratings FOR UPDATE
  TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Editors can select own ratings"
  ON ratings FOR SELECT
  TO authenticated
  USING (editor_id = auth.uid());

CREATE POLICY "Public can view approved testimonials"
  ON ratings FOR SELECT
  TO anon, authenticated
  USING (is_testimonial = TRUE OR feedback_note LIKE '%[TESTIMONIAL:true]%');

-- ─── NOTIFICATIONS POLICIES ───────────────────────────────────────────────────
CREATE POLICY "Admin full access on notifications"
  ON notifications FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Users can select own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ==============================================================================
-- REAL-TIME SUBSCRIPTIONS
-- ==============================================================================
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.revision_requests;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
