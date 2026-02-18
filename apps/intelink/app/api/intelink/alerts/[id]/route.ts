/**
 * PATCH /api/intelink/alerts/[id]
 * 
 * Atualiza status de um alerta (confirm/dismiss)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withSecurity, AuthContext } from '@/lib/api-security';
import { logLinkDecision } from '@/lib/audit-service';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function handlePatch(
    request: NextRequest,
    auth: AuthContext
): Promise<NextResponse> {
    try {
        // Extract ID from URL
        const url = new URL(request.url);
        const id = url.pathname.split('/').pop();
        const body = await request.json();
        const { status } = body;

        if (!['confirmed', 'dismissed', 'pending'].includes(status)) {
            return NextResponse.json(
                { error: 'Status inválido. Use: confirmed, dismissed, ou pending' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('intelink_cross_case_alerts')
            .update({ 
                status,
                reviewed_at: status !== 'pending' ? new Date().toISOString() : null,
                reviewed_by: status !== 'pending' ? auth.memberId : null
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Alert update error:', error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        // Log audit trail
        if (status === 'confirmed' || status === 'dismissed') {
            try {
                await logLinkDecision(
                    status === 'confirmed' ? 'confirm' : 'reject',
                    {
                        id: auth.memberId,
                        name: auth.memberName || 'Usuário',
                        role: auth.systemRole
                    },
                    {
                        id: id || '',
                        source: data?.entity_a_id || 'unknown',
                        target: data?.entity_b_id || 'unknown',
                        confidence: data?.similarity_score || 0
                    }
                );
            } catch (auditErr) {
                console.error('Audit log error:', auditErr);
                // Don't fail the request if audit fails
            }
        }

        return NextResponse.json({ success: true, alert: data });
    } catch (error) {
        console.error('Alert PATCH error:', error);
        return NextResponse.json(
            { error: String(error) },
            { status: 500 }
        );
    }
}

async function handleGet(
    request: NextRequest,
    auth: AuthContext
): Promise<NextResponse> {
    try {
        // Extract ID from URL
        const url = new URL(request.url);
        const id = url.pathname.split('/').pop();

        const { data, error } = await supabase
            .from('intelink_cross_case_alerts')
            .select(`
                *,
                inv_a:intelink_investigations!intelink_cross_case_alerts_investigation_a_id_fkey(id, title),
                inv_b:intelink_investigations!intelink_cross_case_alerts_investigation_b_id_fkey(id, title),
                entity_a:intelink_entities!intelink_cross_case_alerts_entity_a_id_fkey(id, name, type),
                entity_b:intelink_entities!intelink_cross_case_alerts_entity_b_id_fkey(id, name, type)
            `)
            .eq('id', id)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }

        return NextResponse.json({ alert: data });
    } catch (error) {
        console.error('Alert GET error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

// Protected: Only member+ can manage alerts
export const PATCH = withSecurity(handlePatch, { requiredRole: 'member' });
export const GET = withSecurity(handleGet, { requiredRole: 'member' });
