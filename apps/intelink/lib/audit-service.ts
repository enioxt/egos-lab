/**
 * Audit Trail Service
 * 
 * Logs all security-relevant actions for compliance and debugging.
 * 
 * @version 1.0.0
 * @updated 2025-12-06
 */

import { getSupabaseAdmin } from './api-utils';

export type AuditAction = 
    // Frontend actions
    | 'view'
    | 'search'
    | 'create'
    | 'update'
    | 'delete'
    | 'break_the_glass'
    // Backend actions
    | 'login'
    | 'logout'
    | 'role_change'
    | 'permission_change'
    | 'investigation_create'
    | 'investigation_delete'
    | 'investigation_archive'
    | 'entity_create'
    | 'entity_delete'
    | 'link_confirm'
    | 'link_reject'
    | 'document_upload'
    | 'document_delete'
    | 'config_change'
    | 'api_access';

export interface AuditEntry {
    action: AuditAction;
    actorId: string;
    actorName: string;
    actorRole: string;
    targetType?: 'investigation' | 'entity' | 'member' | 'document' | 'link' | 'config';
    targetId?: string;
    targetName?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Log an audit entry
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
    try {
        const supabase = getSupabaseAdmin();
        
        await supabase.from('intelink_audit_logs').insert({
            action: entry.action,
            actor_id: entry.actorId,
            actor_name: entry.actorName,
            actor_role: entry.actorRole,
            target_type: entry.targetType,
            target_id: entry.targetId,
            target_name: entry.targetName,
            details: entry.details,
            ip_address: entry.ipAddress,
            user_agent: entry.userAgent,
            created_at: new Date().toISOString()
        });
    } catch (error) {
        console.error('[Audit] Failed to log:', error);
    }
}

/**
 * Log role change
 */
export async function logRoleChange(
    actor: { id: string; name: string; role: string },
    target: { id: string; name: string },
    oldRole: string,
    newRole: string
): Promise<void> {
    await logAudit({
        action: 'role_change',
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        targetType: 'member',
        targetId: target.id,
        targetName: target.name,
        details: { oldRole, newRole }
    });
}

/**
 * Log investigation action
 */
export async function logInvestigationAction(
    action: 'investigation_create' | 'investigation_delete' | 'investigation_archive',
    actor: { id: string; name: string; role: string },
    investigation: { id: string; title: string }
): Promise<void> {
    await logAudit({
        action,
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        targetType: 'investigation',
        targetId: investigation.id,
        targetName: investigation.title
    });
}

/**
 * Log link decision
 */
export async function logLinkDecision(
    decision: 'confirm' | 'reject',
    actor: { id: string; name: string; role: string },
    link: { id: string; source: string; target: string; confidence: number }
): Promise<void> {
    await logAudit({
        action: decision === 'confirm' ? 'link_confirm' : 'link_reject',
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        targetType: 'link',
        targetId: link.id,
        targetName: `${link.source} ↔ ${link.target}`,
        details: { confidence: link.confidence }
    });
}

/**
 * Get audit logs with filters
 */
export async function getAuditLogs(filters: {
    actorId?: string;
    action?: AuditAction;
    targetType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
}): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    
    let query = supabase
        .from('intelink_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(filters.limit || 100);
    
    if (filters.actorId) {
        query = query.eq('actor_id', filters.actorId);
    }
    if (filters.action) {
        query = query.eq('action', filters.action);
    }
    if (filters.targetType) {
        query = query.eq('target_type', filters.targetType);
    }
    if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
    }
    
    const { data, error } = await query;
    
    if (error) {
        console.error('[Audit] Query error:', error);
        return [];
    }
    
    return data || [];
}
