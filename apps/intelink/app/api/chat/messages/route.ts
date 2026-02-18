import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, parseIntSafe, validationError } from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';

// GET - Get messages for a conversation
async function handleGet(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(req.url);
        const conversationId = searchParams.get('conversation_id');
        const limit = parseIntSafe(searchParams.get('limit'), 100);
        const offset = parseIntSafe(searchParams.get('offset'), 0);

        if (!conversationId) {
            return validationError('conversation_id é obrigatório');
        }

        const { data: messages, error } = await supabase
            .from('intelink_chat_messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('[Chat Messages] Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ messages: messages || [] });

    } catch (e) {
        console.error('[Chat Messages API] Error:', e);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// POST - Add message to conversation
async function handlePost(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const { conversation_id, role, content, sender_id } = await req.json();

        if (!conversation_id || !content) {
            return validationError('conversation_id e content são obrigatórios');
        }

        // Insert message
        const { data: message, error: msgError } = await supabase
            .from('intelink_chat_messages')
            .insert({
                conversation_id,
                role: role || 'user',
                content,
                sender_id: sender_id || null,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (msgError) {
            console.error('[Chat Message Insert] Error:', msgError);
            return NextResponse.json({ error: msgError.message }, { status: 500 });
        }

        // Update conversation timestamp
        await supabase
            .from('intelink_chat_conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', conversation_id);

        return NextResponse.json({ message });

    } catch (e) {
        console.error('[Chat Message API] Error:', e);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// Protected: Only authenticated users can access chat messages
export const GET = withSecurity(handleGet, { requiredRole: 'visitor' });
export const POST = withSecurity(handlePost, { requiredRole: 'visitor' });
