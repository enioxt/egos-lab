/**
 * Radio Vote API
 * POST /api/radio/queue/vote - Vote on a song (up/down)
 */

import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api-rate-limit';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const supabaseAdmin = getSupabaseAdmin();

async function getUser() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

export async function POST(request: Request) {
  const rateLimited = applyRateLimit(request, 'api', '/api/radio/queue/vote');
  if (rateLimited) return rateLimited;
  try {
    const user = await getUser();

    if (!user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { queueId, voteType } = await request.json();

    if (!queueId || !['up', 'down', 'remove'].includes(voteType)) {
        return NextResponse.json({ error: 'Invalid vote' }, { status: 400 });
    }

    // Get existing vote
    const { data: existingVote } = await supabaseAdmin
        .from('volante_radio_votes')
        .select('id, vote_type')
        .eq('queue_id', queueId)
        .eq('user_id', user.id)
        .maybeSingle();

    const oldVoteType = existingVote?.vote_type;

    // Calculate vote changes
    let upvoteDelta = 0;
    let downvoteDelta = 0;

    if (voteType === 'remove' && existingVote) {
        // Remove vote
        await supabaseAdmin
            .from('volante_radio_votes')
            .delete()
            .eq('id', existingVote.id);

        if (oldVoteType === 'up') upvoteDelta = -1;
        if (oldVoteType === 'down') downvoteDelta = -1;
    } else if (existingVote) {
        // Update existing vote
        if (oldVoteType !== voteType) {
            await supabaseAdmin
                .from('volante_radio_votes')
                .update({ vote_type: voteType, updated_at: new Date().toISOString() })
                .eq('id', existingVote.id);

            if (oldVoteType === 'up') upvoteDelta = -1;
            if (oldVoteType === 'down') downvoteDelta = -1;
            if (voteType === 'up') upvoteDelta += 1;
            if (voteType === 'down') downvoteDelta += 1;
        }
    } else if (voteType !== 'remove') {
        // Insert new vote
        await supabaseAdmin
            .from('volante_radio_votes')
            .insert({
                queue_id: queueId,
                user_id: user.id,
                vote_type: voteType,
            });

        if (voteType === 'up') upvoteDelta = 1;
        if (voteType === 'down') downvoteDelta = 1;
    }

    // Update queue item counts
    if (upvoteDelta !== 0 || downvoteDelta !== 0) {
        const { data: current } = await supabaseAdmin
            .from('volante_radio_queue')
            .select('upvotes, downvotes')
            .eq('id', queueId)
            .maybeSingle();

        if (current) {
            await supabaseAdmin
                .from('volante_radio_queue')
                .update({
                    upvotes: (current.upvotes || 0) + upvoteDelta,
                    downvotes: (current.downvotes || 0) + downvoteDelta,
                })
                .eq('id', queueId);
        }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Radio Vote] Error:', err);
    return NextResponse.json({ error: 'Erro ao votar' }, { status: 500 });
  }
}
