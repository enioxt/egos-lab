'use client';

/**
 * NexusTab - Cross-Case Connection Visualization
 * 
 * Shows a list-based view of all cross-case connections.
 * Uses existing /api/central/cross-case-alerts API.
 * 
 * Integrates VoteModal for proper voting with evidence support.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
    Network, Loader2, AlertTriangle, Link2, 
    ArrowRight, Users, RefreshCw, Filter,
    ChevronDown, ExternalLink, ThumbsUp
} from 'lucide-react';
import Link from 'next/link';
import VoteModal from '@/components/shared/VoteModal';

interface CrossCaseAlert {
    id: string;
    entity_a_id: string;
    entity_b_id: string;
    match_type: string;
    match_reason: string;
    similarity_score: number;
    status: 'pending' | 'confirmed' | 'dismissed';
    severity?: 'high' | 'medium' | 'low';
    created_at: string;
    investigation_a_id: string;
    investigation_b_id: string;
    inv_a?: { id: string; title: string };
    inv_b?: { id: string; title: string };
    entity_a?: { id: string; name: string; type: string };
    entity_b?: { id: string; name: string; type: string };
}

interface NexusStats {
    total: number;
    pending: number;
    confirmed: number;
    highSeverity: number;
}

const SEVERITY_COLORS = {
    high: 'bg-red-500/20 text-red-400 border-red-500/30',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    low: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
};

const STATUS_COLORS = {
    pending: 'bg-amber-500/20 text-amber-400',
    confirmed: 'bg-emerald-500/20 text-emerald-400',
    dismissed: 'bg-slate-500/20 text-slate-400'
};

export default function NexusTab() {
    const [alerts, setAlerts] = useState<CrossCaseAlert[]>([]);
    const [stats, setStats] = useState<NexusStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());
    
    // VoteModal state
    const [selectedAlert, setSelectedAlert] = useState<CrossCaseAlert | null>(null);
    const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
    const [isVoting, setIsVoting] = useState(false);

    const loadAlerts = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const res = await fetch(`/api/central/cross-case-alerts?status=${statusFilter}&limit=50`);
            if (!res.ok) throw new Error('Erro ao carregar alertas');
            
            const data = await res.json();
            const alertsList = data.alerts || [];
            setAlerts(alertsList);
            
            // Calculate stats
            const pending = alertsList.filter((a: CrossCaseAlert) => a.status === 'pending').length;
            const confirmed = alertsList.filter((a: CrossCaseAlert) => a.status === 'confirmed').length;
            const highSeverity = alertsList.filter((a: CrossCaseAlert) => a.severity === 'high').length;
            
            setStats({
                total: alertsList.length,
                pending,
                confirmed,
                highSeverity
            });
        } catch (err: any) {
            setError(err.message || 'Erro desconhecido');
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        loadAlerts();
    }, [loadAlerts]);

    const toggleExpanded = (id: string) => {
        setExpandedAlerts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleStatusChange = async (alertId: string, newStatus: string) => {
        try {
            const res = await fetch('/api/central/cross-case-alerts', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ alertId, status: newStatus })
            });
            
            if (res.ok) {
                loadAlerts(); // Refresh
            }
        } catch (err) {
            console.error('Error updating alert:', err);
        }
    };

    const getSeverity = (score: number): 'high' | 'medium' | 'low' => {
        if (score >= 0.9) return 'high';
        if (score >= 0.7) return 'medium';
        return 'low';
    };

    // Open vote modal for an alert
    const openVoteModal = (alert: CrossCaseAlert) => {
        setSelectedAlert(alert);
        setIsVoteModalOpen(true);
    };

    // Handle vote submission from VoteModal
    const handleVoteSubmit = async (action: 'confirm' | 'reject', evidence?: { type: 'text' | 'file'; content: string; fileName?: string }) => {
        if (!selectedAlert) return;
        
        setIsVoting(true);
        try {
            const newStatus = action === 'confirm' ? 'confirmed' : 'dismissed';
            
            const res = await fetch('/api/central/cross-case-alerts', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    alertId: selectedAlert.id, 
                    status: newStatus,
                    evidence: evidence
                })
            });
            
            if (res.ok) {
                loadAlerts(); // Refresh
                setIsVoteModalOpen(false);
                setSelectedAlert(null);
            }
        } catch (err) {
            console.error('Error voting on alert:', err);
        } finally {
            setIsVoting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header with Stats */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Network className="w-5 h-5 text-purple-400" />
                        Nexus - Conexões Cross-Case
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        Entidades que aparecem em múltiplas investigações
                    </p>
                </div>
                <button
                    onClick={loadAlerts}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Atualizar
                </button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-white">{stats.total}</p>
                        <p className="text-xs text-slate-400">Total Conexões</p>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
                        <p className="text-xs text-amber-400/70">Pendentes</p>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-emerald-400">{stats.confirmed}</p>
                        <p className="text-xs text-emerald-400/70">Confirmadas</p>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-red-400">{stats.highSeverity}</p>
                        <p className="text-xs text-red-400/70">Alta Prioridade</p>
                    </div>
                </div>
            )}

            {/* Filter */}
            <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    <option value="all">Todos os status</option>
                    <option value="pending">Pendentes</option>
                    <option value="confirmed">Confirmadas</option>
                    <option value="dismissed">Descartadas</option>
                </select>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <p className="text-red-400">{error}</p>
                </div>
            )}

            {/* Alerts List */}
            {!loading && !error && (
                <div className="space-y-3">
                    {alerts.length === 0 ? (
                        <div className="text-center py-12">
                            <Network className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400">Nenhuma conexão cross-case encontrada</p>
                            <p className="text-slate-500 text-sm mt-1">
                                Quando entidades aparecerem em múltiplas investigações, elas serão listadas aqui
                            </p>
                        </div>
                    ) : (
                        alerts.map((alert) => {
                            const isExpanded = expandedAlerts.has(alert.id);
                            const severity = alert.severity || getSeverity(alert.similarity_score);
                            
                            return (
                                <div 
                                    key={alert.id} 
                                    className={`bg-slate-800/50 border rounded-xl overflow-hidden ${SEVERITY_COLORS[severity].replace('bg-', 'border-').split(' ')[0]}`}
                                >
                                    {/* Header */}
                                    <div 
                                        className="p-4 cursor-pointer hover:bg-slate-700/30 transition-colors"
                                        onClick={() => toggleExpanded(alert.id)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${SEVERITY_COLORS[severity]}`}>
                                                    <Link2 className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-white">
                                                            {alert.entity_a?.name || 'Entidade A'}
                                                        </span>
                                                        <ArrowRight className="w-4 h-4 text-slate-500" />
                                                        <span className="font-medium text-white">
                                                            {alert.entity_b?.name || 'Entidade B'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        {alert.match_reason || alert.match_type} • 
                                                        Score: {Math.round(alert.similarity_score * 100)}%
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`px-2 py-1 rounded text-xs ${STATUS_COLORS[alert.status]}`}>
                                                    {alert.status === 'pending' ? 'Pendente' : 
                                                     alert.status === 'confirmed' ? 'Confirmada' : 'Descartada'}
                                                </span>
                                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    {isExpanded && (
                                        <div className="px-4 pb-4 pt-0 border-t border-slate-700">
                                            <div className="grid grid-cols-2 gap-4 mt-4">
                                                {/* Investigation A */}
                                                <div className="bg-slate-900/50 rounded-lg p-3">
                                                    <p className="text-xs text-slate-500 mb-1">Investigação A</p>
                                                    <p className="text-sm text-white font-medium">
                                                        {alert.inv_a?.title || 'Operação'}
                                                    </p>
                                                    <Link 
                                                        href={`/investigation/${alert.investigation_a_id}`}
                                                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 mt-2"
                                                    >
                                                        Ver investigação <ExternalLink className="w-3 h-3" />
                                                    </Link>
                                                </div>
                                                
                                                {/* Investigation B */}
                                                <div className="bg-slate-900/50 rounded-lg p-3">
                                                    <p className="text-xs text-slate-500 mb-1">Investigação B</p>
                                                    <p className="text-sm text-white font-medium">
                                                        {alert.inv_b?.title || 'Operação'}
                                                    </p>
                                                    <Link 
                                                        href={`/investigation/${alert.investigation_b_id}`}
                                                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 mt-2"
                                                    >
                                                        Ver investigação <ExternalLink className="w-3 h-3" />
                                                    </Link>
                                                </div>
                                            </div>

                                            {/* Actions - Open VoteModal for proper voting */}
                                            {alert.status === 'pending' && (
                                                <div className="flex items-center gap-2 mt-4">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openVoteModal(alert);
                                                        }}
                                                        className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <ThumbsUp className="w-4 h-4" />
                                                        Votar nesta conexão
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleStatusChange(alert.id, 'dismissed');
                                                        }}
                                                        className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors"
                                                    >
                                                        Descartar
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* VoteModal for proper voting with evidence */}
            {selectedAlert && (
                <VoteModal
                    isOpen={isVoteModalOpen}
                    onClose={() => {
                        setIsVoteModalOpen(false);
                        setSelectedAlert(null);
                    }}
                    onVote={handleVoteSubmit}
                    entityName={selectedAlert.entity_a?.name || 'Entidade'}
                    entityType={selectedAlert.entity_a?.type || 'PERSON'}
                    matchConfidence={Math.round(selectedAlert.similarity_score * 100)}
                    matchCriteria={{ 
                        [selectedAlert.match_type]: true,
                        ...(selectedAlert.match_reason ? { reason: selectedAlert.match_reason } : {})
                    }}
                    targetInvestigation={selectedAlert.inv_b?.title || 'Operação'}
                    requiredQuorum={2}
                    isLoading={isVoting}
                />
            )}
        </div>
    );
}
