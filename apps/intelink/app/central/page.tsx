'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { 
    Network, Brain, FileText, Building2, Users,
    AlertTriangle, Link2, Shield, ChevronRight,
    Sparkles, ArrowLeft, Home, Lock, ClipboardCheck,
    Activity, Settings
} from 'lucide-react';
import Link from 'next/link';
import { useRole, AccessDenied, RoleLoading } from '@/hooks/useRole';
import { LiveCard } from '@/components/central';

interface Stats {
    units: number;
    members: number;
    investigations: number;
    entities: number;
    relationships: number;
}

interface LiveStats {
    pendingAlerts: number;
    rhoStatus: 'ok' | 'warning' | 'critical';
    rhoScore: number;
}

export default function CentralIntelligencePage() {
    const permissions = useRole();
    const [stats, setStats] = useState<Stats>({ units: 0, members: 0, investigations: 0, entities: 0, relationships: 0 });
    const [liveStats, setLiveStats] = useState<LiveStats>({ pendingAlerts: 0, rhoStatus: 'ok', rhoScore: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                // Load base stats
                const res = await fetch('/api/stats?scope=central');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
                
                // Load live alerts count
                const alertsRes = await fetch('/api/intelink/alerts?unacknowledged=true&limit=100');
                if (alertsRes.ok) {
                    const alertsData = await alertsRes.json();
                    setLiveStats(prev => ({
                        ...prev,
                        pendingAlerts: alertsData.alerts?.length || 0
                    }));
                }
                
                // Load Rho status (optional)
                try {
                    const rhoRes = await fetch('/api/rho/global-status');
                    if (rhoRes.ok) {
                        const rhoData = await rhoRes.json();
                        setLiveStats(prev => ({
                            ...prev,
                            rhoStatus: rhoData.status || 'ok',
                            rhoScore: rhoData.score || 0
                        }));
                    }
                } catch {
                    // Rho is optional
                }
            } catch (error) {
                console.error('Error loading stats:', error);
            } finally {
                setLoading(false);
            }
        };
        
        if (!permissions.isLoading && permissions.canViewInvestigations) {
            loadStats();
        } else if (!permissions.isLoading) {
            setLoading(false);
        }
    }, [permissions.isLoading, permissions.canViewInvestigations]);
    
    // RBAC: Only members+ can access Central
    if (permissions.isLoading) return <RoleLoading />;
    if (!permissions.canViewInvestigations) return <AccessDenied />;

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="px-4 sm:px-6 py-6 text-white">
                {/* Header compacto */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-xl">
                            <Brain className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Central de Inteligência</h1>
                            <p className="text-xs text-slate-400">{stats.investigations} operações • {stats.entities} entidades • {stats.relationships} vínculos</p>
                        </div>
                    </div>
                </div>

                {/* SEÇÃO OPERACIONAL (Destaque) - Cards Vivos */}
                <div className="mb-10">
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        Inteligência Operacional
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {/* Vínculos Cross-Case - LIVE DATA */}
                        <LiveCard
                            icon={Link2}
                            title="Vínculos Cross-Case"
                            description="Alertas de entidades em múltiplas operações. O coração da inteligência."
                            href="/central/vinculos"
                            color="purple"
                            badge="Principal"
                            liveCount={liveStats.pendingAlerts}
                            countLabel="Pendentes"
                            countVariant={liveStats.pendingAlerts > 5 ? 'danger' : liveStats.pendingAlerts > 0 ? 'warning' : 'success'}
                            features={['Alertas automáticos', 'Confirmar/Descartar', 'Histórico']}
                        />
                        
                        {/* Saúde da Rede - LIVE DATA */}
                        <LiveCard
                            icon={Activity}
                            title="Saúde da Rede"
                            description="Qualidade dos dados e métricas de centralização (Índice Rho)."
                            href="/central/saude"
                            color="cyan"
                            liveCount={Math.round(liveStats.rhoScore * 100)}
                            countLabel="Rho Score"
                            countVariant={liveStats.rhoStatus === 'critical' ? 'danger' : liveStats.rhoStatus === 'warning' ? 'warning' : 'default'}
                            features={['Índice Rho', 'Alertas de concentração', 'Ranking']}
                        />
                    </div>
                </div>

                {/* SEÇÃO ADMINISTRATIVA - ADMIN ONLY (super_admin + unit_admin) */}
                {permissions.canManageMembers && (
                <div className="border-t border-slate-800 pt-6">
                    <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                        Administração do Sistema
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <NavGuideCard
                            icon={Building2}
                            title="Delegacias"
                            description="Gerencie unidades policiais."
                            features={['Criar delegacias', 'Atribuir membros']}
                            href="/central/delegacias"
                            color="slate"
                        />
                        
                        <NavGuideCard
                            icon={Users}
                            title="Equipe"
                            description="Gerencie usuários e acessos."
                            features={['Convidar', 'Definir roles']}
                            href="/central/equipe"
                            color="slate"
                        />
                        
                        <NavGuideCard
                            icon={ClipboardCheck}
                            title="Qualidade"
                            description="Jobs de normalização de dados."
                            features={['Duplicatas', 'Correções']}
                            href="/central/qualidade"
                            color="slate"
                        />
                        
                        <NavGuideCard
                            icon={Settings}
                            title="Configurações"
                            description="Integrações e webhooks."
                            features={['APIs', 'Personalização']}
                            href="/central/configuracoes"
                            color="slate"
                            badge="Admin"
                        />
                    </div>
                </div>
                )}
        </div>
    );
}

// Quick stat component
function QuickStat({ value, label, icon: Icon, color = 'slate' }: {
    value: number;
    label: string;
    icon: any;
    color?: 'slate' | 'cyan';
}) {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${color === 'cyan' ? 'text-cyan-400' : 'text-slate-500'}`} />
                <div>
                    <p className={`text-2xl font-bold ${color === 'cyan' ? 'text-cyan-400' : 'text-white'}`}>{value}</p>
                    <p className="text-xs text-slate-500">{label}</p>
                </div>
            </div>
        </div>
    );
}

// Navigation guide card
function NavGuideCard({ icon: Icon, title, description, features, href, color, badge }: {
    icon: any;
    title: string;
    description: string;
    features: string[];
    href: string;
    color: 'purple' | 'orange' | 'blue' | 'slate' | 'green' | 'red' | 'cyan' | 'yellow';
    badge?: string;
}) {
    const colors: Record<string, string> = {
        purple: 'border-purple-500/30 hover:border-purple-500/50 bg-purple-500/5',
        orange: 'border-orange-500/30 hover:border-orange-500/50 bg-orange-500/5',
        blue: 'border-blue-500/30 hover:border-blue-500/50 bg-blue-500/5',
        slate: 'border-slate-700 hover:border-slate-600 bg-slate-800/30',
        green: 'border-emerald-500/30 hover:border-emerald-500/50 bg-emerald-500/5',
        red: 'border-red-500/30 hover:border-red-500/50 bg-red-500/5',
        cyan: 'border-cyan-500/30 hover:border-cyan-500/50 bg-cyan-500/5',
        yellow: 'border-yellow-500/30 hover:border-yellow-500/50 bg-yellow-500/5',
    };
    
    const iconColors: Record<string, string> = {
        purple: 'text-purple-400',
        orange: 'text-orange-400',
        blue: 'text-blue-400',
        slate: 'text-slate-400',
        green: 'text-emerald-400',
        red: 'text-red-400',
        cyan: 'text-cyan-400',
        yellow: 'text-yellow-400',
    };
    
    return (
        <Link
            href={href}
            className={`block border rounded-xl p-5 transition-all group ${colors[color]}`}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-slate-800`}>
                        <Icon className={`w-5 h-5 ${iconColors[color]}`} />
                    </div>
                    <h3 className="font-semibold text-white">{title}</h3>
                </div>
                {badge && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                        badge === 'Principal' ? 'bg-purple-500/20 text-purple-400' :
                        badge === 'Admin' ? 'bg-red-500/20 text-red-400' :
                        'bg-slate-700 text-slate-300'
                    }`}>
                        {badge}
                    </span>
                )}
            </div>
            
            <p className="text-sm text-slate-400 mb-3 leading-relaxed">{description}</p>
            
            <ul className="space-y-1 mb-4">
                {features.map((feature, i) => (
                    <li key={i} className="text-xs text-slate-500 flex items-center gap-2">
                        <span className="w-1 h-1 bg-slate-600 rounded-full" />
                        {feature}
                    </li>
                ))}
            </ul>
            
            <div className="flex items-center text-sm text-slate-400 group-hover:text-white transition-colors">
                <span>Acessar</span>
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
        </Link>
    );
}

