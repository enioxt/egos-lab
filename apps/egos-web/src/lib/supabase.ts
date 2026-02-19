
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment variables.');
    console.warn('Supabase functionality will be disabled. Set these variables in .env (local) or your hosting provider (production) to enable.');
}

// Create a dummy client if creds are missing so imports don't crash, 
// using a fake URL that passes the URL constructor check in createClient.
const mockUrl = 'https://mock.supabase.co';
const mockKey = 'mock-key';

export const supabase = createClient(supabaseUrl || mockUrl, supabaseAnonKey || mockKey, {
    auth: {
        flowType: 'implicit',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
    },
});
