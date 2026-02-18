/**
 * Compliance Justification API
 * 
 * POST /api/compliance/justify
 * - Records justification for accessing sensitive data
 * - Creates audit log entry with hash chain
 * 
 * Required for judicial compliance
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin, successResponse, errorResponse } from '@/lib/api-utils';
import { withSecurity, SecureContext } from '@/lib/security/middleware';

const justifySchema = z.object({
    case_number: z.string().min(3, 'Número do procedimento muito curto'),
    case_type: z.enum(['inquerito', 'procedimento', 'mandado', 'autorizacao', 'requisicao']),
    data_type: z.enum([
        'sigilo_bancario',
        'sigilo_fiscal',
        'sigilo_telefonico',
        'dados_medicos',
        'antecedentes',
        'interceptacao',
        'outro'
    ]),
    reason: z.string().optional(),
    entity_id: z.string().uuid().optional(),
    entity_name: z.string().optional(),
    investigation_id: z.string().uuid().optional()
});

async function handler(req: NextRequest, context: SecureContext<z.infer<typeof justifySchema>>) {
    const { body, user } = context;
    const supabase = getSupabaseAdmin();

    try {
        // Get user info
        let actorName = 'Unknown';
        let actorRole = 'unknown';
        
        if (user?.memberId) {
            const { data: member } = await supabase
                .from('intelink_unit_members')
                .select('name, system_role')
                .eq('id', user.memberId)
                .single();
            
            if (member) {
                actorName = member.name;
                actorRole = member.system_role;
            }
        }

        // Create audit log entry (will auto-hash via trigger)
        const { data: auditLog, error: auditError } = await supabase
            .from('intelink_audit_logs')
            .insert({
                action: 'SENSITIVE_DATA_ACCESS',
                actor_id: user?.memberId || 'anonymous',
                actor_name: actorName,
                actor_role: actorRole,
                target_type: body.data_type,
                target_id: body.entity_id || null,
                target_name: body.entity_name || null,
                details: {
                    case_number: body.case_number,
                    case_type: body.case_type,
                    reason: body.reason || 'Consulta para investigação',
                    investigation_id: body.investigation_id,
                    data_type: body.data_type,
                    justified_at: new Date().toISOString()
                },
                ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null,
                user_agent: req.headers.get('user-agent') || null
            })
            .select()
            .single();

        if (auditError) {
            console.error('[Compliance] Audit log error:', auditError);
            return errorResponse('Erro ao registrar justificativa');
        }

        return successResponse({
            success: true,
            audit_id: auditLog.id,
            message: 'Justificativa registrada com sucesso',
            access_granted: true
        });

    } catch (e: any) {
        console.error('[Compliance] Error:', e);
        return errorResponse(e.message || 'Erro interno');
    }
}

export const POST = withSecurity(handler, {
    auth: false, // Frontend handles auth
    rateLimit: 'default',
    validation: justifySchema
});
