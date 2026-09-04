import { supabase } from '../supabase/client';

/**
 * Revision Requests Database Operations
 * Matches schema:
 * - id (uuid)
 * - order_id (uuid, FK -> orders.id)
 * - requested_by (uuid, FK -> profiles.id) — client
 * - request_note (text)
 * - status (enum: pending | confirmed | assigned | completed)
 * - confirmed_by (uuid, FK -> profiles.id, nullable) — admin
 * - created_at (timestamp)
 * - updated_at (timestamp)
 */

/**
 * Fetch revisions for an order.
 */
export async function getOrderRevisions(orderId) {
  return await supabase
    .from('revision_requests')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });
}

/**
 * Submit a new revision request (Client).
 */
export async function submitRevisionRequest(orderId, requestedByUserId, requestNote) {
  return await supabase
    .from('revision_requests')
    .insert([
      {
        order_id: orderId,
        requested_by: requestedByUserId,
        request_note: requestNote,
        status: 'pending',
      },
    ])
    .select()
    .single();
}

/**
 * Confirm/update a revision request status (Admin).
 */
export async function updateRevisionStatus(revisionId, status, confirmedByAdminId = null) {
  const updates = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (confirmedByAdminId) {
    updates.confirmed_by = confirmedByAdminId;
  }

  return await supabase
    .from('revision_requests')
    .update(updates)
    .eq('id', revisionId)
    .select()
    .single();
}
