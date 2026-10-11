import { supabase } from './lib/supabase/client';

/**
 * Sign in with Google using Supabase OAuth.
 * Initiates OAuth redirect to Google authentication.
 *
 * @param {Object} [options={}] - Optional OAuth parameters (e.g. redirectTo)
 * @returns {Promise<{data: any, error: any}>}
 */
export async function signInWithGoogle(options = {}) {
  const baseOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const defaultRedirect = `${baseOrigin}/dashboard/client`;
  const redirectTo = options.redirectTo || defaultRedirect;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
      ...options,
    },
  });

  return { data, error };
}

export { supabase };
export default supabase;
