import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, validationError, notFoundError, successResponse, errorResponse } from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';

async function handlePost(
    req: NextRequest,
    auth: AuthContext
): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        // Extract ID from URL
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        const id = pathParts[pathParts.length - 2]; // /api/investigation/[id]/restore

        if (!id) {
            return validationError('Investigation ID é obrigatório');
        }

        // First check if investigation exists and is deleted
        const { data: investigation, error: fetchError } = await supabase
            .from('intelink_investigations')
            .select('id, title, deleted_at')
            .eq('id', id)
            .single();

        if (fetchError || !investigation) {
            return NextResponse.json({ error: 'Investigation not found' }, { status: 404 });
        }

        if (!investigation.deleted_at) {
            return NextResponse.json({ error: 'Investigation is not deleted' }, { status: 400 });
        }

        // Restore: clear deleted_at and set status back to active
        const { error: updateError } = await supabase
            .from('intelink_investigations')
            .update({ 
                deleted_at: null,
                status: 'active',
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (updateError) {
            console.error('[Restore] Error:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ 
            success: true,
            message: `Operação "${investigation.title}" restaurada com sucesso`
        });

    } catch (e) {
        console.error('[Restore API] Error:', e);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// Protected: Only unit_admin+ can restore investigations
export const POST = withSecurity(handlePost, { requiredRole: 'unit_admin' });
