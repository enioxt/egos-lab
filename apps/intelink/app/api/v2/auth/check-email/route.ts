/**
 * Check Email API
 * 
 * If email exists → go to password or create-password
 * If email NOT exists → AUTO-CREATE member and go to create-password
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/api-utils';

const DEFAULT_UNIT_ID = '70b665bd-0c53-4ad3-b6d0-7c5344cf41d6';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, name } = body;

        if (!email || typeof email !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Email é obrigatório' },
                { status: 400 }
            );
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Basic email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return NextResponse.json(
                { success: false, error: 'Email inválido' },
                { status: 400 }
            );
        }

        const supabase = getSupabaseAdmin();

        // Find member by email
        const { data: member, error } = await supabase
            .from('intelink_unit_members')
            .select('id, name, password_hash')
            .eq('email', normalizedEmail)
            .single();

        if (error || !member) {
            // Auto-create member
            console.log('[Check Email] Auto-creating member for:', normalizedEmail);
            
            const { data: newMember, error: createError } = await supabase
                .from('intelink_unit_members')
                .insert({
                    name: name || normalizedEmail.split('@')[0],
                    email: normalizedEmail,
                    role: 'investigator',
                    active: true,
                    unit_id: DEFAULT_UNIT_ID,
                })
                .select('id, name')
                .single();

            if (createError) {
                console.error('[Check Email] Failed to auto-create:', createError);
                return NextResponse.json({
                    success: false,
                    error: 'Erro ao criar usuário',
                });
            }

            return NextResponse.json({
                success: true,
                exists: true,
                hasPassword: false,
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
        console.error('[Check Email] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Erro interno' },
            { status: 500 }
        );
    }
}
