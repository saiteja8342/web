-- ==============================================================================
-- MOTION NODE EDITS / VELOCITY STUDIO
-- MIGRATION: ADD 'CANCELLED' STATUS, DELIVERABLE VISIBILITY & REALTIME REPLICA
-- ==============================================================================
-- Run this script in your Supabase SQL editor:
-- https://supabase.com/dashboard/project/_/sql/new
-- ==============================================================================

-- 1. Safely add 'cancelled' to the order_status_enum
DO $$ BEGIN
  ALTER TYPE order_status_enum ADD VALUE IF NOT EXISTS 'cancelled';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. Add cancellation audit columns to orders table (if not already present)
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- 3. Add client_link_visible column for deliverable video approval/review
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS client_link_visible BOOLEAN DEFAULT FALSE;

-- 4. Enable full replica identity on orders so Supabase Realtime reliably
-- broadcasts UPDATE and status change events across all dashboards & filters
ALTER TABLE public.orders REPLICA IDENTITY FULL;

-- 5. Ensure orders table is in the supabase_realtime publication
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 6. Note: order_status_history already tracks new_status as TEXT and notes as TEXT,
-- so status history logs will record cancellation reasons and approval audits automatically.
