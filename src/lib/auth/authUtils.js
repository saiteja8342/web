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
 * Check if the given email is configured as an administrator.
 */
export function isConfiguredAdminEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const cleanEmail = email.toLowerCase().trim();

  const defaultAdminEmails = ['admin@motionnodeedits.com'];

  const envAdmins = (
    (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_ADMIN_EMAILS || import.meta.env.VITE_ADMIN_EMAIL)) ||
    ''
  )
    .split(',')
    .map(e => e.toLowerCase().trim())
    .filter(Boolean);

  const allAdminEmails = new Set([...defaultAdminEmails, ...envAdmins]);
  return allAdminEmails.has(cleanEmail);
}

/**
 * Check if a session user authenticated via Google OAuth.
 */
export function isGoogleUser(user) {
  if (!user) return false;
  const appProvider = (user.app_metadata?.provider || '').toLowerCase();
  if (appProvider === 'google') return true;

  const appProviders = user.app_metadata?.providers || [];
  if (Array.isArray(appProviders) && appProviders.some(p => String(p).toLowerCase() === 'google')) {
    return true;
  }

  const identities = user.identities || [];
  if (Array.isArray(identities) && identities.some(i => (i.provider || '').toLowerCase() === 'google')) {
    return true;
  }

  return false;
}

/**
 * Fetch profile data for a user ID from the profiles table.
 * If database retrieval fails or is empty, falls back to active session user metadata.
 *
 * @param {string} userId - UUID matching auth.users id
 * @returns {Promise<Object|null>} - Profile record
 */
export async function getUserProfile(userId) {
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, company_name, role, status, avatar_url, editor_title, username, created_at')
      .eq('id', userId)
      .maybeSingle();

    if (!error && data) {
      return data;
    }

    if (error) {
      console.warn('[AuthUtils] Warning fetching user profile from DB:', error.message || error);
    }
  } catch (err) {
    console.warn('[AuthUtils] Exception reading profiles table:', err);
  }

  // Fallback: Check if active session user matches and construct a fallback profile
  try {
    const session = await getSession();
    if (session?.user && session.user.id === userId) {
      const u = session.user;
      const meta = u.user_metadata || {};
      const appMeta = u.app_metadata || {};

      // SECURITY: Only trust app_metadata (set by server) or configured admin emails.
      // NEVER trust user_metadata for admin privileges, as users can modify it via devtools!
      let resolvedRole = (appMeta.role || '').toLowerCase().trim();
      if (!resolvedRole) {
        if (isConfiguredAdminEmail(u.email)) {
          resolvedRole = 'admin';
        } else {
          resolvedRole = 'client';
        }
      }

      let resolvedStatus = 'approved';

      const fallbackProfile = {
        id: u.id,
        full_name: meta.full_name || meta.name || (u.email ? u.email.split('@')[0] : 'User'),
        email: u.email || '',
        phone: meta.phone || null,
        company_name: meta.company_name || null,
        role: resolvedRole,
        status: resolvedStatus,
        avatar_url: meta.avatar_url || meta.picture || null,
        editor_title: meta.editor_title || null,
        username: meta.username || (u.email ? u.email.split('@')[0] : 'user'),
        created_at: u.created_at || new Date().toISOString(),
        _isFallback: true,
      };

      // Persist the missing profile to public.profiles table so it exists in SQL
      try {
        // SECURITY FIX: Omit role and status from client-side upsert to prevent privilege escalation
        supabase.from('profiles').upsert({
          id: fallbackProfile.id,
          full_name: fallbackProfile.full_name,
          email: fallbackProfile.email,
          username: fallbackProfile.username,
        }).then(() => {});
      } catch (_) {}

      return fallbackProfile;
    }
  } catch (fallbackErr) {
    console.warn('[AuthUtils] Fallback profile construction failed:', fallbackErr);
  }

  return null;
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
 * Check if the given profile, role string, or user object is Admin.
 * SECURITY NOTICE: Only checks database role, server-controlled app_metadata, or configured admin emails.
 * Client-writable user_metadata is intentionally ignored to prevent privilege escalation via DevTools.
 */
export function isAdmin(profileOrRoleOrUser) {
  if (!profileOrRoleOrUser) return false;

  if (typeof profileOrRoleOrUser === 'string') {
    return profileOrRoleOrUser.toLowerCase().trim() === 'admin';
  }

  // 1. Check verified database record role (from public.profiles)
  const role = (profileOrRoleOrUser.role || '').toLowerCase().trim();
  if (role === 'admin') return true;

  // 2. Check server-controlled app_metadata (users CANNOT modify app_metadata from client)
  const appMetaRole = (
    profileOrRoleOrUser.app_metadata?.role ||
    profileOrRoleOrUser.raw_app_meta_data?.role ||
    ''
  ).toLowerCase().trim();
  if (appMetaRole === 'admin' || profileOrRoleOrUser.app_metadata?.is_admin === true) {
    return true;
  }

  // 3. Check configured admin email whitelist
  const email = profileOrRoleOrUser.email || '';
  if (isConfiguredAdminEmail(email)) return true;

  return false;
}


/**
 * Check if the given profile or role string is Editor.
 */
export function isEditor(profileOrRole) {
  if (!profileOrRole) return false;
  const role = typeof profileOrRole === 'string' ? profileOrRole : profileOrRole?.role;
  return (role || '').toLowerCase().trim() === 'editor';
}

/**
 * Check if the given profile or role string is Client.
 */
export function isClient(profileOrRole) {
  if (!profileOrRole) return false;
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

