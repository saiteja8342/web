import { createClient } from '@supabase/supabase-js';

// Read Supabase credentials from Vite environment variables (NEXT_PUBLIC_ or VITE_)
const supabaseUrl =
  typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.NEXT_PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL);

const supabaseAnonKey =
  typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[Supabase] Critical Error: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
  );
}

/**
 * Singleton browser Supabase client instance.
 * Safe for client-side and browser usage with Row Level Security (RLS) policies.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export default supabase;
