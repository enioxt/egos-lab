'use client';

export const dynamic = 'force-dynamic';

/**
 * Telemetry Dashboard
 * 
 * Visualizes:
 * - Event counts by type
 * - Prompt classifications
 * - Performance metrics
 * - User activity
 * 
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import {
    BarChart3, Activity, Clock, Users, MessageSquare,
    FileText, Search, RefreshCw, Download, Loader2,
    TrendingUp, AlertTriangle, CheckCircle2, XCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRole, AccessDenied, RoleLoading } from '@/hooks/useRole';

interface TelemetryStats {
    totalEvents: number;
    byEventType: Record<string, number>;
    byPage: Record<string, number>;
    promptCategories: Record<string, number>;
    performance: {
        avgDuration: number;
        slowestEndpoints: Array<{ endpoint: string; avgMs: number }>;
    };
}

export default function TelemetryDashboard() {
    const permissions = useRole();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<TelemetryStats | null>(null);
    const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
    const [error, setError] = useState<string | null>(null);

    // Load telemetry data
    useEffect(() => {
        if (permissions.isLoading || !permissions.canManageSystem) return;
        loadStats();
    }, [permissions.isLoading, permissions.canManageSystem, dateRange]);

    const loadStats = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
            const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
            
            const res = await fetch(`/api/telemetry/export?from=${from}&format=json`);
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.error || 'Erro ao carregar telemetria');
            }
            
            // Process data into stats
            const records = data.records || [];
            const byEventType: Record<string, number> = {};
            const byPage: Record<string, number> = {};
            const promptCategories: Record<string, number> = {};
            const endpointDurations: Record<string, { total: number; count: number }> = {};
            let totalDuration = 0;
            let durationCount = 0;
            
            for (const record of records) {
                // Count by event type
                const eventType = record.event_type || 'unknown';
                byEventType[eventType] = (byEventType[eventType] || 0) + 1;
                
                // Count by page
                const page = record.page || 'unknown';
                byPage[page] = (byPage[page] || 0) + 1;
                
                // Count prompt categories
                if (record.metadata?.prompt_category) {
                    const cat = record.metadata.prompt_category;
                    promptCategories[cat] = (promptCategories[cat] || 0) + 1;
                }
                
                // Sum durations and track by endpoint
                if (record.duration_ms) {
                    totalDuration += record.duration_ms;
                    durationCount++;
                    
                    // Track endpoint performance
                    const endpoint = record.page || record.event_type || 'unknown';
                    if (!endpointDurations[endpoint]) {
                        endpointDurations[endpoint] = { total: 0, count: 0 };
                    }
                    endpointDurations[endpoint].total += record.duration_ms;
                    endpointDurations[endpoint].count++;
                }
            }
            
            // Calculate slowest endpoints
            const slowestEndpoints = Object.entries(endpointDurations)
                .map(([endpoint, data]) => ({
                    endpoint,
                    avgMs: Math.round(data.total / data.count)
                }))
                .sort((a, b) => b.avgMs - a.avgMs)
                .slice(0, 10);
            
            setStats({
                totalEvents: records.length,
                byEventType,
                byPage,
                promptCategories,
                performance: {
                    avgDuration: durationCount > 0 ? Math.round(totalDuration / durationCount) : 0,
                    slowestEndpoints,
                },
            });
            
        } catch (e: any) {
            console.error('Error loading telemetry:', e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (format: 'json' | 'csv') => {
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
        const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        window.open(`/api/telemetry/export?from=${from}&format=${format}`, '_blank');
    };

    // RBAC: Only admins can view telemetry
    if (permissions.isLoading) return <RoleLoading />;
    if (!permissions.canManageSystem) return <AccessDenied />;

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Header */}
            <header className="bg-slate-900 border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold flex items-center gap-2">
                                <Activity className="w-6 h-6 text-blue-400" />
                                Dashboard de Telemetria
                            </h1>
                            <p className="text-sm text-slate-400 mt-1">
                                Análise de eventos e performance do sistema
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Date Range Selector */}
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value as any)}
                                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="7d">Últimos 7 dias</option>
                                <option value="30d">Últimos 30 dias</option>
                                <option value="90d">Últimos 90 dias</option>
                            </select>
                            
                            {/* Refresh */}
                            <button
                                onClick={loadStats}
                                disabled={loading}
                                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                            
                            {/* Export */}
                            <div className="relative group">
                                <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm">
                                    <Download className="w-4 h-4" />
                                    Exportar
                                </button>
                                <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl hidden group-hover:block z-10">
                                    <button
                                        onClick={() => handleExport('json')}
                                        className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-700"
                                    >
                                        JSON
                                    </button>
                                    <button
                                        onClick={() => handleExport('csv')}
                                        className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-700"
                                    >
                                        CSV
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-6 py-6">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                ) : error ? (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
                        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                        <p className="text-red-400">{error}</p>
                        <button
                            onClick={loadStats}
                            className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm"
                        >
                            Tentar novamente
                        </button>
                    </div>
                ) : stats ? (
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard
                                icon={Activity}
                                label="Total de Eventos"
                                value={stats.totalEvents}
                                color="blue"
                            />
                            <StatCard
                                icon={MessageSquare}
                                label="Mensagens de Chat"
                                value={stats.byEventType['chat_message_send'] || 0}
                                color="purple"
                            />
                            <StatCard
                                icon={FileText}
                                label="Uploads"
                                value={stats.byEventType['document_upload'] || 0}
                                color="emerald"
                            />
                            <StatCard
                                icon={Clock}
                                label="Tempo Médio (ms)"
                                value={stats.performance.avgDuration}
                                color="orange"
                            />
                        </div>

                        {/* Charts Grid */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Events by Type */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                                <h3 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4" />
                                    Eventos por Tipo
                                </h3>
                                <div className="space-y-2">
                                    {Object.entries(stats.byEventType)
                                        .sort((a, b) => b[1] - a[1])
                                        .slice(0, 8)
                                        .map(([type, count]) => (
                                            <div key={type} className="flex items-center gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm text-white truncate">{type}</div>
                                                    <div className="h-2 bg-slate-800 rounded-full mt-1 overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-500 rounded-full"
                                                            style={{ width: `${(count / stats.totalEvents) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <span className="text-sm text-slate-400 w-12 text-right">{count}</span>
                                            </div>
                                        ))}
                                </div>
                            </div>

                            {/* Prompt Categories */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                                <h3 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    Categorias de Prompts
                                </h3>
                                {Object.keys(stats.promptCategories).length > 0 ? (
                                    <div className="space-y-2">
                                        {Object.entries(stats.promptCategories)
                                            .sort((a, b) => b[1] - a[1])
                                            .map(([category, count]) => (
                                                <div key={category} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                                                    <span className="text-sm text-white">{getCategoryLabel(category)}</span>
                                                    <span className="text-sm text-slate-400">{count}</span>
                                                </div>
                                            ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500 text-center py-8">
                                        Nenhum prompt classificado ainda
                                    </p>
                                )}
                            </div>

                            {/* Top Pages */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                                <h3 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Páginas Mais Acessadas
                                </h3>
                                <div className="space-y-2">
                                    {Object.entries(stats.byPage)
                                        .sort((a, b) => b[1] - a[1])
                                        .slice(0, 8)
                                        .map(([page, count]) => (
                                            <div key={page} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                                                <span className="text-sm text-white truncate max-w-[200px]">{page || '/'}</span>
                                                <span className="text-sm text-slate-400">{count}</span>
                                            </div>
                                        ))}
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                                <h3 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" />
                                    Ações Rápidas
                                </h3>
                                <div className="space-y-3">
                                    <Link
                                        href="/api/link-prediction/accuracy?format=report"
                                        target="_blank"
                                        className="flex items-center justify-between p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                                    >
                                        <span className="text-sm">Relatório de Precisão</span>
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    </Link>
                                    <Link
                                        href="/api/entity-resolution"
                                        target="_blank"
                                        className="flex items-center justify-between p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                                    >
                                        <span className="text-sm">Entity Resolution API</span>
                                        <Users className="w-4 h-4 text-blue-400" />
                                    </Link>
                                    <button
                                        onClick={() => handleExport('json')}
                                        className="w-full flex items-center justify-between p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                                    >
                                        <span className="text-sm">Exportar Auditoria</span>
                                        <Download className="w-4 h-4 text-purple-400" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </main>
        </div>
    );
}

// Helper Components
function StatCard({ icon: Icon, label, value, color }: {
    icon: typeof Activity;
    label: string;
    value: number | string;
    color: 'blue' | 'purple' | 'emerald' | 'orange';
}) {
    const colors = {
        blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
        purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
        emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
        orange: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    };

    return (
        <div className={`${colors[color]} border rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wide opacity-80">{label}</span>
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
        </div>
    );
}

function getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
        QUERY: '🔍 Consulta',
        COMMAND: '⚡ Comando',
        ANALYSIS: '📊 Análise',
        REPORT: '📄 Relatório',
        NAVIGATION: '🧭 Navegação',
        UNKNOWN: '❓ Indefinido',
    };
    return labels[category] || category;
}
