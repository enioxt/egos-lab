/**
 * Auth v2.0 - Request Access Endpoint
 * 
 * POST /api/v2/auth/request-access
 * 
 * When a phone is not registered, user can request access.
 * Sends notification to admin via Telegram for approval.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// ============================================================================
// VALIDATION
// ============================================================================

const requestAccessSchema = z.object({
    phone: z.string().min(10).max(15),
    name: z.string().min(2).max(100).optional(),
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
// TELEGRAM NOTIFICATION
// ============================================================================

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN_INTELINK;
const ADMIN_CHAT_ID = '171767219'; // ENIO's Telegram chat ID

async function notifyAdmin(phone: string, name: string | null, requestId: string): Promise<boolean> {
    if (!TELEGRAM_BOT_TOKEN) {
        console.error('[AccessRequest] Telegram bot token not configured');
        return false;
    }

    const formattedPhone = phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    
    const message = `🔔 <b>Nova Solicitação de Acesso</b>\n\n` +
        `📱 Telefone: <code>${formattedPhone}</code>\n` +
        (name ? `👤 Nome: ${name}\n` : '') +
        `\n` +
        `Para aprovar, envie:\n` +
        `<code>/aprovar ${requestId.slice(0, 8)}</code>\n\n` +
        `Para rejeitar:\n` +
        `<code>/rejeitar ${requestId.slice(0, 8)}</code>`;

    try {
        const response = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: ADMIN_CHAT_ID,
                    text: message,
                    parse_mode: 'HTML',
                }),
            }
        );

        return response.ok;
    } catch (error) {
        console.error('[AccessRequest] Telegram error:', error);
        return false;
    }
}

// ============================================================================
// HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = requestAccessSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: 'Dados inválidos' },
                { status: 400 }
            );
        }

        const { name } = validation.data;
        const normalizedPhone = normalizePhone(validation.data.phone);
        const supabase = getSupabase();

        // Check if phone already registered
        const { data: existingMember } = await supabase
            .from('intelink_unit_members')
            .select('id')
            .or(`phone.eq.${normalizedPhone},phone.ilike.%${normalizedPhone}%`)
            .single();

        if (existingMember) {
            return NextResponse.json(
                { success: false, error: 'Telefone já cadastrado. Tente fazer login.' },
                { status: 400 }
            );
        }

        // Check if there's already a pending request
        const { data: existingRequest } = await supabase
            .from('intelink_access_requests')
            .select('id, status')
            .eq('phone', normalizedPhone)
            .eq('status', 'pending')
            .single();

        if (existingRequest) {
            return NextResponse.json({
                success: true,
                message: 'Sua solicitação já está em análise. Aguarde a aprovação do administrador.',
                pending: true,
            });
        }

        // Create new request
        const { data: newRequest, error: insertError } = await supabase
            .from('intelink_access_requests')
            .insert({
                phone: normalizedPhone,
                name: name || null,
            })
            .select('id')
            .single();

        if (insertError) {
            console.error('[AccessRequest] Insert error:', insertError);
            return NextResponse.json(
                { success: false, error: 'Erro ao registrar solicitação' },
                { status: 500 }
            );
        }

        // Notify admin via Telegram
        const notified = await notifyAdmin(normalizedPhone, name || null, newRequest.id);

        // Update notification status
        if (notified) {
            await supabase
                .from('intelink_access_requests')
                .update({ telegram_notified: true })
                .eq('id', newRequest.id);
        }

        return NextResponse.json({
            success: true,
            message: 'Solicitação enviada! O administrador foi notificado e analisará seu pedido em breve.',
            requestId: newRequest.id,
        });

    } catch (error) {
        console.error('[AccessRequest] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Erro interno' },
            { status: 500 }
        );
    }
}

// GET - Check request status
export async function GET(request: NextRequest) {
    const phone = request.nextUrl.searchParams.get('phone');
    
    if (!phone) {
        return NextResponse.json(
            { success: false, error: 'Telefone não informado' },
            { status: 400 }
        );
    }

    const normalizedPhone = normalizePhone(phone);
    const supabase = getSupabase();

    // Check if approved (member created)
    const { data: member } = await supabase
        .from('intelink_unit_members')
        .select('id, name')
        .or(`phone.eq.${normalizedPhone},phone.ilike.%${normalizedPhone}%`)
        .single();

    if (member) {
        return NextResponse.json({
            success: true,
            status: 'approved',
            message: 'Acesso aprovado! Você já pode fazer login.',
        });
    }

    // Check pending request
    const { data: pendingRequest } = await supabase
        .from('intelink_access_requests')
        .select('id, status, requested_at')
        .eq('phone', normalizedPhone)
        .order('requested_at', { ascending: false })
        .limit(1)
        .single();

    if (pendingRequest) {
        return NextResponse.json({
            success: true,
            status: pendingRequest.status,
            message: pendingRequest.status === 'pending' 
                ? 'Sua solicitação está em análise.' 
                : pendingRequest.status === 'rejected'
                    ? 'Sua solicitação foi rejeitada.'
                    : 'Acesso aprovado!',
        });
    }

    return NextResponse.json({
        success: true,
        status: 'not_found',
        message: 'Nenhuma solicitação encontrada.',
    });
}
