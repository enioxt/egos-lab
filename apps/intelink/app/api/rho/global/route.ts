import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/api-utils';
import { withSecurity, SecureContext } from '@/lib/security/middleware';

/**
 * GET /api/rho/global
 * 
 * Returns global Rho statistics across all investigations
 */
async function handler(req: NextRequest, context: SecureContext) {
    const supabase = getSupabaseAdmin();

    // Get all investigations with Rho data
    const { data: investigations, error } = await supabase
        .from('intelink_investigations')
        .select(`
            id,
            title,
            rho_score,
            rho_status,
            unit_id,
            intelink_police_units (
                name
            )
        `)
        .order('title');

    if (error) {
        console.error('[Rho Global] Query error:', error);
        return NextResponse.json({ investigations: [], stats: null });
    }

    // Get entity and relationship counts for each investigation
    const investigationsWithCounts = await Promise.all(
        (investigations || []).map(async (inv) => {
            const { count: entityCount } = await supabase
                .from('intelink_entities')
                .select('*', { count: 'exact', head: true })
                .eq('investigation_id', inv.id);

            const { count: relationshipCount } = await supabase
                .from('intelink_relationships')
                .select('*', { count: 'exact', head: true })
                .eq('investigation_id', inv.id);

            return {
                id: inv.id,
                title: inv.title,
                rho_score: inv.rho_score,
                rho_status: inv.rho_status || 'unknown',
                entity_count: entityCount || 0,
                relationship_count: relationshipCount || 0,
                unit_name: (inv.intelink_police_units as any)?.name || null
            };
        })
    );

    // Calculate global stats
    const calculated = investigationsWithCounts.filter(i => i.rho_score !== null);
    const stats = {
        total_investigations: investigationsWithCounts.length,
        healthy: calculated.filter(i => i.rho_status === 'healthy').length,
        warning: calculated.filter(i => i.rho_status === 'warning').length,
        critical: calculated.filter(i => i.rho_status === 'critical').length,
        extreme: calculated.filter(i => i.rho_status === 'extreme').length,
        not_calculated: investigationsWithCounts.filter(i => i.rho_score === null).length,
        avg_rho: calculated.length > 0 
            ? calculated.reduce((sum, i) => sum + (i.rho_score || 0), 0) / calculated.length 
            : 0
    };

    // Sort by rho_score (worst first), then not calculated
    investigationsWithCounts.sort((a, b) => {
        if (a.rho_score === null && b.rho_score === null) return 0;
        if (a.rho_score === null) return 1;
        if (b.rho_score === null) return -1;
        return (b.rho_score || 0) - (a.rho_score || 0);
    });

    return NextResponse.json({
        investigations: investigationsWithCounts,
        stats
    });
}

export const GET = withSecurity(handler, {
    auth: false, // Frontend dashboard
    rateLimit: 'default'
});
