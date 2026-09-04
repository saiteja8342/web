import { supabase } from '../supabase/client';

/**
 * Authentication Utilities
 * Reusable functions to inspect sessions, fetch profile metadata, and verify user roles.
 */

/**
 * Get current active Supabase Auth session.
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('[AuthUtils] Error getting session:', error);
    return null;
  }
  return data.session;
}

/**
 * Get current logged in user object from session.
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user || null;
}

/**
 * Fetch profile data for a user ID from the profiles table.
 *
 * @param {string} userId - UUID matching auth.users id
 * @returns {Promise<Object|null>} - Profile record
 */
export async function getUserProfile(userId) {
  if (!userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, company_name, role, status, avatar_url, editor_title, created_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('[AuthUtils] Error fetching user profile:', error);
    return null;
  }

  return data;
}

/**
 * Get current user profile and role in one call.
 */
export async function getCurrentUserProfile() {
  const user = await getCurrentUser();
  if (!user) return null;
  return await getUserProfile(user.id);
}

/**
 * Check if the given profile or role string is Admin.
 */
export function isAdmin(profileOrRole) {
  const role = typeof profileOrRole === 'string' ? profileOrRole : profileOrRole?.role;
  return (role || '').toLowerCase().trim() === 'admin';
}

/**
 * Check if the given profile or role string is Editor.
 */
export function isEditor(profileOrRole) {
  const role = typeof profileOrRole === 'string' ? profileOrRole : profileOrRole?.role;
  return (role || '').toLowerCase().trim() === 'editor';
}

/**
 * Check if the given profile or role string is Client.
 */
export function isClient(profileOrRole) {
  const role = typeof profileOrRole === 'string' ? profileOrRole : profileOrRole?.role;
  return (role || '').toLowerCase().trim() === 'client';
}

/**
 * Sign out the current user and clear sessions.
 */
export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('[AuthUtils] Error signing out:', error);
  }
  return { success: !error };
}
