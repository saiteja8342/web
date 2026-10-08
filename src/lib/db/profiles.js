import { supabase } from '../supabase/client';

/**
 * Profiles Database Operations
 */

/**
 * Fetch profile by ID.
 */
export async function getProfile(id) {
  const res = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (res.data) return res;

  // Auto-heal missing profile for current authenticated user
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user && session.user.id === id) {
      const u = session.user;
      const meta = u.user_metadata || {};
      const seed = meta.username || (u.email ? u.email.split('@')[0] : 'user');
      const fallbackAvatar = meta.avatar_url || meta.picture || `https://api.dicebear.com/7.x/adventurer/svg?seed=male-${encodeURIComponent(seed)}&hair=short01,short02,short03,short04,short05,short06,short07,short08,short09,short10,short11,short12,short13,short14,short15,short16&hairColor=0e0e0e,2c1b18,4a312c,6a4e42,85461e&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
      const newProfile = {
        id: u.id,
        full_name: meta.full_name || meta.name || (u.email ? u.email.split('@')[0] : 'User'),
        email: u.email || '',
        username: seed,
        avatar_url: fallbackAvatar,
      };

      const { data: inserted, error: insErr } = await supabase
        .from('profiles')
        .upsert(newProfile)
        .select()
        .maybeSingle();

      if (!insErr && inserted) {
        return { data: inserted, error: null };
      }
      return { data: newProfile, error: null };
    }
  } catch (healErr) {
    console.warn('[ProfilesDB] Auto-heal profile error:', healErr);
  }

  return res;
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
 * Fetch all editors (Admin view: approved, active, or pending).
 */
export async function getApprovedEditors() {
  try {
    const res = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'editor')
      .order('created_at', { ascending: false });

    return res;
  } catch (err) {
    console.error('[profiles.js] getApprovedEditors failed:', err);
    return { data: [], error: err };
  }
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

