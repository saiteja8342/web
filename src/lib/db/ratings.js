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
 * Submit rating for a delivered order.
 */
export async function submitOrderRating({ orderId, clientId, editorId, rating, feedbackNote = null }) {
  return await supabase
    .from('ratings')
    .insert([
      {
        order_id: orderId,
        client_id: clientId,
        editor_id: editorId,
        rating,
        feedback_note: feedbackNote,
      },
    ])
    .select()
    .single();
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
