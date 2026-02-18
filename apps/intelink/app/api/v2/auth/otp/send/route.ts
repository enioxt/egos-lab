/**
 * Auth v2.0 - Send OTP Endpoint
 * 
 * POST /api/v2/auth/otp/send
 * 
 * Sends OTP code via Telegram for 2FA
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import {
    generateOTP,
    getOTPExpiry,
    logOtpSent,
    AUTH_ERRORS,
} from '@/lib/auth';

// ============================================================================
// VALIDATION
// ============================================================================

const sendOtpSchema = z.object({
    memberId: z.string().uuid(),
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
// TELEGRAM BOT
// ============================================================================

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN_INTELINK;

async function sendTelegramMessage(chatId: string, message: string): Promise<boolean> {
    if (!TELEGRAM_BOT_TOKEN) {
        console.error('[OTP] Telegram bot token not configured');
        return false;
    }

    try {
        const response = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: 'HTML',
                }),
            }
        );

        return response.ok;
    } catch (error) {
        console.error('[OTP] Telegram error:', error);
        return false;
    }
}

// ============================================================================
// HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = sendOtpSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: 'Dados inválidos' },
                { status: 400 }
            );
        }

        const { memberId } = validation.data;
        const supabase = getSupabase();

        // Get member
        const { data: member, error: memberError } = await supabase
            .from('intelink_unit_members')
            .select('id, name, telegram_chat_id')
            .eq('id', memberId)
            .single();

        if (memberError || !member) {
            return NextResponse.json(
                { success: false, error: 'Membro não encontrado' },
                { status: 404 }
            );
        }

        if (!member.telegram_chat_id) {
            return NextResponse.json(
                { success: false, error: 'Telegram não vinculado. Configure seu Telegram primeiro.' },
                { status: 400 }
            );
        }

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = getOTPExpiry();

        // Store OTP in database
        const { error: otpError } = await supabase
            .from('intelink_unit_members')
            .update({
                otp_code: otp,
                otp_expires_at: expiresAt.toISOString(),
            })
            .eq('id', memberId);

        if (otpError) {
            console.error('[OTP] DB Error:', otpError);
            return NextResponse.json(
                { success: false, error: 'Erro ao gerar código' },
                { status: 500 }
            );
        }

        // Send via Telegram
        const message = `🔐 <b>Código de Verificação Intelink</b>\n\n` +
            `Seu código: <code>${otp}</code>\n\n` +
            `⏱️ Válido por 5 minutos.\n\n` +
            `⚠️ Não compartilhe este código com ninguém.`;

        const sent = await sendTelegramMessage(member.telegram_chat_id, message);

        if (!sent) {
            return NextResponse.json(
                { success: false, error: 'Erro ao enviar código. Verifique seu Telegram.' },
                { status: 500 }
            );
        }

        // Log event
        await logOtpSent(memberId, request, 'telegram');

        return NextResponse.json({
            success: true,
            message: 'Código enviado para seu Telegram',
            expiresAt: expiresAt.toISOString(),
        });

    } catch (error) {
        console.error('[OTP] Send error:', error);
        return NextResponse.json(
            { success: false, error: AUTH_ERRORS.SERVER_ERROR },
            { status: 500 }
        );
    }
}
