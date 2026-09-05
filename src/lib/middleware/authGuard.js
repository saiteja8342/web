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
export async function checkRouteAuth({ requiredRole = null, redirectOnFail = null } = {}) {
  const defaultRedirect = (requiredRole && requiredRole.toLowerCase().trim() === 'admin') ? '/admin/login' : '/login';
  const finalRedirect = redirectOnFail || defaultRedirect;

  try {
    const session = await getSession();

    if (!session || !session.user) {
      if (typeof window !== 'undefined' && finalRedirect) {
        window.location.href = finalRedirect;
      }
      return { authorized: false, session: null, profile: null };
    }

    const profile = await getUserProfile(session.user.id);
    if (!profile) {
      if (typeof window !== 'undefined' && finalRedirect) {
        window.location.href = finalRedirect;
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

      // STRICT RULE: Only sessions from /admin/login can access the admin dashboard
      if (normalizedRequired === 'admin') {
        const authOrigin = typeof window !== 'undefined'
          ? (sessionStorage.getItem('mne_admin_auth_origin') || localStorage.getItem('mne_admin_auth_origin'))
          : null;

        if (authOrigin !== 'admin/login') {
          console.warn('[AuthGuard] Access blocked: Admin dashboard requires authentication via /admin/login');
          await signOutUser();
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('mne_admin_auth_origin');
            localStorage.removeItem('mne_admin_auth_origin');
            window.location.href = '/admin/login?notice=portal_required';
          }
          return { authorized: false, session: null, profile: null };
        }
      }
    }

    return { authorized: true, session, profile };
  } catch (error) {
    console.error('[AuthGuard] Error during authentication guard check:', error);
    if (typeof window !== 'undefined' && finalRedirect) {
      window.location.href = finalRedirect;
    }
    return { authorized: false, session: null, profile: null };
  }
}
