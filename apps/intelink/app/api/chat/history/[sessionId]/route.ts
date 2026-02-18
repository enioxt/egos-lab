/**
 * Chat Session Messages API
 * 
 * GET: Get messages for a session
 * DELETE: Delete a session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, notFoundError } from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';

// GET: Get messages for a session
async function handleGet(request: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        // Extract sessionId from URL
        const url = new URL(request.url);
        const sessionId = url.pathname.split('/').pop();

        // Get session info
        const { data: session, error: sessionError } = await supabase
            .from('intelink_chat_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (sessionError) {
            console.error('[Chat History] Session error:', sessionError);
            // Handle missing table or session not found
            if (sessionError.code === 'PGRST116' || sessionError.code === '42P01') {
                return NextResponse.json({ error: 'Session not found' }, { status: 404 });
            }
            return NextResponse.json({ error: sessionError.message }, { status: 500 });
        }

        // Get messages
        const { data: messages, error: messagesError } = await supabase
            .from('intelink_chat_messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });

        if (messagesError) {
            console.error('[Chat History] Get messages error:', messagesError);
            return NextResponse.json({ error: messagesError.message }, { status: 500 });
        }

        return NextResponse.json({ session, messages });

    } catch (error) {
        console.error('[Chat History] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
    }
}

// DELETE: Delete a session
async function handleDelete(request: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        // Extract sessionId from URL
        const url = new URL(request.url);
        const sessionId = url.pathname.split('/').pop();

        const { error } = await supabase
            .from('intelink_chat_sessions')
            .delete()
            .eq('id', sessionId);

        if (error) {
            console.error('[Chat History] Delete error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('[Chat History] Error:', error);
        return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
    }
}

// Protected: Only visitor+ can access chat history
export const GET = withSecurity(handleGet, { requiredRole: 'visitor' });
export const DELETE = withSecurity(handleDelete, { requiredRole: 'member' });
