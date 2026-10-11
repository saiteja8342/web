import { supabase } from '../supabase/client';

/**
 * Revision Requests Database Operations & Timestamp Engine
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
 * Helper to parse frame timestamp from a revision note string.
 * Example: "[TIMESTAMP:01:24] Fix transition here" -> { timestamp: "01:24", note: "Fix transition here" }
 */
export function parseRevisionTimestamp(noteText) {
  if (!noteText || typeof noteText !== 'string') {
    return { timestamp: null, note: '' };
  }

  // 1. Check for [TIMESTAMP:MM:SS]
  const tagMatch = noteText.match(/^\[TIMESTAMP:([0-9]{1,2}:[0-9]{2})\]\s*(.*)/i);
  if (tagMatch) {
    return {
      timestamp: tagMatch[1],
      note: tagMatch[2]?.trim() || '',
    };
  }

  // 2. Check for [MM:SS] format
  const bracketMatch = noteText.match(/^\[([0-9]{1,2}:[0-9]{2})\]\s*(.*)/);
  if (bracketMatch) {
    return {
      timestamp: bracketMatch[1],
      note: bracketMatch[2]?.trim() || '',
    };
  }

  return {
    timestamp: null,
    note: noteText.trim(),
  };
}

/**
 * Helper to serialize note with timestamp.
 */
export function formatRevisionWithTimestamp(timestamp, noteText) {
  const cleanNote = (noteText || '').trim();
  if (!timestamp || !timestamp.trim()) {
    return cleanNote;
  }
  const cleanTimestamp = timestamp.trim();
  return `[TIMESTAMP:${cleanTimestamp}] ${cleanNote}`;
}

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
 * Submit a new revision request (Client) with optional timestamp.
 */
export async function submitRevisionRequest(orderId, requestedByUserId, requestNote, timestamp = null) {
  const finalNote = formatRevisionWithTimestamp(timestamp, requestNote);

  return await supabase
    .from('revision_requests')
    .insert([
      {
        order_id: orderId,
        requested_by: requestedByUserId,
        request_note: finalNote,
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
