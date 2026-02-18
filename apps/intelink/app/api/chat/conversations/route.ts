import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, parseIntSafe, validationError } from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';

// GET - List conversations for current user
async function handleGet(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(req.url);
        const memberId = searchParams.get('member_id');
        const limit = parseIntSafe(searchParams.get('limit'), 50);

        if (!memberId) {
            return validationError('member_id é obrigatório');
        }

        // Get conversations where user is owner OR participant
        const { data: conversations, error } = await supabase
            .from('intelink_chat_conversations')
            .select(`
                *,
                participants:intelink_chat_participants(
                    member_id,
                    member:intelink_unit_members(name, role)
                )
            `)
            .or(`owner_id.eq.${memberId},participants.member_id.eq.${memberId}`)
            .order('updated_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('[Chat Conversations] Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ conversations: conversations || [] });

    } catch (e) {
        console.error('[Chat Conversations API] Error:', e);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// POST - Create new conversation
async function handlePost(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const { title, owner_id, investigation_id, participants } = await req.json();

        if (!owner_id) {
            return validationError('owner_id é obrigatório');
        }

        // Create conversation
        const { data: conversation, error: convError } = await supabase
            .from('intelink_chat_conversations')
            .insert({
                title: title || 'Nova Conversa',
                owner_id,
                investigation_id: investigation_id || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (convError) {
            console.error('[Chat Create] Error:', convError);
            return NextResponse.json({ error: convError.message }, { status: 500 });
        }

        // Add owner as participant
        await supabase
            .from('intelink_chat_participants')
            .insert({
                conversation_id: conversation.id,
                member_id: owner_id,
                role: 'owner'
            });

        // Add other participants if provided
        if (participants && Array.isArray(participants)) {
            const participantInserts = participants.map((p: string) => ({
                conversation_id: conversation.id,
                member_id: p,
                role: 'participant'
            }));
            
            await supabase
                .from('intelink_chat_participants')
                .insert(participantInserts);
        }

        return NextResponse.json({ conversation });

    } catch (e) {
        console.error('[Chat Create API] Error:', e);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// Protected: Only authenticated users can access chat
export const GET = withSecurity(handleGet, { requiredRole: 'visitor' });
export const POST = withSecurity(handlePost, { requiredRole: 'visitor' });
