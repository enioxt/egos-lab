
import { createClient } from '@supabase/supabase-js';

// These should be defined in the application's .env file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or Anon Key is missing. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Helper to get table name with project prefix
 * @param table The base table name (e.g., 'users', 'products')
 * @returns The prefixed table name (e.g., 'nexusmkt_users')
 */
export const getTableName = (table: string) => `nexusmkt_${table}`;
