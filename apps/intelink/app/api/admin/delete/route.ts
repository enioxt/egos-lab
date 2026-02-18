/**
 * POST /api/admin/delete
 * 
 * Super Admin quick delete for testing data (within 24h of creation)
 * Also handles quorum-based deletion requests for regular users
 * 
 * Features:
 * - Super Admin: Instant delete of items created in last 24h
 * - Regular Users: Request deletion (creates vote)
 * - Visual indicator when item is flagged for deletion
 * - Prevent duplicate votes from same user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, successResponse, errorResponse, validationError } from '@/lib/api-utils';
import { withSecurity, AuthContext, forbiddenResponse } from '@/lib/api-security';

// Types of items that can be deleted
type ItemType = 'entity' | 'document' | 'evidence' | 'relationship' | 'investigation';

interface DeleteRequest {
    item_type: ItemType;
    item_id: string;
    reason?: string;
    force?: boolean; // Super admin bypass
    cascade?: boolean; // Also delete related entities/relationships
}

// Table mapping
const TABLE_MAP: Record<ItemType, string> = {
    entity: 'intelink_entities',
    document: 'intelink_documents',
    evidence: 'intelink_evidence',
    relationship: 'intelink_relationships',
    investigation: 'intelink_investigations',
};

// Quorum required for deletion (by item type)
const DELETE_QUORUM: Record<ItemType, number> = {
    entity: 2,
    document: 2,
    evidence: 2,
    relationship: 1,
    investigation: 3, // Investigations require more votes
};

async function handlePost(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const body: DeleteRequest = await req.json();
        const { item_type, item_id, reason, force, cascade } = body;

        // Validate
        if (!item_type || !TABLE_MAP[item_type]) {
            return validationError(`item_type inválido. Use: ${Object.keys(TABLE_MAP).join(', ')}`);
        }
        if (!item_id) {
            return validationError('item_id é obrigatório');
        }

        const tableName = TABLE_MAP[item_type];

        // Get item to check creation date and existence
        const { data: item, error: fetchError } = await supabase
            .from(tableName)
            .select('*')
            .eq('id', item_id)
            .single();

        if (fetchError || !item) {
            return errorResponse('Item não encontrado', 404);
        }

        // Check if already soft-deleted
        if (item.deleted_at) {
            return NextResponse.json({ 
                error: 'Este item já foi excluído',
                deleted_at: item.deleted_at
            }, { status: 400 });
        }

        // Super Admin: Instant delete for items < 24h old
        const createdAt = new Date(item.created_at);
        const hoursSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
        const isRecent = hoursSinceCreation < 24;

        if (auth.systemRole === 'super_admin' && (isRecent || force)) {
            // Soft delete immediately
            const { error: deleteError } = await supabase
                .from(tableName)
                .update({
                    deleted_at: new Date().toISOString(),
                    deleted_by: auth.memberId,
                    delete_reason: reason || 'Super Admin - Dados de teste'
                })
                .eq('id', item_id);

            if (deleteError) {
                console.error('[Admin Delete] Error:', deleteError);
                return errorResponse('Erro ao excluir: ' + deleteError.message);
            }

            // CASCADE DELETE: Also delete related entities and relationships
            let cascadeStats = { entities: 0, relationships: 0 };
            if (cascade && (item_type === 'document' || item_type === 'evidence')) {
                const now = new Date().toISOString();
                
                // Find entities that reference this document
                const { data: relatedEntities } = await supabase
                    .from('intelink_entities')
                    .select('id')
                    .eq('document_id', item_id)
                    .is('deleted_at', null);
                
                if (relatedEntities && relatedEntities.length > 0) {
                    const entityIds = relatedEntities.map(e => e.id);
                    
                    // Delete relationships involving these entities
                    const { count: relCount } = await supabase
                        .from('intelink_relationships')
                        .update({
                            deleted_at: now,
                            deleted_by: auth.memberId,
                            delete_reason: `Cascade: documento ${item_id} excluído`
                        })
                        .or(`source_entity_id.in.(${entityIds.join(',')}),target_entity_id.in.(${entityIds.join(',')})`)
                        .is('deleted_at', null);
                    
                    cascadeStats.relationships = relCount || 0;
                    
                    // Delete the entities themselves
                    const { count: entCount } = await supabase
                        .from('intelink_entities')
                        .update({
                            deleted_at: now,
                            deleted_by: auth.memberId,
                            delete_reason: `Cascade: documento ${item_id} excluído`
                        })
                        .in('id', entityIds);
                    
                    cascadeStats.entities = entCount || 0;
                }
            }

            // Log deletion
            await supabase.from('intelink_audit_logs').insert({
                action: 'admin_delete',
                entity_type: item_type,
                entity_id: item_id,
                actor_id: auth.memberId,
                actor_name: auth.memberName,
                details: {
                    reason: reason || 'Dados de teste',
                    hours_since_creation: Math.round(hoursSinceCreation * 10) / 10,
                    force: force || false,
                    cascade: cascade || false,
                    cascade_stats: cascadeStats
                }
            });

            const cascadeMsg = cascade && (cascadeStats.entities > 0 || cascadeStats.relationships > 0)
                ? ` + ${cascadeStats.entities} entidades e ${cascadeStats.relationships} relacionamentos`
                : '';

            return successResponse({
                deleted: true,
                item_type,
                item_id,
                cascade_stats: cascadeStats,
                message: `✅ Item excluído com sucesso${cascadeMsg}`
            });
        }

        // Super Admin but item > 24h old without force flag
        if (auth.systemRole === 'super_admin' && !isRecent && !force) {
            return NextResponse.json({
                error: 'Item tem mais de 24h. Use force=true para forçar exclusão.',
                hours_since_creation: Math.round(hoursSinceCreation * 10) / 10,
                requires_force: true
            }, { status: 400 });
        }

        // Regular users: Create or add to deletion request
        const requestsTable = 'intelink_deletion_requests';

        // Check if deletion request already exists
        const { data: existingRequest } = await supabase
            .from(requestsTable)
            .select('*')
            .eq('item_type', item_type)
            .eq('item_id', item_id)
            .eq('status', 'pending')
            .single();

        if (existingRequest) {
            // Check if user already voted
            const votes: Array<{ member_id: string }> = existingRequest.votes || [];
            const alreadyVoted = votes.some(v => v.member_id === auth.memberId);

            if (alreadyVoted) {
                return NextResponse.json({
                    error: 'Você já votou para excluir este item',
                    request_id: existingRequest.id,
                    current_votes: votes.length,
                    required_votes: DELETE_QUORUM[item_type],
                    already_voted: true
                }, { status: 400 });
            }

            // Add vote
            votes.push({
                member_id: auth.memberId,
                member_name: auth.memberName,
                voted_at: new Date().toISOString(),
                reason: reason || null
            } as any);

            const requiredVotes = DELETE_QUORUM[item_type];

            // Check if quorum reached
            if (votes.length >= requiredVotes) {
                // Delete the item
                await supabase
                    .from(tableName)
                    .update({
                        deleted_at: new Date().toISOString(),
                        deleted_by: 'quorum',
                        delete_reason: `Aprovado por ${votes.length} membros`
                    })
                    .eq('id', item_id);

                // Mark request as completed
                await supabase
                    .from(requestsTable)
                    .update({
                        status: 'completed',
                        votes,
                        completed_at: new Date().toISOString()
                    })
                    .eq('id', existingRequest.id);

                return successResponse({
                    deleted: true,
                    item_type,
                    item_id,
                    votes: votes.length,
                    message: `✅ Quorum atingido! Item excluído por ${votes.length} votos.`
                });
            }

            // Update votes
            await supabase
                .from(requestsTable)
                .update({ votes })
                .eq('id', existingRequest.id);

            return successResponse({
                deleted: false,
                request_id: existingRequest.id,
                current_votes: votes.length,
                required_votes: requiredVotes,
                message: `Voto registrado. Necessário ${requiredVotes - votes.length} voto(s) adicional(is).`
            });
        }

        // Create new deletion request
        const { data: newRequest, error: createError } = await supabase
            .from(requestsTable)
            .insert({
                item_type,
                item_id,
                investigation_id: item.investigation_id || null,
                status: 'pending',
                votes: [{
                    member_id: auth.memberId,
                    member_name: auth.memberName,
                    voted_at: new Date().toISOString(),
                    reason: reason || null
                }],
                created_by: auth.memberId,
                created_by_name: auth.memberName
            })
            .select()
            .single();

        if (createError) {
            console.error('[Delete Request] Create error:', createError);
            return errorResponse('Erro ao criar solicitação de exclusão');
        }

        return successResponse({
            deleted: false,
            request_id: newRequest.id,
            current_votes: 1,
            required_votes: DELETE_QUORUM[item_type],
            message: `Solicitação de exclusão criada. Necessário ${DELETE_QUORUM[item_type] - 1} voto(s) adicional(is).`
        });

    } catch (e: any) {
        console.error('[Admin Delete] Error:', e);
        return errorResponse(e.message || 'Erro interno');
    }
}

// GET: Check deletion request status
async function handleGet(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(req.url);
        const item_type = searchParams.get('item_type') as ItemType;
        const item_id = searchParams.get('item_id');
        const investigation_id = searchParams.get('investigation_id');

        let query = supabase
            .from('intelink_deletion_requests')
            .select('*')
            .eq('status', 'pending');

        if (item_type && item_id) {
            query = query.eq('item_type', item_type).eq('item_id', item_id);
        } else if (investigation_id) {
            query = query.eq('investigation_id', investigation_id);
        }

        const { data, error } = await query;

        if (error) {
            return errorResponse(error.message);
        }

        // Enrich with vote counts and user's vote status
        const enriched = (data || []).map(req => {
            const votes = req.votes || [];
            const userVoted = votes.some((v: any) => v.member_id === auth.memberId);
            const requiredVotes = DELETE_QUORUM[req.item_type as ItemType] || 2;

            return {
                ...req,
                current_votes: votes.length,
                required_votes: requiredVotes,
                user_voted: userVoted,
                progress: Math.round((votes.length / requiredVotes) * 100)
            };
        });

        return successResponse({ requests: enriched });
    } catch (e: any) {
        return errorResponse(e.message);
    }
}

export const POST = withSecurity(handlePost, { requiredRole: 'member' });
export const GET = withSecurity(handleGet, { requiredRole: 'member' });
