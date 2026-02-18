import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withSecurity, AuthContext } from '@/lib/api-security';

/**
 * API Route to fetch entity details by ID
 * Uses SERVICE_ROLE_KEY to bypass RLS
 * Required because UnifiedEntityModal runs client-side where RLS blocks reads
 */

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function handleGet(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        // Extract ID from URL
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        const entityId = pathParts[pathParts.indexOf('entities') + 1];
        
        if (!entityId) {
            return NextResponse.json({ error: 'Entity ID required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('intelink_entities')
            .select(`
                id, name, type, metadata, investigation_id, created_at,
                source_type, source_document_id, source_context,
                intelink_investigations(id, title),
                source_doc:intelink_documents!intelink_entities_source_document_id_fkey(id, title)
            `)
            .eq('id', entityId)
            .single();

        if (error) {
            console.error('[API /entities/:id] Error:', error);
            return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
        }

        return NextResponse.json({ 
            entity: {
                id: data.id,
                name: data.name,
                type: data.type,
                metadata: data.metadata || {},
                investigation_id: data.investigation_id,
                investigation_title: (data.intelink_investigations as any)?.title,
                source_type: data.source_type,
                source_document_id: data.source_document_id,
                source_document_name: (data.source_doc as any)?.title,
                source_context: data.source_context,
                created_at: data.created_at,
            }
        });

    } catch (error) {
        console.error('[API /entities/:id] Error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// Protected: Only authenticated users (member+) can fetch entity details
export const GET = withSecurity(handleGet, { requiredRole: 'member' });
