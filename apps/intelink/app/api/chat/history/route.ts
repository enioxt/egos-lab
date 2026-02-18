/**
 * Chat History API
 * 
 * GET: Lista sessões de chat
 * POST: Cria nova sessão ou adiciona mensagem
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, parseIntSafe } from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';

// GET: List chat sessions
async function handleGet(request: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(request.url);
        const mode = searchParams.get('mode');
        const investigationId = searchParams.get('investigation_id');
        const limit = parseIntSafe(searchParams.get('limit'), 20);

        let query = supabase
            .from('intelink_chat_sessions')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(limit);

        if (mode) {
            query = query.eq('mode', mode);
        }

        if (investigationId) {
            query = query.eq('investigation_id', investigationId);
        }

        const { data: sessions, error } = await query;

        if (error) {
            console.error('[Chat History] Error:', error);
            // Se tabela não existe, retorna lista vazia
            if (error.code === '42P01' || error.message?.includes('does not exist')) {
                return NextResponse.json({ sessions: [] });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ sessions: sessions || [] });

    } catch (error) {
        console.error('[Chat History] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }
}

// POST: Create session or add message
async function handlePost(request: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const body = await request.json();
        const { action, sessionId, mode, investigationId, role, content, tokens, contextSize } = body;

        if (action === 'create_session') {
            // Create new session
            const { data: session, error } = await supabase
                .from('intelink_chat_sessions')
                .insert({
                    mode: mode || 'single',
                    investigation_id: investigationId || null,
                    title: content?.substring(0, 100) || 'Nova conversa',
                    message_count: 0,
                    total_tokens: 0
                })
                .select()
                .single();

            if (error) {
                console.error('[Chat History] Create session error:', error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ session });

        } else if (action === 'add_message') {
            if (!sessionId) {
                return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
            }

            // Add message
            const { data: message, error: msgError } = await supabase
                .from('intelink_chat_messages')
                .insert({
                    session_id: sessionId,
                    role: role || 'user',
                    content: content,
                    tokens: tokens || null,
                    context_size: contextSize || null
                })
                .select()
                .single();

            if (msgError) {
                console.error('[Chat History] Add message error:', msgError);
                return NextResponse.json({ error: msgError.message }, { status: 500 });
            }

            // Update session stats (simple increment)
            const { data: currentSession } = await supabase
                .from('intelink_chat_sessions')
                .select('message_count, total_tokens')
                .eq('id', sessionId)
                .single();

            if (currentSession) {
                await supabase
                    .from('intelink_chat_sessions')
                    .update({ 
                        message_count: (currentSession.message_count || 0) + 1,
                        total_tokens: (currentSession.total_tokens || 0) + (tokens || 0)
                    })
                    .eq('id', sessionId);
            }

            return NextResponse.json({ message });

        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

    } catch (error) {
        console.error('[Chat History] Error:', error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}

// Protected: Only authenticated users can access chat history
export const GET = withSecurity(handleGet, { requiredRole: 'visitor' });
export const POST = withSecurity(handlePost, { requiredRole: 'visitor' });
