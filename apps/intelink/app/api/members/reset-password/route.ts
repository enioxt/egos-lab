import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, successResponse, errorResponse, validationError } from '@/lib/api-utils';
import { withSecurity, AuthContext, forbiddenResponse } from '@/lib/api-security';
import { hashPassword } from '@/lib/auth';

/**
 * POST: Admin resets a member's password
 * 
 * Flow:
 * 1. Admin clicks "Reset Password" in /central/permissoes
 * 2. API generates a temporary password
 * 3. Returns temp password to admin (shows on screen)
 * 4. Admin gives temp password to user
 * 5. User logs in with temp password → forced to create new password
 * 
 * Security: Only super_admin and unit_admin can reset passwords
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
            .select('id, name, unit_id, system_role')
            .eq('id', member_id)
            .single();

        if (memberError || !targetMember) {
            return errorResponse('Membro não encontrado', 404);
        }

        // Security: unit_admin can only reset passwords for members in their unit
        if (auth.systemRole === 'unit_admin' && targetMember.unit_id !== auth.unitId) {
            return forbiddenResponse('Você só pode resetar senhas de membros da sua unidade');
        }

        // Security: Cannot reset password of higher-ranked members
        const roleHierarchy: Record<string, number> = {
            super_admin: 100,
            unit_admin: 60,
            member: 40,
            intern: 20,
            visitor: 10,
        };

        const authLevel = roleHierarchy[auth.systemRole] || 0;
        const targetLevel = roleHierarchy[targetMember.system_role] || 0;

        if (targetLevel >= authLevel && auth.systemRole !== 'super_admin') {
            return forbiddenResponse('Você não pode resetar a senha de um membro com cargo igual ou superior');
        }

        // Generate temporary password (6 chars, easy to type)
        const tempPassword = generateTempPassword();
        const hashedPassword = await hashPassword(tempPassword);

        // Update member with temp password and flag to force change
        const { error: updateError } = await supabase
            .from('intelink_unit_members')
            .update({
                password_hash: hashedPassword,
                must_change_password: true, // Force password change on next login
                password_reset_at: new Date().toISOString(),
                password_reset_by: auth.memberId,
            })
            .eq('id', member_id);

        if (updateError) {
            console.error('[ResetPassword] Update error:', updateError);
            return errorResponse('Erro ao resetar senha');
        }

        console.log(`[ResetPassword] Admin ${auth.memberName} reset password for ${targetMember.name}`);

        return successResponse({
            success: true,
            tempPassword,
            memberName: targetMember.name,
            message: `Senha temporária gerada. O usuário deverá criar uma nova senha no próximo login.`
        });

    } catch (e: any) {
        console.error('[ResetPassword] Error:', e);
        return errorResponse(e.message || 'Erro ao resetar senha');
    }
}

/**
 * Generate a simple temporary password
 * Format: 3 letters + 3 numbers (e.g., ABC123)
 * Easy to read over phone/WhatsApp
 */
function generateTempPassword(): string {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // No I, O to avoid confusion
    const numbers = '23456789'; // No 0, 1 to avoid confusion
    
    let password = '';
    for (let i = 0; i < 3; i++) {
        password += letters[Math.floor(Math.random() * letters.length)];
    }
    for (let i = 0; i < 3; i++) {
        password += numbers[Math.floor(Math.random() * numbers.length)];
    }
    
    return password;
}

export const POST = withSecurity(handlePost, { requiredRole: 'unit_admin' });
