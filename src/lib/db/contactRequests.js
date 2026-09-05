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
 * Check if an email has already submitted a contact request.
 */
export async function checkEmailAlreadySubmitted(email) {
  if (!email) return false;
  try {
    const { data, error } = await supabase.rpc('has_already_submitted_contact', {
      p_email: email.trim().toLowerCase()
    });
    if (!error && typeof data === 'boolean') {
      return data;
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

    const { data, error } = await supabase
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
      ])
      .select()
      .single();

    // Catch unique constraint violation (Postgres error 23505)
    if (error && (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('unique constraint'))) {
      return { data: null, error: null, isDuplicate: true };
    }

    return { data, error, isDuplicate: false };
  } catch (err) {
    console.warn('[ContactRequests] Submission error:', err);
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
