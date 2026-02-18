import { NextRequest, NextResponse } from 'next/server';
import { 
    getSupabaseAdmin, 
    successResponse, 
    errorResponse, 
    validationError,
    parseIntSafe,
    createdResponse
} from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';

async function handleGet(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('member_id') || searchParams.get('user_id');
        const limit = parseIntSafe(searchParams.get('limit'), 20);

        if (!userId) {
            return validationError('member_id ou user_id é obrigatório');
        }

        const { data: notifs, error } = await supabase
            .from('intelink_notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.log('[Notifications] Query error:', error.message);
            return successResponse({ notifications: [] });
        }

        // Transform to notification format
        const notifications = (notifs || []).map((n: any) => ({
            id: n.id,
            type: n.notification_type === 'ingestion_complete' ? 'success' : 'info',
            title: getNotificationTitle(n),
            message: n.ai_summary || null,
            timestamp: n.created_at,
            read: n.sent || false,
            action_url: n.investigation_id ? `/investigation/${n.investigation_id}` : null
        }));

        return successResponse({ notifications });

    } catch (e: any) {
        console.error('[Notifications API] Error:', e);
        return successResponse({ notifications: [] });
    }
}

function getNotificationTitle(notif: any): string {
    if (notif.notification_type === 'ingestion_complete') {
        const count = (notif.entities_added || 0) + (notif.relationships_added || 0);
        return `${count} itens adicionados em "${notif.investigation_title || 'operação'}"`;
    }
    return notif.investigation_title || 'Nova notificação';
}

async function handlePost(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const { user_id, username, notification_type, investigation_id, investigation_title, ai_summary } = await req.json();

        if (!user_id || !notification_type) {
            return validationError('user_id e notification_type são obrigatórios');
        }

        const { data, error } = await supabase
            .from('intelink_notifications')
            .insert({
                user_id,
                username,
                notification_type,
                investigation_id,
                investigation_title,
                ai_summary,
                sent: false,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        return createdResponse({ notification: data });

    } catch (e: any) {
        console.error('[Notifications POST] Error:', e);
        return errorResponse(e.message || 'Erro ao criar notificação');
    }
}

// PATCH: Mark notifications as read
async function handlePatch(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const { notification_ids, member_id, mark_all } = await req.json();

        if (!notification_ids && !mark_all) {
            return validationError('notification_ids ou mark_all é obrigatório');
        }

        const now = new Date().toISOString();

        if (mark_all && member_id) {
            // Mark all notifications as read for this member
            const { error } = await supabase
                .from('intelink_notifications')
                .update({ sent: true, sent_at: now })
                .eq('user_id', member_id)
                .eq('sent', false);

            if (error) throw error;
            return successResponse({ marked: 'all' });
        }

        if (notification_ids?.length > 0) {
            const { error } = await supabase
                .from('intelink_notifications')
                .update({ sent: true, sent_at: now })
                .in('id', notification_ids);

            if (error) throw error;
            return successResponse({ marked: notification_ids.length });
        }

        return validationError('Nenhuma notificação para marcar');

    } catch (e: any) {
        console.error('[Notifications PATCH] Error:', e);
        return errorResponse(e.message || 'Erro ao marcar notificações');
    }
}

// Protected: Only authenticated users can access notifications
export const GET = withSecurity(handleGet, { requiredRole: 'visitor' });
export const POST = withSecurity(handlePost, { requiredRole: 'visitor' });
export const PATCH = withSecurity(handlePatch, { requiredRole: 'visitor' });
