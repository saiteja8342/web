-- ==============================================================================
-- MOTION NODE EDITS - WEBSITE CMS FEATURES (MIGRATION SCRIPT)
-- ==============================================================================

-- 1. TABLE: testimonials
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT NOT NULL,
  company TEXT,
  role TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- 2. TABLE: portfolio_videos
CREATE TABLE IF NOT EXISTS public.portfolio_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'REELS',
  aspect_ratio TEXT NOT NULL DEFAULT '16/9',
  metric TEXT,
  duration TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.portfolio_videos ENABLE ROW LEVEL SECURITY;

-- 3. TABLE: site_settings
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Admin check helper function
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- POLICIES: testimonials
-- ------------------------------------------------------------------------------
DO $$ BEGIN
  CREATE POLICY "Public can view active testimonials"
    ON public.testimonials FOR SELECT
    USING (is_active = true OR public.is_cms_admin());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can insert testimonials"
    ON public.testimonials FOR INSERT
    WITH CHECK (public.is_cms_admin());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can update testimonials"
    ON public.testimonials FOR UPDATE
    USING (public.is_cms_admin())
    WITH CHECK (public.is_cms_admin());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can delete testimonials"
    ON public.testimonials FOR DELETE
    USING (public.is_cms_admin());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- POLICIES: portfolio_videos
-- ------------------------------------------------------------------------------
DO $$ BEGIN
  CREATE POLICY "Public can view active portfolio videos"
    ON public.portfolio_videos FOR SELECT
    USING (is_active = true OR public.is_cms_admin());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can insert portfolio videos"
    ON public.portfolio_videos FOR INSERT
    WITH CHECK (public.is_cms_admin());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can update portfolio videos"
    ON public.portfolio_videos FOR UPDATE
    USING (public.is_cms_admin())
    WITH CHECK (public.is_cms_admin());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can delete portfolio videos"
    ON public.portfolio_videos FOR DELETE
    USING (public.is_cms_admin());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- POLICIES: site_settings
-- ------------------------------------------------------------------------------
DO $$ BEGIN
  CREATE POLICY "Public can view site settings"
    ON public.site_settings FOR SELECT
    USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can insert site settings"
    ON public.site_settings FOR INSERT
    WITH CHECK (public.is_cms_admin());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can update site settings"
    ON public.site_settings FOR UPDATE
    USING (public.is_cms_admin())
    WITH CHECK (public.is_cms_admin());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can delete site settings"
    ON public.site_settings FOR DELETE
    USING (public.is_cms_admin());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- SEED DATA (Safe: only inserts if tables are empty)
-- ------------------------------------------------------------------------------
INSERT INTO public.testimonials (name, rating, feedback, company, role, display_order)
SELECT seed.name, seed.rating, seed.feedback, seed.company, seed.role, seed.display_order
FROM (
  VALUES
    ('Prasad', 5, 'They transformed our raw footage with edits that stopped people scrolling. Engagement tripled.', 'Creator Studio', 'YouTube Creator', 1),
    ('Srinivas', 5, 'Outstanding editing quality with fast turnaround. Every revision was handled perfectly.', 'Brand Lab', 'Brand Founder', 2),
    ('Aravind', 5, 'Creative edits that kept viewers watching till the end. Retention went from 35% to 68%.', 'Digital Media', 'Content Creator', 3),
    ('Rakesh', 5, 'The speed, precision, and editing finesse completely exceeded our expectations. Conversions doubled.', 'Scale Growth', 'Head of Growth', 4)
) AS seed(name, rating, feedback, company, role, display_order)
WHERE NOT EXISTS (SELECT 1 FROM public.testimonials LIMIT 1);

INSERT INTO public.portfolio_videos (title, youtube_url, category, aspect_ratio, metric, duration, description, display_order)
SELECT seed.title, seed.youtube_url, seed.category, seed.aspect_ratio, seed.metric, seed.duration, seed.description, seed.display_order
FROM (
  VALUES
    ('Unlock Your Brand''s Potential', 'https://www.youtube.com/shorts/qouiu4CbHU8', 'REELS', '9/16', 'AI Powered', '0:30', 'Unlock your brand''s potential with AI-powered video editing and motion design.', 1),
    ('AI Generative Motion Reel', 'https://www.youtube.com/shorts/k9egdphA9mQ', 'REELS', '9/16', 'High Retention', '0:25', 'Dynamic short-form video creation powered by generative AI visual synthesis.', 2),
    ('Cinematic Coffee Powder Commercial', 'https://www.youtube.com/watch?v=2w_ZO0n9xIg', 'AI ADS', '16/9', '680+ Views', '0:41', 'AI Generated Coffee Ad featuring cinematic product visualization and sound sync.', 3),
    ('Mysore Pak Sweet AI Commercial', 'https://www.youtube.com/watch?v=VYvni7IJaGc', 'AI ADS', '16/9', 'AI Product Ad', '0:31', 'Sound-synced fluid AI commercial showcasing culinary product motion.', 4),
    ('AI Thar Car Motion Reveal', 'https://www.youtube.com/watch?v=IltFdkq1qRA', 'AI ADS', '16/9', 'AI Automotive', '0:10', 'Cinematic 3D-style automotive AI generation and fluid camera panning.', 5),
    ('Hanuman Epic Sun Story', 'https://www.youtube.com/watch?v=pKvRNSqEBE4', 'AI STORY', '16/9', 'Mythological AI', '1:08', 'Widescreen mythological narrative driven by generative AI visual algorithms.', 6)
) AS seed(title, youtube_url, category, aspect_ratio, metric, duration, description, display_order)
WHERE NOT EXISTS (SELECT 1 FROM public.portfolio_videos LIMIT 1);

INSERT INTO public.site_settings (key, value)
VALUES (
  'footer_settings',
  '{
    "headline": "Let''s Create Something Exceptional.",
    "cta_text": "Start A Project",
    "cta_link": "#contact",
    "studio_location": "Hyderabad, India",
    "phone": "+91 89853 51756",
    "email": "hello@motionnodeedits.com",
    "instagram_url": "https://www.instagram.com/motionnodeedits/",
    "youtube_url": "https://www.youtube.com/@motionnodeedits",
    "linkedin_url": "https://www.linkedin.com/company/motionnodeedits",
    "whatsapp_number": "918985351756",
    "copyright_text": "© 2026 MotionNodeEdits. All rights reserved."
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.site_settings (key, value)
VALUES (
  'services_section',
  '{
    "eyebrow": "WHAT WE DO",
    "title": "Every frame. Intentional.",
    "subtitle": "We combine professional visual direction with cutting-edge production to deliver edits that don''t just look cinematic — they capture attention.",
    "items": [
      {
        "id": "video-editing",
        "icon": "Film",
        "title": "Video Editing",
        "description": "Cinematic editing, professional color grading, and custom sound design to craft highly engaging narratives.",
        "color": "#E5E5EA",
        "is_active": true
      },
      {
        "id": "ai-video-production",
        "icon": "Cpu",
        "title": "AI Video Production",
        "description": "Merging cutting-edge generative tools with professional post-production for unmatched visual styling.",
        "color": "#C5C6C9",
        "is_active": true
      },
      {
        "id": "ai-advertisements",
        "icon": "Megaphone",
        "title": "AI Advertisements",
        "description": "Tailored ad campaigns and commercial copy combining algorithmic precision with high-end storytelling.",
        "color": "#D1D1D6",
        "is_active": true
      },
      {
        "id": "social-media-reels",
        "icon": "Smartphone",
        "title": "Social Media Reels",
        "description": "Scroll-stopping TikToks, Instagram Reels, and Shorts engineered specifically to retain views and go viral.",
        "color": "#8E8F94",
        "is_active": true
      },
      {
        "id": "ugc-ads",
        "icon": "Users",
        "title": "UGC Ads",
        "description": "Authentic consumer-focused style editing that builds instant trust and converts viewer interest into sales.",
        "color": "#A2A2A7",
        "is_active": true
      },
      {
        "id": "product-videos",
        "icon": "Box",
        "title": "Product Videos",
        "description": "Sleek, atmospheric product highlights with dynamic macro shots, sound syncs, and 3D camera feel.",
        "color": "#FFFFFF",
        "is_active": true
      }
    ]
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.site_settings (key, value)
VALUES (
  'our_work_settings',
  '{
    "eyebrow": "OUR WORK",
    "title": "Featured Projects",
    "subtitle": "Explore our portfolio filtered by category. Drag or swipe horizontally to view our vertical reels and widescreen productions."
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

