import { getSession, getUserProfile } from '../auth/authUtils';

/**
 * Client Navigation & Route Permission Guard
 * Checks session and role validity for protected dashboard routes.
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

    if (requiredRole) {
      const profile = await getUserProfile(session.user.id);
      const userRole = (profile?.role || '').toLowerCase().trim();

      if (userRole !== requiredRole.toLowerCase().trim()) {
        console.warn(`[AuthGuard] Access denied: User has role "${userRole}", required "${requiredRole}"`);
        if (typeof window !== 'undefined' && redirectOnFail) {
          window.location.href = redirectOnFail;
        }
        return { authorized: false, session, profile };
      }

      return { authorized: true, session, profile };
    }

    return { authorized: true, session, profile: null };
  } catch (error) {
    console.error('[AuthGuard] Error during authentication guard check:', error);
    if (typeof window !== 'undefined' && redirectOnFail) {
      window.location.href = redirectOnFail;
    }
    return { authorized: false, session: null, profile: null };
  }
}
