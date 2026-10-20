import { supabase } from '../supabase/client';

/**
 * Orders Database Operations
 * Matches schema:
 * - id (uuid, primary key)
 * - order_name (text)
 * - video_type (enum: youtube_longform | short | reel | ad | corporate | other)
 * - brief (text)
 * - drive_link (text, nullable)
 * - dropbox_link (text, nullable)
 * - additional_link (text, nullable)
 * - client_id (uuid, FK -> profiles.id)
 * - editor_id (uuid, FK -> profiles.id, nullable)
 * - admin_id (uuid, FK -> profiles.id)
 * - status (enum: received | accepted | in_editing | in_review | revision_requested | on_hold | delivered)
 * - editor_deadline (timestamp)
 * - client_deadline (timestamp)
 * - admin_notes (text, nullable)
 * - created_at (timestamp)
 * - updated_at (timestamp)
 */

/**
 * Map database status enums to UI display labels and badge classes.
 */
export const STATUS_MAP = {
  received:           { label: 'RECEIVED',    badgeClass: 'vel-badge-received',   step: 0 },
  accepted:           { label: 'ACCEPTED',    badgeClass: 'vel-badge-progress',   step: 1 },
  in_editing:         { label: 'IN EDITING',  badgeClass: 'vel-badge-progress',   step: 2 },
  in_review:          { label: 'IN REVIEW',   badgeClass: 'vel-badge-reviewing',  step: 3 },
  revision_requested: { label: 'IN REVIEW',   badgeClass: 'vel-badge-received',   step: 3 },
  on_hold:            { label: 'ON HOLD',     badgeClass: 'vel-badge-received',   step: -1 },
  delivered:          { label: 'DELIVERED',   badgeClass: 'vel-badge-progress',   step: 4 },
  cancelled:          { label: 'CANCELLED',   badgeClass: 'vel-badge-cancelled',  step: -1 },
};

/**
 * Map UI status labels back to database enum values.
 */
export const UI_TO_DB_STATUS = {
  'RECEIVED':    'received',
  'ACCEPTED':    'accepted',
  'IN EDITING':  'in_editing',
  'IN PROGRESS': 'in_editing',
  'IN REVIEW':   'in_review',
  'REVIEWING':   'in_review',
  'REVISION':    'revision_requested',
  'ON HOLD':     'on_hold',
  'DELIVERED':   'delivered',
  'COMPLETED':   'delivered',
  'CANCELLED':   'cancelled',
};

/**
 * Generate a unique order code in format: MNE-YYYYMMDD-XXXX
 * Rule: MNE- + 8-digit date + - + 4 random uppercase alphanumeric characters.
 * Example: MNE-20260904-A7K9
 */
export function generateOrderCode(date = new Date()) {
  const d = date instanceof Date && !isNaN(date.getTime()) ? date : new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MNE-${yyyy}${mm}${dd}-${rand}`;
}

/**
 * Format an order row into its human-readable MNE-YYYYMMDD-XXXX display code.
 */
export function formatOrderCode(order) {
  if (!order) return 'MNE-UNKNOWN';
  if (order.order_code) return order.order_code;
  if (order.orderCode) return order.orderCode;

  const notes = order.admin_notes || order.rawAdminNotes || order.notes || '';
  if (typeof notes === 'string' && notes.includes('[ORDER_CODE:')) {
    const match = notes.match(/\[ORDER_CODE:([^\]]+)\]/);
    if (match && match[1]) return match[1];
  }

  // Deterministic fallback from created_at and id
  const rawDate = order.created_at || order.createdAt;
  const d = rawDate ? new Date(rawDate) : new Date();
  const yyyy = isNaN(d.getTime()) ? '2026' : d.getFullYear();
  const mm = isNaN(d.getTime()) ? '01' : String(d.getMonth() + 1).padStart(2, '0');
  const dd = isNaN(d.getTime()) ? '01' : String(d.getDate()).padStart(2, '0');

  const idStr = String(order.id || order.dbId || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const suffix = idStr.length >= 4 ? idStr.slice(0, 4) : 'A7K9';

  return `MNE-${yyyy}${mm}${dd}-${suffix}`;
}

/**
 * Strip [ORDER_CODE:...] tag from notes for clean UI display.
 */
export function stripOrderCodeTag(notes) {
  if (!notes || typeof notes !== 'string') return '';
  return notes.replace(/\s*\[ORDER_CODE:[^\]]+\]/g, '').trim();
}

/**
 * Strip [CANCELLATION_REASON:...] and [ORDER_CANCELLED:...] tags from notes for clean UI display.
 */
export function stripCancellationTag(notes) {
  if (!notes || typeof notes !== 'string') return '';
  return notes
    .replace(/\s*\[CANCELLATION_REASON:[^\]]*\]/g, '')
    .replace(/\s*\[ORDER_CANCELLED:[^\]]*\]/g, '')
    .trim();
}

/**
 * Extract cancellation reason from order notes.
 */
export function parseCancellationReason(notes) {
  if (!notes || typeof notes !== 'string') return '';
  const match = notes.match(/\[CANCELLATION_REASON:([^\]]*)\]/);
  return match && match[1] ? match[1].trim() : '';
}

/**
 * Map video_type_enum to display labels.
 */
export const VIDEO_TYPE_MAP = {
  youtube_longform: 'YouTube Longform (16:9)',
  short:            'YouTube Short (9:16)',
  reel:             'Instagram / TikTok Reel (9:16)',
  ad:               'Commercial / Ad',
  corporate:        'Corporate Video',
  other:            'Other',
};

/**
 * Map display label back to video_type_enum.
 */
export const UI_TO_VIDEO_TYPE = Object.fromEntries(
  Object.entries(VIDEO_TYPE_MAP).map(([k, v]) => [v, k])
);

/**
 * Fetch orders for the logged-in client.
 * Supports matching by client UUID or client email (for offline claimed orders).
 */
export async function getClientOrders(clientId, clientEmail = null) {
  let query = supabase
    .from('orders')
    .select(`
      *,
      editor:editor_id (id, full_name, email, editor_title, avatar_url)
    `);

  if (clientEmail && clientEmail.trim()) {
    const cleanEmail = clientEmail.trim().toLowerCase();
    query = query.or(`client_id.eq.${clientId},client_email.ilike.${cleanEmail},admin_notes.ilike.%[OFFLINE_CLIENT_EMAIL:${cleanEmail}]%`);
  } else {
    query = query.eq('client_id', clientId);
  }

  return await query.order('created_at', { ascending: false });
}

/**
 * Auto-claim offline orders for a client who registered or logged in.
 * Updates past offline orders created with this email to point to their user UUID.
 */
export async function claimOfflineOrdersForClient(clientId, clientEmail) {
  if (!clientId || !clientEmail || !clientEmail.includes('@')) {
    return { count: 0 };
  }
  const cleanEmail = clientEmail.trim().toLowerCase();

  try {
    // 1. Try invoking the database RPC if available
    const { data: rpcCount, error: rpcErr } = await supabase.rpc('claim_my_offline_orders');
    if (!rpcErr && typeof rpcCount === 'number' && rpcCount > 0) {
      return { count: rpcCount };
    }

    // 2. Client-side fallback check
    const { data: matchedOrders, error: findErr } = await supabase
      .from('orders')
      .select('id, client_id, admin_notes')
      .neq('client_id', clientId)
      .or(`client_email.ilike.${cleanEmail},admin_notes.ilike.%[OFFLINE_CLIENT_EMAIL:${cleanEmail}]%`);

    if (findErr || !matchedOrders || matchedOrders.length === 0) {
      return { count: 0 };
    }

    const orderIds = matchedOrders.map((o) => o.id);
    const { error: updateErr } = await supabase
      .from('orders')
      .update({ client_id: clientId, updated_at: new Date().toISOString() })
      .in('id', orderIds);

    if (updateErr) {
      console.warn('[orders.js] Auto-claim fallback update error:', updateErr);
      return { count: 0, error: updateErr };
    }

    return { count: orderIds.length, orderIds };
  } catch (err) {
    console.warn('[orders.js] claimOfflineOrdersForClient error:', err);
    return { count: 0, error: err };
  }
}

/**
 * Fetch client's current active order.
 */
export async function getClientActiveOrder(clientId) {
  return await supabase
    .from('orders')
    .select(`
      *,
      editor:editor_id (id, full_name, email, editor_title, avatar_url)
    `)
    .eq('client_id', clientId)
    .neq('status', 'delivered')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
}

/**
 * Fetch editor's active assigned project.
 */
export async function getEditorActiveProject(editorId) {
  try {
    const res = await supabase
      .from('orders')
      .select(`
        *,
        client:client_id (
          id,
          full_name,
          company_name,
          email
        )
      `)
      .eq('editor_id', editorId)
      .neq('status', 'delivered')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!res.error && res.data) {
      const d = res.data;
      d.order_name = d.order_name || d.title || 'Untitled Project';
      d.title = d.title || d.order_name;
      d.brief = d.brief || d.description || '';
      return { data: d, error: null };
    }
  } catch (e) {
    console.warn('[Orders DB] Join select failed, trying fallback:', e);
  }

  // Fallback: query without relational join
  const fallback = await supabase
    .from('orders')
    .select('*')
    .eq('editor_id', editorId)
    .neq('status', 'delivered')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fallback.data) {
    const d = fallback.data;
    d.order_name = d.order_name || d.title || 'Untitled Project';
    d.title = d.title || d.order_name;
    d.brief = d.brief || d.description || '';
    if (d.client_id) {
      const { data: clientProf } = await supabase.from('profiles').select('id, full_name, email').eq('id', d.client_id).maybeSingle();
      if (clientProf) d.client = clientProf;
    }
    return { data: d, error: null };
  }

  return fallback;
}

/**
 * Fetch all active (non-delivered) projects for an editor.
 */
export async function getEditorActiveOrders(editorId) {
  return await supabase
    .from('orders')
    .select(`
      *,
      client:client_id (id, full_name, company_name)
    `)
    .eq('editor_id', editorId)
    .neq('status', 'delivered')
    .order('created_at', { ascending: false });
}

/**
 * Fetch completed project history for an editor.
 */
export async function getEditorProjectHistory(editorId) {
  return await supabase
    .from('orders')
    .select(`
      *,
      client:client_id (id, full_name, company_name),
      ratings (rating)
    `)
    .eq('editor_id', editorId)
    .eq('status', 'delivered')
    .order('updated_at', { ascending: false });
}

/**
 * Fetch editor stats: total projects, on-time count, delayed count.
 */
export async function getEditorStats(editorId) {
  const { data: allOrders, error } = await supabase
    .from('orders')
    .select('id, status, editor_deadline, updated_at')
    .eq('editor_id', editorId)
    .eq('status', 'delivered');

  if (error || !allOrders) {
    return { totalProjects: 0, onTime: 0, delayed: 0 };
  }

  let onTime = 0;
  let delayed = 0;

  allOrders.forEach(order => {
    if (order.editor_deadline && order.updated_at) {
      const deadline = new Date(order.editor_deadline);
      const delivered = new Date(order.updated_at);
      if (delivered <= deadline) {
        onTime++;
      } else {
        delayed++;
      }
    } else {
      onTime++; // No deadline set = assume on time
    }
  });

  return {
    totalProjects: allOrders.length,
    onTime,
    delayed,
  };
}

/**
 * Fetch all orders for Admin view with joined client & editor profiles.
 */
export async function getAdminAllOrders() {
  return await supabase
    .from('orders')
    .select(`
      *,
      client:client_id (id, full_name, company_name, email),
      editor:editor_id (id, full_name, email, editor_title, avatar_url)
    `)
    .order('created_at', { ascending: false });
}

/**
 * Fetch unassigned orders (for assign project dropdown).
 */
export async function getUnassignedOrders() {
  return await supabase
    .from('orders')
    .select(`
      *,
      client:client_id (id, full_name, company_name)
    `)
    .is('editor_id', null)
    .neq('status', 'delivered')
    .order('created_at', { ascending: false });
}

/**
 * Fetch live counts for Admin Dashboard Home:
 * - Active running orders (status != 'delivered')
 * - Accepted orders (status == 'accepted')
 * - Pending orders (status == 'received')
 * - With editor (status in ('in_editing', 'in_review'))
 * - Completed this week
 * - Ready for delivery (status == 'in_review')
 */
export async function getAdminOrderCounts() {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [activeRes, acceptedRes, pendingRes, withEditorRes, completedWeekRes, readyRes] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }).neq('status', 'delivered'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'accepted'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'received'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', ['in_editing', 'in_review']).not('editor_id', 'is', null),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'delivered').gte('updated_at', weekAgo.toISOString()),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'in_review'),
  ]);

  return {
    activeOrders: activeRes.count || 0,
    acceptedOrders: acceptedRes.count || 0,
    pendingOrders: pendingRes.count || 0,
    withEditorOrders: withEditorRes.count || 0,
    completedThisWeek: completedWeekRes.count || 0,
    readyForDelivery: readyRes.count || 0,
  };
}

/**
 * Create a new order (Admin).
 */
export async function createOrder(orderPayload) {
  let code = orderPayload.order_code;
  if (!code) {
    code = generateOrderCode();
  }

  const codeTag = `[ORDER_CODE:${code}]`;
  const notesWithCode = orderPayload.admin_notes
    ? `${orderPayload.admin_notes} ${codeTag}`
    : codeTag;

  const payloadWithCode = {
    ...orderPayload,
    order_code: code,
    admin_notes: notesWithCode,
  };

  // Attempt insert with all provided columns
  let res = await supabase
    .from('orders')
    .insert([payloadWithCode])
    .select(`
      *,
      client:client_id (id, full_name, company_name, email),
      editor:editor_id (id, full_name, email, editor_title, avatar_url)
    `)
    .single();

  // Fallback if specific columns (order_code, client_email, client_name, client_phone) don't exist yet in Supabase table
  if (res.error && res.error.message) {
    const msg = res.error.message.toLowerCase();
    const hasColError = ['order_code', 'client_email', 'client_name', 'client_phone'].some(col => msg.includes(col));
    if (hasColError) {
      const sanitized = { ...payloadWithCode };
      if (msg.includes('order_code')) delete sanitized.order_code;
      if (msg.includes('client_email')) delete sanitized.client_email;
      if (msg.includes('client_name')) delete sanitized.client_name;
      if (msg.includes('client_phone')) delete sanitized.client_phone;

      res = await supabase
        .from('orders')
        .insert([sanitized])
        .select(`
          *,
          client:client_id (id, full_name, company_name, email),
          editor:editor_id (id, full_name, email, editor_title, avatar_url)
        `)
        .single();
    }
  }

  return res;
}

/**
 * Update an order (generic field update).
 */
export async function updateOrder(orderId, updates) {
  try {
    const res = await supabase
      .from('orders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select(`
        *,
        client:client_id (id, full_name, company_name, email),
        editor:editor_id (id, full_name, email, editor_title, avatar_url)
      `)
      .maybeSingle();

    if (!res.error && res.data) {
      return res;
    }
  } catch (e) {
    console.warn('[Orders DB] Relational update failed, attempting simple update:', e);
  }

  // Fallback without relational joins
  return await supabase
    .from('orders')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .select('*')
    .maybeSingle();
}

/**
 * Update order status and log into order_status_history.
 */
export async function updateOrderStatus(orderId, newStatus, changedByUserId, oldStatus = null, notes = null) {
  const normalizedStatus = UI_TO_DB_STATUS[newStatus] || (typeof newStatus === 'string' ? newStatus.toLowerCase() : newStatus);
  let updatedOrder = null;
  try {
    const res = await supabase
      .from('orders')
      .update({ status: normalizedStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select(`
        *,
        client:client_id (id, full_name, company_name, email),
        editor:editor_id (id, full_name, email, editor_title, avatar_url)
      `)
      .maybeSingle();

    if (!res.error && res.data) {
      updatedOrder = res.data;
    }
  } catch (e) {
    console.warn('[Orders DB] Relational update failed, attempting simple update:', e);
  }

  if (!updatedOrder) {
    const fallback = await supabase
      .from('orders')
      .update({ status: normalizedStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select('*')
      .maybeSingle();

    if (fallback.error) return { data: null, error: fallback.error };
    updatedOrder = fallback.data;
  }

  // Log to order_status_history if available
  if (changedByUserId) {
    try {
      await supabase
        .from('order_status_history')
        .insert([
          {
            order_id: orderId,
            changed_by: changedByUserId,
            old_status: oldStatus,
            new_status: newStatus,
            changed_at: new Date().toISOString(),
            notes: notes,
          },
        ]);
    } catch (historyErr) {
      console.warn('[Orders DB] Warning logging status history:', historyErr);
    }
  }

  return { data: updatedOrder, error: null };
}

/**
 * Assign editor to an order with deadlines and notes.
 */
export async function assignEditorToOrder(orderId, editorId, adminId, extraUpdates = {}) {
  // Update the order with editor, change status to accepted, and commit deadlines
  const updates = {
    editor_id: editorId,
    status: 'accepted',
    ...extraUpdates,
  };
  const { data, error } = await updateOrder(orderId, updates);

  if (error) return { data: null, error };

  // Log status change
  await supabase
    .from('order_status_history')
    .insert([{
      order_id: orderId,
      changed_by: adminId,
      old_status: 'received',
      new_status: 'accepted',
      notes: `Editor assigned. Internal deadline: ${extraUpdates.editor_deadline || 'none'}, Client deadline: ${extraUpdates.client_deadline || 'none'}`,
    }]);

  return { data, error: null };
}

/**
 * Get active order count for each editor (for workload display).
 */
export async function getEditorActiveOrderCounts() {
  const { data, error } = await supabase
    .from('orders')
    .select('editor_id')
    .neq('status', 'delivered')
    .neq('status', 'cancelled')
    .not('editor_id', 'is', null);

  if (error || !data) return {};

  const counts = {};
  data.forEach(row => {
    counts[row.editor_id] = (counts[row.editor_id] || 0) + 1;
  });
  return counts;
}

/**
 * Cancel an order (Admin-only action).
 * Updates order status to cancelled, records reason in admin_notes and order_status_history.
 */
export async function cancelOrder(orderId, adminId, cancellationReason, currentNotes = '') {
  if (!orderId) {
    return { data: null, error: new Error('Order ID is required to cancel an order') };
  }

  const reasonText = (cancellationReason || '').trim() || 'No reason provided';
  const cleanNotes = stripCancellationTag(currentNotes || '');
  const cancelTags = `[ORDER_CANCELLED:true] [CANCELLATION_REASON:${reasonText}]`;
  const combinedNotes = cleanNotes ? `${cleanNotes} ${cancelTags}` : cancelTags;
  const nowIso = new Date().toISOString();

  let updatedOrder = null;
  let updateErr = null;

  // 1. Attempt update with dedicated columns (if schema migration was run)
  try {
    const res = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        admin_notes: combinedNotes,
        cancellation_reason: reasonText,
        cancelled_at: nowIso,
        cancelled_by: adminId,
        updated_at: nowIso,
      })
      .eq('id', orderId)
      .select(`
        *,
        client:client_id (id, full_name, company_name, email),
        editor:editor_id (id, full_name, email, editor_title, avatar_url)
      `)
      .maybeSingle();

    if (!res.error && res.data) {
      updatedOrder = res.data;
    } else if (res.error) {
      updateErr = res.error;
    }
  } catch (err) {
    updateErr = err;
  }

  // 2. Fallback update if dedicated columns don't exist yet
  if (!updatedOrder) {
    try {
      const res = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          admin_notes: combinedNotes,
          updated_at: nowIso,
        })
        .eq('id', orderId)
        .select('*')
        .maybeSingle();

      if (!res.error && res.data) {
        updatedOrder = res.data;
        updateErr = null;
      } else if (res.error) {
        // If PostgreSQL enum does not have 'cancelled' yet, save into on_hold with cancel tags
        console.warn('[Orders DB] Cancel enum update failed, attempting resilient fallback with cancel tags:', res.error);
        const fallbackRes = await supabase
          .from('orders')
          .update({
            status: 'on_hold',
            admin_notes: combinedNotes,
            updated_at: nowIso,
          })
          .eq('id', orderId)
          .select('*')
          .maybeSingle();

        if (fallbackRes.data) {
          updatedOrder = { ...fallbackRes.data, status: 'cancelled' };
          updateErr = null;
        } else {
          updateErr = res.error;
        }
      }
    } catch (e2) {
      updateErr = e2;
    }
  }

  // 3. Record status change in order_status_history
  if (adminId) {
    try {
      await supabase
        .from('order_status_history')
        .insert([{
          order_id: orderId,
          changed_by: adminId,
          old_status: null,
          new_status: 'cancelled',
          changed_at: nowIso,
          notes: `Cancelled by Studio Admin. Reason: ${reasonText}`,
        }]);
    } catch (hErr) {
      console.warn('[Orders DB] Warning logging status history for cancellation:', hErr);
    }
  }

  return { data: updatedOrder, error: updateErr };
}
