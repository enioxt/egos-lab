import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, successResponse, errorResponse, validationError, notFoundError } from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';

async function handleGet(request: NextRequest, auth: AuthContext): Promise<NextResponse> {
    const { searchParams } = new URL(request.url);
    const investigationId = searchParams.get('investigation_id');

    if (!investigationId) {
        return validationError('investigation_id é obrigatório');
    }

    try {
        const supabase = getSupabaseAdmin();
        
        // Fetch investigation
        const { data: investigation, error: invError } = await supabase
            .from('intelink_investigations')
            .select('*')
            .eq('id', investigationId)
            .single();

        if (invError || !investigation) {
            return notFoundError('Operação');
        }

        // Fetch all data in parallel (using simple queries to avoid FK JOIN issues)
        const [entitiesRes, relationshipsRes, evidenceRes] = await Promise.all([
            supabase.from('intelink_entities').select('*').eq('investigation_id', investigationId).order('created_at', { ascending: false }),
            supabase.from('intelink_relationships').select('*').eq('investigation_id', investigationId).order('created_at', { ascending: false }),
            supabase.from('intelink_evidence').select('*').eq('investigation_id', investigationId).order('created_at', { ascending: false })
        ]);

        // Build entity map for relationship enrichment
        const entities = entitiesRes.data || [];
        const entityMap = new Map(entities.map(e => [e.id, { id: e.id, name: e.name, type: e.type }]));

        // Enrich relationships with source/target info
        const relationships = (relationshipsRes.data || []).map(rel => ({
            ...rel,
            source: entityMap.get(rel.source_id) || { id: rel.source_id, name: 'Desconhecido', type: 'UNKNOWN' },
            target: entityMap.get(rel.target_id) || { id: rel.target_id, name: 'Desconhecido', type: 'UNKNOWN' }
        }));

        return successResponse({
            investigation,
            entities,
            relationships,
            evidence: evidenceRes.data || []
        });

    } catch (error: any) {
        console.error('[API/History] Error:', error);
        return errorResponse(error.message || 'Erro ao buscar histórico');
    }
}

// Protected: Only member+ can access investigation history
export const GET = withSecurity(handleGet, { requiredRole: 'member' });
