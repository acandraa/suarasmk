import { createClient } from '@supabase/supabase-js';

// We use environment variables for the Supabase URL and anonymous key.
// In a Vite project, these should be prefixed with VITE_ and placed in a .env file.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
