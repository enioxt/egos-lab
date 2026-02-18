/**
 * Auth v2.0 - Approve/Reject Access Request
 * 
 * POST /api/v2/auth/approve-access
 * 
 * Admin endpoint to approve or reject access requests.
 * Creates member if approved.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { generateAccessCode } from '@/lib/auth';

// ============================================================================
// VALIDATION
// ============================================================================

const approveSchema = z.object({
    requestId: z.string().min(8), // Can be partial UUID
    action: z.enum(['approve', 'reject']),
    name: z.string().optional(),
    role: z.string().optional().default('Visitante'),
    unitId: z.string().uuid().optional(),
    notes: z.string().optional(),
    adminId: z.string().uuid().optional(), // For API calls
});

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

const getSupabase = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createClient(supabaseUrl, supabaseKey);
};

// ============================================================================
// TELEGRAM NOTIFICATION
// ============================================================================

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN_INTELINK;

async function notifyRequester(phone: string, approved: boolean, accessCode?: string): Promise<boolean> {
    if (!TELEGRAM_BOT_TOKEN) return false;

    // Try to find the requester's telegram chat ID (unlikely for new users)
    // For now, we'll skip this - user will just try to login again
    return true;
}

// ============================================================================
// HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = approveSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: 'Dados inválidos', details: validation.error.issues },
                { status: 400 }
            );
        }

        const { requestId, action, name, role, unitId, notes, adminId } = validation.data;
        const supabase = getSupabase();

        // Find the request (supports partial UUID)
        const { data: accessRequest, error: findError } = await supabase
            .from('intelink_access_requests')
            .select('*')
            .ilike('id', `${requestId}%`)
            .eq('status', 'pending')
            .single();

        if (findError || !accessRequest) {
            return NextResponse.json(
                { success: false, error: 'Solicitação não encontrada ou já processada' },
                { status: 404 }
            );
        }

        if (action === 'reject') {
            // Update request status
            await supabase
                .from('intelink_access_requests')
                .update({
                    status: 'rejected',
                    reviewed_by: adminId || null,
                    reviewed_at: new Date().toISOString(),
                    notes: notes || null,
                })
                .eq('id', accessRequest.id);

            return NextResponse.json({
                success: true,
                message: 'Solicitação rejeitada.',
                phone: accessRequest.phone,
            });
        }

        // APPROVE - Create member
        const accessCode = generateAccessCode();
        
        // Get default unit if not provided
        let memberUnitId = unitId;
        if (!memberUnitId) {
            const { data: defaultUnit } = await supabase
                .from('intelink_units')
                .select('id')
                .limit(1)
                .single();
            memberUnitId = defaultUnit?.id;
        }

        // Create member
        const { data: newMember, error: memberError } = await supabase
            .from('intelink_unit_members')
            .insert({
                name: name || accessRequest.name || 'Novo Usuário',
                phone: accessRequest.phone,
                role: role || 'Visitante',
                system_role: 'visitor',
                unit_id: memberUnitId,
                access_code: accessCode,
                access_code_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
            })
            .select('id')
            .single();

        if (memberError) {
            console.error('[ApproveAccess] Member creation error:', memberError);
            return NextResponse.json(
                { success: false, error: 'Erro ao criar membro' },
                { status: 500 }
            );
        }

        // Update request status
        await supabase
            .from('intelink_access_requests')
            .update({
                status: 'approved',
                reviewed_by: adminId || null,
                reviewed_at: new Date().toISOString(),
                notes: notes || null,
                created_member_id: newMember.id,
            })
            .eq('id', accessRequest.id);

        return NextResponse.json({
            success: true,
            message: 'Acesso aprovado! Usuário criado.',
            phone: accessRequest.phone,
            accessCode,
            memberId: newMember.id,
        });

    } catch (error) {
        console.error('[ApproveAccess] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Erro interno' },
            { status: 500 }
        );
    }
}
