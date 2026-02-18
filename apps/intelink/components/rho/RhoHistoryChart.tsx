'use client';

import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, History, RefreshCw } from 'lucide-react';

interface Snapshot {
    id: string;
    rho_score: number;
    rho_status: string;
    total_entities: number;
    total_relationships: number;
    created_at: string;
}

interface RhoHistoryChartProps {
    investigationId: string;
    className?: string;
}

const STATUS_COLORS: Record<string, string> = {
    healthy: '#10b981',
    warning: '#f59e0b',
    critical: '#f97316',
    extreme: '#ef4444',
    unknown: '#64748b'
};

export default function RhoHistoryChart({ investigationId, className = '' }: RhoHistoryChartProps) {
    const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
    const [trend, setTrend] = useState<'improving' | 'stable' | 'worsening' | 'unknown'>('unknown');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, [investigationId]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/rho/history?investigation_id=${investigationId}&limit=20`);
            
            if (res.ok) {
                const data = await res.json();
                setSnapshots(data.snapshots || []);
                setTrend(data.trend || 'unknown');
            }
        } catch (e) {
            console.error('Error fetching Rho history:', e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={`bg-slate-900/50 rounded-xl border border-slate-800 p-4 ${className}`}>
                <div className="animate-pulse">
                    <div className="h-4 bg-slate-700 rounded w-32 mb-4"></div>
                    <div className="h-24 bg-slate-800 rounded"></div>
                </div>
            </div>
        );
    }

    if (snapshots.length === 0) {
        return (
            <div className={`bg-slate-900/50 rounded-xl border border-slate-800 p-4 ${className}`}>
                <div className="flex items-center gap-2 mb-4">
                    <History className="w-5 h-5 text-blue-400" />
                    <span className="font-medium text-white">Histórico Rho</span>
                </div>
                <p className="text-sm text-slate-400 text-center py-8">
                    Nenhum cálculo de Rho ainda. Execute uma análise para começar.
                </p>
            </div>
        );
    }

    // Prepare data for visualization (reversed for chronological order)
    const chartData = [...snapshots].reverse();
    const maxScore = Math.max(...chartData.map(s => s.rho_score), 0.1);

    const TrendIcon = trend === 'improving' ? TrendingDown : 
                      trend === 'worsening' ? TrendingUp : Minus;
    
    const trendColor = trend === 'improving' ? 'text-emerald-400' :
                       trend === 'worsening' ? 'text-red-400' : 'text-slate-400';
    
    const trendLabel = trend === 'improving' ? 'Melhorando' :
                       trend === 'worsening' ? 'Piorando' : 
                       trend === 'stable' ? 'Estável' : '';

    return (
        <div className={`bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden ${className}`}>
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-blue-400" />
                    <span className="font-medium text-white">Histórico Rho</span>
                </div>
                <div className="flex items-center gap-3">
                    {trend !== 'unknown' && (
                        <div className={`flex items-center gap-1 ${trendColor}`}>
                            <TrendIcon className="w-4 h-4" />
                            <span className="text-xs">{trendLabel}</span>
                        </div>
                    )}
                    <button
                        onClick={fetchHistory}
                        className="text-slate-400 hover:text-white transition-colors"
                        title="Atualizar"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Chart */}
            <div className="p-4">
                <div className="relative h-32">
                    {/* Threshold lines */}
                    <div className="absolute left-0 right-0 border-t border-dashed border-emerald-500/30" 
                         style={{ bottom: `${(0.03 / maxScore) * 100}%` }} />
                    <div className="absolute left-0 right-0 border-t border-dashed border-yellow-500/30" 
                         style={{ bottom: `${(0.06 / maxScore) * 100}%` }} />
                    <div className="absolute left-0 right-0 border-t border-dashed border-red-500/30" 
                         style={{ bottom: `${(0.10 / maxScore) * 100}%` }} />

                    {/* Bars */}
                    <div className="flex items-end gap-1 h-full">
                        {chartData.map((snapshot, idx) => {
                            const height = (snapshot.rho_score / maxScore) * 100;
                            const color = STATUS_COLORS[snapshot.rho_status] || STATUS_COLORS.unknown;
                            
                            return (
                                <div
                                    key={snapshot.id}
                                    className="flex-1 relative group cursor-pointer"
                                    style={{ minWidth: '8px' }}
                                >
                                    <div
                                        className="absolute bottom-0 left-0 right-0 rounded-t transition-all hover:opacity-80"
                                        style={{ 
                                            height: `${Math.max(height, 2)}%`,
                                            backgroundColor: color
                                        }}
                                    />
                                    
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                        <div className="bg-slate-800 rounded-lg p-2 shadow-lg border border-slate-700 whitespace-nowrap">
                                            <div className="text-xs font-medium text-white">
                                                ρ = {(snapshot.rho_score * 100).toFixed(2)}%
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                {new Date(snapshot.created_at).toLocaleDateString('pt-BR', {
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
                </div>

                {/* Legend */}
                <div className="flex justify-between mt-4 text-xs text-slate-500">
                    <span>{chartData[0] && new Date(chartData[0].created_at).toLocaleDateString('pt-BR')}</span>
                    <span>{chartData[chartData.length - 1] && new Date(chartData[chartData.length - 1].created_at).toLocaleDateString('pt-BR')}</span>
                </div>

                {/* Status Legend */}
                <div className="flex gap-4 mt-3 justify-center">
                    {Object.entries({ healthy: 'Saudável', warning: 'Atenção', critical: 'Crítico', extreme: 'Extremo' }).map(([key, label]) => (
                        <div key={key} className="flex items-center gap-1">
                            <div 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: STATUS_COLORS[key] }}
                            />
                            <span className="text-xs text-slate-400">{label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
