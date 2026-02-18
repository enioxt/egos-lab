/**
 * Check Phone API (SIMPLIFIED)
 * 
 * If phone exists → go to password or create-password
 * If phone NOT exists → AUTO-CREATE member and go to create-password
 * 
 * NO APPROVAL NEEDED - simplified for testing phase
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/api-utils';

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

// Default unit_id for auto-created members
const DEFAULT_UNIT_ID = '70b665bd-0c53-4ad3-b6d0-7c5344cf41d6';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { phone, name } = body;

        if (!phone) {
            return NextResponse.json(
                { success: false, error: 'Telefone é obrigatório' },
                { status: 400 }
            );
        }

        const normalizedPhone = normalizePhone(phone);
        const supabase = getSupabaseAdmin();

        // Find member by phone
        const { data: member, error } = await supabase
            .from('intelink_unit_members')
            .select('id, name, password_hash')
            .or(`phone.eq.${normalizedPhone},phone.ilike.%${normalizedPhone}%`)
            .single();

        if (error || !member) {
            // ═══════════════════════════════════════════════════════
            // SIMPLIFIED: Auto-create member (no approval needed)
            // ═══════════════════════════════════════════════════════
            console.log('[Check Phone] Auto-creating member for:', normalizedPhone);
            
            const { data: newMember, error: createError } = await supabase
                .from('intelink_unit_members')
                .insert({
                    name: name || `Usuário ${normalizedPhone.slice(-4)}`,
                    phone: normalizedPhone,
                    role: 'investigator',
                    active: true,
                    unit_id: DEFAULT_UNIT_ID,
                })
                .select('id, name')
                .single();

            if (createError) {
                console.error('[Check Phone] Failed to auto-create:', createError);
                return NextResponse.json({
                    success: false,
                    error: 'Erro ao criar usuário',
                });
            }

            return NextResponse.json({
                success: true,
                exists: true, // Now exists!
                hasPassword: false, // Needs to create password
                memberId: newMember.id,
                memberName: newMember.name,
                autoCreated: true,
            });
        }

        return NextResponse.json({
            success: true,
            exists: true,
            hasPassword: !!member.password_hash,
            memberId: member.id,
            memberName: member.name,
        });

    } catch (error) {
        console.error('[Check Phone] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Erro interno' },
            { status: 500 }
        );
    }
}
