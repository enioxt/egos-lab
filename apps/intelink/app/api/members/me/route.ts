/**
 * API: /api/members/me
 * 
 * Permite que qualquer membro autenticado edite APENAS seus próprios
 * dados de contato (telefone, whatsapp, telegram).
 * 
 * NÃO permite editar: nome, role, unit_id, system_role, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/api-utils';

// Campos que o próprio usuário pode editar
const SELF_EDITABLE_FIELDS = ['phone', 'whatsapp', 'telegram_username', 'email'];

function cleanPhoneForStorage(phone: string): string {
    return phone.replace(/\D/g, '');
}

// GET: Retorna dados do próprio membro
export async function GET(req: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();
        
        // Pegar identificação de várias fontes
        const memberPhone = req.headers.get('x-member-phone');
        let memberId = req.headers.get('x-member-id');
        
        // Also check Authorization header (Bearer token could be member_id)
        if (!memberId) {
            const authHeader = req.headers.get('Authorization');
            if (authHeader?.startsWith('Bearer ')) {
                const token = authHeader.slice(7);
                // Check if it's a UUID (member_id)
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (uuidRegex.test(token)) {
                    memberId = token;
                }
            }
        }
        
        if (!memberPhone && !memberId) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        let query = supabase
            .from('intelink_unit_members')
            .select('id, name, role, system_role, phone, whatsapp, telegram_username, email, unit_id, is_chief');
        
        if (memberId) {
            query = query.eq('id', memberId);
        } else if (memberPhone) {
            query = query.eq('phone', cleanPhoneForStorage(memberPhone));
        }
        
        const { data, error } = await query.single();
        
        if (error || !data) {
            return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 });
        }

        return NextResponse.json({ member: data });
    } catch (e: any) {
        console.error('[Members/Me API] GET Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// PATCH: Atualiza dados de contato do próprio membro
export async function PATCH(req: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();
        const body = await req.json();
        
        // Pegar identificação do header
        const memberPhone = req.headers.get('x-member-phone');
        const memberId = req.headers.get('x-member-id');
        
        if (!memberPhone && !memberId) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        // Filtrar apenas campos permitidos
        const allowedUpdates: Record<string, any> = {};
        for (const field of SELF_EDITABLE_FIELDS) {
            if (body[field] !== undefined) {
                if (field === 'phone') {
                    allowedUpdates[field] = cleanPhoneForStorage(body[field]);
                } else if (field === 'whatsapp') {
                    const digits = body[field].replace(/\D/g, '');
                    allowedUpdates[field] = digits ? `wa.me/${digits}` : null;
                } else {
                    allowedUpdates[field] = body[field] || null;
                }
            }
        }

        if (Object.keys(allowedUpdates).length === 0) {
            return NextResponse.json({ 
                error: 'Nenhum campo editável fornecido',
                allowedFields: SELF_EDITABLE_FIELDS 
            }, { status: 400 });
        }

        // Buscar membro pelo ID ou telefone
        let query = supabase
            .from('intelink_unit_members')
            .update(allowedUpdates);
        
        if (memberId) {
            query = query.eq('id', memberId);
        } else if (memberPhone) {
            query = query.eq('phone', cleanPhoneForStorage(memberPhone));
        }
        
        const { data, error } = await query.select().single();

        if (error) {
            console.error('[Members/Me API] Update Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ 
            success: true,
            message: 'Dados de contato atualizados',
            member: data,
            updatedFields: Object.keys(allowedUpdates)
        });
    } catch (e: any) {
        console.error('[Members/Me API] PATCH Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
