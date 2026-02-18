import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, successResponse, errorResponse } from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';

// GET: Fetch pending edits for an entity or investigation
async function handleGet(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(req.url);
        const entityId = searchParams.get('entity_id');
        const investigationId = searchParams.get('investigation_id');
        const status = searchParams.get('status') || 'pending';

        // Simple query without JOINs that may not exist
        let query = supabase
            .from('intelink_entity_edits')
            .select('*')
            .eq('status', status)
            .order('created_at', { ascending: false });

        if (entityId) {
            query = query.eq('entity_id', entityId);
        }
        if (investigationId) {
            query = query.eq('investigation_id', investigationId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[Edits API GET] Error:', error);
            return NextResponse.json({ edits: [], error: error.message }, { status: 200 });
        }

        return NextResponse.json({ edits: data || [] });
    } catch (e: any) {
        console.error('[Edits API GET] Exception:', e);
        return NextResponse.json({ edits: [], error: e.message }, { status: 200 });
    }
}

// POST: Propose a new edit
async function handlePost(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const body = await req.json();
        const { entity_id, investigation_id, proposed_by, proposed_by_name, changes, reason } = body;

        // Validate required fields
        const missing = [];
        if (!entity_id) missing.push('entity_id');
        if (!investigation_id) missing.push('investigation_id');
        if (!proposed_by) missing.push('proposed_by');
        if (!changes || Object.keys(changes).length === 0) missing.push('changes');

        if (missing.length > 0) {
            console.log('[Edits API POST] Missing fields:', missing, 'Body:', body);
            return NextResponse.json({ 
                error: `Campos obrigatórios faltando: ${missing.join(', ')}` 
            }, { status: 400 });
        }

        // Check if there's already a pending edit for this entity
        const { data: existing } = await supabase
            .from('intelink_entity_edits')
            .select('id')
            .eq('entity_id', entity_id)
            .eq('status', 'pending')
            .maybeSingle();

        if (existing) {
            return NextResponse.json({ 
                error: 'Já existe uma edição pendente para esta entidade. Aguarde a aprovação.' 
            }, { status: 409 });
        }

        // Create the edit proposal - using bigint chat_id for proposed_by
        const insertData = {
            entity_id,
            investigation_id,
            proposed_by: proposed_by, // bigint chat_id
            proposed_by_name: proposed_by_name || 'Usuário',
            changes,
            reason: reason || 'Sem motivo informado',
            approvals: [String(proposed_by)], // Proposer auto-approves (stored as text[])
            rejections: [],
            min_approvals: 2,
            status: 'pending'
        };

        console.log('[Edits API POST] Inserting:', insertData);

        const { data, error } = await supabase
            .from('intelink_entity_edits')
            .insert(insertData)
            .select()
            .single();

        if (error) {
            console.error('[Edits API POST] Insert error:', error);
            return NextResponse.json({ error: `Erro ao criar edição: ${error.message}` }, { status: 500 });
        }

        return NextResponse.json({ 
            success: true, 
            edit: data,
            message: 'Edição proposta. Aguardando aprovação de outro membro.'
        });
    } catch (e: any) {
        console.error('[Edits API POST] Exception:', e);
        return NextResponse.json({ error: `Erro interno: ${e.message}` }, { status: 500 });
    }
}

// PATCH: Approve or reject an edit
async function handlePatch(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const body = await req.json();
        const { edit_id, member_id, action } = body;

        if (!edit_id || !member_id || !['approve', 'reject'].includes(action)) {
            return NextResponse.json({ 
                error: 'Campos obrigatórios: edit_id, member_id, action (approve/reject)' 
            }, { status: 400 });
        }

        // Get current edit
        const { data: edit, error: fetchError } = await supabase
            .from('intelink_entity_edits')
            .select('*')
            .eq('id', edit_id)
            .single();

        if (fetchError || !edit) {
            return NextResponse.json({ error: 'Edição não encontrada' }, { status: 404 });
        }

        if (edit.status !== 'pending') {
            return NextResponse.json({ error: 'Esta edição já foi processada' }, { status: 400 });
        }

        // Check if member already voted
        if (edit.approvals?.includes(member_id) || edit.rejections?.includes(member_id)) {
            return NextResponse.json({ error: 'Você já votou nesta edição' }, { status: 400 });
        }

        let updateData: any = { updated_at: new Date().toISOString() };

        if (action === 'approve') {
            const newApprovals = [...(edit.approvals || []), member_id];
            updateData.approvals = newApprovals;

            // Check if quorum reached
            if (newApprovals.length >= edit.min_approvals) {
                updateData.status = 'approved';
                updateData.resolved_at = new Date().toISOString();

                // Apply changes to entity
                const { error: applyError } = await supabase
                    .from('intelink_entities')
                    .update(edit.changes)
                    .eq('id', edit.entity_id);

                if (applyError) {
                    console.error('[Edits API] Apply error:', applyError);
                    return NextResponse.json({ error: 'Erro ao aplicar edição' }, { status: 500 });
                }
            }
        } else {
            const newRejections = [...(edit.rejections || []), member_id];
            updateData.rejections = newRejections;

            // If rejections >= approvals needed, reject the edit
            if (newRejections.length >= edit.min_approvals) {
                updateData.status = 'rejected';
                updateData.resolved_at = new Date().toISOString();
            }
        }

        const { data: updated, error: updateError } = await supabase
            .from('intelink_entity_edits')
            .update(updateData)
            .eq('id', edit_id)
            .select()
            .single();

        if (updateError) {
            console.error('[Edits API] Update error:', updateError);
            return NextResponse.json({ error: 'Erro ao atualizar edição' }, { status: 500 });
        }

        return NextResponse.json({ 
            success: true, 
            edit: updated,
            message: updated.status === 'approved' 
                ? '✅ Edição aprovada e aplicada!' 
                : updated.status === 'rejected'
                    ? '❌ Edição rejeitada.'
                    : `Voto registrado. ${updated.approvals.length}/${updated.min_approvals} aprovações.`
        });
    } catch (e) {
        console.error('[Edits API] Error:', e);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

// Protected: Only member+ can access edits
export const GET = withSecurity(handleGet, { requiredRole: 'member' });
export const POST = withSecurity(handlePost, { requiredRole: 'member' });
export const PATCH = withSecurity(handlePatch, { requiredRole: 'member' });
