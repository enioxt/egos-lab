'use client';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Singleton pattern with lazy initialization
// Using a global variable attached to window in dev to prevent multiple instances during HMR
const globalForSupabase = global as unknown as { supabase: SupabaseClient };

export function getSupabaseClient(): SupabaseClient | null {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Server-side: Always create new instance (safe)
    if (typeof window === 'undefined') {
        if (url && key) {
            return createClient(url, key);
        }
        return null;
    }
    
    // Client-side: Singleton pattern
    // Return existing instance if available
    if (globalForSupabase.supabase) {
        return globalForSupabase.supabase;
    }
    
    if (url && key) {
        const client = createClient(url, key, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        });
        
        // Save to global in dev to prevent HMR duplicates
        if (process.env.NODE_ENV !== 'production') {
            globalForSupabase.supabase = client;
        }
        
        return client;
    }
    
    return null;
}

// Alias for compatibility
export const getSupabase = getSupabaseClient;

// For components that need to check configuration
export function isSupabaseReady(): boolean {
    return typeof window !== 'undefined' && 
           !!process.env.NEXT_PUBLIC_SUPABASE_URL && 
           !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}
