/**
 * GET /api/intelink/alerts
 * 
 * Retorna alertas cross-case para uma operação ou todos pendentes
 * 
 * CORRIGIDO: Usa tabela correta 'intelink_cross_case_alerts' com schema atualizado
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';

async function handleGet(request: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const searchParams = request.nextUrl.searchParams;
        const investigationId = searchParams.get('investigation_id');

        // Query the correct table with correct column names
        let query = supabase
            .from('intelink_cross_case_alerts')
            .select(`
                id,
                entity_a_id,
                entity_b_id,
                match_type,
                match_reason,
                similarity_score,
                status,
                severity,
                created_at,
                reviewed_at,
                reviewed_by,
                investigation_a_id,
                investigation_b_id,
                inv_a:intelink_investigations!intelink_cross_case_alerts_investigation_a_id_fkey(id, title, deleted_at),
                inv_b:intelink_investigations!intelink_cross_case_alerts_investigation_b_id_fkey(id, title, deleted_at),
                entity_a:intelink_entities!intelink_cross_case_alerts_entity_a_id_fkey(id, name, type),
                entity_b:intelink_entities!intelink_cross_case_alerts_entity_b_id_fkey(id, name, type),
                reviewer:intelink_unit_members!intelink_cross_case_alerts_reviewed_by_fkey(id, name)
            `)
            .order('similarity_score', { ascending: false })
            .order('created_at', { ascending: false });

        // Filter by investigation if provided
        if (investigationId) {
            query = query.or(`investigation_a_id.eq.${investigationId},investigation_b_id.eq.${investigationId}`);
        }

        // Default to pending only
        const statusFilter = searchParams.get('status');
        if (!statusFilter || statusFilter === 'pending') {
            query = query.eq('status', 'pending');
        } else if (statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
        }

        const { data, error } = await query.limit(50);

        if (error) {
            console.error('Alerts query error:', error);
            return NextResponse.json({ alerts: [], error: error.message }, { status: 200 });
        }

        // FILTER OUT alerts from deleted investigations
        // An investigation is deleted if inv_a or inv_b is null (FK failed) or has deleted_at set
        const activeAlerts = (data || []).filter((alert: any) => {
            // If either investigation reference is missing, skip
            if (!alert.inv_a || !alert.inv_b) return false;
            // If either investigation is soft-deleted, skip
            if (alert.inv_a.deleted_at || alert.inv_b.deleted_at) return false;
            return true;
        });

        // Transform to expected format for CrossCaseAlertsPanel
        const transformedAlerts = activeAlerts.map((alert: any) => ({
            id: alert.id,
            entity_name: alert.entity_a?.name || 'Entidade',
            entity_type: alert.entity_a?.type || 'PERSON',
            match_type: alert.match_type,
            confidence: parseFloat(alert.similarity_score) || 0,
            description: alert.match_reason || `Match de ${alert.match_type} entre operações`,
            status: alert.status,
            severity: alert.severity || getSeverity(parseFloat(alert.similarity_score) || 0),
            created_at: alert.created_at,
            reviewed_at: alert.reviewed_at,
            reviewed_by: alert.reviewed_by,
            reviewer_name: alert.reviewer?.name || null,
            source_investigation_id: alert.investigation_a_id,
            target_investigation_id: alert.investigation_b_id,
            source_inv: alert.inv_a,
            target_inv: alert.inv_b
        }));

        return NextResponse.json({ alerts: transformedAlerts });
    } catch (error) {
        console.error('Alerts API error:', error);
        return NextResponse.json({ alerts: [], error: String(error) }, { status: 200 });
    }
}

function getSeverity(confidence: number): string {
    if (confidence >= 0.95) return 'critical';
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
}

// Protected: Only member+ can view alerts
export const GET = withSecurity(handleGet, { requiredRole: 'member' });
