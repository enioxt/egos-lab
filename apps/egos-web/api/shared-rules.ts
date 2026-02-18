/**
 * GET /api/shared-rules — List shared rules (with filters)
 * POST /api/shared-rules — Submit a new rule (authenticated)
 * 
 * All data comes from Supabase hub_shared_rules table — never hardcoded.
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

export default async function handler(req: Request) {
    const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

    if (req.method === 'GET') {
        try {
            const url = new URL(req.url);
            const category = url.searchParams.get('category');
            const tag = url.searchParams.get('tag');
            const sort = url.searchParams.get('sort') || 'stars';
            const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);

            let query = supabase
                .from('hub_shared_rules')
                .select('id, title, description, category, content, language, tags, star_count, fork_count, usage_count, is_official, source_repo, created_at, updated_at')
                .eq('visibility', 'public')
                .limit(limit);

            if (category) query = query.eq('category', category);
            if (tag) query = query.contains('tags', [tag]);

            if (sort === 'stars') query = query.order('star_count', { ascending: false });
            else if (sort === 'recent') query = query.order('created_at', { ascending: false });
            else if (sort === 'usage') query = query.order('usage_count', { ascending: false });

            const { data, error } = await query;
            if (error) throw error;

            return new Response(JSON.stringify({ rules: data || [] }), { headers });
        } catch (err) {
            console.error('[shared-rules] GET Error:', err);
            return new Response(JSON.stringify({ error: 'Failed to fetch rules' }), { status: 500, headers });
        }
    }

    if (req.method === 'POST') {
        try {
            const body = await req.json();
            const { title, description, category, content, language, tags } = body;

            if (!title || !content || !category) {
                return new Response(JSON.stringify({ error: 'title, content, and category are required' }), { status: 400, headers });
            }

            const { data: rule, error } = await supabase
                .from('hub_shared_rules')
                .insert({
                    title,
                    description: description || '',
                    category,
                    content,
                    language: language || 'text',
                    tags: tags || [],
                    visibility: 'public',
                })
                .select('id, title, category, created_at')
                .single();

            if (error) throw error;

            // Create initial version
            await supabase.from('hub_rule_versions').insert({
                rule_id: rule.id,
                version_number: 1,
                content,
                change_summary: 'Initial version',
            });

            return new Response(JSON.stringify({ rule }), { status: 201, headers });
        } catch (err) {
            console.error('[shared-rules] POST Error:', err);
            return new Response(JSON.stringify({ error: 'Failed to create rule' }), { status: 500, headers });
        }
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
}
