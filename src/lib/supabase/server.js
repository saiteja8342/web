import { createClient } from '@supabase/supabase-js';

/**
 * Server-Side / Edge / Admin Supabase Client
 * 
 * CRITICAL SECURITY INSTRUCTION:
 * - This file and the SUPABASE_SERVICE_ROLE_KEY MUST NEVER be exposed or bundled to the browser.
 * - Any browser execution will throw a fatal error.
 */

// Runtime safety guard: immediately throw if invoked in a browser environment
if (typeof window !== 'undefined') {
  throw new Error(
    'CRITICAL SECURITY ERROR: Supabase server client with SUPABASE_SERVICE_ROLE_KEY cannot be executed in the browser!'
  );
}

const supabaseUrl =
  (typeof process !== 'undefined' && process.env && (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)) ||
  'https://yipfxibyzqsxqhhiwotk.supabase.co';

const supabaseServiceRoleKey =
  (typeof process !== 'undefined' && process.env && process.env.SUPABASE_SERVICE_ROLE_KEY) ||
  '';

let serverClient = null;

/**
 * Returns a server-side Supabase client with admin / service-role privileges.
 * Bypasses RLS - use only for administrative backend operations, Edge Functions, or webhooks.
 */
export function getSupabaseServerClient() {
  if (typeof window !== 'undefined') {
    throw new Error('CRITICAL SECURITY ERROR: Cannot access server client on the client-side.');
  }

  if (!supabaseServiceRoleKey) {
    console.warn(
      '[Supabase Server] Warning: SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables.'
    );
  }

  if (!serverClient && supabaseUrl && supabaseServiceRoleKey) {
    serverClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return serverClient;
}

export default getSupabaseServerClient;
