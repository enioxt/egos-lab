/**
 * API para Alertas Cross-Case
 * GET: Listar alertas pendentes
 * PATCH: Atualizar status de um alerta
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
    getSupabaseAdmin, 
    successResponse, 
    errorResponse, 
    validationError,
    parseIntSafe 
} from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';

async function handleGet(request: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(request.url);
        const investigationId = searchParams.get('inv');
        const status = searchParams.get('status') || 'pending';
        const limit = parseIntSafe(searchParams.get('limit'), 20);

        // Query com JOINs para trazer títulos e filtrar deletados
        let query = supabase
            .from('intelink_cross_case_alerts')
            .select(`
                *,
                inv_a:investigation_a_id(id, title, deleted_at),
                inv_b:investigation_b_id(id, title, deleted_at),
                entity_a:entity_a_id(id, name, type),
                entity_b:entity_b_id(id, name, type)
            `)
            .order('similarity_score', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(limit);

        // Filter by status
        if (status !== 'all') {
            query = query.eq('status', status);
        }

        // Filter by investigation
        if (investigationId) {
            query = query.or(`investigation_a_id.eq.${investigationId},investigation_b_id.eq.${investigationId}`);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Filtrar alertas onde uma das investigações foi deletada
        const validAlerts = data?.filter((alert: any) => {
            const invADeleted = alert.inv_a?.deleted_at !== null && alert.inv_a?.deleted_at !== undefined;
            const invBDeleted = alert.inv_b?.deleted_at !== null && alert.inv_b?.deleted_at !== undefined;
            return !invADeleted && !invBDeleted;
        }) || [];

        // Enrich with severity
        const enrichedAlerts = validAlerts.map((alert: any) => ({
            ...alert,
            severity: getSeverity(alert.similarity_score)
        }));

        return successResponse({
            count: enrichedAlerts.length,
            alerts: enrichedAlerts
        });

    } catch (error: any) {
        console.error('[Cross-Case Alerts API] GET error:', error);
        return errorResponse(error.message || 'Erro ao buscar alertas');
    }
}

async function handlePatch(request: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const body = await request.json();
        const { alertId, status, notes } = body;

        if (!alertId || !status) {
            return validationError('alertId e status são obrigatórios');
        }

        const validStatuses = ['pending', 'confirmed', 'dismissed', 'investigating'];
        if (!validStatuses.includes(status)) {
            return validationError(`status inválido. Use: ${validStatuses.join(', ')}`);
        }

        const updateData: any = { status };
        if (notes) updateData.notes = notes;
        if (status === 'confirmed' || status === 'dismissed') {
            updateData.resolved_at = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('intelink_cross_case_alerts')
            .update(updateData)
            .eq('id', alertId)
            .select()
            .single();

        if (error) throw error;

        return successResponse({ alert: data });

    } catch (error: any) {
        console.error('[Cross-Case Alerts API] PATCH error:', error);
        return errorResponse(error.message || 'Erro ao atualizar alerta');
    }
}

// POST handler - trigger cross-case analysis (called after document upload)
async function handlePost(request: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const body = await request.json();
        const { investigation_id, trigger } = body;

        if (!investigation_id) {
            return validationError('investigation_id é obrigatório');
        }

        // Log the trigger
        console.log(`[Cross-Case] Triggered by ${trigger} for investigation ${investigation_id}`);

        // The actual cross-case analysis is done by a database trigger
        // This endpoint just acknowledges the request
        return successResponse({
            triggered: true,
            investigation_id,
            message: 'Análise cross-case iniciada em background'
        });

    } catch (error: any) {
        console.error('[Cross-Case Alerts API] POST error:', error);
        return errorResponse(error.message || 'Erro ao iniciar análise');
    }
}

// Protected: Only member+ can access cross-case alerts
export const GET = withSecurity(handleGet, { requiredRole: 'member' });
export const POST = withSecurity(handlePost, { requiredRole: 'member' });
export const PATCH = withSecurity(handlePatch, { requiredRole: 'member' });

function getSeverity(confidence: number): string {
    if (confidence >= 0.95) return 'critical';
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
}
