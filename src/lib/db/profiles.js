import { supabase } from '../supabase/client';

/**
 * Profiles Database Operations
 */

/**
 * Fetch profile by ID.
 */
export async function getProfile(id) {
  return await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
}

/**
 * Get the current logged-in user's profile.
 */
export async function getCurrentUserProfile() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return { data: null, error: new Error('Not authenticated') };
  return await getProfile(session.user.id);
}

/**
 * Fetch all clients (Admin view).
 * Returns all profiles that have role = 'client' or null (default registered users).
 */
export async function getApprovedClients() {
  return await supabase
    .from('profiles')
    .select('*')
    .or('role.eq.client,role.is.null')
    .neq('status', 'pending')
    .order('created_at', { ascending: false });
}

/**
 * Fetch ALL clients for the Admin Dashboard (including approved, pending, and suspended/blocked).
 */
export async function getAllClientsForAdmin() {
  return await supabase
    .from('profiles')
    .select('*')
    .or('role.eq.client,role.is.null')
    .order('created_at', { ascending: false });
}

/**
 * Fetch all approved editors (Admin view).
 */
export async function getApprovedEditors() {
  return await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'editor')
    .neq('status', 'pending')
    .order('created_at', { ascending: false });
}

/**
 * Fetch all pending profiles (Admin approval queue).
 */
export async function getPendingProfiles() {
  return await supabase
    .from('profiles')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
}

/**
 * Update a user profile safely (disallowing privilege escalation fields).
 */
export async function updateProfile(id, updates) {
  // Sanitize updates to prevent accidental or malicious role/status escalation
  const { id: _omitId, role: _omitRole, status: _omitStatus, created_at: _omitCreatedAt, ...safeUpdates } = updates;

  return await supabase
    .from('profiles')
    .update(safeUpdates)
    .eq('id', id)
    .select()
    .single();
}

/**
 * Approve or reject a pending profile.
 */
export async function updateProfileStatus(id, status) {
  return await supabase
    .from('profiles')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
}

/**
 * Block / suspend a client immediately.
 */
export async function blockClient(id) {
  return await updateProfileStatus(id, 'rejected');
}

/**
 * Unblock / restore a client to active status.
 */
export async function unblockClient(id) {
  return await updateProfileStatus(id, 'approved');
}

/**
 * Delete a user profile (and optionally via admin RPC if configured).
 */
export async function deleteClient(id) {
  try {
    // Attempt RPC delete (removes from auth.users as well if RPC exists)
    const { data, error } = await supabase.rpc('delete_user_by_admin', { target_user_id: id });
    if (!error) return { data, error: null };
  } catch (_) {
    // RPC not present, fallback to direct profiles table deletion
  }

  return await supabase
    .from('profiles')
    .delete()
    .eq('id', id);
}

/**
 * Create or upsert a profile for a user.
 */
export async function createProfile(profileData) {
  return await supabase
    .from('profiles')
    .upsert([profileData])
    .select()
    .single();
}

