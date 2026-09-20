import { supabase } from '../supabase/client';

export const PROJECT_TYPE_LABELS = {
  video_editing: 'Video Editing',
  ai_production: 'AI Video Production',
  ai_ads: 'AI Advertisements',
  social_reels: 'Social Media Reels',
  ugc_ads: 'UGC Ads',
  product_videos: 'Product Videos',
};

export const STATUS_CONFIG = {
  new: { label: 'New', badgeClass: 'vel-badge-review', color: '#3B82F6' },
  contacted: { label: 'Contacted', badgeClass: 'vel-badge-editing', color: '#10B981' },
  in_discussion: { label: 'In Discussion', badgeClass: 'vel-badge-progress', color: '#8B5CF6' },
  closed: { label: 'Closed', badgeClass: 'vel-badge-delivered', color: '#6B7280' },
};

/**
 * Check if an email has already submitted a contact request within the last 24 hours.
 */
export async function checkEmailAlreadySubmitted(email) {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();

  // 1. Check RPC function (with 24h interval check)
  try {
    const { data, error } = await supabase.rpc('has_already_submitted_contact', {
      p_email: cleanEmail
    });
    if (!error && typeof data === 'boolean') {
      return data;
    }
  } catch {}

  // 2. Fallback query checking if this email was submitted within the last 24 hours
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('contact_requests')
      .select('id')
      .ilike('email', cleanEmail)
      .gte('created_at', twentyFourHoursAgo)
      .limit(1);

    if (!error && Array.isArray(data) && data.length > 0) {
      return true;
    }
  } catch {}

  return false;
}

/**
 * Submit a new contact/quote request (Used by the public website contact form).
 * Ensures a single user cannot submit multiple spam requests.
 */
export async function createContactRequest({ name, email, phone, project_type, message }) {
  try {
    const cleanEmail = email?.trim().toLowerCase();

    // Check if duplicate via RPC first
    const isAlreadySubmitted = await checkEmailAlreadySubmitted(cleanEmail);
    if (isAlreadySubmitted) {
      return { data: null, error: null, isDuplicate: true };
    }

    // Pure INSERT without .select() - avoids RLS "returning representation" permission error for anon visitors
    const { error } = await supabase
      .from('contact_requests')
      .insert([
        {
          name: name?.trim(),
          email: cleanEmail,
          phone: phone?.trim() || null,
          project_type: project_type || 'video_editing',
          message: message?.trim(),
          status: 'new',
        }
      ]);

    if (error) {
      console.error('[ContactRequests] Supabase insert error:', error);
      // Catch unique constraint violation (Postgres error 23505)
      if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
        return { data: null, error: null, isDuplicate: true };
      }
      return { data: null, error, isDuplicate: false };
    }

    console.log('[ContactRequests] Contact request saved successfully to Supabase!');
    return { data: true, error: null, isDuplicate: false };
  } catch (err) {
    console.error('[ContactRequests] Submission exception:', err);
    return { data: null, error: err, isDuplicate: false };
  }
}

/**
 * Fetch all contact requests (Admin only).
 */
export async function getContactRequests() {
  return await supabase
    .from('contact_requests')
    .select('*')
    .order('created_at', { ascending: false });
}

/**
 * Update the status of a contact request.
 */
export async function updateContactRequestStatus(id, status) {
  return await supabase
    .from('contact_requests')
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
}

/**
 * Update internal admin notes for a contact request.
 */
export async function updateContactRequestNotes(id, adminNotes) {
  return await supabase
    .from('contact_requests')
    .update({
      admin_notes: adminNotes,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
}

/**
 * Delete a contact request.
 */
export async function deleteContactRequest(id) {
  return await supabase
    .from('contact_requests')
    .delete()
    .eq('id', id);
}
