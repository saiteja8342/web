import { getSession, getUserProfile, signOutUser, isAdmin, isGoogleUser } from '../auth/authUtils';
import { supabase } from '../supabase/client';

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
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session || !session.user) {
      if (typeof window !== 'undefined' && finalRedirect) {
        window.location.href = finalRedirect;
      }
      return { authorized: false, session: null, profile: null };
    }

    let profile = await getUserProfile(session.user.id);
    const userIsAdmin = isAdmin(profile) || isAdmin(session.user);
    const userIsGoogle = isGoogleUser(session.user);

    if (!profile) {
      if (userIsAdmin) {
        profile = {
          id: session.user.id,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name || 'Administrator',
          role: 'admin',
          status: 'approved',
          username: session.user.user_metadata?.username || 'admin',
        };
      } else {
        // Auto-provision client profile for authenticated user so they can enter immediately
        const meta = session.user.user_metadata || {};
        profile = {
          id: session.user.id,
          email: session.user.email,
          full_name: meta.full_name || meta.name || (session.user.email ? session.user.email.split('@')[0] : 'User'),
          role: 'client',
          status: 'approved',
          username: meta.username || (session.user.email ? session.user.email.split('@')[0] : 'user'),
        };
        // Persist to profiles table in background
        try {
          // SECURITY FIX: Omit role and status from client-side upsert to prevent privilege escalation
          const { role: _r, status: _s, ...safeProfile } = profile;
          supabase.from('profiles').upsert(safeProfile).then(() => {});
        } catch (_) {}
      }
    }

    let userRole = userIsAdmin ? 'admin' : (profile.role || '').toLowerCase().trim();
    let userStatus = (profile.status || '').toLowerCase().trim();

    // ─── INSTANT ACCESS WITHOUT ADMIN APPROVAL ──────────────────────
    // All newly registered clients can enter the Client Dashboard immediately.
    // Only accounts that were explicitly suspended/declined by an administrator are blocked.
    if (!userIsAdmin) {
      if (userStatus === 'rejected') {
        // Suspended or blocked by administrator: deny access!
        await signOutUser();
        if (typeof window !== 'undefined') {
          window.location.href = '/login?status=rejected';
        }
        return { authorized: false, session: null, profile };
      }

      // If pending or unset, auto-approve client user
      if (userStatus !== 'approved') {
        userStatus = 'approved';
        profile.status = 'approved';

        // Synchronize basic profile info to database in the background
        try {
          // SECURITY FIX: Prevent client code from setting role or status directly in database
          supabase
            .from('profiles')
            .upsert({
              id: session.user.id,
              full_name: profile.full_name || session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Client',
              email: session.user.email,
              avatar_url: profile.avatar_url || session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || null,
            })
            .then(() => {})
            .catch((uErr) => console.warn('[AuthGuard] Client profile sync notice:', uErr));
        } catch (_) {
          // ignore
        }
      }
    }


    // Check specific role requirement
    if (requiredRole) {
      const normalizedRequired = requiredRole.toLowerCase().trim();
      if (userRole !== normalizedRequired && !userIsAdmin) {
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

