/**
 * Notification Service
 * 
 * Handles push notifications for new matches and important events.
 * Integrates with Telegram bot for real-time notifications.
 * 
 * @version 1.0.0
 * @updated 2025-12-06
 */

import { getSupabaseAdmin } from './api-utils';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN_INTELINK;

export type NotificationType = 
    | 'new_match'
    | 'match_confirmed'
    | 'match_rejected'
    | 'investigation_update'
    | 'permission_changed'
    | 'ingestion_complete'
    | 'rho_alert';

interface NotificationPayload {
    type: NotificationType;
    title: string;
    message: string;
    actionUrl?: string;
    investigationId?: string;
    investigationTitle?: string;
    entityId?: string;
    entityName?: string;
    confidence?: number;
    metadata?: Record<string, any>;
}

interface NotificationTarget {
    memberId: string;
    telegramChatId?: number | string;
    unitId?: string;
}

/**
 * Create notification record in database
 */
async function createNotificationRecord(
    target: NotificationTarget,
    payload: NotificationPayload
): Promise<void> {
    const supabase = getSupabaseAdmin();
    
    await supabase.from('intelink_notifications').insert({
        user_id: target.telegramChatId || target.memberId,
        notification_type: payload.type,
        investigation_id: payload.investigationId,
        investigation_title: payload.investigationTitle,
        ai_summary: payload.message,
        ai_detected_links: payload.metadata ? [payload.metadata] : null,
        sent: false,
        created_at: new Date().toISOString()
    });
}

/**
 * Send Telegram notification
 */
async function sendTelegramNotification(
    chatId: number | string,
    payload: NotificationPayload
): Promise<boolean> {
    if (!TELEGRAM_BOT_TOKEN || !chatId) {
        return false;
    }
    
    const numericChatId = typeof chatId === 'string' ? parseInt(chatId) : chatId;
    if (numericChatId < 0) {
        console.log('[Notification] Skipping group chat:', chatId);
        return false;
    }
    
    try {
        const emoji = getNotificationEmoji(payload.type);
        const text = `${emoji} *${payload.title}*\n\n${payload.message}`;
        
        const buttons = payload.actionUrl ? {
            inline_keyboard: [[{
                text: '🔗 Ver detalhes',
                url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://intelink.vercel.app'}${payload.actionUrl}`
            }]]
        } : undefined;
        
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: 'Markdown',
                reply_markup: buttons
            })
        });
        
        return response.ok;
    } catch (error) {
        console.error('[Notification] Telegram error:', error);
        return false;
    }
}

function getNotificationEmoji(type: NotificationType): string {
    const emojis: Record<NotificationType, string> = {
        new_match: '🔗',
        match_confirmed: '✅',
        match_rejected: '❌',
        investigation_update: '📋',
        permission_changed: '🔐',
        ingestion_complete: '📄',
        rho_alert: '🚨'
    };
    return emojis[type] || '🔔';
}

/**
 * Notify member about a new match
 */
export async function notifyNewMatch(
    match: {
        sourceEntityName: string;
        targetEntityName: string;
        confidence: number;
        investigationId: string;
        investigationTitle: string;
        matchReason?: string;
    },
    targetMemberIds: string[]
): Promise<void> {
    const supabase = getSupabaseAdmin();
    
    const { data: members } = await supabase
        .from('intelink_unit_members')
        .select('id, telegram_chat_id, unit_id')
        .in('id', targetMemberIds);
    
    if (!members?.length) return;
    
    const payload: NotificationPayload = {
        type: 'new_match',
        title: 'Novo Vínculo Detectado',
        message: `Possível ligação entre "${match.sourceEntityName}" e "${match.targetEntityName}" (${match.confidence}% confiança)${match.matchReason ? `\n\n📎 ${match.matchReason}` : ''}`,
        actionUrl: `/central/vinculos`,
        investigationId: match.investigationId,
        investigationTitle: match.investigationTitle,
        confidence: match.confidence,
        metadata: { source: match.sourceEntityName, target: match.targetEntityName }
    };
    
    for (const member of members) {
        await createNotificationRecord(
            { memberId: member.id, telegramChatId: member.telegram_chat_id, unitId: member.unit_id },
            payload
        );
        
        if (member.telegram_chat_id) {
            await sendTelegramNotification(member.telegram_chat_id, payload);
        }
    }
}

/**
 * Notify unit members about investigation update
 */
export async function notifyInvestigationUpdate(
    investigationId: string,
    investigationTitle: string,
    updateType: 'new_entity' | 'new_relationship' | 'status_change',
    details: string
): Promise<void> {
    const supabase = getSupabaseAdmin();
    
    // Get investigation team members
    const { data: members } = await supabase
        .from('intelink_unit_members')
        .select('id, telegram_chat_id')
        .limit(50);
    
    if (!members?.length) return;
    
    const payload: NotificationPayload = {
        type: 'investigation_update',
        title: `Atualização: ${investigationTitle}`,
        message: details,
        actionUrl: `/investigation/${investigationId}`,
        investigationId,
        investigationTitle
    };
    
    for (const member of members) {
        await createNotificationRecord(
            { memberId: member.id, telegramChatId: member.telegram_chat_id },
            payload
        );
    }
}

/**
 * Notify about match confirmation/rejection
 */
export async function notifyMatchDecision(
    matchId: string,
    decision: 'confirmed' | 'rejected',
    entityNames: { source: string; target: string },
    decidedBy: string,
    investigationId?: string
): Promise<void> {
    const supabase = getSupabaseAdmin();
    
    const { data: members } = await supabase
        .from('intelink_unit_members')
        .select('id, telegram_chat_id')
        .limit(20);
    
    if (!members?.length) return;
    
    const payload: NotificationPayload = {
        type: decision === 'confirmed' ? 'match_confirmed' : 'match_rejected',
        title: decision === 'confirmed' ? 'Vínculo Confirmado' : 'Vínculo Rejeitado',
        message: `${entityNames.source} ↔ ${entityNames.target}\n\nDecisão por: ${decidedBy}`,
        actionUrl: investigationId ? `/investigation/${investigationId}` : '/central/vinculos',
        investigationId
    };
    
    for (const member of members) {
        await createNotificationRecord(
            { memberId: member.id, telegramChatId: member.telegram_chat_id },
            payload
        );
    }
}

/**
 * Get unread notifications count for a member
 */
export async function getUnreadCount(memberId: string): Promise<number> {
    const supabase = getSupabaseAdmin();
    
    const { count } = await supabase
        .from('intelink_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', memberId)
        .eq('sent', false);
    
    return count || 0;
}

/**
 * Mark notifications as read
 */
export async function markAsRead(notificationIds: string[]): Promise<void> {
    const supabase = getSupabaseAdmin();
    
    await supabase
        .from('intelink_notifications')
        .update({ sent: true, sent_at: new Date().toISOString() })
        .in('id', notificationIds);
}

/**
 * Notify about Rho Protocol alert (critical/extreme centralization)
 * 
 * @param alert - Rho alert data
 * @param unitId - Optional unit ID to filter recipients
 */
export async function notifyRhoAlert(
    alert: {
        investigationId: string;
        investigationTitle: string;
        rhoScore: number;
        rhoStatus: 'critical' | 'extreme';
        alertType: 'hub_detected' | 'entropy_drop' | 'isolation_detected' | 'critical_threshold';
        entityName?: string;
    },
    unitId?: string
): Promise<void> {
    const supabase = getSupabaseAdmin();
    
    // Get admins and chiefs to notify
    let query = supabase
        .from('intelink_unit_members')
        .select('id, telegram_chat_id, name, system_role')
        .eq('active', true)
        .in('system_role', ['super_admin', 'unit_admin']);
    
    if (unitId) {
        query = query.eq('unit_id', unitId);
    }
    
    const { data: members } = await query;
    
    if (!members?.length) {
        console.log('[Notification] No admins to notify for Rho alert');
        return;
    }
    
    // Build alert message
    const statusEmoji = alert.rhoStatus === 'extreme' ? '🔴' : '🟠';
    const statusLabel = alert.rhoStatus === 'extreme' ? 'EXTREMO' : 'CRÍTICO';
    const scorePercent = (alert.rhoScore * 100).toFixed(1);
    
    const alertMessages: Record<string, string> = {
        hub_detected: `Entidade "${alert.entityName || 'desconhecida'}" concentra muitos vínculos`,
        entropy_drop: 'Diversidade de informações reduziu significativamente',
        isolation_detected: 'Existem grupos isolados de entidades não conectadas',
        critical_threshold: `Índice Rho ultrapassou limite de segurança`
    };
    
    const payload: NotificationPayload = {
        type: 'rho_alert',
        title: `${statusEmoji} Alerta Rho ${statusLabel}`,
        message: [
            `📋 *${alert.investigationTitle}*`,
            ``,
            `⚠️ ${alertMessages[alert.alertType] || 'Centralização detectada'}`,
            ``,
            `📊 Índice Rho: ${scorePercent}%`,
            `🎯 Status: ${statusLabel}`,
            ``,
            `💡 _Recomendação: Diversifique as fontes de informação para reduzir o risco de visão de túnel._`
        ].join('\n'),
        actionUrl: `/investigation/${alert.investigationId}`,
        investigationId: alert.investigationId,
        investigationTitle: alert.investigationTitle,
        metadata: {
            rho_score: alert.rhoScore,
            rho_status: alert.rhoStatus,
            alert_type: alert.alertType
        }
    };
    
    let sent = 0;
    for (const member of members) {
        // Save notification record
        await createNotificationRecord(
            { memberId: member.id, telegramChatId: member.telegram_chat_id },
            payload
        );
        
        // Send Telegram notification
        if (member.telegram_chat_id) {
            const success = await sendTelegramNotification(member.telegram_chat_id, payload);
            if (success) sent++;
        }
    }
    
    console.log(`[Notification] Rho alert sent to ${sent}/${members.length} members`);
}
