'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, X, Eye, ChevronRight, Bell } from 'lucide-react';

interface RhoAlert {
    id: string;
    alert_type: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    rho_score_before: number | null;
    rho_score_after: number | null;
    is_acknowledged: boolean;
    created_at: string;
}

interface TunnelVisionAlertProps {
    investigationId: string;
    onAlertClick?: (alert: RhoAlert) => void;
    className?: string;
}

const ALERT_TYPE_CONFIG: Record<string, { label: string; icon: typeof AlertTriangle; color: string }> = {
    tunnel_vision: {
        label: 'Visão de Túnel',
        icon: Eye,
        color: 'text-red-400'
    },
    information_bubble: {
        label: 'Bolha de Informação',
        icon: AlertTriangle,
        color: 'text-orange-400'
    },
    rapid_centralization: {
        label: 'Centralização Rápida',
        icon: AlertTriangle,
        color: 'text-yellow-400'
    },
    healthy_recovery: {
        label: 'Recuperação',
        icon: Bell,
        color: 'text-emerald-400'
    },
    new_contributor: {
        label: 'Novo Contribuidor',
        icon: Bell,
        color: 'text-blue-400'
    }
};

const SEVERITY_CONFIG = {
    info: {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        text: 'text-blue-400'
    },
    warning: {
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/30',
        text: 'text-yellow-400'
    },
    critical: {
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        text: 'text-red-400'
    }
};

export default function TunnelVisionAlert({
    investigationId,
    onAlertClick,
    className = ''
}: TunnelVisionAlertProps) {
    const [alerts, setAlerts] = useState<RhoAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchAlerts();
    }, [investigationId]);

    const fetchAlerts = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/rho/alerts?investigation_id=${investigationId}&unacknowledged=true`);
            
            if (!res.ok) {
                throw new Error('Failed to fetch alerts');
            }
            
            const json = await res.json();
            setAlerts(json.alerts || []);
        } catch (e) {
            console.error('Error fetching Rho alerts:', e);
            setAlerts([]);
        } finally {
            setLoading(false);
        }
    };

    const acknowledgeAlert = async (alertId: string) => {
        try {
            await fetch(`/api/rho/alerts/${alertId}/acknowledge`, {
                method: 'POST'
            });
            
            // Remove from local state
            setDismissed(prev => new Set([...prev, alertId]));
        } catch (e) {
            console.error('Error acknowledging alert:', e);
        }
    };

    const visibleAlerts = alerts.filter(a => !dismissed.has(a.id));

    if (loading) {
        return null; // Silent loading
    }

    if (visibleAlerts.length === 0) {
        return null; // No alerts = no component
    }

    return (
        <div className={`space-y-2 ${className}`}>
            {visibleAlerts.map(alert => {
                const typeConfig = ALERT_TYPE_CONFIG[alert.alert_type] || ALERT_TYPE_CONFIG.tunnel_vision;
                const severityConfig = SEVERITY_CONFIG[alert.severity];
                const Icon = typeConfig.icon;

                return (
                    <div
                        key={alert.id}
                        className={`
                            relative rounded-lg border p-3
                            ${severityConfig.bg} ${severityConfig.border}
                            transition-all duration-300 hover:scale-[1.01]
                        `}
                    >
                        {/* Dismiss button */}
                        <button
                            onClick={() => acknowledgeAlert(alert.id)}
                            className="absolute top-2 right-2 text-slate-500 hover:text-slate-300 transition-colors"
                            title="Dispensar alerta"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Content */}
                        <div 
                            className="flex items-start gap-3 cursor-pointer"
                            onClick={() => onAlertClick?.(alert)}
                        >
                            <div className={`p-2 rounded-lg ${severityConfig.bg}`}>
                                <Icon className={`w-5 h-5 ${typeConfig.color}`} />
                            </div>
                            
                            <div className="flex-1 min-w-0 pr-6">
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-medium ${severityConfig.text}`}>
                                        {typeConfig.label}
                                    </span>
                                    <span className={`text-xs px-1.5 py-0.5 rounded ${severityConfig.bg} ${severityConfig.text}`}>
                                        {alert.severity === 'critical' ? 'CRÍTICO' : 
                                         alert.severity === 'warning' ? 'ATENÇÃO' : 'INFO'}
                                    </span>
                                </div>
                                
                                <p className="text-sm text-slate-300 mt-1 line-clamp-2">
                                    {alert.message}
                                </p>

                                {/* Rho Score Change */}
                                {alert.rho_score_before !== null && alert.rho_score_after !== null && (
                                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                                        <span>ρ {(alert.rho_score_before * 100).toFixed(1)}%</span>
                                        <ChevronRight className="w-3 h-3" />
                                        <span className={alert.rho_score_after > alert.rho_score_before ? 'text-red-400' : 'text-emerald-400'}>
                                            {(alert.rho_score_after * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                )}

                                <div className="text-xs text-slate-500 mt-2">
                                    {new Date(alert.created_at).toLocaleString('pt-BR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// Export a simple banner version for headers
export function TunnelVisionBanner({ 
    investigationId, 
    className = '' 
}: { investigationId: string; className?: string }) {
    const [hasAlerts, setHasAlerts] = useState(false);
    const [criticalCount, setCriticalCount] = useState(0);

    useEffect(() => {
        const checkAlerts = async () => {
            try {
                const res = await fetch(`/api/rho/alerts?investigation_id=${investigationId}&unacknowledged=true`);
                if (res.ok) {
                    const json = await res.json();
                    const alerts = json.alerts || [];
                    setHasAlerts(alerts.length > 0);
                    setCriticalCount(alerts.filter((a: RhoAlert) => a.severity === 'critical').length);
                }
            } catch (e) {
                console.error('Error checking alerts:', e);
            }
        };

        checkAlerts();
    }, [investigationId]);

    if (!hasAlerts) return null;

    return (
        <div className={`
            flex items-center gap-2 px-3 py-2 rounded-lg
            ${criticalCount > 0 ? 'bg-red-500/20 border-red-500/30' : 'bg-yellow-500/20 border-yellow-500/30'}
            border animate-pulse
            ${className}
        `}>
            <AlertTriangle className={`w-4 h-4 ${criticalCount > 0 ? 'text-red-400' : 'text-yellow-400'}`} />
            <span className={`text-sm font-medium ${criticalCount > 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                {criticalCount > 0 
                    ? `${criticalCount} alerta${criticalCount > 1 ? 's' : ''} crítico${criticalCount > 1 ? 's' : ''} de Rho`
                    : 'Alertas de rede pendentes'}
            </span>
        </div>
    );
}
