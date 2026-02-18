import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, successResponse, errorResponse, validationError } from '@/lib/api-utils';
import { withSecurity, AuthContext, forbiddenResponse } from '@/lib/api-security';

/**
 * POST: Generate access code for a member
 * 
 * Flow:
 * 1. Admin clicks "Gerar Código" in /central/equipe
 * 2. API generates ABC123 code (valid 7 days)
 * 3. Admin sends code via WhatsApp to user
 * 4. User logs in with phone + code → creates password
 */
async function handlePost(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const { member_id } = await req.json();

        if (!member_id) {
            return validationError('member_id é obrigatório');
        }

        // Get target member
        const { data: targetMember, error: memberError } = await supabase
            .from('intelink_unit_members')
            .select('id, name, phone, unit_id')
            .eq('id', member_id)
            .single();

        if (memberError || !targetMember) {
            return errorResponse('Membro não encontrado', 404);
        }

        if (!targetMember.phone) {
            return validationError('Membro não tem telefone cadastrado');
        }

        // Security: unit_admin can only generate codes for own unit
        if (auth.systemRole === 'unit_admin' && targetMember.unit_id !== auth.unitId) {
            return forbiddenResponse('Você só pode gerar códigos para membros da sua unidade');
        }

        // Generate code: 3 letters + 3 numbers (easy to read/type)
        const code = generateAccessCode();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        // Save code
        const { error: updateError } = await supabase
            .from('intelink_unit_members')
            .update({
                access_code: code,
                access_code_expires_at: expiresAt.toISOString(),
                access_code_created_by: auth.memberId,
                // Clear old password if exists (force new password creation)
                password_hash: null,
                must_change_password: false,
            })
            .eq('id', member_id);

        if (updateError) {
            console.error('[AccessCode] Update error:', updateError);
            return errorResponse('Erro ao gerar código');
        }

        // Format phone for WhatsApp link
        const cleanPhone = targetMember.phone.replace(/\D/g, '');
        const whatsappPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
        const message = encodeURIComponent(
            `🔐 INTELINK - Seu código de acesso:\n\n` +
            `Código: *${code}*\n\n` +
            `Acesse: intelink.ia.br\n` +
            `Digite seu telefone e o código acima.\n\n` +
            `⏱️ Válido por 7 dias.`
        );
        const whatsappLink = `https://wa.me/${whatsappPhone}?text=${message}`;

        console.log(`[AccessCode] Admin ${auth.memberName} generated code for ${targetMember.name}`);

        return successResponse({
            success: true,
            code,
            memberName: targetMember.name,
            memberPhone: targetMember.phone,
            expiresAt: expiresAt.toISOString(),
            whatsappLink,
        });

    } catch (e: any) {
        console.error('[AccessCode] Error:', e);
        return errorResponse(e.message || 'Erro ao gerar código');
    }
}

/**
 * Generate access code: ABC123 format
 * Easy to read over phone, no confusing characters
 */
function generateAccessCode(): string {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // No I, O
    const numbers = '23456789'; // No 0, 1
    
    let code = '';
    for (let i = 0; i < 3; i++) {
        code += letters[Math.floor(Math.random() * letters.length)];
    }
    for (let i = 0; i < 3; i++) {
        code += numbers[Math.floor(Math.random() * numbers.length)];
    }
    
    return code;
}

export const POST = withSecurity(handlePost, { requiredRole: 'unit_admin' });
