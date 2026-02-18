/**
 * Auth v2.0 - Current User Endpoint
 * 
 * GET /api/v2/auth/me
 * 
 * Returns complete info about the current authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
    verifySession,
    getAccessTokenFromRequest,
    AUTH_ERRORS,
    ROLE_PERMISSIONS,
} from '@/lib/auth';

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

const getSupabase = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createClient(supabaseUrl, supabaseKey);
};

// ============================================================================
// HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
    try {
        const accessToken = getAccessTokenFromRequest(request);
        const supabase = getSupabase();

        if (!accessToken) {
            return NextResponse.json(
                { success: false, error: 'Não autenticado' },
                { status: 401 }
            );
        }

        // Check if accessToken is a UUID (member_id fallback)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        let member: any = null;
        let shouldRefresh = false;

        if (uuidRegex.test(accessToken)) {
            // Direct member_id lookup (fallback for legacy auth)
            const { data: memberData, error } = await supabase
                .from('intelink_unit_members')
                .select('id, name, phone, email, role, system_role, unit_id, telegram_chat_id, telegram_username')
                .eq('id', accessToken)
                .single();

            if (error || !memberData) {
                return NextResponse.json(
                    { success: false, error: 'Membro não encontrado' },
                    { status: 401 }
                );
            }

            member = {
                id: memberData.id,
                name: memberData.name,
                phone: memberData.phone,
                email: memberData.email,
                role: memberData.role,
                systemRole: memberData.system_role || 'member',
                unitId: memberData.unit_id,
                telegramChatId: memberData.telegram_chat_id,
                telegramUsername: memberData.telegram_username,
            };
        } else {
            // JWT verification (v2 auth)
            const result = await verifySession(accessToken);

            if (!result.success || !result.member) {
                return NextResponse.json(
                    { success: false, error: result.error || 'Sessão inválida' },
                    { status: 401 }
                );
            }

            member = result.member;
            shouldRefresh = result.shouldRefresh || false;
        }

        // Get unit info
        const { data: unit } = await supabase
            .from('intelink_units')
            .select('id, name, code')
            .eq('id', member.unitId)
            .single();

        // Get permissions for role
        const rolePermissions = ROLE_PERMISSIONS[member.systemRole as keyof typeof ROLE_PERMISSIONS] || {};

        return NextResponse.json({
            success: true,
            member: {
                id: member.id,
                name: member.name,
                phone: member.phone,
                email: member.email,
                role: member.role,
                systemRole: member.systemRole,
                telegramUsername: member.telegramUsername,
                hasTelegram: !!member.telegramChatId,
            },
            unit: unit ? {
                id: unit.id,
                name: unit.name,
                code: unit.code,
            } : null,
            permissions: rolePermissions,
            shouldRefresh,
        });

    } catch (error) {
        console.error('[Auth v2] Me error:', error);
        return NextResponse.json(
            { success: false, error: AUTH_ERRORS.SERVER_ERROR },
            { status: 500 }
        );
    }
}
