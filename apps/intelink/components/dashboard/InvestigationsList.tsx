'use client';

import React from 'react';
import Link from 'next/link';
import {
    BarChart3, Users, Network, FileSearch, Clock,
    Plus, Trash2, RotateCcw, Filter, X, ChevronRight, ChevronDown, AlertCircle
} from 'lucide-react';
import { SkeletonInvestigationList } from '@/components/ui/Skeleton';
import { matchesSearch } from '@/lib/utils/search';
import { formatRelativeDate, isInvestigationIncomplete, type Investigation } from '@/lib/utils/formatters';

interface InvestigationsListProps {
    investigations: Investigation[];
    loading: boolean;
    showDeleted: boolean;
    setShowDeleted: (show: boolean) => void;
    investigationSearch: string;
    setInvestigationSearch: (search: string) => void;
    sortBy: 'recent' | 'activity' | 'name';
    setSortBy: (sort: 'recent' | 'activity' | 'name') => void;
    visibleCount: number;
    setVisibleCount: (count: number | ((prev: number) => number)) => void;
    onToggleStatus: (e: React.MouseEvent, inv: Investigation) => void;
    onRestore: (e: React.MouseEvent, inv: Investigation) => void;
}

export default function InvestigationsList({
    investigations,
    loading,
    showDeleted,
    setShowDeleted,
    investigationSearch,
    setInvestigationSearch,
    sortBy,
    setSortBy,
    visibleCount,
    setVisibleCount,
    onToggleStatus,
    onRestore,
}: InvestigationsListProps) {
    
    // Filter and sort investigations
    const getFilteredAndSorted = () => {
        // Filter by search (accent-insensitive)
        const filtered = investigations.filter(inv => 
            matchesSearch(inv.title, investigationSearch)
        );
        
        // Remove duplicates by title (keep most recent)
        const seen = new Map<string, Investigation>();
        filtered.forEach(inv => {
            const key = inv.title?.toLowerCase().trim();
            const existing = seen.get(key);
            if (!existing || new Date(inv.updated_at) > new Date(existing.updated_at)) {
                seen.set(key, inv);
            }
        });
        
        // Sort based on selected option
        const uniqueInvs = Array.from(seen.values());
        return uniqueInvs.sort((a, b) => {
            switch (sortBy) {
                case 'activity':
                    const aActivity = (a.entity_count || 0) + (a.relationship_count || 0);
                    const bActivity = (b.entity_count || 0) + (b.relationship_count || 0);
                    return bActivity - aActivity;
                case 'name':
                    return (a.title || '').localeCompare(b.title || '', 'pt-BR');
                case 'recent':
                default:
                    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
            }
        });
    };

    const sortedInvestigations = getFilteredAndSorted();

    return (
        <div className={`rounded-2xl overflow-hidden shadow-lg transition-colors ${
            showDeleted 
                ? 'bg-red-950/30 border-2 border-red-500/30' 
                : 'bg-slate-800/40 border border-slate-600/40'
        }`}>
            {/* Trash Mode Banner */}
            {showDeleted && (
                <div className="px-6 py-3 bg-gradient-to-r from-red-500/20 to-orange-500/20 border-b border-red-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Trash2 className="w-5 h-5 text-red-400" />
                        <div>
                            <p className="text-red-300 font-medium">Modo Lixeira Ativo</p>
                            <p className="text-red-400/70 text-xs">Operações deletadas podem ser restauradas em até 30 dias</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowDeleted(false)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Voltar às Operações
                    </button>
                </div>
            )}
            
            {/* Header */}
            <div className={`px-6 py-4 border-b flex items-center justify-between ${
                showDeleted 
                    ? 'border-red-500/20 bg-red-950/20' 
                    : 'border-slate-600/40 bg-slate-800/60'
            }`}>
                <div className="flex items-center gap-2 flex-wrap">
                    {showDeleted ? <Trash2 className="w-5 h-5 text-red-400" /> : <BarChart3 className="w-5 h-5 text-slate-400" />}
                    <h2 className={`font-bold text-lg ${showDeleted ? 'text-red-300' : 'text-white'}`}>
                        {showDeleted ? 'Lixeira' : 'Operações'}
                    </h2>
                    <span className={`px-2 py-0.5 rounded-full text-sm ${showDeleted ? 'text-red-300 bg-red-500/20' : 'text-slate-300 bg-slate-700/60'}`}>
                        {investigations.length} casos
                    </span>
                    
                    {!showDeleted && (
                        <Link 
                            href="/investigation/new"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors ml-2"
                        >
                            <Plus className="w-4 h-4" />
                            Nova
                        </Link>
                    )}
                    
                    {/* Search Input */}
                    {!showDeleted && (
                        <div className="relative ml-auto">
                            <Filter className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input 
                                type="text" 
                                placeholder="Filtrar por nome..." 
                                value={investigationSearch}
                                onChange={(e) => setInvestigationSearch(e.target.value)}
                                className="bg-slate-800/80 border border-slate-700/50 rounded-lg pl-9 pr-8 py-1.5 text-sm text-white focus:outline-none focus:border-slate-600 w-48"
                            />
                            {investigationSearch && (
                                <button 
                                    onClick={() => setInvestigationSearch('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-700 rounded"
                                >
                                    <X className="w-3 h-3 text-slate-500" />
                                </button>
                            )}
                        </div>
                    )}
                    
                    {/* Sort Dropdown */}
                    {!showDeleted && (
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'recent' | 'activity' | 'name')}
                            className="bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 [&>option]:bg-slate-800 [&>option]:text-white"
                        >
                            <option value="recent">📅 Mais recentes</option>
                            <option value="activity">📊 Mais ativas</option>
                            <option value="name">🔤 Nome A-Z</option>
                        </select>
                    )}
                </div>
                
                {/* Lixeira button */}
                <button
                    onClick={() => setShowDeleted(!showDeleted)}
                    title={showDeleted ? 'Voltar às operações' : 'Ver lixeira'}
                    className={`p-2 rounded-lg transition-colors ${
                        showDeleted 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : 'text-slate-500 hover:text-red-400 hover:bg-slate-800'
                    }`}
                >
                    {showDeleted ? <RotateCcw className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                </button>
            </div>

            {/* List */}
            <div className="divide-y divide-slate-800/50">
                {loading ? (
                    <div className="p-4">
                        <SkeletonInvestigationList count={3} />
                    </div>
                ) : investigations.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        Nenhuma operação encontrada.
                        <br />
                        <span className="text-sm">Use o bot para criar uma nova.</span>
                    </div>
                ) : (
                    <>
                        {sortedInvestigations.slice(0, visibleCount).map((inv) => (
                            <InvestigationCard
                                key={inv.id}
                                investigation={inv}
                                showDeleted={showDeleted}
                                onToggleStatus={onToggleStatus}
                                onRestore={onRestore}
                            />
                        ))}
                        
                        {visibleCount < sortedInvestigations.length && (
                            <div className="p-6 flex justify-center">
                                <button 
                                    onClick={() => setVisibleCount(prev => prev + 5)}
                                    className="group flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 hover:from-blue-600/30 hover:to-cyan-600/30 border border-blue-500/30 hover:border-blue-400/50 rounded-xl text-blue-300 hover:text-blue-200 font-medium transition-all duration-300"
                                >
                                    <span>Ver mais operações</span>
                                    <span className="text-xs bg-blue-500/20 px-2 py-0.5 rounded-full text-blue-400">
                                        +{sortedInvestigations.length - visibleCount}
                                    </span>
                                    <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// Investigation Card Component
function InvestigationCard({
    investigation: inv,
    showDeleted,
    onToggleStatus,
    onRestore,
}: {
    investigation: Investigation;
    showDeleted: boolean;
    onToggleStatus: (e: React.MouseEvent, inv: Investigation) => void;
    onRestore: (e: React.MouseEvent, inv: Investigation) => void;
}) {
    const incompleteInfo = isInvestigationIncomplete(inv);
    
    return (
        <Link 
            href={`/investigation/${inv.id}`}
            className="flex items-center justify-between p-5 hover:bg-slate-800/30 transition-colors group"
        >
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium text-white group-hover:text-blue-400 transition-colors">
                        {inv.title.toUpperCase()}
                    </h3>
                    {showDeleted ? (
                        <button
                            onClick={(e) => onRestore(e, inv)}
                            className="px-2 py-0.5 text-xs rounded-full transition-colors hover:opacity-80 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                        >
                            <span className="flex items-center gap-1">
                                <RotateCcw className="w-3 h-3" />
                                Restaurar
                            </span>
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={(e) => onToggleStatus(e, inv)}
                                className={`px-2 py-0.5 text-xs rounded-full transition-colors hover:opacity-80 ${
                                    inv.status === 'active' 
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}
                            >
                                {inv.status === 'active' ? 'Ativo' : 'Arquivado'}
                            </button>
                            
                            {/* Incomplete Badge with Tooltip */}
                            {incompleteInfo.incomplete && (
                                <div className="relative group/tooltip">
                                    <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1 cursor-help">
                                        <AlertCircle className="w-3 h-3" />
                                        Incompleta
                                    </span>
                                    <div className="absolute left-0 top-full mt-2 z-50 hidden group-hover/tooltip:block w-64">
                                        <div className="bg-slate-800 border border-amber-500/40 rounded-lg shadow-xl p-3">
                                            <div className="flex items-center gap-2 mb-2 text-amber-400 font-medium text-sm">
                                                <AlertCircle className="w-4 h-4" />
                                                Dados Incompletos
                                            </div>
                                            <ul className="text-xs text-slate-300 space-y-1 mb-3">
                                                {incompleteInfo.reasons.map((reason, idx) => (
                                                    <li key={idx} className="flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                                                        {reason}
                                                    </li>
                                                ))}
                                            </ul>
                                            <p className="text-xs text-slate-400 border-t border-slate-700 pt-2">
                                                Clique na operação para adicionar entidades e vínculos.
                                            </p>
                                        </div>
                                        <div className="absolute left-4 -top-1 w-2 h-2 bg-slate-800 border-l border-t border-amber-500/40 rotate-45"></div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {inv.entity_count || 0} entidades
                    </span>
                    <span className="flex items-center gap-1">
                        <Network className="w-3.5 h-3.5" />
                        {inv.relationship_count || 0} vínculos
                    </span>
                    <span className="flex items-center gap-1">
                        <FileSearch className="w-3.5 h-3.5" />
                        {inv.evidence_count || 0} evidências
                    </span>
                    <span className="flex items-center gap-1" title={new Date(inv.updated_at).toLocaleString('pt-BR')}>
                        <Clock className="w-3.5 h-3.5" />
                        {formatRelativeDate(inv.updated_at)}
                    </span>
                </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-blue-400 transition-colors" />
        </Link>
    );
}
