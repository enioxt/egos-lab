import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, validationError } from '@/lib/api-utils';
import { withSecurity, SecureContext } from '@/lib/security/middleware';

/**
 * GET /api/rho/history
 * 
 * Returns Rho Score history (snapshots) for an investigation
 */
async function handler(req: NextRequest, context: SecureContext) {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);
    
    const investigationId = searchParams.get('investigation_id');
    const limit = parseInt(searchParams.get('limit') || '30');

    if (!investigationId) {
        return validationError('investigation_id é obrigatório');
    }

    // Get snapshots with calculated_by name
    const { data: snapshots, error } = await supabase
        .from('intelink_rho_snapshots')
        .select(`
            id,
            rho_score,
            rho_status,
            total_entities,
            total_relationships,
            top_contributor_share,
            diversity_score,
            created_at,
            calculated_by,
            top_contributor:intelink_entities(name)
        `)
        .eq('investigation_id', investigationId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.warn('[Rho History] Query error:', error);
        return NextResponse.json({ snapshots: [], error: error.message });
    }

    // Format response
    const formattedSnapshots = snapshots?.map(s => ({
        id: s.id,
        rho_score: s.rho_score,
        rho_status: s.rho_status,
        total_entities: s.total_entities,
        total_relationships: s.total_relationships,
        top_contributor: (s.top_contributor as any)?.name || null,
        top_contributor_share: s.top_contributor_share,
        diversity_score: s.diversity_score,
        created_at: s.created_at
    })) || [];

    // Calculate trend
    let trend: 'improving' | 'stable' | 'worsening' | 'unknown' = 'unknown';
    if (formattedSnapshots.length >= 2) {
        const latest = formattedSnapshots[0].rho_score;
        const previous = formattedSnapshots[1].rho_score;
        
        if (latest < previous - 0.005) {
            trend = 'improving';
        } else if (latest > previous + 0.005) {
            trend = 'worsening';
        } else {
            trend = 'stable';
        }
    }

    return NextResponse.json({ 
        snapshots: formattedSnapshots,
        count: formattedSnapshots.length,
        trend
    });
}

export const GET = withSecurity(handler, {
    auth: false, // Frontend widget
    rateLimit: 'default'
});
