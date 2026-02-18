import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/api-utils';

/**
 * POST: Add email to a member (self-service during password recovery)
 * 
 * This allows users to add their email when they don't have Telegram
 * and need to recover their password.
 * 
 * Security: Only allows adding email to your own phone number
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();
        const { phone, email } = await request.json();

        if (!phone || !email) {
            return NextResponse.json({ 
                error: 'Telefone e email são obrigatórios' 
            }, { status: 400 });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ 
                error: 'Formato de email inválido' 
            }, { status: 400 });
        }

        // Normalize phone
        const normalizedPhone = phone.replace(/\D/g, '');

        // Find member by phone
        const { data: member, error: findError } = await supabase
            .from('intelink_unit_members')
            .select('id, name, email')
            .eq('phone', normalizedPhone)
            .maybeSingle();

        if (findError || !member) {
            return NextResponse.json({ 
                error: 'Telefone não cadastrado' 
            }, { status: 404 });
        }

        // Check if email already exists for another member
        const { data: existingEmail } = await supabase
            .from('intelink_unit_members')
            .select('id, name')
            .eq('email', email.toLowerCase())
            .neq('id', member.id)
            .maybeSingle();

        if (existingEmail) {
            return NextResponse.json({ 
                error: 'Este email já está vinculado a outra conta' 
            }, { status: 409 });
        }

        // Update member with email
        const { error: updateError } = await supabase
            .from('intelink_unit_members')
            .update({ email: email.toLowerCase() })
            .eq('id', member.id);

        if (updateError) {
            console.error('[AddEmail] Update error:', updateError);
            return NextResponse.json({ 
                error: 'Erro ao adicionar email' 
            }, { status: 500 });
        }

        console.log(`[AddEmail] Email added for ${member.name}: ${email}`);

        return NextResponse.json({
            success: true,
            message: 'Email adicionado com sucesso'
        });

    } catch (e: any) {
        console.error('[AddEmail] Error:', e);
        return NextResponse.json({ 
            error: 'Erro interno' 
        }, { status: 500 });
    }
}
