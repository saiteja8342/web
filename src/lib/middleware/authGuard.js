import { getSession, getUserProfile, signOutUser } from '../auth/authUtils';

/**
 * Client Navigation & Route Permission Guard
 * Checks session, account approval status, and role validity for protected dashboard routes.
 *
 * @param {Object} options
 * @param {string} [options.requiredRole] - Expected role ('admin' | 'editor' | 'client')
 * @param {string} [options.redirectOnFail] - URL to redirect to if unauthorized (default: '/login')
 * @returns {Promise<{authorized: boolean, session: Object|null, profile: Object|null}>}
 */
export async function checkRouteAuth({ requiredRole = null, redirectOnFail = '/login' } = {}) {
  try {
    const session = await getSession();

    if (!session || !session.user) {
      if (typeof window !== 'undefined' && redirectOnFail) {
        window.location.href = redirectOnFail;
      }
      return { authorized: false, session: null, profile: null };
    }

    const profile = await getUserProfile(session.user.id);
    if (!profile) {
      if (typeof window !== 'undefined' && redirectOnFail) {
        window.location.href = redirectOnFail;
      }
      return { authorized: false, session, profile: null };
    }

    const userRole = (profile.role || '').toLowerCase().trim();
    const userStatus = (profile.status || '').toLowerCase().trim();

    // Block non-admins if account is pending approval
    if (userRole !== 'admin' && userStatus === 'pending') {
      await signOutUser();
      if (typeof window !== 'undefined') {
        window.location.href = '/login?status=pending';
      }
      return { authorized: false, session: null, profile };
    }

    // Block non-admins if account was rejected
    if (userRole !== 'admin' && userStatus === 'rejected') {
      await signOutUser();
      if (typeof window !== 'undefined') {
        window.location.href = '/login?status=rejected';
      }
      return { authorized: false, session: null, profile };
    }

    // Check specific role requirement
    if (requiredRole) {
      const normalizedRequired = requiredRole.toLowerCase().trim();
      if (userRole !== normalizedRequired && userRole !== 'admin') {
        console.warn(`[AuthGuard] Access denied: User role "${userRole}" does not match required "${requiredRole}"`);
        if (typeof window !== 'undefined') {
          // Route user to their own valid dashboard instead of unauthorized page
          if (userRole === 'editor') {
            window.location.href = '/dashboard/editor';
          } else {
            window.location.href = '/dashboard/client';
          }
        }
        return { authorized: false, session, profile };
      }
    }

    return { authorized: true, session, profile };
  } catch (error) {
    console.error('[AuthGuard] Error during authentication guard check:', error);
    if (typeof window !== 'undefined' && redirectOnFail) {
      window.location.href = redirectOnFail;
    }
    return { authorized: false, session: null, profile: null };
  }
}
