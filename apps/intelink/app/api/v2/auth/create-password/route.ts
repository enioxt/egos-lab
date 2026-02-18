/**
 * Create Password API
 * 
 * Creates a password for a member who doesn't have one yet,
 * then automatically logs them in.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/api-utils';
import { hashPassword } from '@/lib/auth/password';
import { createSession, setAuthCookies } from '@/lib/auth/session';
import { Member } from '@/lib/auth/types';

// Normalize phone to 11 digits
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

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { phone, password, confirmPassword, name, rememberMe = false } = body;

        // Validation
        if (!phone || !password || !confirmPassword) {
            return NextResponse.json(
                { success: false, error: 'Todos os campos são obrigatórios' },
                { status: 400 }
            );
        }

        if (password !== confirmPassword) {
            return NextResponse.json(
                { success: false, error: 'As senhas não coincidem' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { success: false, error: 'Senha deve ter no mínimo 6 caracteres' },
                { status: 400 }
            );
        }

        const normalizedPhone = normalizePhone(phone);
        const supabase = getSupabaseAdmin();

        // Find member
        const { data: member, error: memberError } = await supabase
            .from('intelink_unit_members')
            .select(`
                id, name, phone, email, role, system_role, unit_id,
                telegram_chat_id, telegram_username, password_hash
            `)
            .or(`phone.eq.${normalizedPhone},phone.ilike.%${normalizedPhone}%`)
            .single();

        if (memberError || !member) {
            return NextResponse.json(
                { success: false, error: 'Telefone não encontrado' },
                { status: 404 }
            );
        }

        // Check if already has password
        if (member.password_hash) {
            return NextResponse.json(
                { success: false, error: 'Este usuário já possui senha cadastrada. Use o login normal.' },
                { status: 400 }
            );
        }

        // Hash password and save (also update name if provided)
        const passwordHash = await hashPassword(password);
        
        const updateData: Record<string, unknown> = { 
            password_hash: passwordHash,
        };
        
        // Update name if provided and different
        if (name && name.trim() && name.trim() !== member.name) {
            updateData.name = name.trim();
        }
        
        const { error: updateError } = await supabase
            .from('intelink_unit_members')
            .update(updateData)
            .eq('id', member.id);

        if (updateError) {
            console.error('[Create Password] Update error:', updateError);
            return NextResponse.json(
                { success: false, error: 'Erro ao salvar senha' },
                { status: 500 }
            );
        }

        // Create session (auto-login)
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
                { success: false, error: 'Senha criada, mas falha ao fazer login. Tente logar manualmente.' },
                { status: 500 }
            );
        }

        // Use updated name or original
        const finalName = (name && name.trim()) ? name.trim() : member.name;
        
        // Build response
        const response = NextResponse.json({
            success: true,
            message: 'Senha criada com sucesso!',
            member: {
                id: member.id,
                name: finalName,
                role: member.role,
                systemRole: member.system_role || 'member',
                unitId: member.unit_id,
            },
        });

        // Set auth cookies
        if (sessionResult.accessToken && sessionResult.refreshToken) {
            setAuthCookies(
                response,
                sessionResult.accessToken,
                sessionResult.refreshToken,
                rememberMe
            );
        }

        // Set member_id cookie
        response.cookies.set('intelink_member_id', member.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60,
        });

        return response;

    } catch (error) {
        console.error('[Create Password] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
