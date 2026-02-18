import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, notFoundError, successResponse, errorResponse } from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';

async function handleGet(
    request: NextRequest,
    auth: AuthContext
): Promise<NextResponse> {
    try {
        // Extract ID from URL manually since App Router params are tricky with wrapper
        const url = new URL(request.url);
        const pathParts = url.pathname.split('/');
        // /api/documents/[id]
        const id = pathParts[pathParts.length - 1];

        // TENANT ISOLATION: Verify access to document
        const { guardDocument } = await import('@/lib/tenant-guard');
        const accessDenied = await guardDocument(auth, id);
        if (accessDenied) return accessDenied;

        const supabase = getSupabaseAdmin();

        // Fetch document with related entities
        const { data: document, error: docError } = await supabase
            .from('intelink_documents')
            .select(`
                *,
                investigation:intelink_investigations(id, title),
                entities:intelink_document_entities(*)
            `)
            .eq('id', id)
            .single();

        if (docError) {
            if (docError.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Documento não encontrado' },
                    { status: 404 }
                );
            }
            throw docError;
        }

        return NextResponse.json(document);
    } catch (error) {
        console.error('Error fetching document:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar documento' },
            { status: 500 }
        );
    }
}

async function handleDelete(
    request: NextRequest,
    auth: AuthContext
): Promise<NextResponse> {
    try {
        // Extract ID from URL manually
        const url = new URL(request.url);
        const pathParts = url.pathname.split('/');
        const id = pathParts[pathParts.length - 1];

        // TENANT ISOLATION: Verify access to document
        const { guardDocument } = await import('@/lib/tenant-guard');
        const accessDenied = await guardDocument(auth, id);
        if (accessDenied) return accessDenied;

        const supabase = getSupabaseAdmin();

        // Delete related entities first
        await supabase
            .from('intelink_document_entities')
            .delete()
            .eq('document_id', id);

        // Delete document
        const { error } = await supabase
            .from('intelink_documents')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting document:', error);
        return NextResponse.json(
            { error: 'Erro ao excluir documento' },
            { status: 500 }
        );
    }
}

// Protected: Only member+ can view/delete documents
export const GET = withSecurity(handleGet, { requiredRole: 'member' });
export const DELETE = withSecurity(handleDelete, { requiredRole: 'member' });
