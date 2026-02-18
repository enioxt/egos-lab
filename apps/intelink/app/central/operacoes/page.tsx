'use client';

export const dynamic = 'force-dynamic';

/**
 * Hub de Operações - Central de Inteligência
 * 
 * Unifica:
 * - Alertas Cross-Case (conexões entre operações)
 * - Jobs de Qualidade de Dados (correções pendentes)
 * - Achados Investigativos de Alta Prioridade
 */

import React, { useEffect, useState } from 'react';
import { 
    AlertTriangle, CheckCircle, Clock, Link2,
    Users, FileText, Target, Zap, RefreshCw,
    ChevronRight, ExternalLink, Filter, Bell
} from 'lucide-react';
import Link from 'next/link';

interface CrossCaseAlert {
    id: string;
    entity_name: string;
    entity_type: string;
    match_type: string;
    confidence: number;
    severity: string;
    status: string;
    source_inv?: { id: string; title: string };
    target_inv?: { id: string; title: string };
    created_at: string;
}

interface DataJob {
    id: string;
    job_type: string;
    priority: string;
    status: string;
    entity_name: string;
    title: string;
    points_reward: number;
}

interface PriorityFinding {
    id: string;
    title: string;
    finding_type: string;
    finding_type_label: string;
    confidence: number;
    action_priority: string;
    suggested_action: string;
    investigation?: { id: string; title: string };
}

const SEVERITY_COLORS: Record<string, string> = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
};

const PRIORITY_ICONS: Record<string, React.ReactNode> = {
    immediate: <Zap className="w-4 h-4 text-red-400" />,
    high: <AlertTriangle className="w-4 h-4 text-orange-400" />,
    medium: <Clock className="w-4 h-4 text-yellow-400" />,
    low: <CheckCircle className="w-4 h-4 text-slate-400" />
};

export default function OperacoesPage() {
    const [alerts, setAlerts] = useState<CrossCaseAlert[]>([]);
    const [jobs, setJobs] = useState<DataJob[]>([]);
    const [findings, setFindings] = useState<PriorityFinding[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        pendingAlerts: 0,
        openJobs: 0,
        priorityFindings: 0
    });

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        setLoading(true);
        try {
            // Load all data in parallel
            const [alertsRes, jobsRes, findingsRes] = await Promise.all([
                fetch('/api/central/cross-case-alerts?status=pending&limit=5'),
                fetch('/api/jobs?status=open&limit=5'),
                fetch('/api/findings?priority=high&limit=5')
            ]);

            if (alertsRes.ok) {
                const data = await alertsRes.json();
                setAlerts(data.alerts || []);
                setStats(s => ({ ...s, pendingAlerts: data.count || 0 }));
            }

            if (jobsRes.ok) {
                const data = await jobsRes.json();
                setJobs(data.jobs || []);
                setStats(s => ({ ...s, openJobs: data.stats?.open || 0 }));
            }

            if (findingsRes.ok) {
                const data = await findingsRes.json();
                setFindings(data.findings || []);
                setStats(s => ({ ...s, priorityFindings: data.count || 0 }));
            }

        } catch (error) {
            console.error('Error loading operations data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Target className="w-8 h-8 text-cyan-400" />
                            Hub de Operações
                        </h1>
                        <p className="text-slate-400 mt-1">
                            Alertas, tarefas e achados que requerem atenção
                        </p>
                    </div>
                    <button
                        onClick={loadAllData}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm">Alertas Pendentes</p>
                                <p className="text-2xl font-bold text-white">{stats.pendingAlerts}</p>
                            </div>
                            <div className="p-3 bg-orange-500/20 rounded-xl">
                                <Bell className="w-6 h-6 text-orange-400" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm">Tarefas Abertas</p>
                                <p className="text-2xl font-bold text-white">{stats.openJobs}</p>
                            </div>
                            <div className="p-3 bg-blue-500/20 rounded-xl">
                                <FileText className="w-6 h-6 text-blue-400" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm">Achados Prioritários</p>
                                <p className="text-2xl font-bold text-white">{stats.priorityFindings}</p>
                            </div>
                            <div className="p-3 bg-red-500/20 rounded-xl">
                                <Zap className="w-6 h-6 text-red-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Cross-Case Alerts */}
                    <section className="bg-slate-900/50 border border-slate-700/50 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
                            <h2 className="font-semibold text-lg flex items-center gap-2 text-white">
                                <Link2 className="w-5 h-5 text-orange-400" />
                                Alertas Cross-Case
                            </h2>
                            <Link 
                                href="/central/alertas"
                                className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                            >
                                Ver todos <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="divide-y divide-slate-800/50">
                            {loading ? (
                                <div className="p-8 text-center text-slate-500">
                                    <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2" />
                                    Carregando...
                                </div>
                            ) : alerts.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">
                                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                                    Nenhum alerta pendente
                                </div>
                            ) : (
                                alerts.map(alert => (
                                    <div key={alert.id} className="p-4 hover:bg-slate-800/30 transition-colors">
                                        <div className="flex items-start gap-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${SEVERITY_COLORS[alert.severity]}`}>
                                                {Math.round(alert.confidence * 100)}%
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-white truncate">{alert.entity_name}</p>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    {alert.source_inv?.title} ↔ {alert.target_inv?.title}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    {/* Priority Findings */}
                    <section className="bg-slate-900/50 border border-slate-700/50 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
                            <h2 className="font-semibold text-lg flex items-center gap-2 text-white">
                                <Zap className="w-5 h-5 text-red-400" />
                                Achados Prioritários
                            </h2>
                            <Link 
                                href="/reports?type=findings"
                                className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                            >
                                Ver todos <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="divide-y divide-slate-800/50">
                            {loading ? (
                                <div className="p-8 text-center text-slate-500">
                                    <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2" />
                                    Carregando...
                                </div>
                            ) : findings.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">
                                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                                    Nenhum achado prioritário
                                </div>
                            ) : (
                                findings.map(finding => (
                                    <div key={finding.id} className="p-4 hover:bg-slate-800/30 transition-colors">
                                        <div className="flex items-start gap-3">
                                            {PRIORITY_ICONS[finding.action_priority] || PRIORITY_ICONS.medium}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-white truncate">{finding.title}</p>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    {finding.finding_type_label} • {finding.investigation?.title}
                                                </p>
                                                {finding.suggested_action && (
                                                    <p className="text-xs text-cyan-400 mt-1 truncate">
                                                        💡 {finding.suggested_action}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    {/* Data Quality Jobs */}
                    <section className="bg-slate-900/50 border border-slate-700/50 rounded-2xl overflow-hidden lg:col-span-2">
                        <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
                            <h2 className="font-semibold text-lg flex items-center gap-2 text-white">
                                <FileText className="w-5 h-5 text-blue-400" />
                                Tarefas de Qualidade de Dados
                            </h2>
                            <Link 
                                href="/jobs"
                                className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                            >
                                Ver todos <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                            {loading ? (
                                <div className="col-span-full p-8 text-center text-slate-500">
                                    <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2" />
                                    Carregando...
                                </div>
                            ) : jobs.length === 0 ? (
                                <div className="col-span-full p-8 text-center text-slate-500">
                                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                                    Nenhuma tarefa pendente
                                </div>
                            ) : (
                                jobs.map(job => (
                                    <div 
                                        key={job.id} 
                                        className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600 transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <span className={`px-2 py-0.5 rounded text-xs ${
                                                job.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                                                job.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                                'bg-slate-500/20 text-slate-400'
                                            }`}>
                                                {job.priority}
                                            </span>
                                            <span className="text-xs text-emerald-400">+{job.points_reward} pts</span>
                                        </div>
                                        <p className="font-medium text-white text-sm truncate">{job.title}</p>
                                        <p className="text-xs text-slate-500 mt-1 truncate">{job.entity_name}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                </div>
            </main>
        </>
    );
}
