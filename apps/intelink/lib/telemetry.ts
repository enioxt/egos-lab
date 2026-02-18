/**
 * Intelink Telemetry Service
 * Tracks user actions and page performance
 */

interface TelemetryEvent {
    event_type: string;
    page: string;
    action?: string;
    metadata?: Record<string, any>;
    duration_ms?: number;
    timestamp: string;
}

class TelemetryService {
    private queue: TelemetryEvent[] = [];
    private flushInterval: number = 5000; // 5 seconds
    private timer: NodeJS.Timeout | null = null;

    constructor() {
        if (typeof window !== 'undefined') {
            this.startAutoFlush();
        }
    }

    /**
     * Track a page view
     */
    trackPageView(page: string, metadata?: Record<string, any>) {
        this.addEvent({
            event_type: 'page_view',
            page,
            metadata,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Track an action (click, submit, etc.)
     */
    trackAction(page: string, action: string, metadata?: Record<string, any>) {
        this.addEvent({
            event_type: 'action',
            page,
            action,
            metadata,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Track performance metrics
     */
    trackPerformance(page: string, action: string, durationMs: number, metadata?: Record<string, any>) {
        this.addEvent({
            event_type: 'performance',
            page,
            action,
            duration_ms: durationMs,
            metadata,
            timestamp: new Date().toISOString()
        });

        // Log slow operations
        if (durationMs > 3000) {
            console.warn(`[Telemetry] Slow operation: ${page}/${action} took ${durationMs}ms`);
        }
    }

    /**
     * Start a timer and return a function to stop it
     */
    startTimer(page: string, action: string): () => void {
        const startTime = performance.now();
        return () => {
            const duration = Math.round(performance.now() - startTime);
            this.trackPerformance(page, action, duration);
        };
    }

    private addEvent(event: TelemetryEvent) {
        this.queue.push(event);
        
        // Immediate flush for performance events
        if (event.event_type === 'performance' && this.queue.length >= 5) {
            this.flush();
        }
    }

    private startAutoFlush() {
        this.timer = setInterval(() => {
            this.flush();
        }, this.flushInterval);
    }

    private async flush() {
        if (this.queue.length === 0) return;

        const events = [...this.queue];
        this.queue = [];

        try {
            // Send to API
            await fetch('/api/telemetry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ events })
            });
        } catch (e) {
            // Re-queue failed events
            this.queue = [...events, ...this.queue];
            console.error('[Telemetry] Failed to flush:', e);
        }
    }

    /**
     * Force flush all queued events
     */
    forceFlush() {
        this.flush();
    }

    /**
     * Stop auto-flush timer
     */
    destroy() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        this.flush();
    }
}

// Singleton instance
export const telemetry = typeof window !== 'undefined' ? new TelemetryService() : null;

// Helper hooks for React
export function usePageTelemetry(page: string) {
    if (typeof window !== 'undefined' && telemetry) {
        telemetry.trackPageView(page);
    }
}

export function useLoadTimer(page: string, action: string) {
    if (typeof window !== 'undefined' && telemetry) {
        return telemetry.startTimer(page, action);
    }
    return () => {};
}
