'use client';

export const dynamic = 'force-dynamic';

/**
 * Dashboard - Telemetry & System Overview
 * 
 * Shows real-time statistics and performance metrics.
 * @route /dashboard
 */

import { useEffect, useState } from 'react';
import { 
    BarChart3, 
    Users, 
    FileSearch, 
    Link2, 
    FileText, 
    AlertTriangle,
    Building2,
    Activity,
    TrendingUp,
    Clock,
    Loader2,
    RefreshCw
} from 'lucide-react';

interface DashboardStats {
    investigations: number;
    entities: number;
    relationships: number;
    evidence: number;
    units?: number;
    members?: number;
    documents?: number;
    findings?: number;
    pendingAlerts?: number;
}

interface PerformanceStats {
    [key: string]: {
        count: number;
        avg: number;
    };
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [performance, setPerformance] = useState<PerformanceStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    
    const fetchData = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        
        try {
            // Fetch stats
            const statsRes = await fetch('/api/stats?scope=full');
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }
            
            // Fetch telemetry performance
            const telemetryRes = await fetch('/api/telemetry');
            if (telemetryRes.ok) {
                const telemetryData = await telemetryRes.json();
                setPerformance(telemetryData.stats || {});
            }
            
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
    
    useEffect(() => {
        fetchData();
        
        // Auto-refresh every 30 seconds
        const interval = setInterval(() => fetchData(true), 30000);
        return () => clearInterval(interval);
    }, []);
    
    const StatCard = ({ 
        icon: Icon, 
        label, 
        value, 
        color = 'cyan',
        subtext 
    }: { 
        icon: typeof BarChart3; 
        label: string; 
        value: number | string; 
        color?: string;
        subtext?: string;
    }) => (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-colors">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-slate-400 font-medium">{label}</p>
                    <p className={`text-3xl font-bold text-${color}-400 mt-1`}>
                        {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
                    </p>
                    {subtext && (
                        <p className="text-xs text-slate-500 mt-1">{subtext}</p>
                    )}
                </div>
                <div className={`w-12 h-12 bg-${color}-500/20 rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 text-${color}-400`} />
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Carregando métricas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <BarChart3 className="w-7 h-7 text-cyan-400" />
                        Dashboard de Métricas
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Visão geral do sistema Intelink
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {lastUpdated && (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Clock className="w-4 h-4" />
                            Atualizado: {lastUpdated.toLocaleTimeString('pt-BR')}
                        </div>
                    )}
                    <button
                        onClick={() => fetchData(true)}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Atualizar
                    </button>
                </div>
            </div>
            
            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard 
                    icon={FileSearch} 
                    label="Operações" 
                    value={stats?.investigations || 0}
                    color="cyan"
                />
                <StatCard 
                    icon={Users} 
                    label="Entidades" 
                    value={stats?.entities || 0}
                    color="blue"
                    subtext="Pessoas, veículos, locais..."
                />
                <StatCard 
                    icon={Link2} 
                    label="Vínculos" 
                    value={stats?.relationships || 0}
                    color="purple"
                />
                <StatCard 
                    icon={FileText} 
                    label="Evidências" 
                    value={stats?.evidence || 0}
                    color="emerald"
                />
            </div>
            
            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {stats?.units !== undefined && (
                    <StatCard 
                        icon={Building2} 
                        label="Unidades" 
                        value={stats.units}
                        color="amber"
                    />
                )}
                {stats?.members !== undefined && (
                    <StatCard 
                        icon={Users} 
                        label="Membros Ativos" 
                        value={stats.members}
                        color="green"
                    />
                )}
                {stats?.pendingAlerts !== undefined && (
                    <StatCard 
                        icon={AlertTriangle} 
                        label="Alertas Pendentes" 
                        value={stats.pendingAlerts}
                        color="red"
                    />
                )}
            </div>
            
            {/* Performance Section */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    Performance do Sistema
                </h2>
                
                {performance && Object.keys(performance).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(performance).slice(0, 9).map(([key, data]) => (
                            <div 
                                key={key} 
                                className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-slate-400 truncate max-w-[150px]" title={key}>
                                        {key.split('/').pop() || key}
                                    </span>
                                    <span className={`text-sm font-medium ${
                                        data.avg < 500 ? 'text-emerald-400' :
                                        data.avg < 2000 ? 'text-amber-400' :
                                        'text-red-400'
                                    }`}>
                                        {data.avg}ms
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-slate-700 rounded-full h-2">
                                        <div 
                                            className={`h-2 rounded-full ${
                                                data.avg < 500 ? 'bg-emerald-500' :
                                                data.avg < 2000 ? 'bg-amber-500' :
                                                'bg-red-500'
                                            }`}
                                            style={{ width: `${Math.min(100, (data.avg / 3000) * 100)}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-slate-500">{data.count}x</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-500">
                        <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Dados de performance serão coletados conforme o uso do sistema.</p>
                    </div>
                )}
            </div>
            
            {/* Footer */}
            <div className="mt-8 text-center text-sm text-slate-500">
                <p>INTELINK - Sistema de Inteligência Policial</p>
            </div>
        </div>
    );
}
