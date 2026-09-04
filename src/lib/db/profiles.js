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
 * Update a user profile.
 */
export async function updateProfile(id, updates) {
  return await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
}

/**
 * Approve or reject a pending profile.
 */
export async function updateProfileStatus(id, status) {
  return await updateProfile(id, { status });
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
