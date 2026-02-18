/**
 * POST /api/entities/merge/vote
 * 
 * Vote on entity merge suggestions
 * Allows team members to approve or reject merge candidates
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withSecurity, AuthContext } from '@/lib/api-security';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function handlePost(request: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const body = await request.json();
        const { entity1_id, entity2_id, vote } = body;
        
        if (!entity1_id || !entity2_id) {
            return NextResponse.json({ error: 'entity1_id e entity2_id são obrigatórios' }, { status: 400 });
        }
        
        if (!['approve', 'reject'].includes(vote)) {
            return NextResponse.json({ error: 'vote deve ser "approve" ou "reject"' }, { status: 400 });
        }
        
        // Check if user already voted
        const { data: existingVote } = await supabase
            .from('intelink_merge_votes')
            .select('id, vote')
            .eq('entity1_id', entity1_id)
            .eq('entity2_id', entity2_id)
            .eq('member_id', auth.memberId)
            .single();
        
        if (existingVote) {
            // Update existing vote
            const { error } = await supabase
                .from('intelink_merge_votes')
                .update({ 
                    vote,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingVote.id);
            
            if (error) {
                console.error('Error updating vote:', error);
                return NextResponse.json({ error: 'Erro ao atualizar voto' }, { status: 500 });
            }
        } else {
            // Create new vote
            const { error } = await supabase
                .from('intelink_merge_votes')
                .insert({
                    entity1_id,
                    entity2_id,
                    member_id: auth.memberId,
                    vote,
                    created_at: new Date().toISOString()
                });
            
            if (error) {
                console.error('Error creating vote:', error);
                return NextResponse.json({ error: 'Erro ao registrar voto' }, { status: 500 });
            }
        }
        
        // Get updated vote counts
        const { data: votes } = await supabase
            .from('intelink_merge_votes')
            .select('vote')
            .eq('entity1_id', entity1_id)
            .eq('entity2_id', entity2_id);
        
        const voteCounts = {
            approve: votes?.filter(v => v.vote === 'approve').length || 0,
            reject: votes?.filter(v => v.vote === 'reject').length || 0,
            total: votes?.length || 0
        };
        
        return NextResponse.json({
            success: true,
            vote,
            counts: voteCounts
        });
        
    } catch (error: any) {
        console.error('Vote API error:', error);
        return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
    }
}

// GET: Get votes for a merge candidate
async function handleGet(request: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const entity1_id = searchParams.get('entity1_id');
        const entity2_id = searchParams.get('entity2_id');
        
        if (!entity1_id || !entity2_id) {
            return NextResponse.json({ error: 'entity1_id e entity2_id são obrigatórios' }, { status: 400 });
        }
        
        // Get all votes
        const { data: votes } = await supabase
            .from('intelink_merge_votes')
            .select(`
                id, vote, created_at,
                member:intelink_members(id, name)
            `)
            .eq('entity1_id', entity1_id)
            .eq('entity2_id', entity2_id);
        
        // Get user's vote
        const userVote = votes?.find(v => (v.member as any)?.id === auth.memberId);
        
        const voteCounts = {
            approve: votes?.filter(v => v.vote === 'approve').length || 0,
            reject: votes?.filter(v => v.vote === 'reject').length || 0,
            total: votes?.length || 0
        };
        
        return NextResponse.json({
            votes: votes || [],
            counts: voteCounts,
            userVote: userVote?.vote || null
        });
        
    } catch (error: any) {
        console.error('Vote GET error:', error);
        return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
    }
}

export const POST = withSecurity(handlePost, { requiredRole: 'member' });
export const GET = withSecurity(handleGet, { requiredRole: 'member' });
