import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, validationError } from '@/lib/api-utils';
import { withSecurity, SecureContext } from '@/lib/security/middleware';

/**
 * GET /api/rho/alerts
 * 
 * Returns Rho alerts for an investigation
 */
async function handler(req: NextRequest, context: SecureContext) {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);
    
    const investigationId = searchParams.get('investigation_id');
    const unacknowledgedOnly = searchParams.get('unacknowledged') === 'true';

    if (!investigationId) {
        return validationError('investigation_id é obrigatório');
    }

    let query = supabase
        .from('intelink_rho_alerts')
        .select('*')
        .eq('investigation_id', investigationId)
        .order('created_at', { ascending: false })
        .limit(50);

    if (unacknowledgedOnly) {
        query = query.eq('is_acknowledged', false);
    }

    const { data: alerts, error } = await query;

    if (error) {
        // Table might not exist yet
        console.warn('[Rho Alerts] Query error:', error);
        return NextResponse.json({ alerts: [] });
    }

    return NextResponse.json({ 
        alerts: alerts || [],
        count: alerts?.length || 0
    });
}

export const GET = withSecurity(handler, {
    auth: false, // Frontend widget
    rateLimit: 'default'
});
