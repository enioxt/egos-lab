/**
 * GET /api/stats
 * 
 * Unified stats endpoint for all Intelink metrics
 * 
 * Query params:
 * - scope: 'basic' | 'central' | 'full' (default: 'basic')
 * 
 * @example GET /api/stats?scope=basic  → investigations, entities, relationships, evidence
 * @example GET /api/stats?scope=central → + units, members
 * @example GET /api/stats?scope=full → + documents, findings, alerts
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, successResponse, errorResponse } from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';

async function handleGet(request: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(request.url);
        const scope = searchParams.get('scope') || 'basic';
        
        // Basic stats (always included)
        const basicPromises = [
            supabase.from('intelink_investigations').select('*', { count: 'exact', head: true }).is('deleted_at', null),
            supabase.from('intelink_entities').select('*', { count: 'exact', head: true }),
            supabase.from('intelink_relationships').select('*', { count: 'exact', head: true }),
            supabase.from('intelink_evidence').select('*', { count: 'exact', head: true })
        ];

        const [
            { count: investigations },
            { count: entities },
            { count: relationships },
            { count: evidence }
        ] = await Promise.all(basicPromises);

        const stats: Record<string, number> = {
            investigations: investigations || 0,
            entities: entities || 0,
            relationships: relationships || 0,
            evidence: evidence || 0
        };

        // Central scope: add units and members
        if (scope === 'central' || scope === 'full') {
            const [
                { count: units },
                { count: members }
            ] = await Promise.all([
                supabase.from('intelink_police_units').select('*', { count: 'exact', head: true }),
                supabase.from('intelink_unit_members').select('*', { count: 'exact', head: true }).eq('active', true)
            ]);
            stats.units = units || 0;
            stats.members = members || 0;
        }

        // Full scope: add documents, findings, alerts
        if (scope === 'full') {
            const [
                { count: documents },
                { count: findings },
                { count: alerts }
            ] = await Promise.all([
                supabase.from('intelink_documents').select('*', { count: 'exact', head: true }),
                supabase.from('intelink_investigator_findings').select('*', { count: 'exact', head: true }),
                supabase.from('intelink_cross_case_alerts').select('*', { count: 'exact', head: true }).eq('status', 'pending')
            ]);
            stats.documents = documents || 0;
            stats.findings = findings || 0;
            stats.pendingAlerts = alerts || 0;
        }

        return successResponse(stats);

    } catch (e: any) {
        console.error('[Stats API] Error:', e);
        return errorResponse(e.message || 'Erro ao buscar estatísticas');
    }
}

// Protected: Only authenticated users can access stats
export const GET = withSecurity(handleGet, { requiredRole: 'visitor' });
