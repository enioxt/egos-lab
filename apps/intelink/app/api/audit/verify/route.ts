/**
 * Audit Chain Verification API
 * 
 * GET /api/audit/verify
 * - Verifies the integrity of the audit log hash chain
 * - Returns whether the chain is valid and where it breaks if not
 * 
 * Only accessible by super_admin role
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, successResponse, errorResponse } from '@/lib/api-utils';
import { withSecurity, SecureContext } from '@/lib/security/middleware';

async function handler(req: NextRequest, context: SecureContext) {
    const { user } = context;
    const supabase = getSupabaseAdmin();

    // Check if user is super_admin
    if (user?.role !== 'super_admin') {
        return errorResponse('Acesso restrito a Super Admin', 403);
    }

    try {
        // Call the verification function
        const { data, error } = await supabase
            .rpc('verify_audit_chain');

        if (error) {
            console.error('[Audit Verify] Error:', error);
            return errorResponse('Erro ao verificar cadeia de auditoria');
        }

        const result = data?.[0];

        if (!result) {
            return successResponse({
                status: 'empty',
                message: 'Nenhum log de auditoria encontrado',
                is_valid: true
            });
        }

        if (result.is_valid) {
            return successResponse({
                status: 'valid',
                message: 'Cadeia de auditoria íntegra ✅',
                is_valid: true,
                verified_at: new Date().toISOString()
            });
        } else {
            return successResponse({
                status: 'broken',
                message: '⚠️ ALERTA: Cadeia de auditoria comprometida!',
                is_valid: false,
                broken_at_sequence: result.broken_at_sequence,
                expected_hash: result.expected_hash,
                actual_hash: result.actual_hash,
                verified_at: new Date().toISOString()
            });
        }

    } catch (e: any) {
        console.error('[Audit Verify] Error:', e);
        return errorResponse(e.message || 'Erro interno');
    }
}

export const GET = withSecurity(handler, {
    auth: false, // We check role manually
    rateLimit: 'auth' // Low rate limit for security
});
