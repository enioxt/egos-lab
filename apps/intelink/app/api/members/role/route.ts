import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, successResponse, errorResponse, validationError } from '@/lib/api-utils';
import { withSecurity, AuthContext, hasMinRole, forbiddenResponse } from '@/lib/api-security';
import { logRoleChange } from '@/lib/audit-service';
import crypto from 'crypto';

const VALID_ROLES = ['super_admin', 'unit_admin', 'member', 'intern', 'visitor'];

// Roles that require OTP verification
const OTP_REQUIRED_ROLES = ['super_admin', 'unit_admin'];

// Role hierarchy for permission checks
const ROLE_LEVEL: Record<string, number> = {
    super_admin: 100,
    unit_admin: 60,
    member: 40,
    intern: 20,
    visitor: 10,
};

async function handleRoleUpdate(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const body = await req.json();
        const { member_id, system_role, otp_auth_token } = body;

        if (!member_id) {
            return validationError('member_id é obrigatório');
        }

        if (!system_role || !VALID_ROLES.includes(system_role)) {
            return validationError(`role inválido. Use: ${VALID_ROLES.join(', ')}`);
        }

        // SECURITY: Only super_admin can create other super_admins
        if (system_role === 'super_admin' && auth.systemRole !== 'super_admin') {
            return forbiddenResponse('Apenas super_admin pode criar outros super_admin');
        }
        
        // SECURITY: Can only assign roles lower than your own
        const userLevel = ROLE_LEVEL[auth.systemRole] || 0;
        const targetLevel = ROLE_LEVEL[system_role] || 0;
        
        if (targetLevel >= userLevel && auth.systemRole !== 'super_admin') {
            return forbiddenResponse('Você só pode atribuir roles inferiores ao seu');
        }

        // ═══════════════════════════════════════════════════════════════════
        // OTP required for elevation to admin roles (Telegram verification)
        // Re-enabled 2025-12-16 - Telegram bot configured
        // ═══════════════════════════════════════════════════════════════════
        if (OTP_REQUIRED_ROLES.includes(system_role)) {
            if (!otp_auth_token) {
                return NextResponse.json(
                    { 
                        error: 'OTP obrigatório', 
                        otp_required: true,
                        action: 'role_elevation',
                        message: 'Elevação para cargo administrativo requer verificação via Telegram.'
                    }, 
                    { status: 403 }
                );
            }

            // Verify the auth token
            const authTokenHash = crypto.createHash('sha256').update(otp_auth_token).digest('hex');
            
            const { data: otpRecord, error: otpError } = await supabase
                .from('intelink_otp_tokens')
                .select('*')
                .eq('member_id', auth.memberId)
                .eq('auth_token', authTokenHash)
                .eq('action', 'role_elevation')
                .gt('auth_token_expires_at', new Date().toISOString())
                .single();

            if (otpError || !otpRecord) {
                return NextResponse.json(
                    { error: 'Token de autorização inválido ou expirado. Solicite novo OTP.' },
                    { status: 401 }
                );
            }

            // Verify context matches (optional but recommended)
            if (otpRecord.context?.targetRole && otpRecord.context.targetRole !== system_role) {
                return NextResponse.json(
                    { error: 'Token não autorizado para este cargo. Solicite novo OTP.' },
                    { status: 401 }
                );
            }

            // Invalidate the auth token after use
            await supabase
                .from('intelink_otp_tokens')
                .update({ auth_token: null, auth_token_expires_at: null })
                .eq('id', otpRecord.id);

            console.log(`[Role Update] OTP verified for ${auth.memberName} -> ${system_role}`);
        }

        const { data, error } = await supabase
            .from('intelink_unit_members')
            .update({ system_role })
            .eq('id', member_id)
            .select()
            .single();

        if (error) throw error;

        // Audit log
        await logRoleChange(
            { id: auth.memberId, name: auth.memberName, role: auth.systemRole },
            { id: member_id, name: data.name || 'Unknown' },
            data.system_role || 'member',
            system_role
        );

        console.log(`[Role Update] ${auth.memberName} changed ${member_id} role to ${system_role}`);

        return successResponse({ member: data });
    } catch (e: any) {
        console.error('[Role Update] Error:', e);
        return errorResponse(e.message || 'Erro ao atualizar role');
    }
}

// Protected: Only unit_admin+ can change roles
export const PATCH = withSecurity(handleRoleUpdate, { requiredRole: 'unit_admin' });
