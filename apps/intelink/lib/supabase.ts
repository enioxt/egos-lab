import { getSupabaseClient, isSupabaseReady } from './supabase-client';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * @deprecated Use getSupabaseClient() from '@/lib/supabase-client' instead.
 * This file is kept for compatibility.
 */
export function getSupabase(): SupabaseClient {
    const client = getSupabaseClient();
    if (!client) {
        throw new Error('Supabase environment variables not configured or not running on client side');
    }
    return client;
}

export const isSupabaseConfigured = isSupabaseReady;
