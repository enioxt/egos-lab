import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';

// Create a delete request that requires quorum
async function handlePost(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const body = await req.json();
        const { unit_id, requester_id, reason } = body;

        if (!unit_id || !requester_id) {
            return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
        }

        // Check if requester is super_admin
        const { data: requester } = await supabase
            .from('intelink_unit_members')
            .select('system_role, name')
            .eq('id', requester_id)
            .single();

        const isSuperAdmin = requester?.system_role === 'super_admin';

        // Get member count for quorum calculation
        const { count: memberCount } = await supabase
            .from('intelink_unit_members')
            .select('id', { count: 'exact', head: true })
            .eq('active', true);

        // Calculate required approvals
        // Super Admin: needs only 1 more approval
        // Regular: needs (members/2) + 1
        const requiredApprovals = isSuperAdmin ? 1 : Math.floor((memberCount || 0) / 2) + 1;

        // Create delete request
        const { data: request, error } = await supabase
            .from('intelink_delete_requests')
            .insert({
                entity_type: 'unit',
                entity_id: unit_id,
                requester_id,
                reason: reason || 'Solicitação de exclusão de delegacia',
                required_approvals: requiredApprovals,
                current_approvals: 1, // Requester counts as first approval
                status: requiredApprovals === 1 ? 'approved' : 'pending',
                approvers: [requester_id]
            })
            .select()
            .single();

        if (error) {
            // If table doesn't exist, try to execute deletion directly for super_admin
            if (error.code === '42P01' && isSuperAdmin) {
                // Direct delete for super_admin (fallback)
                const { error: deleteError } = await supabase
                    .from('intelink_police_units')
                    .delete()
                    .eq('id', unit_id);

                if (deleteError) {
                    return NextResponse.json({ error: deleteError.message }, { status: 500 });
                }

                return NextResponse.json({ 
                    success: true, 
                    message: 'Delegacia excluída diretamente (Super Admin)',
                    directDelete: true
                });
            }
            
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // If already approved (super_admin + 1 = 1), execute deletion
        if (request.status === 'approved') {
            await supabase
                .from('intelink_police_units')
                .delete()
                .eq('id', unit_id);

            return NextResponse.json({ 
                success: true, 
                message: 'Delegacia excluída com sucesso',
                request 
            });
        }

        return NextResponse.json({ 
            success: true, 
            message: `Solicitação criada. Necessário ${requiredApprovals - 1} aprovação(ões) adicional(is).`,
            request,
            requiredApprovals,
            pendingApprovals: requiredApprovals - 1
        });

    } catch (e) {
        console.error('[Delete Request] Error:', e);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// Approve a pending delete request
async function handlePatch(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const body = await req.json();
        const { request_id, approver_id } = body;

        if (!request_id || !approver_id) {
            return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
        }

        // Get the request
        const { data: request, error: fetchError } = await supabase
            .from('intelink_delete_requests')
            .select('*')
            .eq('id', request_id)
            .single();

        if (fetchError || !request) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        if (request.status !== 'pending') {
            return NextResponse.json({ error: 'Request is not pending' }, { status: 400 });
        }

        // Check if approver already approved
        if (request.approvers?.includes(approver_id)) {
            return NextResponse.json({ error: 'You already approved this request' }, { status: 400 });
        }

        const newApprovals = request.current_approvals + 1;
        const newApprovers = [...(request.approvers || []), approver_id];
        const isApproved = newApprovals >= request.required_approvals;

        // Update request
        const { error: updateError } = await supabase
            .from('intelink_delete_requests')
            .update({
                current_approvals: newApprovals,
                approvers: newApprovers,
                status: isApproved ? 'approved' : 'pending',
                approved_at: isApproved ? new Date().toISOString() : null
            })
            .eq('id', request_id);

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        // If approved, execute deletion
        if (isApproved) {
            await supabase
                .from('intelink_police_units')
                .delete()
                .eq('id', request.entity_id);

            return NextResponse.json({ 
                success: true, 
                message: 'Quorum atingido! Delegacia excluída.',
                approved: true
            });
        }

        return NextResponse.json({ 
            success: true, 
            message: `Aprovação registrada. Faltam ${request.required_approvals - newApprovals} aprovação(ões).`,
            approved: false,
            remaining: request.required_approvals - newApprovals
        });

    } catch (e) {
        console.error('[Delete Approval] Error:', e);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// Protected: Only unit_admin+ can request/approve deletions
export const POST = withSecurity(handlePost, { requiredRole: 'unit_admin' });
export const PATCH = withSecurity(handlePatch, { requiredRole: 'unit_admin' });
