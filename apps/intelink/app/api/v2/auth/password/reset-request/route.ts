/**
 * Auth v2.0 - Password Reset Request Endpoint
 * 
 * POST /api/v2/auth/password/reset-request
 * 
 * Initiates password reset by sending code via Telegram
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import {
    generateAccessCode,
    getAccessCodeExpiry,
    logPasswordResetRequested,
    AUTH_ERRORS,
} from '@/lib/auth';

// ============================================================================
// VALIDATION
// ============================================================================

const resetRequestSchema = z.object({
    phone: z.string().min(10).max(15),
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
    if (digits.length >= 12 && digits.startsWith('55')) {
        digits = digits.substring(2);
    }
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
// TELEGRAM BOT
// ============================================================================

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN_INTELINK;

async function sendTelegramMessage(chatId: string, message: string): Promise<boolean> {
    if (!TELEGRAM_BOT_TOKEN) return false;

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
    } catch {
        return false;
    }
}

// ============================================================================
// HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = resetRequestSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: 'Telefone inválido' },
                { status: 400 }
            );
        }

        const normalizedPhone = normalizePhone(validation.data.phone);
        const supabase = getSupabase();

        // Find member
        const { data: member, error: memberError } = await supabase
            .from('intelink_unit_members')
            .select('id, name, telegram_chat_id')
            .or(`phone.eq.${normalizedPhone},phone.ilike.%${normalizedPhone}%`)
            .single();

        if (memberError || !member) {
            // Don't reveal if phone exists
            return NextResponse.json({
                success: true,
                message: 'Se o telefone estiver cadastrado, você receberá o código de recuperação.',
            });
        }

        if (!member.telegram_chat_id) {
            // Member exists but no Telegram - log but don't reveal
            await logPasswordResetRequested(member.id, normalizedPhone, request, 'telegram');
            return NextResponse.json({
                success: true,
                message: 'Se o telefone estiver cadastrado, você receberá o código de recuperação.',
            });
        }

        // Generate reset code
        const resetCode = generateAccessCode();
        const expiresAt = getAccessCodeExpiry();

        // Store in database
        const { error: updateError } = await supabase
            .from('intelink_unit_members')
            .update({
                reset_code: resetCode,
                reset_code_expires_at: expiresAt.toISOString(),
            })
            .eq('id', member.id);

        if (updateError) {
            console.error('[Reset] DB Error:', updateError);
            return NextResponse.json(
                { success: false, error: AUTH_ERRORS.SERVER_ERROR },
                { status: 500 }
            );
        }

        // Send via Telegram
        const message = `🔑 <b>Recuperação de Senha - Intelink</b>\n\n` +
            `Olá, ${member.name}!\n\n` +
            `Seu código de recuperação: <code>${resetCode}</code>\n\n` +
            `⏱️ Válido por 7 dias.\n\n` +
            `Use este código na tela de login para criar uma nova senha.\n\n` +
            `⚠️ Se você não solicitou isso, ignore esta mensagem.`;

        await sendTelegramMessage(member.telegram_chat_id, message);

        // Log event
        await logPasswordResetRequested(member.id, normalizedPhone, request, 'telegram');

        return NextResponse.json({
            success: true,
            message: 'Se o telefone estiver cadastrado, você receberá o código de recuperação.',
        });

    } catch (error) {
        console.error('[Reset] Request error:', error);
        return NextResponse.json(
            { success: false, error: AUTH_ERRORS.SERVER_ERROR },
            { status: 500 }
        );
    }
}
