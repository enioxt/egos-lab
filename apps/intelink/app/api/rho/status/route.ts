import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, validationError, notFoundError } from '@/lib/api-utils';
import { withSecurity, SecureContext } from '@/lib/security/middleware';

/**
 * GET /api/rho/status
 * 
 * Returns the current Rho status for an investigation
 */
async function handler(req: NextRequest, context: SecureContext) {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);
    const investigationId = searchParams.get('investigation_id');

    if (!investigationId) {
        return validationError('investigation_id é obrigatório');
    }

    // Get investigation with Rho data
    const { data: investigation, error: invError } = await supabase
        .from('intelink_investigations')
        .select(`
            id,
            title,
            rho_score,
            rho_status,
            rho_calculated_at
        `)
        .eq('id', investigationId)
        .single();

    if (invError || !investigation) {
        return notFoundError('Investigação');
    }

    // Get entity and relationship counts
    const { count: entityCount } = await supabase
        .from('intelink_entities')
        .select('*', { count: 'exact', head: true })
        .eq('investigation_id', investigationId);

    const { count: relationshipCount } = await supabase
        .from('intelink_relationships')
        .select('*', { count: 'exact', head: true })
        .eq('investigation_id', investigationId);

    // Get top contributor if Rho is calculated
    let topContributor = null;
    if (investigation.rho_score !== null) {
        const { data: topEntity } = await supabase
            .from('intelink_entities')
            .select('name, centrality_metrics')
            .eq('investigation_id', investigationId)
            .not('centrality_metrics', 'is', null)
            .order('centrality_metrics->pagerank', { ascending: false })
            .limit(1)
            .single();

        if (topEntity) {
            topContributor = topEntity.name;
        }
    }

    return NextResponse.json({
        rho_score: investigation.rho_score,
        rho_status: investigation.rho_status || 'unknown',
        rho_calculated_at: investigation.rho_calculated_at,
        total_entities: entityCount || 0,
        total_relationships: relationshipCount || 0,
        top_contributor: topContributor
    });
}

// NOTE: This is a read-only endpoint called by frontend widgets
// Auth is handled by the session cookie, not the middleware
export const GET = withSecurity(handler, {
    auth: false,
    rateLimit: 'default'
});
