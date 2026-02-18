/**
 * POST /api/entities/merge
 * 
 * Entity Merge API - Detect duplicates, suggest merges, perform with rollback
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withSecurity, AuthContext } from '@/lib/api-security';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DETECT DUPLICATES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function detectDuplicates(investigationId: string) {
    const { data, error } = await supabase.rpc('detect_entity_duplicates_same_investigation', {
        p_investigation_id: investigationId
    });

    if (error) {
        console.error('Error detecting duplicates:', error);
        throw error;
    }

    return data || [];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CREATE DIFF
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function createDiff(entityA: any, entityB: any): Record<string, any> {
    const diff: Record<string, any> = {};
    
    // Compare basic fields
    const fields = ['name', 'type', 'cpf', 'rg', 'birth_date', 'mother_name', 'father_name'];
    
    for (const field of fields) {
        const valA = entityA[field] || entityA.metadata?.[field];
        const valB = entityB[field] || entityB.metadata?.[field];
        
        if (valA !== valB && (valA || valB)) {
            diff[field] = { a: valA || null, b: valB || null };
        }
    }
    
    // Compare metadata
    if (entityA.metadata && entityB.metadata) {
        for (const key of Object.keys({ ...entityA.metadata, ...entityB.metadata })) {
            if (entityA.metadata[key] !== entityB.metadata[key]) {
                diff[`metadata.${key}`] = {
                    a: entityA.metadata[key] || null,
                    b: entityB.metadata[key] || null
                };
            }
        }
    }
    
    return diff;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PERFORM MERGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function performMerge(
    sourceId: string, 
    targetId: string, 
    suggestionId: string | null,
    userId: string,
    reason?: string
) {
    // 1. Get both entities
    const { data: entities, error: fetchError } = await supabase
        .from('intelink_entities')
        .select('*')
        .in('id', [sourceId, targetId]);
    
    if (fetchError || !entities || entities.length !== 2) {
        throw new Error('Failed to fetch entities for merge');
    }
    
    const source = entities.find(e => e.id === sourceId)!;
    const target = entities.find(e => e.id === targetId)!;
    
    // 2. Create audit log entry (for rollback)
    const { data: logEntry, error: logError } = await supabase
        .from('intelink_entity_merge_log')
        .insert({
            action: 'merge',
            suggestion_id: suggestionId || null, // Now optional
            source_entity_id: sourceId,
            target_entity_id: targetId,
            source_entity_snapshot: source,
            target_entity_snapshot: target,
            performed_by: userId,
            rollback_available: true,
            reason: reason || null
        })
        .select('id')
        .single();
    
    if (logError) {
        console.error('Failed to create audit log:', logError);
        // Continue anyway - merge is more important than logging
    }
    
    // 3. Merge metadata (target wins for conflicts, but keep source extras)
    const mergedMetadata = {
        ...source.metadata,
        ...target.metadata,
        // Keep record of merge
        _merged_from: sourceId,
        _merged_at: new Date().toISOString()
    };
    
    // 4. Update target with merged data
    const { error: updateError } = await supabase
        .from('intelink_entities')
        .update({
            metadata: mergedMetadata,
            // Take the more complete name
            name: target.name.length > source.name.length ? target.name : source.name
        })
        .eq('id', targetId);
    
    if (updateError) {
        throw new Error('Failed to update target entity');
    }
    
    // 5. Update all relationships pointing to source → point to target
    await supabase
        .from('intelink_relationships')
        .update({ source_id: targetId })
        .eq('source_id', sourceId);
    
    await supabase
        .from('intelink_relationships')
        .update({ target_id: targetId })
        .eq('target_id', sourceId);
    
    // 6. Soft-delete source entity
    await supabase
        .from('intelink_entities')
        .update({ 
            metadata: { 
                ...source.metadata,
                _merged_into: targetId,
                _deleted: true,
                _deleted_at: new Date().toISOString()
            }
        })
        .eq('id', sourceId);
    
    // 7. Update suggestion status (only if suggestion exists)
    if (suggestionId) {
        await supabase
            .from('intelink_entity_merge_suggestions')
            .update({
                status: 'merged',
                merged_into_id: targetId,
                merged_at: new Date().toISOString(),
                reviewed_by: userId,
                reviewed_at: new Date().toISOString()
            })
            .eq('id', suggestionId);
    }
    
    return { merged: true, target_id: targetId, source_deleted: sourceId };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROLLBACK MERGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function rollbackMerge(logId: string, userId: string) {
    // 1. Get log entry
    const { data: log, error: logError } = await supabase
        .from('intelink_entity_merge_log')
        .select('*')
        .eq('id', logId)
        .single();
    
    if (logError || !log || !log.rollback_available) {
        throw new Error('Rollback not available');
    }
    
    // 2. Restore source entity
    const { error: restoreError } = await supabase
        .from('intelink_entities')
        .update(log.source_entity_snapshot)
        .eq('id', log.source_entity_id);
    
    if (restoreError) {
        throw new Error('Failed to restore source entity');
    }
    
    // 3. Restore target entity
    if (log.target_entity_snapshot) {
        await supabase
            .from('intelink_entities')
            .update(log.target_entity_snapshot)
            .eq('id', log.target_entity_id);
    }
    
    // 4. Mark rollback as performed
    await supabase
        .from('intelink_entity_merge_log')
        .update({
            rollback_available: false,
            rollback_performed_at: new Date().toISOString(),
            rollback_by: userId
        })
        .eq('id', logId);
    
    // 5. Update suggestion back to pending
    if (log.suggestion_id) {
        await supabase
            .from('intelink_entity_merge_suggestions')
            .update({
                status: 'pending',
                merged_into_id: null,
                merged_at: null
            })
            .eq('id', log.suggestion_id);
    }
    
    return { rolled_back: true };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HANDLERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handlePost(request: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const body = await request.json();
        const { action, investigation_id, source_id, target_id, suggestion_id, log_id, reason } = body;
        
        switch (action) {
            case 'detect':
                // Detect duplicates in investigation
                const duplicates = await detectDuplicates(investigation_id);
                
                // Create suggestions for new duplicates
                for (const dup of duplicates) {
                    // Get both entities for diff
                    const { data: entities } = await supabase
                        .from('intelink_entities')
                        .select('*')
                        .in('id', [dup.entity_a_id, dup.entity_b_id]);
                    
                    if (entities && entities.length === 2) {
                        const diff = createDiff(entities[0], entities[1]);
                        
                        await supabase
                            .from('intelink_entity_merge_suggestions')
                            .upsert({
                                entity_a_id: dup.entity_a_id,
                                entity_b_id: dup.entity_b_id,
                                investigation_id,
                                match_type: dup.match_type,
                                match_reason: dup.match_reason,
                                similarity_score: dup.similarity_score,
                                diff_data: diff,
                                status: 'pending'
                            }, { onConflict: 'entity_a_id,entity_b_id' });
                    }
                }
                
                // Get all pending suggestions
                const { data: suggestions } = await supabase
                    .from('intelink_entity_merge_suggestions')
                    .select(`
                        *,
                        entity_a:intelink_entities!intelink_entity_merge_suggestions_entity_a_id_fkey(*),
                        entity_b:intelink_entities!intelink_entity_merge_suggestions_entity_b_id_fkey(*)
                    `)
                    .eq('investigation_id', investigation_id)
                    .eq('status', 'pending');
                
                return NextResponse.json({
                    success: true,
                    count: suggestions?.length || 0,
                    suggestions
                });
            
            case 'merge':
                // Perform merge (suggestion_id now optional)
                const result = await performMerge(source_id, target_id, suggestion_id || null, auth.memberId, reason);
                return NextResponse.json({ success: true, ...result });
            
            case 'rollback':
                // Rollback merge
                const rollbackResult = await rollbackMerge(log_id, auth.memberId);
                return NextResponse.json({ success: true, ...rollbackResult });
            
            case 'reject':
                // Reject suggestion
                await supabase
                    .from('intelink_entity_merge_suggestions')
                    .update({
                        status: 'rejected',
                        reviewed_by: auth.memberId,
                        reviewed_at: new Date().toISOString()
                    })
                    .eq('id', suggestion_id);
                
                return NextResponse.json({ success: true, rejected: true });
            
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Merge API error:', error);
        return NextResponse.json(
            { error: 'Internal error', details: String(error) },
            { status: 500 }
        );
    }
}

// Protected: Only member+ can merge
export const POST = withSecurity(handlePost, { requiredRole: 'member' });
