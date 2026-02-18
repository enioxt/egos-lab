'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useCallback } from 'react';
import { 
    Activity, TrendingUp, TrendingDown, AlertTriangle, 
    CheckCircle, Building2, RefreshCw, BarChart3,
    Users, Link2, Eye, Info, HelpCircle, Filter,
    Calculator, Zap, ChevronDown, ChevronUp, Search, SortAsc, X
} from 'lucide-react';
import Link from 'next/link';
import { useRole, RoleLoading, AccessDenied } from '@/hooks/useRole';
import { PageHeaderCompact } from '@/components/shared/PageHeader';

interface InvestigationRho {
    id: string;
    title: string;
    rho_score: number | null;
    rho_status: string;
    entity_count: number;
    relationship_count: number;
    unit_name: string;
}

interface GlobalStats {
    total_investigations: number;
    healthy: number;
    warning: number;
    critical: number;
    extreme: number;
    not_calculated: number;
    avg_rho: number;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
    healthy: { color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'Saudável' },
    warning: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Atenção' },
    critical: { color: 'text-orange-400', bg: 'bg-orange-500/20', label: 'Crítico' },
    extreme: { color: 'text-red-400', bg: 'bg-red-500/20', label: 'Extremo' },
    unknown: { color: 'text-slate-400', bg: 'bg-slate-500/20', label: 'Não calculado' }
};

export default function SaudeGlobalPage() {
    const permissions = useRole();
    const [investigations, setInvestigations] = useState<InvestigationRho[]>([]);
    const [stats, setStats] = useState<GlobalStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [calculating, setCalculating] = useState<string | null>(null);
    const [calculatingAll, setCalculatingAll] = useState(false);
    const [filter, setFilter] = useState<'all' | 'healthy' | 'warning' | 'critical' | 'extreme' | 'pending'>('all');
    const [showExplanation, setShowExplanation] = useState(false); // Data-first: collapsed by default
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'rho_desc' | 'rho_asc' | 'name' | 'entities'>('rho_desc');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const res = await fetch('/api/rho/global');
            if (res.ok) {
                const data = await res.json();
                setInvestigations(data.investigations || []);
                setStats(data.stats || null);
            }
        } catch (e) {
            console.error('Error loading global Rho data:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    const calculateRho = async (investigationId: string, entityCount: number) => {
        // Skip investigations with no entities
        if (entityCount === 0) {
            setError('Não é possível calcular Rho: investigação sem entidades');
            setTimeout(() => setError(null), 3000);
            return;
        }

        try {
            setCalculating(investigationId);
            const res = await fetch('/api/rho/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ investigation_id: investigationId })
            });
            
            if (!res.ok) {
                const err = await res.json();
                setError(err.error || 'Erro ao calcular Rho');
                setTimeout(() => setError(null), 3000);
            }
            
            // Silent reload - only update data, no loading spinner
            await loadData(true);
        } catch (e) {
            console.error('Error calculating Rho:', e);
            setError('Erro de conexão ao calcular Rho');
            setTimeout(() => setError(null), 3000);
        } finally {
            setCalculating(null);
        }
    };

    const calculateAll = async () => {
        // Only calculate for investigations with entities
        const calculable = investigations.filter(i => i.rho_score === null && i.entity_count > 0);
        if (calculable.length === 0) {
            setError('Nenhuma investigação pendente com entidades');
            setTimeout(() => setError(null), 3000);
            return;
        }
        
        setCalculatingAll(true);
        for (const inv of calculable) {
            await calculateRho(inv.id, inv.entity_count);
        }
        setCalculatingAll(false);
    };

    // Filter and sort investigations
    const filteredInvestigations = investigations
        .filter(inv => {
            // Filter by status
            if (filter !== 'all') {
                if (filter === 'pending') {
                    if (inv.rho_score !== null) return false;
                } else if (inv.rho_status !== filter) {
                    return false;
                }
            }
            // Filter by search query
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                    inv.title.toLowerCase().includes(query) ||
                    (inv.unit_name && inv.unit_name.toLowerCase().includes(query))
                );
            }
            return true;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'rho_desc':
                    // Higher Rho first (worse), null last
                    if (a.rho_score === null && b.rho_score === null) return 0;
                    if (a.rho_score === null) return 1;
                    if (b.rho_score === null) return -1;
                    return b.rho_score - a.rho_score;
                case 'rho_asc':
                    // Lower Rho first (better), null last
                    if (a.rho_score === null && b.rho_score === null) return 0;
                    if (a.rho_score === null) return 1;
                    if (b.rho_score === null) return -1;
                    return a.rho_score - b.rho_score;
                case 'name':
                    return a.title.localeCompare(b.title);
                case 'entities':
                    return b.entity_count - a.entity_count;
                default:
                    return 0;
            }
        });

    // RBAC
    if (permissions.isLoading) return <RoleLoading />;
    if (!permissions.canViewInvestigations) return <AccessDenied />;

    return (
        <div className="w-full px-4 md:px-6 py-6">
            {/* Header */}
            <PageHeaderCompact
                title="Saúde Global da Rede"
                subtitle="Visão consolidada de todas as investigações"
                icon={Activity}
                iconColor="text-blue-400"
                actions={
                    <div className="flex gap-2">
                        <button
                            onClick={calculateAll}
                            disabled={loading || calculating !== null || calculatingAll}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
                        >
                            <BarChart3 className="w-5 h-5" />
                            {calculatingAll ? 'Calculando...' : 'Calcular Todos'}
                        </button>
                        <button
                            onClick={() => loadData()}
                            disabled={loading}
                            className="p-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
                            title="Atualizar dados"
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                }
            />

            {/* Error Toast */}
            {error && (
                <div className="fixed top-4 right-4 z-50 bg-red-500/90 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
                    <AlertTriangle className="w-5 h-5" />
                    {error}
                </div>
            )}

            {/* Rho Explanation - Collapsible */}
            <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 rounded-xl border border-blue-500/30 mb-6 overflow-hidden">
                <button
                    onClick={() => setShowExplanation(!showExplanation)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-blue-500/10 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <HelpCircle className="w-5 h-5 text-blue-400" />
                        <span className="font-medium text-white">O que é o Índice Rho (ρ)?</span>
                    </div>
                    {showExplanation ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                </button>
                
                {showExplanation && (
                    <div className="px-4 pb-4 space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-slate-800/50 rounded-lg p-4">
                                <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-blue-400" />
                                    Como funciona o cálculo?
                                </h4>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    O <strong>Índice Rho</strong> mede a <strong>centralização</strong> da sua rede de investigação. 
                                    Ele combina dois fatores:
                                </p>
                                <ul className="text-sm text-slate-400 mt-2 space-y-1">
                                    <li>• <strong className="text-white">Authority (A)</strong>: Quanto uma entidade concentra conexões</li>
                                    <li>• <strong className="text-white">Diversity (D)</strong>: Variedade de conexões na rede</li>
                                </ul>
                                <p className="text-sm text-slate-400 mt-2">
                                    <strong>Fórmula:</strong> <code className="bg-slate-900 px-2 py-0.5 rounded text-blue-400">ρ = A² × (1 - D)</code>
                                </p>
                            </div>
                            
                            <div className="bg-slate-800/50 rounded-lg p-4">
                                <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-yellow-400" />
                                    O que significa cada nível?
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                                        <span className="text-emerald-400">Saudável (≤3%)</span>
                                        <span className="text-slate-400">- Rede bem distribuída</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                                        <span className="text-yellow-400">Atenção (3-6%)</span>
                                        <span className="text-slate-400">- Monitore conexões</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                                        <span className="text-orange-400">Crítico (6-10%)</span>
                                        <span className="text-slate-400">- Risco de viés</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                        <span className="text-red-400">Extremo (&gt;10%)</span>
                                        <span className="text-slate-400">- Ação urgente</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-slate-800/50 rounded-lg p-4">
                            <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-amber-400" />
                                Como melhorar o Rho da investigação?
                            </h4>
                            <div className="grid md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <strong className="text-white">1. Adicione mais entidades</strong>
                                    <p className="text-slate-400">Quanto mais pessoas, veículos e locais, mais distribuída a rede fica.</p>
                                </div>
                                <div>
                                    <strong className="text-white">2. Diversifique conexões</strong>
                                    <p className="text-slate-400">Evite que poucas entidades concentrem todas as relações.</p>
                                </div>
                                <div>
                                    <strong className="text-white">3. Mapeie novas fontes</strong>
                                    <p className="text-slate-400">Inclua dados de diferentes depoimentos e documentos.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Search and Sort */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar investigação..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
                
                {/* Sort dropdown */}
                <div className="flex items-center gap-2">
                    <SortAsc className="w-5 h-5 text-slate-400" />
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none cursor-pointer"
                    >
                        <option value="rho_desc">Pior Rho primeiro</option>
                        <option value="rho_asc">Melhor Rho primeiro</option>
                        <option value="name">Nome A-Z</option>
                        <option value="entities">Mais entidades</option>
                    </select>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
                <span className="flex items-center gap-2 text-sm text-slate-400 mr-2">
                    <Filter className="w-4 h-4" />
                    Status:
                </span>
                {[
                    { key: 'all', label: 'Todos', count: stats?.total_investigations || 0 },
                    { key: 'healthy', label: 'Saudável', count: stats?.healthy || 0 },
                    { key: 'warning', label: 'Atenção', count: stats?.warning || 0 },
                    { key: 'critical', label: 'Crítico', count: stats?.critical || 0 },
                    { key: 'extreme', label: 'Extremo', count: stats?.extreme || 0 },
                    { key: 'pending', label: 'Pendente', count: stats?.not_calculated || 0 },
                ].map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key as any)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            filter === f.key 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                        }`}
                    >
                        {f.label} ({f.count})
                    </button>
                ))}
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                    <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                        <div className="text-2xl font-bold text-white">{stats.total_investigations}</div>
                        <div className="text-sm text-slate-400">Total</div>
                    </div>
                    <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/30">
                        <div className="text-2xl font-bold text-emerald-400">{stats.healthy}</div>
                        <div className="text-sm text-emerald-400/80">Saudáveis</div>
                    </div>
                    <div className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/30">
                        <div className="text-2xl font-bold text-yellow-400">{stats.warning}</div>
                        <div className="text-sm text-yellow-400/80">Atenção</div>
                    </div>
                    <div className="bg-orange-500/10 rounded-xl p-4 border border-orange-500/30">
                        <div className="text-2xl font-bold text-orange-400">{stats.critical}</div>
                        <div className="text-sm text-orange-400/80">Críticos</div>
                    </div>
                    <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/30">
                        <div className="text-2xl font-bold text-red-400">{stats.extreme}</div>
                        <div className="text-sm text-red-400/80">Extremos</div>
                    </div>
                    <div className="bg-slate-500/10 rounded-xl p-4 border border-slate-500/30">
                        <div className="text-2xl font-bold text-slate-400">{stats.not_calculated}</div>
                        <div className="text-sm text-slate-400/80">Pendentes</div>
                    </div>
                </div>
            )}

            {/* Average Rho */}
            {stats && stats.avg_rho > 0 && (
                <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-slate-400 mb-1">Rho Médio Global</div>
                            <div className="text-3xl font-bold text-white">
                                {(stats.avg_rho * 100).toFixed(2)}%
                            </div>
                        </div>
                        <div className={`text-lg font-medium ${
                            stats.avg_rho <= 0.03 ? 'text-emerald-400' :
                            stats.avg_rho <= 0.06 ? 'text-yellow-400' :
                            stats.avg_rho <= 0.10 ? 'text-orange-400' : 'text-red-400'
                        }`}>
                            {stats.avg_rho <= 0.03 ? 'Rede Saudável' :
                             stats.avg_rho <= 0.06 ? 'Atenção Recomendada' :
                             stats.avg_rho <= 0.10 ? 'Ação Necessária' : 'Intervenção Urgente'}
                        </div>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-4 h-3 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-500 ${
                                stats.avg_rho <= 0.03 ? 'bg-emerald-500' :
                                stats.avg_rho <= 0.06 ? 'bg-yellow-500' :
                                stats.avg_rho <= 0.10 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(stats.avg_rho * 1000, 100)}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Investigations Table */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-800">
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Investigação</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Unidade</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-slate-400">Entidades</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-slate-400">Vínculos</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-slate-400">Rho Score</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-slate-400">Status</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-slate-400">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center">
                                        <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-2" />
                                        <p className="text-slate-400">Carregando...</p>
                                    </td>
                                </tr>
                            ) : filteredInvestigations.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                                        {filter === 'all' ? 'Nenhuma investigação encontrada' : `Nenhuma investigação com status "${filter}"`}
                                    </td>
                                </tr>
                            ) : (
                                filteredInvestigations.map(inv => {
                                    const status = inv.rho_status || 'unknown';
                                    const config = STATUS_CONFIG[status] || STATUS_CONFIG.unknown;
                                    
                                    return (
                                        <tr key={inv.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                                            <td className="px-4 py-3">
                                                <Link 
                                                    href={`/investigation/${inv.id}`}
                                                    className="text-white hover:text-blue-400 transition-colors font-medium"
                                                >
                                                    {inv.title}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <Building2 className="w-4 h-4" />
                                                    {inv.unit_name || '-'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="flex items-center justify-center gap-1 text-slate-300">
                                                    <Users className="w-4 h-4 text-slate-500" />
                                                    {inv.entity_count}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="flex items-center justify-center gap-1 text-slate-300">
                                                    <Link2 className="w-4 h-4 text-slate-500" />
                                                    {inv.relationship_count}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`font-mono font-bold ${config.color}`}>
                                                    {inv.rho_score !== null 
                                                        ? `${(inv.rho_score * 100).toFixed(2)}%` 
                                                        : '—'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                                                    {config.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => calculateRho(inv.id, inv.entity_count)}
                                                        disabled={calculating === inv.id || inv.entity_count === 0}
                                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-sm transition-colors ${
                                                            inv.entity_count === 0 
                                                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                                                                : 'bg-blue-600 hover:bg-blue-500 text-white'
                                                        }`}
                                                        title={inv.entity_count === 0 ? 'Adicione entidades primeiro' : 'Calcular Rho'}
                                                    >
                                                        {calculating === inv.id ? (
                                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Calculator className="w-4 h-4" />
                                                        )}
                                                        <span className="hidden sm:inline">
                                                            {inv.rho_score === null ? 'Calcular' : 'Recalcular'}
                                                        </span>
                                                    </button>
                                                    <Link 
                                                        href={`/investigation/${inv.id}`}
                                                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                                                        title="Ver Investigação"
                                                    >
                                                        <Eye className="w-4 h-4 text-slate-400 hover:text-white" />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
