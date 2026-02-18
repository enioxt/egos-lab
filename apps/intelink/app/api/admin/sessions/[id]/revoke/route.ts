/**
 * Admin API - Revoke Session
 * 
 * POST /api/admin/sessions/[id]/revoke
 * 
 * Revokes a specific session
 * Requires super_admin role
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
    verifySession,
    revokeSession,
    getAccessTokenFromRequest,
    logSessionRevoked,
} from '@/lib/auth';

const getSupabase = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createClient(supabaseUrl, supabaseKey);
};

// Verify admin via legacy or new auth system
async function verifyAdmin(request: NextRequest): Promise<{ valid: boolean; memberId?: string; memberName?: string }> {
    const supabase = getSupabase();

    // Try new auth system first
    const accessToken = getAccessTokenFromRequest(request);
    if (accessToken) {
        const authResult = await verifySession(accessToken);
        if (authResult.success && authResult.member) {
            const isAdmin = ['super_admin', 'unit_admin'].includes(authResult.member.systemRole);
            return { valid: isAdmin, memberId: authResult.member.id, memberName: authResult.member.name };
        }
    }

    // Fallback to legacy system
    const legacyToken = request.cookies.get('intelink_session')?.value;
    if (legacyToken) {
        const { data: session } = await supabase
            .from('intelink_sessions')
            .select('member_id')
            .eq('access_token', legacyToken)
            .gt('token_expires_at', new Date().toISOString())
            .single();

        if (session?.member_id) {
            const { data: member } = await supabase
                .from('intelink_unit_members')
                .select('id, name, system_role')
                .eq('id', session.member_id)
                .single();

            if (member) {
                const isAdmin = ['super_admin', 'unit_admin'].includes(member.system_role || '');
                return { valid: isAdmin, memberId: member.id, memberName: member.name };
            }
        }
    }

    return { valid: false };
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: sessionId } = await params;

        // Verify admin access (supports both auth systems)
        const auth = await verifyAdmin(request);
        if (!auth.valid) {
            return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
        }

        // Revoke session
        const success = await revokeSession(sessionId, `Revoked by admin: ${auth.memberName}`);

        if (!success) {
            return NextResponse.json({ success: false, error: 'Erro ao revogar sessão' }, { status: 500 });
        }

        // Log action
        if (auth.memberId) {
            await logSessionRevoked(auth.memberId, sessionId, 'Admin revocation');
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('[Admin] Revoke error:', error);
        return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
    }
}
