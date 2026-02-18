/**
 * useAudit - Hook para registrar ações de auditoria
 * 
 * Uso:
 * const { logView, logSearch, logAction } = useAudit();
 * 
 * // Ao abrir uma operação
 * logView('operation', operationId, { title: 'Op Raposa' });
 * 
 * // Ao fazer uma busca
 * logSearch('CPF do prefeito');
 * 
 * // Ação genérica
 * logAction('ACCESS_GRANT', 'evidence', evidenceId, { reason: 'Investigação cruzada' });
 */

import { useCallback } from 'react';

type AuditAction = 
    | 'VIEW' 
    | 'SEARCH' 
    | 'CREATE' 
    | 'UPDATE' 
    | 'DELETE' 
    | 'AI_PROMPT' 
    | 'ACCESS_GRANT' 
    | 'ACCESS_REQUEST'
    | 'BREAK_THE_GLASS';

type ResourceType = 
    | 'operation' 
    | 'evidence' 
    | 'person' 
    | 'entity' 
    | 'report' 
    | 'member'
    | 'search';

interface AuditPayload {
    action: AuditAction;
    resource_type: ResourceType;
    resource_id?: string;
    metadata?: Record<string, unknown>;
}

export function useAudit() {
    const log = useCallback(async (payload: AuditPayload) => {
        try {
            // Get user info from localStorage (set during login)
            const chatId = localStorage.getItem('intelink_chat_id');
            
            await fetch('/api/audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...payload,
                    user_chat_id: chatId,
                    timestamp: new Date().toISOString(),
                    user_agent: navigator.userAgent,
                })
            });
        } catch (error) {
            // Silently fail - audit should not block UX
            console.warn('Audit log failed:', error);
        }
    }, []);

    const logView = useCallback((
        resourceType: ResourceType, 
        resourceId: string, 
        metadata?: Record<string, unknown>
    ) => {
        return log({
            action: 'VIEW',
            resource_type: resourceType,
            resource_id: resourceId,
            metadata
        });
    }, [log]);

    const logSearch = useCallback((searchTerm: string, metadata?: Record<string, unknown>) => {
        return log({
            action: 'SEARCH',
            resource_type: 'search',
            metadata: { term: searchTerm, ...metadata }
        });
    }, [log]);

    const logAction = useCallback((
        action: AuditAction,
        resourceType: ResourceType,
        resourceId?: string,
        metadata?: Record<string, unknown>
    ) => {
        return log({
            action,
            resource_type: resourceType,
            resource_id: resourceId,
            metadata
        });
    }, [log]);

    const logAIPrompt = useCallback((prompt: string, response?: string) => {
        return log({
            action: 'AI_PROMPT',
            resource_type: 'search',
            metadata: { 
                prompt, 
                response_preview: response?.slice(0, 200),
                has_response: !!response 
            }
        });
    }, [log]);

    const logBreakTheGlass = useCallback((
        resourceType: ResourceType,
        resourceId: string,
        justification: string
    ) => {
        return log({
            action: 'BREAK_THE_GLASS',
            resource_type: resourceType,
            resource_id: resourceId,
            metadata: { 
                justification, 
                severity: 'HIGH',
                requires_review: true 
            }
        });
    }, [log]);

    return {
        log,
        logView,
        logSearch,
        logAction,
        logAIPrompt,
        logBreakTheGlass
    };
}

export default useAudit;
