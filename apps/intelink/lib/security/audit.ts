/**
 * 📋 Audit Module
 * 
 * Registra ações importantes para auditoria.
 * 
 * USO:
 * ```typescript
 * import { logAuditEvent } from '@/lib/security';
 * 
 * await logAuditEvent({
 *   action: 'INVESTIGATION_CREATE',
 *   userId: user.memberId,
 *   resourceId: investigation.id,
 *   details: { title: investigation.title }
 * });
 * ```
 */

import { getSupabaseAdmin } from '../api-utils';

// ============================================
// TYPES
// ============================================

export type AuditAction =
    // Auth
    | 'AUTH_LOGIN'
    | 'AUTH_LOGOUT'
    | 'AUTH_LOGIN_FAILED'
    // Investigation
    | 'INVESTIGATION_CREATE'
    | 'INVESTIGATION_UPDATE'
    | 'INVESTIGATION_DELETE'
    | 'INVESTIGATION_VIEW'
    // Entity
    | 'ENTITY_CREATE'
    | 'ENTITY_UPDATE'
    | 'ENTITY_DELETE'
    // Document
    | 'DOCUMENT_UPLOAD'
    | 'DOCUMENT_DELETE'
    | 'DOCUMENT_EXTRACT'
    // Chat
    | 'CHAT_SESSION_CREATE'
    | 'CHAT_MESSAGE_SEND'
    | 'CHAT_SHARE'
    // Admin
    | 'MEMBER_CREATE'
    | 'MEMBER_UPDATE'
    | 'MEMBER_DELETE'
    | 'UNIT_CREATE'
    | 'UNIT_UPDATE'
    // Cross-case
    | 'CROSS_CASE_ALERT_VIEW'
    | 'CROSS_CASE_ALERT_DISMISS';

export interface AuditEvent {
    /** Tipo de ação realizada */
    action: AuditAction;
    /** ID do usuário que realizou a ação */
    userId: string;
    /** ID do recurso afetado (opcional) */
    resourceId?: string;
    /** Tipo do recurso afetado */
    resourceType?: string;
    /** IP do cliente */
    ipAddress?: string;
    /** User agent */
    userAgent?: string;
    /** Detalhes adicionais (JSON) */
    details?: Record<string, unknown>;
}

// ============================================
// AUDIT LOGGING
// ============================================

/**
 * Registra evento de auditoria no banco
 */
export async function logAuditEvent(event: AuditEvent): Promise<void> {
    try {
        const supabase = getSupabaseAdmin();
        
        await supabase.from('intelink_activity_log').insert({
            action: event.action,
            user_id: event.userId,
            resource_id: event.resourceId,
            resource_type: event.resourceType,
            ip_address: event.ipAddress,
            user_agent: event.userAgent,
            details: event.details,
            created_at: new Date().toISOString(),
        });
        
    } catch (error) {
        // Não falhar a requisição principal por erro de auditoria
        console.error('[Audit] Failed to log event:', error);
    }
}

/**
 * Registra evento de auditoria (fire and forget)
 * Não bloqueia a resposta da API
 */
export function logAuditEventAsync(event: AuditEvent): void {
    // Fire and forget - não aguarda
    logAuditEvent(event).catch(() => {
        // Silently ignore - já logou erro internamente
    });
}

// ============================================
// HELPER: Extract request info
// ============================================

export function extractRequestInfo(request: Request): {
    ipAddress: string;
    userAgent: string;
} {
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded
        ? forwarded.split(',')[0].trim()
        : request.headers.get('x-real-ip') || 'unknown';
        
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    return { ipAddress, userAgent };
}

// ============================================
// SENSITIVE ACTIONS (require audit)
// ============================================

export const SENSITIVE_ACTIONS: AuditAction[] = [
    'AUTH_LOGIN',
    'AUTH_LOGIN_FAILED',
    'INVESTIGATION_DELETE',
    'ENTITY_DELETE',
    'DOCUMENT_DELETE',
    'MEMBER_DELETE',
    'CHAT_SHARE',
];

/**
 * Verifica se uma ação é sensível e requer auditoria obrigatória
 */
export function isSensitiveAction(action: AuditAction): boolean {
    return SENSITIVE_ACTIONS.includes(action);
}
