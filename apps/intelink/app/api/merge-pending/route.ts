/**
 * API: /api/merge-pending
 * 
 * GET - List pending merges
 * PATCH - Approve/Reject a merge
 * 
 * Supports quorum-based approval system
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, successResponse, errorResponse, validationError } from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';

// Quorum configuration by role
const QUORUM_CONFIG = {
    super_admin: 1,  // Super admin can approve alone
    admin: 2,        // Admins need 2 votes
    default: 3       // Regular users need 3 votes
};

async function handleGet(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(req.url);
        
        const status = searchParams.get('status') || 'pending';
        const investigationId = searchParams.get('investigation_id');
        const limit = parseInt(searchParams.get('limit') || '50');
        
        let query = supabase
            .from('intelink_merge_pending')
            .select(`
                *,
                target_entity:target_entity_id(id, name, type, metadata),
                source_entity:source_entity_id(id, name, type, metadata),
                investigation:investigation_id(id, title)
            `)
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (status !== 'all') {
            query = query.eq('status', status);
        }
        
        if (investigationId) {
            query = query.eq('investigation_id', investigationId);
        }
        
        const { data: merges, error } = await query;
        
        if (error) {
            console.error('[Merge Pending] Query error:', error);
            return errorResponse('Erro ao buscar merges pendentes', 500);
        }
        
        // Calculate stats
        const stats = {
            total: merges?.length || 0,
            pending: merges?.filter(m => m.status === 'pending').length || 0,
            approved: merges?.filter(m => m.status === 'approved').length || 0,
            rejected: merges?.filter(m => m.status === 'rejected').length || 0,
            autoApplied: merges?.filter(m => m.status === 'auto_applied').length || 0
        };
        
        return successResponse({ merges: merges || [], stats });
        
    } catch (err: any) {
        console.error('[Merge Pending] Error:', err);
        return errorResponse(err.message || 'Erro interno', 500);
    }
}

async function handlePatch(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const body = await req.json();
        
        const { mergeId, action, reason } = body;
        
        if (!mergeId || !action) {
            return validationError('mergeId e action são obrigatórios');
        }
        
        if (!['approve', 'reject'].includes(action)) {
            return validationError('action deve ser "approve" ou "reject"');
        }
        
        // Get current merge status
        const { data: merge, error: fetchError } = await supabase
            .from('intelink_merge_pending')
            .select('*')
            .eq('id', mergeId)
            .single();
        
        if (fetchError || !merge) {
            return errorResponse('Merge não encontrado', 404);
        }
        
        if (merge.status !== 'pending') {
            return errorResponse(`Merge já foi ${merge.status}`, 400);
        }
        
        // Get user role for quorum calculation
        const userRole = auth.systemRole || 'default';
        const requiredVotes = QUORUM_CONFIG[userRole as keyof typeof QUORUM_CONFIG] || QUORUM_CONFIG.default;
        
        // For super_admin, approve immediately
        if (userRole === 'super_admin' || requiredVotes === 1) {
            const newStatus = action === 'approve' ? 'approved' : 'rejected';
            
            const { error: updateError } = await supabase
                .from('intelink_merge_pending')
                .update({
                    status: newStatus,
                    current_votes: 1,
                    reviewed_at: new Date().toISOString(),
                    reviewed_by: auth.memberId
                })
                .eq('id', mergeId);
            
            if (updateError) {
                return errorResponse('Erro ao atualizar merge', 500);
            }
            
            // If approved, apply the merge to the entity
            if (action === 'approve' && merge.metadata_preview) {
                await supabase
                    .from('intelink_entities')
                    .update({ 
                        metadata: {
                            ...merge.metadata_preview,
                            _approved_by: auth.memberId,
                            _approved_at: new Date().toISOString()
                        }
                    })
                    .eq('id', merge.target_entity_id);
            }
            
            return successResponse({ 
                message: `Merge ${newStatus}`,
                status: newStatus
            });
        }
        
        // For other roles, increment vote count
        const newVotes = (merge.current_votes || 0) + 1;
        
        if (newVotes >= requiredVotes) {
            // Quorum reached
            const newStatus = action === 'approve' ? 'approved' : 'rejected';
            
            await supabase
                .from('intelink_merge_pending')
                .update({
                    status: newStatus,
                    current_votes: newVotes,
                    reviewed_at: new Date().toISOString(),
                    reviewed_by: auth.memberId
                })
                .eq('id', mergeId);
            
            // Apply merge if approved
            if (action === 'approve' && merge.metadata_preview) {
                await supabase
                    .from('intelink_entities')
                    .update({ metadata: merge.metadata_preview })
                    .eq('id', merge.target_entity_id);
            }
            
            return successResponse({ 
                message: `Merge ${newStatus} (quorum atingido: ${newVotes}/${requiredVotes})`,
                status: newStatus
            });
        } else {
            // Vote recorded, waiting for quorum
            await supabase
                .from('intelink_merge_pending')
                .update({ current_votes: newVotes })
                .eq('id', mergeId);
            
            return successResponse({ 
                message: `Voto registrado (${newVotes}/${requiredVotes})`,
                status: 'pending',
                votesNeeded: requiredVotes - newVotes
            });
        }
        
    } catch (err: any) {
        console.error('[Merge Pending] Error:', err);
        return errorResponse(err.message || 'Erro interno', 500);
    }
}

export const GET = withSecurity(handleGet, { allowPublic: false });
export const PATCH = withSecurity(handlePatch, { allowPublic: false });
