/**
 * GET /api/chat/shared
 * 
 * Lista conversas compartilhadas (agrupadas por sessão)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';

async function handleGet(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        
        // Get all shared access records with session details
        const { data: sharedAccess, error: accessError } = await supabase
            .from('intelink_chat_shared_access')
            .select('session_id, shared_with_member_id, can_interact, created_at')
            .order('created_at', { ascending: false });

        if (accessError) {
            console.error('[Chat Shared] Access error:', accessError);
            if (accessError.code === '42P01') {
                return NextResponse.json({ sessions: [] });
            }
            return NextResponse.json({ error: accessError.message }, { status: 500 });
        }

        if (!sharedAccess || sharedAccess.length === 0) {
            return NextResponse.json({ sessions: [] });
        }

        // Get unique session IDs
        const sessionIds = [...new Set(sharedAccess.map(a => a.session_id))];

        // Get session details
        const { data: sessions, error: sessionsError } = await supabase
            .from('intelink_chat_sessions')
            .select('id, title, mode, message_count, created_at')
            .in('id', sessionIds);

        if (sessionsError) {
            console.error('[Chat Shared] Sessions error:', sessionsError);
            return NextResponse.json({ sessions: [] });
        }

        // Get member names for shared_with_member_id
        const memberIds = sharedAccess
            .filter(a => a.shared_with_member_id)
            .map(a => a.shared_with_member_id);

        let memberMap: Record<string, string> = {};
        if (memberIds.length > 0) {
            const { data: members } = await supabase
                .from('intelink_unit_members')
                .select('id, name')
                .in('id', memberIds);
            
            memberMap = (members || []).reduce((acc, m) => {
                acc[m.id] = m.name;
                return acc;
            }, {} as Record<string, string>);
        }

        // Group shares by session
        const sessionSharesMap = sharedAccess.reduce((acc, share) => {
            if (!acc[share.session_id]) {
                acc[share.session_id] = {
                    members: [],
                    can_interact: share.can_interact,
                    shared_at: share.created_at
                };
            }
            if (share.shared_with_member_id) {
                acc[share.session_id].members.push(
                    memberMap[share.shared_with_member_id] || 'Membro'
                );
            }
            return acc;
        }, {} as Record<string, { members: string[], can_interact: boolean, shared_at: string }>);

        // Build response with session details and share info
        const enrichedSessions = (sessions || []).map(session => ({
            id: session.id,
            title: session.title || 'Conversa compartilhada',
            mode: session.mode,
            message_count: session.message_count,
            created_at: session.created_at,
            shared_with: sessionSharesMap[session.id]?.members || [],
            can_interact: sessionSharesMap[session.id]?.can_interact || false,
            shared_at: sessionSharesMap[session.id]?.shared_at
        }));

        return NextResponse.json({ sessions: enrichedSessions });

    } catch (error) {
        console.error('[Chat Shared] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch shared sessions' }, { status: 500 });
    }
}

// Protected: Only member+ can view shared sessions
export const GET = withSecurity(handleGet, { requiredRole: 'member' });
