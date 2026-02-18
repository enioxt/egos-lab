/**
 * Push Notifications System
 * 
 * Sistema de notificações para alertar usuários sobre:
 * - Novos matches/vínculos detectados
 * - Atualizações em operações
 * - Mensagens da equipe
 * - Alertas de segurança
 * 
 * Suporta:
 * - Web Push API (browser)
 * - Telegram (via bot)
 * - In-app notifications (toast)
 */

// ============================================================================
// TYPES
// ============================================================================

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type NotificationChannel = 'push' | 'telegram' | 'in-app' | 'all';

export interface NotificationPayload {
    id?: string;
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: Record<string, any>;
    priority?: NotificationPriority;
    channel?: NotificationChannel;
    url?: string; // URL to open when clicked
    actions?: NotificationAction[];
}

export interface NotificationAction {
    action: string;
    title: string;
    icon?: string;
}

export interface NotificationPreferences {
    enabled: boolean;
    channels: {
        push: boolean;
        telegram: boolean;
        inApp: boolean;
    };
    quietHours?: {
        start: number; // Hour (0-23)
        end: number;
    };
    priorities: {
        low: boolean;
        normal: boolean;
        high: boolean;
        urgent: boolean;
    };
}

// ============================================================================
// DEFAULT PREFERENCES
// ============================================================================

const DEFAULT_PREFERENCES: NotificationPreferences = {
    enabled: true,
    channels: {
        push: true,
        telegram: true,
        inApp: true,
    },
    priorities: {
        low: false,
        normal: true,
        high: true,
        urgent: true,
    },
};

// ============================================================================
// PUSH NOTIFICATIONS CLASS
// ============================================================================

export class PushNotifications {
    private preferences: NotificationPreferences;
    private swRegistration: ServiceWorkerRegistration | null = null;
    private inAppListeners: Set<(notification: NotificationPayload) => void> = new Set();

    constructor(preferences?: Partial<NotificationPreferences>) {
        this.preferences = { ...DEFAULT_PREFERENCES, ...preferences };
    }

    /**
     * Initialize push notifications
     */
    async init(): Promise<boolean> {
        if (typeof window === 'undefined' || !('Notification' in window)) {
            console.warn('[Push] Notifications not supported');
            return false;
        }

        // Request permission if not granted
        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                console.warn('[Push] Permission denied');
                return false;
            }
        }

        // Register service worker for background notifications
        if ('serviceWorker' in navigator) {
            try {
                this.swRegistration = await navigator.serviceWorker.ready;
            } catch (error) {
                console.warn('[Push] Service worker not available:', error);
            }
        }

        return Notification.permission === 'granted';
    }

    /**
     * Check if notifications are enabled
     */
    isEnabled(): boolean {
        return this.preferences.enabled && Notification.permission === 'granted';
    }

    /**
     * Check if within quiet hours
     */
    private isQuietHours(): boolean {
        if (!this.preferences.quietHours) return false;
        
        const now = new Date().getHours();
        const { start, end } = this.preferences.quietHours;
        
        if (start < end) {
            return now >= start && now < end;
        } else {
            // Quiet hours span midnight
            return now >= start || now < end;
        }
    }

    /**
     * Should show notification based on priority and preferences
     */
    private shouldShow(priority: NotificationPriority): boolean {
        if (!this.preferences.enabled) return false;
        if (!this.preferences.priorities[priority]) return false;
        
        // Urgent always shows, even in quiet hours
        if (priority === 'urgent') return true;
        
        return !this.isQuietHours();
    }

    /**
     * Send a notification
     */
    async send(payload: NotificationPayload): Promise<boolean> {
        const priority = payload.priority || 'normal';
        const channel = payload.channel || 'all';

        if (!this.shouldShow(priority)) {
            return false;
        }

        const results: boolean[] = [];

        // Web Push
        if ((channel === 'all' || channel === 'push') && this.preferences.channels.push) {
            results.push(await this.sendWebPush(payload));
        }

        // Telegram
        if ((channel === 'all' || channel === 'telegram') && this.preferences.channels.telegram) {
            results.push(await this.sendTelegram(payload));
        }

        // In-app
        if ((channel === 'all' || channel === 'in-app') && this.preferences.channels.inApp) {
            results.push(this.sendInApp(payload));
        }

        return results.some(r => r);
    }

    /**
     * Send Web Push notification
     */
    private async sendWebPush(payload: NotificationPayload): Promise<boolean> {
        try {
            if (this.swRegistration) {
                // Use service worker for persistent notifications
                await this.swRegistration.showNotification(payload.title, {
                    body: payload.body,
                    icon: payload.icon || '/icons/notification-icon.png',
                    badge: payload.badge || '/icons/badge-icon.png',
                    tag: payload.tag,
                    data: { ...payload.data, url: payload.url },
                    requireInteraction: payload.priority === 'urgent',
                } as NotificationOptions);
            } else {
                // Fallback to basic Notification API
                new Notification(payload.title, {
                    body: payload.body,
                    icon: payload.icon || '/icons/notification-icon.png',
                    tag: payload.tag,
                    data: payload.data,
                });
            }
            return true;
        } catch (error) {
            console.error('[Push] Web Push error:', error);
            return false;
        }
    }

    /**
     * Send Telegram notification via API
     */
    private async sendTelegram(payload: NotificationPayload): Promise<boolean> {
        try {
            const chatId = localStorage.getItem('intelink_chat_id');
            if (!chatId) return false;

            const message = `🔔 *${payload.title}*\n\n${payload.body}`;
            
            const response = await fetch('/api/telegram/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    message,
                    parse_mode: 'Markdown',
                }),
            });

            return response.ok;
        } catch (error) {
            console.error('[Push] Telegram error:', error);
            return false;
        }
    }

    /**
     * Send in-app notification (triggers listeners)
     */
    private sendInApp(payload: NotificationPayload): boolean {
        for (const listener of this.inAppListeners) {
            try {
                listener(payload);
            } catch (error) {
                console.error('[Push] In-app listener error:', error);
            }
        }
        return this.inAppListeners.size > 0;
    }

    /**
     * Subscribe to in-app notifications
     */
    onNotification(callback: (notification: NotificationPayload) => void): () => void {
        this.inAppListeners.add(callback);
        return () => this.inAppListeners.delete(callback);
    }

    /**
     * Update preferences
     */
    setPreferences(prefs: Partial<NotificationPreferences>): void {
        this.preferences = { ...this.preferences, ...prefs };
        this.savePreferences();
    }

    /**
     * Get current preferences
     */
    getPreferences(): NotificationPreferences {
        return { ...this.preferences };
    }

    /**
     * Save preferences to localStorage
     */
    private savePreferences(): void {
        if (typeof window !== 'undefined') {
            localStorage.setItem('intelink_notification_prefs', JSON.stringify(this.preferences));
        }
    }

    /**
     * Load preferences from localStorage
     */
    loadPreferences(): void {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('intelink_notification_prefs');
            if (saved) {
                try {
                    this.preferences = { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) };
                } catch (error) {
                    console.warn('[Push] Failed to load preferences:', error);
                }
            }
        }
    }
}

// ============================================================================
// PREDEFINED NOTIFICATIONS
// ============================================================================

export const NOTIFICATION_TEMPLATES = {
    newMatch: (entityName: string, investigationTitle: string): NotificationPayload => ({
        title: '🔗 Novo Vínculo Detectado',
        body: `"${entityName}" pode estar conectado a "${investigationTitle}"`,
        priority: 'high',
        tag: 'new-match',
        url: '/central/vinculos',
    }),

    matchConfirmed: (entityA: string, entityB: string): NotificationPayload => ({
        title: '✅ Vínculo Confirmado',
        body: `Conexão entre "${entityA}" e "${entityB}" foi confirmada`,
        priority: 'normal',
        tag: 'match-confirmed',
    }),

    investigationUpdate: (title: string, update: string): NotificationPayload => ({
        title: `📋 ${title}`,
        body: update,
        priority: 'normal',
        tag: 'investigation-update',
    }),

    teamMessage: (from: string, message: string): NotificationPayload => ({
        title: `💬 Mensagem de ${from}`,
        body: message,
        priority: 'normal',
        tag: 'team-message',
    }),

    securityAlert: (message: string): NotificationPayload => ({
        title: '🚨 Alerta de Segurança',
        body: message,
        priority: 'urgent',
        tag: 'security-alert',
    }),

    reportReady: (reportName: string): NotificationPayload => ({
        title: '📊 Relatório Pronto',
        body: `O relatório "${reportName}" está pronto para download`,
        priority: 'normal',
        tag: 'report-ready',
        url: '/reports',
    }),
};

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let instance: PushNotifications | null = null;

export function getNotifications(): PushNotifications {
    if (!instance) {
        instance = new PushNotifications();
        instance.loadPreferences();
    }
    return instance;
}

// ============================================================================
// REACT HOOK
// ============================================================================

export function useNotifications() {
    const notifications = getNotifications();

    return {
        send: notifications.send.bind(notifications),
        onNotification: notifications.onNotification.bind(notifications),
        setPreferences: notifications.setPreferences.bind(notifications),
        getPreferences: notifications.getPreferences.bind(notifications),
        isEnabled: notifications.isEnabled.bind(notifications),
        init: notifications.init.bind(notifications),
        templates: NOTIFICATION_TEMPLATES,
    };
}

export default PushNotifications;
