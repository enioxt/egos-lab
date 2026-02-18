/**
 * POST /api/profile/update
 * 
 * Secure profile update with OTP verification via Telegram
 * 
 * Flow:
 * 1. Request OTP (step: 'request_otp')
 * 2. Verify OTP and update (step: 'verify_and_update')
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, successResponse, errorResponse, validationError } from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';
import { logAudit } from '@/lib/audit-service';

const OTP_EXPIRY_MINUTES = 5;

// Generate 6-digit OTP
function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP via Telegram
async function sendTelegramOTP(chatId: string, otp: string, action: string): Promise<boolean> {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken || !chatId) return false;

    const actionLabel = action === 'email' ? '📧 Email' : '📱 Telefone';
    const message = `🔐 *Código de Verificação*\n\n` +
        `Você solicitou alterar seu ${actionLabel}.\n\n` +
        `Seu código: \`${otp}\`\n\n` +
        `⏱ Válido por ${OTP_EXPIRY_MINUTES} minutos.\n\n` +
        `⚠️ Se você não solicitou, ignore esta mensagem.`;

    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown'
            })
        });
        return response.ok;
    } catch (error) {
        console.error('[Profile/Update] Telegram error:', error);
        return false;
    }
}

async function handlePost(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const body = await req.json();
        const { step, field, value, otp } = body;

        // Validate field
        if (!['email', 'phone'].includes(field)) {
            return validationError('Campo inválido. Use: email ou phone');
        }

        // Get member with telegram_chat_id
        const { data: member, error: memberError } = await supabase
            .from('intelink_unit_members')
            .select('id, name, phone, email, telegram_chat_id, otp_code, otp_expires_at')
            .eq('id', auth.memberId)
            .single();

        if (memberError || !member) {
            return errorResponse('Membro não encontrado');
        }

        // Require Telegram for OTP
        if (!member.telegram_chat_id) {
            return NextResponse.json({
                success: false,
                error: 'Telegram não vinculado',
                message: 'Você precisa vincular seu Telegram para alterar dados sensíveis.'
            }, { status: 400 });
        }

        // Step 1: Request OTP
        if (step === 'request_otp') {
            const otpCode = generateOTP();
            const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

            // Save OTP to member
            await supabase
                .from('intelink_unit_members')
                .update({
                    otp_code: otpCode,
                    otp_expires_at: expiresAt.toISOString()
                })
                .eq('id', auth.memberId);

            // Send via Telegram
            const sent = await sendTelegramOTP(member.telegram_chat_id, otpCode, field);

            if (!sent) {
                return errorResponse('Erro ao enviar código. Tente novamente.');
            }

            return successResponse({
                step: 'otp_sent',
                message: 'Código enviado via Telegram',
                expires_in: OTP_EXPIRY_MINUTES * 60
            });
        }

        // Step 2: Verify OTP and update
        if (step === 'verify_and_update') {
            if (!otp || !value) {
                return validationError('Código e novo valor são obrigatórios');
            }

            // Validate OTP
            if (!member.otp_code || member.otp_code !== otp) {
                return NextResponse.json({
                    success: false,
                    error: 'Código inválido'
                }, { status: 400 });
            }

            // Check expiry
            if (member.otp_expires_at && new Date(member.otp_expires_at) < new Date()) {
                return NextResponse.json({
                    success: false,
                    error: 'Código expirado. Solicite um novo.'
                }, { status: 400 });
            }

            // Validate value format
            if (field === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    return validationError('Email inválido');
                }
            } else if (field === 'phone') {
                const phoneClean = value.replace(/\D/g, '');
                if (phoneClean.length < 10 || phoneClean.length > 11) {
                    return validationError('Telefone inválido. Use DDD + número');
                }
            }

            // Update field and clear OTP
            const updateData: Record<string, any> = {
                [field]: value,
                otp_code: null,
                otp_expires_at: null,
                updated_at: new Date().toISOString()
            };

            const { error: updateError } = await supabase
                .from('intelink_unit_members')
                .update(updateData)
                .eq('id', auth.memberId);

            if (updateError) {
                return errorResponse('Erro ao atualizar: ' + updateError.message);
            }

            // Audit log
            await logAudit({
                action: 'config_change',
                actorId: auth.memberId,
                actorName: auth.memberName,
                actorRole: auth.systemRole,
                targetType: 'member',
                targetId: auth.memberId,
                targetName: member.name,
                details: {
                    field,
                    oldValue: member[field as keyof typeof member] || null,
                    newValue: value,
                    verifiedVia: 'telegram_otp'
                }
            });

            // Notify via Telegram
            const confirmMessage = field === 'email' 
                ? `✅ Email atualizado para: ${value}`
                : `✅ Telefone atualizado para: ${value}`;
            
            await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: member.telegram_chat_id,
                    text: confirmMessage
                })
            });

            return successResponse({
                step: 'updated',
                message: `${field === 'email' ? 'Email' : 'Telefone'} atualizado com sucesso`,
                field,
                value
            });
        }

        return validationError('Step inválido. Use: request_otp ou verify_and_update');

    } catch (e: any) {
        console.error('[Profile/Update] Error:', e);
        return errorResponse(e.message || 'Erro ao atualizar perfil');
    }
}

// Protected: User can only update their own profile
export const POST = withSecurity(handlePost, { requiredRole: 'visitor' });
