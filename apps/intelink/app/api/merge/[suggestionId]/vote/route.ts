import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/api-utils';
import { withSecurity, SecureContext } from '@/lib/security/middleware';
import { z } from 'zod';

/**
 * Vote on a merge suggestion
 * 
 * POST /api/merge/[suggestionId]/vote
 * Body: { vote: 'confirm'|'reject'|'need_info', justification?: string, confidence?: number }
 * 
 * GET /api/merge/[suggestionId]/vote
 * Returns all votes for the suggestion
 */

const VoteSchema = z.object({
    vote: z.enum(['confirm', 'reject', 'need_info']),
    justification: z.string().optional(),
    confidence: z.number().min(0).max(1).optional(),
    additionalInfo: z.record(z.string(), z.any()).optional()
});

async function handlePost(
    req: NextRequest,
    context: SecureContext,
    { params }: { params: { suggestionId: string } }
): Promise<NextResponse> {
    const supabase = getSupabaseAdmin();
    const { suggestionId } = params;
    
    // Get member ID from session
    const memberId = req.cookies.get('intelink_member_id')?.value;
    if (!memberId) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    
    try {
        const body = await req.json();
        const validatedData = VoteSchema.parse(body);
        
        // Check if suggestion exists
        const { data: suggestion, error: suggestionError } = await supabase
            .from('intelink_entity_merge_suggestions')
            .select('id, status')
            .eq('id', suggestionId)
            .single();
        
        if (suggestionError || !suggestion) {
            return NextResponse.json({ error: 'Sugestão não encontrada' }, { status: 404 });
        }
        
        // Check if already resolved
        if (suggestion.status !== 'pending' && suggestion.status !== 'in_analysis') {
            return NextResponse.json({ 
                error: 'Esta sugestão já foi resolvida',
                status: suggestion.status 
            }, { status: 400 });
        }
        
        // Upsert vote (update if already voted)
        const { data: vote, error: voteError } = await supabase
            .from('intelink_merge_votes')
            .upsert({
                suggestion_id: suggestionId,
                member_id: memberId,
                vote: validatedData.vote,
                justification: validatedData.justification,
                confidence: validatedData.confidence,
                additional_info: validatedData.additionalInfo || {},
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'suggestion_id,member_id'
            })
            .select()
            .single();
        
        if (voteError) {
            console.error('[MergeVote] Error:', voteError);
            return NextResponse.json({ error: 'Erro ao registrar voto' }, { status: 500 });
        }
        
        // Update suggestion status to in_analysis if first vote
        await supabase
            .from('intelink_entity_merge_suggestions')
            .update({ status: 'in_analysis' })
            .eq('id', suggestionId)
            .eq('status', 'pending');
        
        // Get updated vote counts
        const { data: updatedSuggestion } = await supabase
            .from('intelink_entity_merge_suggestions')
            .select('votes_confirm, votes_reject, votes_need_info, status, auto_resolved')
            .eq('id', suggestionId)
            .single();
        
        return NextResponse.json({
            success: true,
            vote,
            suggestion: updatedSuggestion,
            message: validatedData.vote === 'confirm' 
                ? 'Voto de confirmação registrado' 
                : validatedData.vote === 'reject'
                    ? 'Voto de rejeição registrado'
                    : 'Pedido de mais informações registrado'
        });
        
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 });
        }
        console.error('[MergeVote] Error:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

async function handleGet(
    req: NextRequest,
    context: SecureContext,
    { params }: { params: { suggestionId: string } }
): Promise<NextResponse> {
    const supabase = getSupabaseAdmin();
    const { suggestionId } = params;
    
    // Get all votes for this suggestion
    const { data: votes, error: votesError } = await supabase
        .from('intelink_merge_votes')
        .select(`
            id,
            vote,
            justification,
            confidence,
            additional_info,
            created_at,
            updated_at,
            member:intelink_unit_members(id, name, role)
        `)
        .eq('suggestion_id', suggestionId)
        .order('created_at', { ascending: false });
    
    if (votesError) {
        console.error('[MergeVote] Get error:', votesError);
        return NextResponse.json({ error: 'Erro ao buscar votos' }, { status: 500 });
    }
    
    // Get suggestion with vote counts
    const { data: suggestion } = await supabase
        .from('intelink_entity_merge_suggestions')
        .select('id, status, votes_confirm, votes_reject, votes_need_info, threshold_confirm, threshold_reject, auto_resolved')
        .eq('id', suggestionId)
        .single();
    
    // Check if current user has voted
    const memberId = req.cookies.get('intelink_member_id')?.value;
    const userVote = votes?.find(v => {
        const memberData = v.member as any;
        return memberData?.id === memberId;
    });
    
    return NextResponse.json({
        votes,
        suggestion,
        userVote: userVote || null,
        canVote: suggestion?.status === 'pending' || suggestion?.status === 'in_analysis'
    });
}

export const POST = withSecurity(
    (req: NextRequest, ctx: SecureContext) => handlePost(req, ctx, { params: { suggestionId: req.url.split('/merge/')[1]?.split('/vote')[0] || '' } }),
    { auth: true, rateLimit: 'default' }
);

export const GET = withSecurity(
    (req: NextRequest, ctx: SecureContext) => handleGet(req, ctx, { params: { suggestionId: req.url.split('/merge/')[1]?.split('/vote')[0] || '' } }),
    { auth: true, rateLimit: 'default' }
);
