'use client';

import React, { useEffect, useState } from 'react';
import { Activity, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Info, ExternalLink, HelpCircle } from 'lucide-react';
import Link from 'next/link';

interface RhoHealthWidgetProps {
    investigationId: string;
    className?: string;
    compact?: boolean;
    /** Hide internal header (use when inside CollapsibleWidget) */
    hideHeader?: boolean;
    /** Callback to expose recalculate function to parent */
    onRecalculate?: () => void;
}

interface RhoData {
    rho_score: number | null;
    rho_status: 'healthy' | 'warning' | 'critical' | 'extreme' | 'unknown';
    rho_calculated_at: string | null;
    total_entities?: number;
    total_relationships?: number;
    top_contributor?: string;
}

const STATUS_CONFIG = {
    healthy: {
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/20',
        border: 'border-emerald-500/30',
        icon: CheckCircle,
        label: 'Saudável',
        description: 'Rede bem distribuída'
    },
    warning: {
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/20',
        border: 'border-yellow-500/30',
        icon: AlertTriangle,
        label: 'Atenção',
        description: 'Concentração moderada detectada'
    },
    critical: {
        color: 'text-orange-400',
        bg: 'bg-orange-500/20',
        border: 'border-orange-500/30',
        icon: AlertTriangle,
        label: 'Crítico',
        description: 'Alta centralização - risco de viés'
    },
    extreme: {
        color: 'text-red-400',
        bg: 'bg-red-500/20',
        border: 'border-red-500/30',
        icon: AlertTriangle,
        label: 'Extremo',
        description: 'Visão de túnel detectada!'
    },
    unknown: {
        color: 'text-slate-400',
        bg: 'bg-slate-500/20',
        border: 'border-slate-500/30',
        icon: Info,
        label: 'Não calculado',
        description: 'Execute a análise Rho'
    }
};

export default function RhoHealthWidget({ 
    investigationId, 
    className = '',
    compact = false,
    hideHeader = false
}: RhoHealthWidgetProps) {
    const [data, setData] = useState<RhoData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchRhoData();
    }, [investigationId]);

    const fetchRhoData = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/rho/status?investigation_id=${investigationId}`);
            
            if (!res.ok) {
                throw new Error('Failed to fetch Rho data');
            }
            
            const json = await res.json();
            setData(json);
        } catch (e: any) {
            setError(e.message);
            // Set default data for display
            setData({
                rho_score: null,
                rho_status: 'unknown',
                rho_calculated_at: null
            });
        } finally {
            setLoading(false);
        }
    };

    const calculateRho = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/rho/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ investigation_id: investigationId })
            });
            
            if (!res.ok) {
                throw new Error('Failed to calculate Rho');
            }
            
            const json = await res.json();
            setData(json);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={`bg-slate-900/50 rounded-lg p-4 ${className}`}>
                <div className="animate-pulse flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-700 rounded-full"></div>
                    <div className="flex-1">
                        <div className="h-4 bg-slate-700 rounded w-24 mb-2"></div>
                        <div className="h-3 bg-slate-700 rounded w-32"></div>
                    </div>
                </div>
            </div>
        );
    }

    const status = data?.rho_status || 'unknown';
    const config = STATUS_CONFIG[status];
    const Icon = config.icon;
    const score = data?.rho_score ?? null;

    // Compact version for sidebars
    if (compact) {
        return (
            <div 
                className={`flex items-center gap-2 px-3 py-2 rounded-lg ${config.bg} ${config.border} border ${className}`}
                title={config.description}
            >
                <Icon className={`w-4 h-4 ${config.color}`} />
                <span className={`text-sm font-medium ${config.color}`}>
                    ρ = {score !== null ? score.toFixed(4) : '—'}
                </span>
            </div>
        );
    }

    // Full widget
    return (
        <div className={`${hideHeader ? '' : 'bg-slate-900/50 rounded-xl border border-slate-800'} overflow-hidden ${className}`}>
            {/* Header - hidden when inside CollapsibleWidget */}
            {!hideHeader && (
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-400" />
                        <span className="font-medium text-white">Índice Rho</span>
                    </div>
                    <button
                        onClick={calculateRho}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        disabled={loading}
                    >
                        Recalcular
                    </button>
                </div>
            )}

            {/* Body */}
            <div className="p-4">
                {/* Score Display */}
                <div className="flex items-center gap-4 mb-4">
                    <div className={`w-16 h-16 rounded-full ${config.bg} ${config.border} border-2 flex items-center justify-center`}>
                        <Icon className={`w-8 h-8 ${config.color}`} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className={`text-2xl font-bold ${config.color}`}>
                                {score !== null ? (score * 100).toFixed(1) + '%' : '—'}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded ${config.bg} ${config.color}`}>
                                {config.label}
                            </span>
                        </div>
                        <p className="text-sm text-slate-400 mt-1">
                            {config.description}
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Distribuído</span>
                        <span>Centralizado</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-500 ${
                                status === 'healthy' ? 'bg-emerald-500' :
                                status === 'warning' ? 'bg-yellow-500' :
                                status === 'critical' ? 'bg-orange-500' :
                                status === 'extreme' ? 'bg-red-500' : 'bg-slate-600'
                            }`}
                            style={{ width: score !== null ? `${Math.min(score * 1000, 100)}%` : '0%' }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-slate-600 mt-1">
                        <span>0%</span>
                        <span>3%</span>
                        <span>6%</span>
                        <span>10%+</span>
                    </div>
                </div>

                {/* Stats */}
                {data?.total_entities !== undefined && (
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
                        <div className="text-center">
                            <div className="text-lg font-bold text-white">{data.total_entities}</div>
                            <div className="text-xs text-slate-400">Entidades</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold text-white">{data.total_relationships}</div>
                            <div className="text-xs text-slate-400">Vínculos</div>
                        </div>
                    </div>
                )}

                {/* Top Contributor Warning */}
                {data?.top_contributor && status !== 'healthy' && (
                    <div className="mt-3 p-2 bg-slate-800/50 rounded-lg">
                        <p className="text-xs text-slate-400">
                            <span className="text-slate-300 font-medium">{data.top_contributor}</span>
                            {' '}concentra a maior parte das conexões
                        </p>
                    </div>
                )}

                {/* Last calculated */}
                {data?.rho_calculated_at && (
                    <div className="mt-3 text-xs text-slate-500 text-center">
                        Calculado em {new Date(data.rho_calculated_at).toLocaleString('pt-BR')}
                    </div>
                )}

                {/* Link to full Rho explanation */}
                <Link 
                    href="/central/saude"
                    className="mt-4 flex items-center justify-center gap-2 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-blue-400 text-sm transition-colors"
                >
                    <HelpCircle className="w-4 h-4" />
                    <span>O que é o Índice Rho?</span>
                    <ExternalLink className="w-3 h-3" />
                </Link>
            </div>
        </div>
    );
}
