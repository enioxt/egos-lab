/**
 * useTelemetry Hook
 * 
 * Registra todas as ações do usuário para análise e auditoria.
 * Envia eventos para /api/telemetry em batch a cada 5 segundos.
 * 
 * @example
 * const { track, trackPageView, trackError } = useTelemetry();
 * track('button_click', { button: 'save' });
 * trackPageView('/investigation/123');
 * trackError(new Error('Something went wrong'));
 */

import { useCallback, useEffect, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface TelemetryEvent {
    event: string;
    properties?: Record<string, any>;
    timestamp: number;
    sessionId: string;
    userId?: string;
    page?: string;
}

interface TelemetryConfig {
    batchSize?: number;
    flushInterval?: number; // ms
    endpoint?: string;
    enabled?: boolean;
    debug?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: TelemetryConfig = {
    batchSize: 10,
    flushInterval: 5000,
    endpoint: '/api/telemetry',
    enabled: true,
    debug: false,
};

// Standard events
export const TELEMETRY_EVENTS = {
    // Navigation
    PAGE_VIEW: 'page_view',
    PAGE_LEAVE: 'page_leave',
    
    // Investigations
    INVESTIGATION_CREATE: 'investigation_create',
    INVESTIGATION_VIEW: 'investigation_view',
    INVESTIGATION_ARCHIVE: 'investigation_archive',
    INVESTIGATION_DELETE: 'investigation_delete',
    
    // Entities
    ENTITY_CREATE: 'entity_create',
    ENTITY_UPDATE: 'entity_update',
    ENTITY_DELETE: 'entity_delete',
    ENTITY_VIEW: 'entity_view',
    
    // Graph
    GRAPH_VIEW: 'graph_view',
    GRAPH_NODE_CLICK: 'graph_node_click',
    GRAPH_ZOOM: 'graph_zoom',
    
    // Chat
    CHAT_MESSAGE_SEND: 'chat_message_send',
    CHAT_SUGGESTION_CLICK: 'chat_suggestion_click',
    
    // Documents
    DOCUMENT_UPLOAD: 'document_upload',
    DOCUMENT_PROCESS: 'document_process',
    DOCUMENT_VIEW: 'document_view',
    
    // Links/Matches
    LINK_CONFIRM: 'link_confirm',
    LINK_REJECT: 'link_reject',
    LINK_VIEW: 'link_view',
    
    // Auth
    LOGIN: 'login',
    LOGOUT: 'logout',
    
    // Errors
    ERROR: 'error',
    API_ERROR: 'api_error',
    
    // UI
    MODAL_OPEN: 'modal_open',
    MODAL_CLOSE: 'modal_close',
    BUTTON_CLICK: 'button_click',
    SEARCH: 'search',
    FILTER_CHANGE: 'filter_change',
} as const;

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

let sessionId: string | null = null;

function getSessionId(): string {
    if (sessionId) return sessionId;
    
    // Try to get from sessionStorage
    if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem('telemetry_session_id');
        if (stored) {
            sessionId = stored;
            return sessionId;
        }
        
        // Generate new session ID
        sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('telemetry_session_id', sessionId);
    }
    
    return sessionId || 'unknown';
}

// ============================================================================
// EVENT QUEUE
// ============================================================================

const eventQueue: TelemetryEvent[] = [];
let flushTimer: NodeJS.Timeout | null = null;

async function flushEvents(config: TelemetryConfig): Promise<void> {
    if (eventQueue.length === 0) return;
    if (!config.enabled) return;
    
    const events = [...eventQueue];
    eventQueue.length = 0; // Clear queue
    
    if (config.debug) {
        console.log('[Telemetry] Flushing events:', events);
    }
    
    try {
        const response = await fetch(config.endpoint!, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ events }),
        });
        
        if (!response.ok && config.debug) {
            console.warn('[Telemetry] Flush failed:', response.status);
        }
    } catch (error) {
        if (config.debug) {
            console.warn('[Telemetry] Flush error:', error);
        }
        // Re-add events to queue on failure
        eventQueue.unshift(...events);
    }
}

// ============================================================================
// HOOK
// ============================================================================

export function useTelemetry(customConfig?: Partial<TelemetryConfig>) {
    const config = useRef({ ...DEFAULT_CONFIG, ...customConfig });
    
    // Setup flush interval
    useEffect(() => {
        if (!config.current.enabled) return;
        
        flushTimer = setInterval(() => {
            flushEvents(config.current);
        }, config.current.flushInterval);
        
        // Flush on page unload
        const handleBeforeUnload = () => {
            if (eventQueue.length > 0) {
                navigator.sendBeacon(
                    config.current.endpoint!,
                    JSON.stringify({ events: eventQueue })
                );
            }
        };
        
        window.addEventListener('beforeunload', handleBeforeUnload);
        
        return () => {
            if (flushTimer) clearInterval(flushTimer);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);
    
    // Track generic event
    const track = useCallback((
        event: string,
        properties?: Record<string, any>
    ) => {
        if (!config.current.enabled) return;
        
        const userId = typeof window !== 'undefined' 
            ? localStorage.getItem('intelink_member_id') || undefined
            : undefined;
        
        const telemetryEvent: TelemetryEvent = {
            event,
            properties,
            timestamp: Date.now(),
            sessionId: getSessionId(),
            userId,
            page: typeof window !== 'undefined' ? window.location.pathname : undefined,
        };
        
        eventQueue.push(telemetryEvent);
        
        if (config.current.debug) {
            console.log('[Telemetry] Event:', telemetryEvent);
        }
        
        // Flush if batch size reached
        if (eventQueue.length >= config.current.batchSize!) {
            flushEvents(config.current);
        }
    }, []);
    
    // Track page view
    const trackPageView = useCallback((path?: string) => {
        track(TELEMETRY_EVENTS.PAGE_VIEW, {
            path: path || (typeof window !== 'undefined' ? window.location.pathname : undefined),
            referrer: typeof document !== 'undefined' ? document.referrer : undefined,
        });
    }, [track]);
    
    // Track error
    const trackError = useCallback((error: Error | string, context?: Record<string, any>) => {
        track(TELEMETRY_EVENTS.ERROR, {
            message: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined,
            ...context,
        });
    }, [track]);
    
    // Track API error
    const trackApiError = useCallback((endpoint: string, status: number, message?: string) => {
        track(TELEMETRY_EVENTS.API_ERROR, {
            endpoint,
            status,
            message,
        });
    }, [track]);
    
    // Track button click
    const trackClick = useCallback((buttonId: string, context?: Record<string, any>) => {
        track(TELEMETRY_EVENTS.BUTTON_CLICK, {
            buttonId,
            ...context,
        });
    }, [track]);
    
    // Track search
    const trackSearch = useCallback((query: string, resultsCount?: number) => {
        track(TELEMETRY_EVENTS.SEARCH, {
            query,
            resultsCount,
        });
    }, [track]);
    
    return {
        track,
        trackPageView,
        trackError,
        trackApiError,
        trackClick,
        trackSearch,
        EVENTS: TELEMETRY_EVENTS,
    };
}

// ============================================================================
// STANDALONE TRACK FUNCTION
// ============================================================================

export function track(event: string, properties?: Record<string, any>): void {
    const userId = typeof window !== 'undefined' 
        ? localStorage.getItem('intelink_member_id') || undefined
        : undefined;
    
    eventQueue.push({
        event,
        properties,
        timestamp: Date.now(),
        sessionId: getSessionId(),
        userId,
        page: typeof window !== 'undefined' ? window.location.pathname : undefined,
    });
}

export default useTelemetry;
