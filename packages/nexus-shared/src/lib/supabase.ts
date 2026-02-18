
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

/**
 * Lazy-initialized Supabase client.
 * Allows dotenv to load before first use.
 */
export function getSupabaseClient(): SupabaseClient {
    if (!_client) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

        if (!url || !key) {
            console.warn('[Supabase] URL or Key is missing. Check your .env file.');
        }

        _client = createClient(url, key);
    }
    return _client;
}

/**
 * @deprecated Use `getSupabaseClient()` instead.
 * Kept for backward compat — lazily creates on first property access.
 */
export const supabase = new Proxy({} as SupabaseClient, {
    get(_, prop: string) {
        return (getSupabaseClient() as any)[prop];
    },
});

/**
 * Helper to get table name with project prefix
 */
export const getTableName = (table: string) => `nexusmkt_${table}`;
