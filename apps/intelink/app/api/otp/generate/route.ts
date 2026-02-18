/**
 * OTP Generation API
 * 
 * Generates a 6-digit OTP and sends it via Telegram.
 * Used for critical operations like role elevation.
 * 
 * @security Requires authenticated user with linked Telegram
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';
import crypto from 'crypto';

// OTP valid for 5 minutes
const OTP_EXPIRY_MINUTES = 5;

interface OTPRequest {
  action: 'role_elevation' | 'delete_investigation' | 'merge_entities';
  context?: {
    targetMemberId?: string;
    targetRole?: string;
    investigationId?: string;
  };
}

async function handlePost(req: NextRequest, auth: AuthContext) {
  const supabase = getSupabaseAdmin();

  try {
    const body: OTPRequest = await req.json();
    const { action, context } = body;

    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 });
    }

    // Get current user's Telegram info
    const { data: member, error: memberError } = await supabase
      .from('intelink_unit_members')
      .select('id, name, telegram_id, telegram_username')
      .eq('id', auth.memberId)
      .single();

    if (memberError || !member) {
      return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 });
    }

    if (!member.telegram_id) {
      return NextResponse.json(
        { error: 'Telegram não vinculado. Use /vincular no bot primeiro.' },
        { status: 400 }
      );
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Store OTP in database
    const { error: insertError } = await supabase
      .from('intelink_otp_tokens')
      .insert({
        member_id: auth.memberId,
        otp_hash: crypto.createHash('sha256').update(otp).digest('hex'),
        action,
        context: context || {},
        expires_at: expiresAt.toISOString(),
        used: false,
      });

    if (insertError) {
      console.error('[OTP Generate] Insert error:', insertError);
      return NextResponse.json({ error: 'Erro ao gerar OTP' }, { status: 500 });
    }

    // Send OTP via Telegram
    const actionLabels: Record<string, string> = {
      role_elevation: 'Alteração de Permissão',
      delete_investigation: 'Exclusão de Investigação',
      merge_entities: 'Fusão de Entidades',
    };

    let contextMessage = '';
    if (context?.targetRole) {
      contextMessage = `\n📋 *Novo cargo:* ${context.targetRole}`;
    }

    const telegramMessage = `
🔐 *CÓDIGO DE VERIFICAÇÃO INTELINK*

${actionLabels[action] || action}${contextMessage}

Seu código: \`${otp}\`

⏰ Válido por ${OTP_EXPIRY_MINUTES} minutos.

⚠️ *Não compartilhe este código com ninguém.*
`;

    // Send via Telegram Bot API
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (botToken) {
      try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: member.telegram_id,
            text: telegramMessage,
            parse_mode: 'Markdown',
          }),
        });
        console.log(`[OTP Generate] Sent OTP to ${member.telegram_username || member.telegram_id}`);
      } catch (telegramError) {
        console.error('[OTP Generate] Telegram send error:', telegramError);
        // Don't fail - OTP is still in DB, user can request resend
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Código enviado para seu Telegram',
      expiresAt: expiresAt.toISOString(),
      telegramUsername: member.telegram_username || null,
    });
  } catch (error) {
    console.error('[OTP Generate] Error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export const POST = withSecurity(handlePost, { requiredRole: 'unit_admin' });
