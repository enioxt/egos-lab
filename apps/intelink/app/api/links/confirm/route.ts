/**
 * POST /api/links/confirm
 * 
 * Confirma ou rejeita um vínculo entre entidades.
 * Implementa sistema de QUORUM baseado na confiança:
 * 
 * - 100% (CPF/RG/CNPJ): Requer 2 confirmações de usuários diferentes
 * - 90-99% (Nome+DN/Filiação): Requer 2 confirmações
 * - 70-89% (Telefone/Endereço/Nome): Requer 1 confirmação
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/api-utils';
import { notifyMatchDecision } from '@/lib/notification-service';
import { withSecurity, AuthContext } from '@/lib/api-security';

// Quorum requirements based on confidence
function getRequiredQuorum(confidence: number): number {
    if (confidence >= 100) return 2; // CPF/RG/CNPJ - máxima segurança
    if (confidence >= 90) return 2;  // Nome+DN, Nome+Filiação
    return 1; // Telefone, Endereço, Nome Similar
}

interface VoteEvidence {
    type: 'text' | 'file';
    content: string;
    fileName?: string;
    hash?: string; // SHA-256 hash for verification
}

interface ConfirmRequest {
    linkId?: string;
    sourceEntityId?: string;
    targetEntityId?: string;
    action: 'confirm' | 'reject';
    memberId: string;
    memberName: string;
    confidence: number;
    matchCriteria?: Record<string, any>;
    evidence?: VoteEvidence;
}

// Check if evidence is required for this vote
function isEvidenceRequired(
    previousVotes: Array<{ memberId: string }>, 
    confidence: number
): boolean {
    // Evidence required for 2nd+ vote on high-confidence matches
    if (confidence >= 90 && previousVotes.length >= 1) {
        return true;
    }
    return false;
}

async function handlePost(request: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const body: ConfirmRequest = await request.json();
        const { action, memberId, memberName, confidence, matchCriteria } = body;
        
        if (!memberId || !memberName) {
            return NextResponse.json({ error: 'memberId and memberName required' }, { status: 400 });
        }
        
        if (!action || !['confirm', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'action must be confirm or reject' }, { status: 400 });
        }
        
        const supabase = getSupabaseAdmin();
        const now = new Date().toISOString();
        
        // Find or create the link
        let linkId = body.linkId;
        let existingLink;
        
        if (linkId) {
            const { data } = await supabase
                .from('intelink_entity_links')
                .select('*')
                .eq('id', linkId)
                .single();
            existingLink = data;
        } else if (body.sourceEntityId && body.targetEntityId) {
            // Try to find existing link
            const { data } = await supabase
                .from('intelink_entity_links')
                .select('*')
                .eq('source_entity_id', body.sourceEntityId)
                .eq('target_entity_id', body.targetEntityId)
                .single();
            existingLink = data;
            
            // Create if doesn't exist
            if (!existingLink) {
                const { data: newLink, error: createError } = await supabase
                    .from('intelink_entity_links')
                    .insert({
                        source_entity_id: body.sourceEntityId,
                        target_entity_id: body.targetEntityId,
                        confidence_score: confidence,
                        match_criteria: matchCriteria || {},
                        status: 'pending',
                        confirmed_by: [],
                        rejected_by: [],
                        created_by: memberId
                    })
                    .select()
                    .single();
                
                if (createError) {
                    console.error('Error creating link:', createError);
                    return NextResponse.json({ error: 'Failed to create link' }, { status: 500 });
                }
                existingLink = newLink;
            }
            linkId = existingLink?.id;
        }
        
        if (!existingLink) {
            return NextResponse.json({ error: 'Link not found' }, { status: 404 });
        }
        
        // Parse existing confirmations/rejections
        const confirmedBy: Array<{ memberId: string; memberName: string; confirmedAt: string }> = 
            existingLink.confirmed_by || [];
        const rejectedBy: Array<{ memberId: string; memberName: string; rejectedAt: string }> = 
            existingLink.rejected_by || [];
        
        // Check if user already voted
        const alreadyConfirmed = confirmedBy.some(c => c.memberId === memberId);
        const alreadyRejected = rejectedBy.some(r => r.memberId === memberId);
        
        if (alreadyConfirmed || alreadyRejected) {
            return NextResponse.json({ 
                error: 'Você já votou neste vínculo',
                existingVote: alreadyConfirmed ? 'confirm' : 'reject'
            }, { status: 400 });
        }
        
        // Check if evidence is required for this vote
        const allPreviousVotes = [...confirmedBy, ...rejectedBy];
        const evidenceRequired = isEvidenceRequired(
            allPreviousVotes, 
            existingLink.confidence_score || confidence
        );
        
        if (evidenceRequired && !body.evidence) {
            return NextResponse.json({ 
                error: 'Evidência obrigatória para o 2º voto em matches de alta confiança (≥90%)',
                evidenceRequired: true,
                previousVotes: allPreviousVotes.length
            }, { status: 400 });
        }
        
        // Validate evidence if provided
        if (body.evidence) {
            if (!body.evidence.type || !body.evidence.content) {
                return NextResponse.json({ 
                    error: 'Evidência inválida: tipo e conteúdo são obrigatórios'
                }, { status: 400 });
            }
            
            // Generate hash for text evidence
            if (body.evidence.type === 'text' && !body.evidence.hash) {
                const encoder = new TextEncoder();
                const data = encoder.encode(body.evidence.content + memberId + now);
                const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                body.evidence.hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            }
        }
        
        // Add vote with evidence
        const voteData = {
            memberId,
            memberName,
            timestamp: now,
            evidence: body.evidence || null
        };
        
        if (action === 'confirm') {
            confirmedBy.push({ ...voteData, confirmedAt: now });
        } else {
            rejectedBy.push({ ...voteData, rejectedAt: now });
        }
        
        // Calculate required quorum
        const requiredQuorum = getRequiredQuorum(existingLink.confidence_score || confidence);
        
        // Determine new status
        let newStatus = 'pending';
        if (confirmedBy.length >= requiredQuorum) {
            newStatus = 'confirmed';
        } else if (rejectedBy.length >= requiredQuorum) {
            newStatus = 'rejected';
        }
        
        // Update link
        const { error: updateError } = await supabase
            .from('intelink_entity_links')
            .update({
                confirmed_by: confirmedBy,
                rejected_by: rejectedBy,
                status: newStatus,
                updated_at: now
            })
            .eq('id', linkId);
        
        if (updateError) {
            console.error('Error updating link:', updateError);
            return NextResponse.json({ error: 'Failed to update link' }, { status: 500 });
        }
        
        // Send notification if decision is final
        if (newStatus !== 'pending' && linkId) {
            try {
                // Get entity names for notification
                const { data: entities } = await supabase
                    .from('intelink_entities')
                    .select('id, name')
                    .in('id', [existingLink.source_entity_id, existingLink.target_entity_id]);
                
                const sourceEntity = entities?.find(e => e.id === existingLink.source_entity_id);
                const targetEntity = entities?.find(e => e.id === existingLink.target_entity_id);
                
                await notifyMatchDecision(
                    linkId as string,
                    newStatus as 'confirmed' | 'rejected',
                    { 
                        source: sourceEntity?.name || 'Entidade', 
                        target: targetEntity?.name || 'Entidade' 
                    },
                    memberName,
                    existingLink.investigation_id
                );
            } catch (notifError) {
                console.error('[Links/Confirm] Notification error:', notifError);
            }
        }
        
        return NextResponse.json({
            success: true,
            linkId,
            status: newStatus,
            confirmations: confirmedBy.length,
            rejections: rejectedBy.length,
            requiredQuorum,
            isComplete: newStatus !== 'pending',
            message: newStatus === 'pending' 
                ? `Voto registrado. Necessário ${requiredQuorum - (action === 'confirm' ? confirmedBy.length : rejectedBy.length)} voto(s) adicional(is).`
                : `Vínculo ${newStatus === 'confirmed' ? 'confirmado' : 'rejeitado'} com sucesso!`
        });
        
    } catch (error: any) {
        console.error('[Links/Confirm] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET: Check link status
async function handleGet(request: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const linkId = searchParams.get('linkId');
        const sourceEntityId = searchParams.get('sourceEntityId');
        const targetEntityId = searchParams.get('targetEntityId');
        
        const supabase = getSupabaseAdmin();
        
        let query = supabase.from('intelink_entity_links').select('*');
        
        if (linkId) {
            query = query.eq('id', linkId);
        } else if (sourceEntityId && targetEntityId) {
            query = query
                .eq('source_entity_id', sourceEntityId)
                .eq('target_entity_id', targetEntityId);
        } else {
            return NextResponse.json({ error: 'linkId or sourceEntityId+targetEntityId required' }, { status: 400 });
        }
        
        const { data, error } = await query.single();
        
        if (error || !data) {
            return NextResponse.json({ exists: false });
        }
        
        const requiredQuorum = getRequiredQuorum(data.confidence_score);
        
        return NextResponse.json({
            exists: true,
            link: data,
            requiredQuorum,
            confirmations: (data.confirmed_by || []).length,
            rejections: (data.rejected_by || []).length
        });
        
    } catch (error: any) {
        console.error('[Links/Confirm GET] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Protected: Only member+ can confirm/reject links
export const GET = withSecurity(handleGet, { requiredRole: 'member' });
export const POST = withSecurity(handlePost, { requiredRole: 'member' });
