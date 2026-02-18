/**
 * Auth v2.0 - Login Endpoint
 * 
 * POST /api/v2/auth/login
 * 
 * Unified login endpoint that handles:
 * - Phone + Password authentication
 * - 2FA via Telegram OTP (when enabled)
 * - Session creation with JWT tokens
 * - Audit logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import {
    verifyPassword,
    isAccountLocked,
    getRemainingLockoutMinutes,
    shouldLockAccount,
    getLockoutExpiry,
    createSession,
    setAuthCookies,
    logLogin,
    logLoginFailed,
    logAccountLocked,
    AUTH_ERRORS,
    AUTH_SUCCESS,
    type Member,
} from '@/lib/auth';

// ============================================================================
// VALIDATION
// ============================================================================

const loginSchema = z.object({
    phone: z.string().min(10).max(15),
    password: z.string().min(1),
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
// PHONE NORMALIZATION
// ============================================================================

function normalizePhone(phone: string): string {
    let digits = phone.replace(/\D/g, '');
    
    // Remove country code if present
    if (digits.length >= 12 && digits.startsWith('55')) {
        digits = digits.substring(2);
    }
    
    // Add 9 for old 10-digit mobile numbers
    if (digits.length === 10) {
        const ddd = digits.substring(0, 2);
        const firstDigit = digits.charAt(2);
        if (['6', '7', '8', '9'].includes(firstDigit)) {
            return ddd + '9' + digits.substring(2);
        }
    }
    
    return digits;
}

// ============================================================================
// HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
    try {
        // Parse and validate request
        const body = await request.json();
        const validation = loginSchema.safeParse(body);
        
        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: 'Dados inválidos' },
                { status: 400 }
            );
        }

        const { phone, password, rememberMe } = validation.data;
        const normalizedPhone = normalizePhone(phone);
        const supabase = getSupabase();

        // Find member by phone
        const { data: member, error: memberError } = await supabase
            .from('intelink_unit_members')
            .select(`
                id, name, phone, email, role, system_role, unit_id,
                telegram_chat_id, telegram_username,
                password_hash, failed_login_attempts, locked_until
            `)
            .or(`phone.eq.${normalizedPhone},phone.ilike.%${normalizedPhone}%`)
            .single();

        if (memberError || !member) {
            await logLoginFailed(normalizedPhone, request, 'Member not found');
            return NextResponse.json(
                { success: false, error: AUTH_ERRORS.PHONE_NOT_FOUND },
                { status: 404 }
            );
        }

        // Check if account is locked
        if (isAccountLocked(member.locked_until)) {
            const remainingMinutes = getRemainingLockoutMinutes(member.locked_until);
            return NextResponse.json(
                { 
                    success: false, 
                    error: AUTH_ERRORS.ACCOUNT_LOCKED.replace('{minutes}', remainingMinutes.toString()),
                    lockedUntil: member.locked_until,
                },
                { status: 423 }
            );
        }

        // Check password - if not set, redirect to password setup
        if (!member.password_hash) {
            await logLoginFailed(normalizedPhone, request, 'No password set');
            return NextResponse.json(
                { 
                    success: false, 
                    error: 'Senha não configurada ainda. Solicite um código de acesso para criar sua senha.',
                    needsPasswordSetup: true,
                    memberId: member.id,
                    memberName: member.name,
                    memberPhone: normalizedPhone,
                },
                { status: 401 }
            );
        }

        const passwordValid = await verifyPassword(password, member.password_hash);

        if (!passwordValid) {
            // Increment failed attempts
            const newFailedAttempts = (member.failed_login_attempts || 0) + 1;
            const remainingAttempts = 5 - newFailedAttempts;

            if (shouldLockAccount(newFailedAttempts)) {
                // Lock account
                const lockExpiry = getLockoutExpiry();
                await supabase
                    .from('intelink_unit_members')
                    .update({
                        failed_login_attempts: newFailedAttempts,
                        locked_until: lockExpiry.toISOString(),
                    })
                    .eq('id', member.id);

                await logAccountLocked(member.id, request, newFailedAttempts);

                return NextResponse.json(
                    { 
                        success: false, 
                        error: AUTH_ERRORS.ACCOUNT_LOCKED.replace('{minutes}', '15'),
                        remainingAttempts: 0,
                    },
                    { status: 423 }
                );
            }

            // Just increment counter
            await supabase
                .from('intelink_unit_members')
                .update({ failed_login_attempts: newFailedAttempts })
                .eq('id', member.id);

            await logLoginFailed(normalizedPhone, request, 'Invalid password');

            return NextResponse.json(
                { 
                    success: false, 
                    error: `Senha incorreta. ${remainingAttempts} tentativa${remainingAttempts !== 1 ? 's' : ''} restante${remainingAttempts !== 1 ? 's' : ''}.`,
                    remainingAttempts,
                },
                { status: 401 }
            );
        }

        // Check if 2FA is required (mandatory for super_admin)
        const requiresOtp = member.system_role === 'super_admin';
        
        if (requiresOtp) {
            // Verify telegram is linked
            if (!member.telegram_chat_id) {
                return NextResponse.json({
                    success: false,
                    error: 'Admin requer 2FA via Telegram. Configure seu Telegram primeiro.',
                    requiresTelegramLink: true,
                }, { status: 400 });
            }

            // Generate and send OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

            // Store OTP
            await supabase
                .from('intelink_unit_members')
                .update({
                    otp_code: otp,
                    otp_expires_at: otpExpiry.toISOString(),
                })
                .eq('id', member.id);

            // Send via Telegram
            const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN_INTELINK;
            if (TELEGRAM_BOT_TOKEN) {
                await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: member.telegram_chat_id,
                        text: `🔐 <b>Código de Verificação Intelink</b>\n\nSeu código: <code>${otp}</code>\n\n⏱️ Válido por 5 minutos.\n\n⚠️ Não compartilhe este código.`,
                        parse_mode: 'HTML',
                    }),
                });
            }

            return NextResponse.json({
                success: true,
                requiresOtp: true,
                memberId: member.id,
                memberName: member.name,
                otpSentTo: 'Telegram',
                message: 'Código de verificação enviado para seu Telegram',
            });
        }

        // Reset failed attempts
        await supabase
            .from('intelink_unit_members')
            .update({ 
                failed_login_attempts: 0,
                locked_until: null,
            })
            .eq('id', member.id);

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

        // Log successful login
        await logLogin(member.id, request, { rememberMe });

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
        console.error('[Auth v2] Login error:', error);
        return NextResponse.json(
            { success: false, error: AUTH_ERRORS.SERVER_ERROR },
            { status: 500 }
        );
    }
}
