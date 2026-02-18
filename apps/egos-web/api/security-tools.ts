/**
 * GET /api/security-tools
 * Returns curated security tools from Supabase hub_security_tools table.
 * Dynamic — not hardcoded. Tools are managed in the database.
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

export default async function handler(req: Request) {
    if (req.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    try {
        const url = new URL(req.url);
        const category = url.searchParams.get('category');
        const recommended = url.searchParams.get('recommended');

        let query = supabase
            .from('hub_security_tools')
            .select('id, name, description, category, install_command, website_url, github_url, icon_emoji, platform, difficulty, is_recommended, sort_order')
            .order('sort_order', { ascending: true });

        if (category) query = query.eq('category', category);
        if (recommended === 'true') query = query.eq('is_recommended', true);

        const { data, error } = await query;

        if (error) throw error;

        return new Response(JSON.stringify({ tools: data || [] }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
    } catch (err) {
        console.error('[security-tools] Error:', err);
        return new Response(JSON.stringify({ error: 'Failed to fetch tools' }), { status: 500 });
    }
}
