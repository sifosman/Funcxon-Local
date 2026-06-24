import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isPlaceholder =
  !SUPABASE_URL ||
  SUPABASE_URL.includes('placeholder') ||
  !SUPABASE_ANON_KEY ||
  SUPABASE_ANON_KEY === 'placeholder';

let supabase: SupabaseClient;

if (isPlaceholder) {
  console.warn('[Supabase] Missing or placeholder credentials. Using dummy client — Supabase features will be unavailable.');
  // Dummy client to prevent runtime crashes
  supabase = createClient('http://localhost:54321', 'dummy-key', {
    auth: { autoRefreshToken: false, persistSession: false },
  });
} else {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export { supabase, SUPABASE_URL };
