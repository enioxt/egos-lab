'use client';

export const dynamicMode = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { 
    BarChart3, PieChart, Activity, Users, Network, 
    ArrowLeft, TrendingUp, Loader2
} from 'lucide-react';
import Link from 'next/link';
import nextDynamic from 'next/dynamic';

// Dynamic import charts to reduce initial bundle size (~500KB savings)
const EntityDistributionChart = nextDynamic(
    () => import('@/components/charts/AnalyticsCharts').then(mod => mod.EntityDistributionChart),
    { 
        ssr: false,
        loading: () => (
            <div className="h-[300px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
            </div>
        )
    }
);

const StatusBarChart = nextDynamic(
    () => import('@/components/charts/AnalyticsCharts').then(mod => mod.StatusBarChart),
    { 
        ssr: false,
        loading: () => (
            <div className="h-[300px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
            </div>
        )
    }
);

interface AnalyticsData {
    entityData: { name: string; value: number }[];
    statusData: { name: string; value: number }[];
    unitData: { name: string; value: number }[];
    relationshipData: { name: string; value: number }[];
    totals: {
        entities: number;
        investigations: number;
        relationships: number;
        evidence: number;
        units: number;
    };
}

export default function AnalyticsPage() {
    const [stats, setStats] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/analytics');
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (e) {
            console.error('Error loading analytics:', e);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

    if (loading) {
        return (
            <div className="fixed inset-0 bg-slate-950 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
            <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 backdrop-blur-xl border-b border-slate-600/50 sticky top-0 z-50 px-4 md:px-6 py-3 md:py-4">
                    <div className="flex items-center gap-3 md:gap-4">
                        <Link href="/" className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-300" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-cyan-400" />
                                Análise de Dados
                            </h1>
                            <p className="text-slate-400 text-xs">Estatísticas gerais do sistema</p>
                        </div>
                    </div>
                </header>

                <main className="w-full px-6 py-6 space-y-8">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        <KpiCard 
                            icon={Activity} 
                            label="Total de Casos" 
                            value={stats?.totals.investigations || 0} 
                            color="blue" 
                        />
                        <KpiCard 
                            icon={Users} 
                            label="Entidades Mapeadas" 
                            value={stats?.totals.entities || 0} 
                            color="purple" 
                        />
                        <KpiCard 
                            icon={Network} 
                            label="Vínculos Identificados" 
                            value={stats?.totals.relationships || 0} 
                            color="emerald" 
                        />
                        <KpiCard 
                            icon={BarChart3} 
                            label="Evidências Coletadas" 
                            value={stats?.totals.evidence || 0} 
                            color="cyan" 
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Entity Distribution Chart */}
                        <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6">
                            <h3 className="font-semibold mb-6 flex items-center gap-2">
                                <PieChart className="w-5 h-5 text-blue-400" />
                                Distribuição por Tipo de Entidade
                            </h3>
                            <div className="h-[300px]">
                                <EntityDistributionChart 
                                    data={stats?.entityData || []} 
                                    colors={COLORS} 
                                />
                            </div>
                        </div>

                        {/* Investigation Status Chart */}
                        <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6">
                            <h3 className="font-semibold mb-6 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-emerald-400" />
                                Status das Operações
                            </h3>
                            <div className="h-[300px]">
                                <StatusBarChart data={stats?.statusData || []} />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

function KpiCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
    const colors: Record<string, string> = {
        blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    };

    return (
        <div className={`p-6 rounded-2xl border ${colors[color]}`}>
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-slate-950/30`}>
                    <Icon className="w-8 h-8" />
                </div>
                <div>
                    <p className="text-slate-400 text-sm">{label}</p>
                    <p className="text-3xl font-bold text-white">{value}</p>
                </div>
            </div>
        </div>
    );
}
