import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, successResponse, errorResponse, notFoundError } from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';
import { applyPIIMasking } from '@/lib/pii-masking';

async function handleGet(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        // Extract ID from URL
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        const id = pathParts[pathParts.indexOf('investigation') + 1];

        // Get investigation
        const { data: investigation, error: invError } = await supabase
            .from('intelink_investigations')
            .select('*')
            .eq('id', id)
            .single();

        if (invError || !investigation) {
            return notFoundError('Operação');
        }

        // TENANT ISOLATION: Verify ownership (unless super_admin)
        if (auth.unitId && auth.systemRole !== 'super_admin' && investigation.unit_id !== auth.unitId) {
            console.log(`[Investigation API] Access denied: user unit ${auth.unitId} != investigation unit ${investigation.unit_id}`);
            return NextResponse.json({ error: 'Acesso negado: operação de outra unidade' }, { status: 403 });
        }

        // Get all data in parallel (including documents which are the main evidence source)
        // FILTER: Exclude soft-deleted items (deleted_at IS NULL)
        const [entitiesRes, relationshipsRes, evidenceRes, documentsRes] = await Promise.all([
            supabase.from('intelink_entities').select('*').eq('investigation_id', id).is('deleted_at', null).order('created_at', { ascending: false }),
            supabase.from('intelink_relationships').select('*').eq('investigation_id', id).is('deleted_at', null),
            supabase.from('intelink_evidence').select('*').eq('investigation_id', id).is('deleted_at', null).order('created_at', { ascending: false }),
            supabase.from('intelink_documents').select('*').eq('investigation_id', id).is('deleted_at', null).order('created_at', { ascending: false })
        ]);
        
        // Map documents to evidence format for unified display
        const mappedDocuments = (documentsRes.data || []).map(doc => ({
            id: doc.id,
            investigation_id: doc.investigation_id,
            type: 'DOCUMENT', // All docs show as DOCUMENT type
            description: doc.title,
            url: doc.external_storage_url,
            created_at: doc.created_at,
            metadata: {
                summary: doc.summary,
                natureza: doc.natureza,
                document_type: doc.document_type,
                numero_ocorrencia: doc.numero_ocorrencia
            }
        }));
        
        // Combine legacy evidence + documents
        const combinedEvidence = [
            ...(evidenceRes.data || []),
            ...mappedDocuments
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        // Apply PII masking based on user role
        const userRole = auth.systemRole || 'visitor';
        const maskedEntities = applyPIIMasking(entitiesRes.data || [], userRole);
        
        return successResponse({
            investigation,
            entities: maskedEntities,
            relationships: relationshipsRes.data || [],
            evidence: combinedEvidence
        });

    } catch (e: any) {
        console.error('[Investigation API] Error:', e);
        return errorResponse(e.message || 'Erro ao buscar operação');
    }
}

// PATCH: Update investigation details (title, description)
async function handlePatch(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        const id = pathParts[pathParts.indexOf('investigation') + 1];

        // Parse body
        const body = await req.json();
        const { title, description } = body;

        if (!title?.trim()) {
            return NextResponse.json({ error: 'Nome da operação é obrigatório' }, { status: 400 });
        }

        // Get investigation first for ownership check
        const { data: investigation, error: invError } = await supabase
            .from('intelink_investigations')
            .select('id, unit_id')
            .eq('id', id)
            .single();

        if (invError || !investigation) {
            return notFoundError('Operação');
        }

        // TENANT ISOLATION: Verify ownership
        if (auth.unitId && auth.systemRole !== 'super_admin' && investigation.unit_id !== auth.unitId) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        // Update
        const { data, error } = await supabase
            .from('intelink_investigations')
            .update({
                title: title.trim(),
                description: description?.trim() || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[Investigation PATCH] Error:', error);
            return errorResponse('Erro ao atualizar operação');
        }

        return successResponse({ investigation: data, message: 'Operação atualizada' });

    } catch (e: any) {
        console.error('[Investigation PATCH] Error:', e);
        return errorResponse(e.message || 'Erro ao atualizar operação');
    }
}

// Protected: Only member+ can view investigation details
export const GET = withSecurity(handleGet, { requiredRole: 'member' });
export const PATCH = withSecurity(handlePatch, { requiredRole: 'member' });
