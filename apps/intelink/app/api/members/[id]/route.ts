import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, successResponse, errorResponse, notFoundError } from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';

async function handleGet(
    req: NextRequest,
    auth: AuthContext
): Promise<NextResponse> {
    try {
        // Extract ID from URL manually since App Router params are tricky with wrapper
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        // /api/members/[id]
        const id = pathParts[pathParts.length - 1];

        const supabase = getSupabaseAdmin();

        // Get member with unit info
        const { data: member, error } = await supabase
            .from('intelink_unit_members')
            .select(`
                id,
                name,
                role,
                system_role,
                phone,
                email,
                unit_id,
                is_chief,
                telegram_username,
                created_at,
                unit:intelink_police_units(id, code, name)
            `)
            .eq('id', id)
            .single();

        if (error || !member) {
            return notFoundError('Membro');
        }

        return successResponse({ member });

    } catch (e: any) {
        console.error('[Member API] Error:', e);
        return errorResponse(e.message || 'Erro ao buscar membro');
    }
}

// Protected: Only member+ can view other members
export const GET = withSecurity(handleGet, { requiredRole: 'member' });
