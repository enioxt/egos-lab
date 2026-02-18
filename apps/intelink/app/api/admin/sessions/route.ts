/**
 * Admin API - List Sessions
 * 
 * GET /api/admin/sessions
 * 
 * Returns all sessions for admin management
 * Requires super_admin role
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
    verifySession,
    getAccessTokenFromRequest,
} from '@/lib/auth';

const getSupabase = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createClient(supabaseUrl, supabaseKey);
};

// Verify admin via legacy or new auth system
async function verifyAdmin(request: NextRequest): Promise<{ valid: boolean; memberId?: string; systemRole?: string }> {
    const supabase = getSupabase();

    // Try new auth system first
    const accessToken = getAccessTokenFromRequest(request);
    if (accessToken) {
        const authResult = await verifySession(accessToken);
        if (authResult.success && authResult.member) {
            return { 
                valid: ['super_admin', 'unit_admin'].includes(authResult.member.systemRole),
                memberId: authResult.member.id,
                systemRole: authResult.member.systemRole,
            };
        }
    }

    // Fallback to legacy system - check intelink_session cookie
    const legacyToken = request.cookies.get('intelink_session')?.value;
    if (legacyToken) {
        // Verify legacy session (column is access_token, not token)
        const { data: session } = await supabase
            .from('intelink_sessions')
            .select('member_id')
            .eq('access_token', legacyToken)
            .gt('token_expires_at', new Date().toISOString())
            .single();

        if (session?.member_id) {
            // Get member role
            const { data: member } = await supabase
                .from('intelink_unit_members')
                .select('id, system_role')
                .eq('id', session.member_id)
                .single();

            if (member) {
                return {
                    valid: ['super_admin', 'unit_admin'].includes(member.system_role || ''),
                    memberId: member.id,
                    systemRole: member.system_role,
                };
            }
        }
    }

    return { valid: false };
}

export async function GET(request: NextRequest) {
    try {
        // Verify admin access (supports both auth systems)
        const auth = await verifyAdmin(request);
        if (!auth.valid) {
            return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
        }

        const supabase = getSupabase();

        // Get sessions with member names
        const { data: sessions, error } = await supabase
            .from('auth_sessions')
            .select(`
                id,
                member_id,
                device_info,
                created_at,
                expires_at,
                last_activity_at,
                revoked_at
            `)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            console.error('[Admin] Sessions error:', error);
            return NextResponse.json({ success: false, error: 'Erro ao buscar sessões' }, { status: 500 });
        }

        // Get member names
        const memberIds = [...new Set(sessions?.map(s => s.member_id) || [])];
        const { data: members } = await supabase
            .from('intelink_unit_members')
            .select('id, name')
            .in('id', memberIds);

        const memberMap = new Map(members?.map(m => [m.id, m.name]) || []);

        // Enrich sessions with member names
        const enrichedSessions = sessions?.map(s => ({
            ...s,
            member_name: memberMap.get(s.member_id) || 'Desconhecido',
        })) || [];

        return NextResponse.json({
            success: true,
            sessions: enrichedSessions,
        });

    } catch (error) {
        console.error('[Admin] Sessions error:', error);
        return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
    }
}
