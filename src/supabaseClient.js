/**
 * Supabase Client Entry Point (Backwards Compatibility Layer)
 * Re-exports the singleton browser client from src/lib/supabase/client.js.
 * Preserves 100% compatibility with existing dashboard and auth pages.
 */
import { supabase } from './lib/supabase/client';

export { supabase };
export default supabase;
