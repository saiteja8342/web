import { supabase } from '../supabase/client';

// ==============================================================================
// TESTIMONIALS
// ==============================================================================

/**
 * Fetch all active testimonials for the public website.
 */
export async function getPublicTestimonials() {
  try {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching public testimonials:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Exception fetching public testimonials:', err);
    return [];
  }
}

/**
 * Fetch all testimonials (active and inactive) for Admin Dashboard.
 */
export async function getAllTestimonialsAdmin() {
  try {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('getAllTestimonialsAdmin error:', error);
    return { data: [], error };
  }
}

/**
 * Create a new testimonial (Admin only).
 */
export async function createTestimonial({
  name,
  rating = 5,
  feedback,
  company = '',
  role = '',
  avatar_url = null,
  is_active = true
}) {
  try {
    if (!name?.trim()) throw new Error('Person name is required.');
    if (!feedback?.trim()) throw new Error('Feedback is required.');

    const cleanRating = Math.max(1, Math.min(5, Number(rating) || 5));

    const { data, error } = await supabase
      .from('testimonials')
      .insert([
        {
          name: name.trim(),
          rating: cleanRating,
          feedback: feedback.trim(),
          company: company?.trim() || null,
          role: role?.trim() || null,
          avatar_url: avatar_url?.trim() || null,
          is_active: Boolean(is_active)
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('createTestimonial error:', error);
    return { data: null, error };
  }
}

/**
 * Update an existing testimonial (Admin only).
 */
export async function updateTestimonial(id, updates) {
  try {
    if (!id) throw new Error('Testimonial ID is required');

    const cleanUpdates = { ...updates, updated_at: new Date().toISOString() };
    if (cleanUpdates.rating !== undefined) {
      cleanUpdates.rating = Math.max(1, Math.min(5, Number(cleanUpdates.rating) || 5));
    }

    const { data, error } = await supabase
      .from('testimonials')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('updateTestimonial error:', error);
    return { data: null, error };
  }
}

/**
 * Delete a testimonial (Admin only).
 */
export async function deleteTestimonial(id) {
  try {
    if (!id) throw new Error('Testimonial ID is required');

    const { error } = await supabase
      .from('testimonials')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('deleteTestimonial error:', error);
    return { success: false, error };
  }
}

// ==============================================================================
// PORTFOLIO VIDEOS (OUR WORK)
// ==============================================================================

/**
 * Fetch all active portfolio videos for the public Our Work section.
 */
export async function getPublicPortfolioVideos() {
  try {
    const { data, error } = await supabase
      .from('portfolio_videos')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching public portfolio videos:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Exception fetching public portfolio videos:', err);
    return [];
  }
}

/**
 * Fetch all portfolio videos for Admin Dashboard.
 */
export async function getAllPortfolioVideosAdmin() {
  try {
    const { data, error } = await supabase
      .from('portfolio_videos')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('getAllPortfolioVideosAdmin error:', error);
    return { data: [], error };
  }
}

/**
 * Create a new portfolio video (Admin only).
 */
export async function createPortfolioVideo({
  title,
  youtube_url,
  category = 'REELS',
  aspect_ratio = '16/9',
  metric = '',
  duration = '',
  description = '',
  is_active = true
}) {
  try {
    if (!title?.trim()) throw new Error('Video title is required.');
    if (!youtube_url?.trim()) throw new Error('YouTube URL or link is required.');

    const { data, error } = await supabase
      .from('portfolio_videos')
      .insert([
        {
          title: title.trim(),
          youtube_url: youtube_url.trim(),
          category: (category?.trim() || 'REELS').toUpperCase(),
          aspect_ratio: aspect_ratio === '9/16' ? '9/16' : '16/9',
          metric: metric?.trim() || null,
          duration: duration?.trim() || null,
          description: description?.trim() || null,
          is_active: Boolean(is_active)
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('createPortfolioVideo error:', error);
    return { data: null, error };
  }
}

/**
 * Update a portfolio video (Admin only).
 */
export async function updatePortfolioVideo(id, updates) {
  try {
    if (!id) throw new Error('Video ID is required');

    const cleanUpdates = { ...updates, updated_at: new Date().toISOString() };
    if (cleanUpdates.category) {
      cleanUpdates.category = cleanUpdates.category.trim().toUpperCase();
    }

    const { data, error } = await supabase
      .from('portfolio_videos')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('updatePortfolioVideo error:', error);
    return { data: null, error };
  }
}

/**
 * Delete a portfolio video (Admin only).
 */
export async function deletePortfolioVideo(id) {
  try {
    if (!id) throw new Error('Video ID is required');

    const { error } = await supabase
      .from('portfolio_videos')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('deletePortfolioVideo error:', error);
    return { success: false, error };
  }
}

// ==============================================================================
// SITE SETTINGS (FOOTER & GENERAL CONFIG)
// ==============================================================================

export const DEFAULT_FOOTER_SETTINGS = {
  headline: "Let's Create Something Exceptional.",
  cta_text: "Start A Project",
  cta_link: "#contact",
  studio_location: "Hyderabad, India",
  phone: "+91 89853 51756",
  email: "hello@motionnodeedits.com",
  instagram_url: "https://www.instagram.com/motionnodeedits/",
  youtube_url: "https://www.youtube.com/@motionnodeedits",
  linkedin_url: "https://www.linkedin.com/company/motionnodeedits",
  whatsapp_number: "918985351756",
  copyright_text: "© 2026 MotionNodeEdits. All rights reserved."
};

/**
 * Fetch a site setting by key.
 */
export async function getSiteSettings(key = 'footer_settings') {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', key)
      .single();

    if (error || !data) {
      return key === 'footer_settings' ? DEFAULT_FOOTER_SETTINGS : {};
    }
    return {
      ...(key === 'footer_settings' ? DEFAULT_FOOTER_SETTINGS : {}),
      ...data.value
    };
  } catch (err) {
    console.warn(`Exception reading site setting ${key}:`, err);
    return key === 'footer_settings' ? DEFAULT_FOOTER_SETTINGS : {};
  }
}

/**
 * Update a site setting by key (Admin only).
 */
export async function updateSiteSettings(key, value) {
  try {
    if (!key) throw new Error('Settings key is required');

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id || null;

    const { data, error } = await supabase
      .from('site_settings')
      .upsert({
        key,
        value,
        updated_at: new Date().toISOString(),
        updated_by: userId
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('updateSiteSettings error:', error);
    return { data: null, error };
  }
}

/**
 * Fetch all client ratings from delivered orders for Admin approval/review.
 */
export async function getClientOrderRatingsForAdmin() {
  try {
    const { data, error } = await supabase
      .from('ratings')
      .select(`
        id,
        order_id,
        client_id,
        editor_id,
        rating,
        feedback_note,
        is_testimonial,
        created_at,
        orders:order_id (
          id,
          order_name
        ),
        client:client_id (
          id,
          full_name,
          company_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.warn('getClientOrderRatingsForAdmin error:', error);
    return { data: [], error };
  }
}

