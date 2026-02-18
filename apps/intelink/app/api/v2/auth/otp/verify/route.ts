/**
 * Auth v2.0 - Verify OTP Endpoint
 * 
 * POST /api/v2/auth/otp/verify
 * 
 * Verifies OTP code and completes 2FA login
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import {
    isOTPExpired,
    createSession,
    setAuthCookies,
    logOtpVerified,
    logLogin,
    AUTH_ERRORS,
    AUTH_SUCCESS,
    type Member,
} from '@/lib/auth';

// ============================================================================
// VALIDATION
// ============================================================================

const verifyOtpSchema = z.object({
    memberId: z.string().uuid(),
    otp: z.string().length(6).regex(/^\d+$/),
    rememberMe: z.boolean().optional().default(false),
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
// HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = verifyOtpSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: 'Dados inválidos' },
                { status: 400 }
            );
        }

        const { memberId, otp, rememberMe } = validation.data;
        const supabase = getSupabase();

        // Get member with OTP
        const { data: member, error: memberError } = await supabase
            .from('intelink_unit_members')
            .select(`
                id, name, phone, email, role, system_role, unit_id,
                telegram_chat_id, telegram_username,
                otp_code, otp_expires_at
            `)
            .eq('id', memberId)
            .single();

        if (memberError || !member) {
            return NextResponse.json(
                { success: false, error: 'Membro não encontrado' },
                { status: 404 }
            );
        }

        // Check OTP
        if (!member.otp_code || !member.otp_expires_at) {
            await logOtpVerified(memberId, request, false);
            return NextResponse.json(
                { success: false, error: 'Nenhum código pendente. Solicite um novo.' },
                { status: 400 }
            );
        }

        if (isOTPExpired(member.otp_expires_at)) {
            await logOtpVerified(memberId, request, false);
            return NextResponse.json(
                { success: false, error: AUTH_ERRORS.OTP_EXPIRED },
                { status: 400 }
            );
        }

        if (member.otp_code !== otp) {
            await logOtpVerified(memberId, request, false);
            return NextResponse.json(
                { success: false, error: AUTH_ERRORS.INVALID_OTP },
                { status: 401 }
            );
        }

        // OTP valid - clear it
        await supabase
            .from('intelink_unit_members')
            .update({
                otp_code: null,
                otp_expires_at: null,
                failed_login_attempts: 0,
                locked_until: null,
            })
            .eq('id', memberId);

        // Log OTP verified
        await logOtpVerified(memberId, request, true);

        // Build member object
        const memberData: Member = {
            id: member.id,
            name: member.name,
            phone: member.phone,
            email: member.email,
            role: member.role,
            systemRole: member.system_role || 'member',
            unitId: member.unit_id,
            telegramChatId: member.telegram_chat_id,
            telegramUsername: member.telegram_username,
        };

        // Create session
        const sessionResult = await createSession({
            member: memberData,
            deviceInfo: {
                userAgent: request.headers.get('user-agent') || 'Unknown',
                ip: request.headers.get('x-forwarded-for')?.split(',')[0] || undefined,
            },
            rememberMe,
        });

        if (!sessionResult.success || !sessionResult.session) {
            return NextResponse.json(
                { success: false, error: 'Falha ao criar sessão' },
                { status: 500 }
            );
        }

        // Log login
        await logLogin(member.id, request, { method: '2fa', rememberMe });

        // Build response
        const response = NextResponse.json({
            success: true,
            message: AUTH_SUCCESS.LOGIN,
            session: {
                id: sessionResult.session.id,
                memberId: member.id,
                expiresAt: sessionResult.session.expiresAt,
            },
            member: {
                id: member.id,
                name: member.name,
                role: member.role,
                systemRole: member.system_role || 'member',
                unitId: member.unit_id,
            },
        });

        // Set cookies
        if (sessionResult.accessToken && sessionResult.refreshToken) {
            setAuthCookies(
                response,
                sessionResult.accessToken,
                sessionResult.refreshToken,
                rememberMe
            );
        }

        // Also set member_id cookie (needed by API security)
        response.cookies.set('intelink_member_id', member.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60,
        });

        return response;

    } catch (error) {
        console.error('[OTP] Verify error:', error);
        return NextResponse.json(
            { success: false, error: AUTH_ERRORS.SERVER_ERROR },
            { status: 500 }
        );
    }
}
