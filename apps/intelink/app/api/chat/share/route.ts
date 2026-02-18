import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, validationError } from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';

// POST - Share conversation with team members
async function handlePost(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const { session_id, member_ids, can_interact = false } = await req.json();

        if (!session_id || !member_ids || !Array.isArray(member_ids)) {
            return NextResponse.json({ 
                error: 'session_id and member_ids (array) required' 
            }, { status: 400 });
        }

        // Get member IDs from intelink_unit_members (correct table)
        const { data: members, error: membersError } = await supabase
            .from('intelink_unit_members')
            .select('id, name, role')
            .in('id', member_ids);

        if (membersError) {
            console.error('[Chat Share] Members query error:', membersError);
            return NextResponse.json({ error: 'Erro ao buscar membros' }, { status: 500 });
        }

        if (!members || members.length === 0) {
            return NextResponse.json({ error: 'Membros não encontrados' }, { status: 404 });
        }

        // Insert shares for each member (using member_id directly)
        const inserts = members.map(member => ({
            session_id,
            shared_with_member_id: member.id,
            can_interact
        }));

        if (inserts.length === 0) {
            return NextResponse.json({ 
                error: 'Membros selecionados não possuem conta de usuário' 
            }, { status: 400 });
        }

        // Try to insert, ignore duplicates
        const { data, error } = await supabase
            .from('intelink_chat_shared_access')
            .insert(inserts)
            .select();

        if (error) {
            // If duplicate error, it's fine - already shared
            if (error.code === '23505') {
                console.log('[Chat Share] Some members already have access');
            } else {
                console.error('[Chat Share] Error:', error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
        }

        // Mark session as shared
        await supabase
            .from('intelink_chat_sessions')
            .update({ is_shared: true })
            .eq('id', session_id);

        return NextResponse.json({ 
            success: true, 
            shares: data,
            count: data?.length || 0
        });

    } catch (error) {
        console.error('[Chat Share] Error:', error);
        return NextResponse.json({ error: 'Failed to share session' }, { status: 500 });
    }
}

// Protected: Only member+ can share chat sessions
export const POST = withSecurity(handlePost, { requiredRole: 'member' });

// DELETE - Remove participant from conversation
export async function DELETE(req: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(req.url);
        const conversationId = searchParams.get('conversation_id');
        const memberId = searchParams.get('member_id');

        if (!conversationId || !memberId) {
            return validationError('conversation_id e member_id são obrigatórios');
        }

        const { error } = await supabase
            .from('intelink_chat_participants')
            .delete()
            .eq('conversation_id', conversationId)
            .eq('member_id', memberId);

        if (error) {
            console.error('[Chat Unshare] Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (e) {
        console.error('[Chat Unshare API] Error:', e);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// GET - Get available team members to share with
export async function GET(req: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(req.url);
        const conversationId = searchParams.get('conversation_id');
        const unitId = searchParams.get('unit_id');

        // Get all team members
        let query = supabase
            .from('intelink_unit_members')
            .select('id, name, role, rank')
            .order('name');

        if (unitId) {
            query = query.eq('unit_id', unitId);
        }

        const { data: members, error: membersError } = await query;

        if (membersError) {
            return NextResponse.json({ error: membersError.message }, { status: 500 });
        }

        // If conversation_id provided, mark who's already a participant
        if (conversationId) {
            const { data: participants } = await supabase
                .from('intelink_chat_participants')
                .select('member_id')
                .eq('conversation_id', conversationId);

            const participantIds = new Set(participants?.map(p => p.member_id) || []);
            
            const enrichedMembers = members?.map(m => ({
                ...m,
                isParticipant: participantIds.has(m.id)
            }));

            return NextResponse.json({ members: enrichedMembers || [] });
        }

        return NextResponse.json({ members: members || [] });

    } catch (e) {
        console.error('[Chat Members API] Error:', e);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
