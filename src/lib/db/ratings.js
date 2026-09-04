import { supabase } from '../supabase/client';

/**
 * Ratings Database Operations
 * Matches schema:
 * - id (uuid)
 * - order_id (uuid, FK -> orders.id)
 * - client_id (uuid, FK -> profiles.id)
 * - editor_id (uuid, FK -> profiles.id)
 * - rating (integer, 1-5)
 * - feedback_note (text, nullable)
 * - created_at (timestamp)
 */

/**
 * Helper to strip internal testimonial tag from user-facing feedback notes.
 */
export function stripTestimonialTag(note) {
  if (!note || typeof note !== 'string') return '';
  return note.replace(/\[TESTIMONIAL:(true|false)\]/g, '').trim();
}

/**
 * Helper to determine if testimonial consent was granted.
 */
export function parseIsTestimonial(note, isTestimonialCol) {
  if (typeof note === 'string' && note.includes('[TESTIMONIAL:true]')) return true;
  if (isTestimonialCol === true) return true;
  return false;
}

/**
 * Submit or update rating for a delivered order.
 */
export async function submitOrderRating({ orderId, clientId, editorId, rating, feedbackNote = null, isTestimonial = false }) {
  const cleanNote = stripTestimonialTag(feedbackNote);
  const noteWithTag = isTestimonial ? `${cleanNote} [TESTIMONIAL:true]`.trim() : cleanNote;

  // 1. First attempt: include is_testimonial column if available
  try {
    const res = await supabase
      .from('ratings')
      .upsert({
        order_id: orderId,
        client_id: clientId,
        editor_id: editorId,
        rating,
        feedback_note: noteWithTag,
        is_testimonial: isTestimonial,
      }, { onConflict: 'order_id,client_id' })
      .select()
      .maybeSingle();

    if (!res.error && res.data) {
      return res;
    }
  } catch (e) {
    console.warn('[Ratings DB] Upsert with is_testimonial failed, falling back:', e);
  }

  // 2. Fallback attempt without is_testimonial column
  return await supabase
    .from('ratings')
    .upsert({
      order_id: orderId,
      client_id: clientId,
      editor_id: editorId,
      rating,
      feedback_note: noteWithTag,
    }, { onConflict: 'order_id,client_id' })
    .select()
    .maybeSingle();
}

/**
 * Get average rating and count for an editor.
 */
export async function getEditorRatingStats(editorId) {
  const { data, error } = await supabase
    .from('ratings')
    .select('rating')
    .eq('editor_id', editorId);

  if (error || !data || data.length === 0) {
    return { average: 0, count: 0 };
  }

  const total = data.reduce((sum, row) => sum + row.rating, 0);
  const average = Number((total / data.length).toFixed(1));

  return { average, count: data.length };
}

/**
 * Get existing rating for an order.
 */
export async function getOrderRating(orderId) {
  return await supabase
    .from('ratings')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();
}

/**
 * Fetch all ratings mapped by order_id for fast lookup in Admin views.
 */
export async function getAllDeliveredOrdersRatingsMap() {
  const { data, error } = await supabase
    .from('ratings')
    .select('*');

  if (error || !data) {
    return {};
  }

  const map = {};
  data.forEach((r) => {
    map[r.order_id] = {
      ...r,
      cleanFeedback: stripTestimonialTag(r.feedback_note),
      isTestimonial: parseIsTestimonial(r.feedback_note, r.is_testimonial),
    };
  });
  return map;
}
