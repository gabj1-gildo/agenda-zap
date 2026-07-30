import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

// Initialize the Supabase client with the Service Role key
// This bypasses RLS, which is why we must use it ONLY on the server
// and handle all authorization checks ourselves.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || 'placeholder_key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
