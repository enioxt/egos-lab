'use client';

/**
 * JourneyCompareModal - Compare investigation journeys between investigators
 * 
 * Features:
 * - Side-by-side journey comparison
 * - Common entities highlight
 * - Unique finds per investigator
 * - Coverage metrics
 * - Visual timeline diff
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
    X, 
    Users,
    User,
    Car,
    MapPin,
    Building2,
    FileText,
    Clock,
    Footprints,
    Loader2,
    CheckCircle2,
    AlertCircle,
    BarChart3,
    GitCompare,
    Eye
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase-client';
import type { InvestigationJourney, JourneyStep } from '@/lib/types/journey';

// Entity type icons
const ENTITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    PERSON: User,
    VEHICLE: Car,
    LOCATION: MapPin,
    ORGANIZATION: Building2,
    COMPANY: Building2,
    default: FileText,
};

// Entity type colors
const ENTITY_COLORS: Record<string, string> = {
    PERSON: 'bg-blue-500',
    VEHICLE: 'bg-emerald-500',
    LOCATION: 'bg-amber-500',
    ORGANIZATION: 'bg-purple-500',
    COMPANY: 'bg-purple-500',
    default: 'bg-slate-500',
};

// Investigator colors for comparison
const INVESTIGATOR_COLORS = [
    'text-cyan-400 border-cyan-500 bg-cyan-500/10',
    'text-amber-400 border-amber-500 bg-amber-500/10',
    'text-emerald-400 border-emerald-500 bg-emerald-500/10',
    'text-purple-400 border-purple-500 bg-purple-500/10',
    'text-pink-400 border-pink-500 bg-pink-500/10',
];

interface EnrichedJourney {
    id: string;
    user_id: string;
    investigation_id?: string;
    title?: string;
    context?: string;
    steps: JourneyStep[];
    status: string;
    step_count?: number;
    ai_analysis?: string;
    created_at: string;
    updated_at: string;
    investigator_name: string;
}

interface ComparisonData {
    totalInvestigators: number;
    totalEntitiesVisited: number;
    commonEntities: number;
    uniqueFinds: Record<string, number>;
}

interface JourneyCompareModalProps {
    isOpen: boolean;
    onClose: () => void;
    investigationId?: string;
}

export function JourneyCompareModal({ 
    isOpen, 
    onClose, 
    investigationId 
}: JourneyCompareModalProps) {
    const supabase = getSupabase();
    
    // Data state
    const [investigations, setInvestigations] = useState<{ id: string; title: string }[]>([]);
    const [selectedInvId, setSelectedInvId] = useState<string>(investigationId || '');
    const [journeys, setJourneys] = useState<EnrichedJourney[]>([]);
    const [comparison, setComparison] = useState<ComparisonData | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedJourneyIds, setSelectedJourneyIds] = useState<string[]>([]);
    
    // Load investigations list
    useEffect(() => {
        if (!isOpen || !supabase) return;
        loadInvestigations();
    }, [isOpen]);
    
    // Load journeys when investigation selected
    useEffect(() => {
        if (selectedInvId) {
            loadJourneys(selectedInvId);
        }
    }, [selectedInvId]);
    
    const loadInvestigations = async () => {
        if (!supabase) return;
        
        const { data } = await supabase
            .from('intelink_investigations')
            .select('id, title')
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (data) {
            setInvestigations(data);
            if (!selectedInvId && data.length > 0) {
                setSelectedInvId(data[0].id);
            }
        }
    };
    
    const loadJourneys = async (invId: string) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/journeys/compare?investigation_id=${invId}`);
            const data = await response.json();
            
            if (data.success) {
                setJourneys(data.journeys || []);
                setComparison(data.comparison || null);
                
                // Auto-select first 2 journeys for comparison
                if (data.journeys && data.journeys.length >= 2) {
                    setSelectedJourneyIds([data.journeys[0].id, data.journeys[1].id]);
                } else if (data.journeys && data.journeys.length === 1) {
                    setSelectedJourneyIds([data.journeys[0].id]);
                }
            }
        } catch (e) {
            console.error('[JourneyCompare] Load error:', e);
        }
        setLoading(false);
    };
    
    // Get selected journeys for comparison
    const selectedJourneys = useMemo(() => {
        return journeys.filter(j => selectedJourneyIds.includes(j.id));
    }, [journeys, selectedJourneyIds]);
    
    // Calculate comparison between selected journeys
    const detailedComparison = useMemo(() => {
        if (selectedJourneys.length < 2) return null;
        
        const entitySets: Record<string, Set<string>> = {};
        const entityDetails: Record<string, { name: string; type: string }> = {};
        
        selectedJourneys.forEach((journey, idx) => {
            entitySets[journey.id] = new Set();
            
            const steps = journey.steps || [];
            steps.forEach((step: JourneyStep) => {
                if (step.entityId) {
                    entitySets[journey.id].add(step.entityId);
                    entityDetails[step.entityId] = {
                        name: step.entityName,
                        type: step.entityType,
                    };
                }
            });
        });
        
        const journeyIds = Object.keys(entitySets);
        const allEntities = new Set<string>();
        journeyIds.forEach(id => entitySets[id].forEach(e => allEntities.add(e)));
        
        // Common entities (visited by all)
        const common = [...allEntities].filter(entityId => 
            journeyIds.every(id => entitySets[id].has(entityId))
        );
        
        // Unique to each investigator
        const unique: Record<string, string[]> = {};
        journeyIds.forEach(id => {
            unique[id] = [...entitySets[id]].filter(entityId => 
                journeyIds.filter(otherId => otherId !== id).every(otherId => 
                    !entitySets[otherId].has(entityId)
                )
            );
        });
        
        return {
            common,
            unique,
            entityDetails,
            total: allEntities.size,
        };
    }, [selectedJourneys]);
    
    const toggleJourneySelection = (journeyId: string) => {
        setSelectedJourneyIds(prev => {
            if (prev.includes(journeyId)) {
                return prev.filter(id => id !== journeyId);
            }
            // Max 3 for comparison
            if (prev.length >= 3) {
                return [...prev.slice(1), journeyId];
            }
            return [...prev, journeyId];
        });
    };
    
    const getIcon = (type: string) => {
        const Icon = ENTITY_ICONS[type] || ENTITY_ICONS.default;
        return <Icon className="w-3 h-3" />;
    };
    
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                            <GitCompare className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Comparar Jornadas</h2>
                            <p className="text-sm text-slate-400">
                                Análise de caminhos entre investigadores
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>
                
                <div className="flex h-[calc(100%-80px)]">
                    {/* Sidebar - Journey Selection */}
                    <div className="w-72 border-r border-slate-700 p-4 overflow-y-auto">
                        {/* Investigation Selector */}
                        <div className="mb-4">
                            <label className="text-xs font-semibold text-slate-400 uppercase mb-2 block">
                                Operação
                            </label>
                            <select
                                value={selectedInvId}
                                onChange={(e) => setSelectedInvId(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:border-purple-500 focus:outline-none"
                            >
                                <option value="">Selecione...</option>
                                {investigations.map(inv => (
                                    <option key={inv.id} value={inv.id}>
                                        {inv.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Journey List */}
                        <h3 className="text-xs font-semibold text-slate-400 uppercase mb-3">
                            Jornadas Disponíveis
                        </h3>
                        
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                            </div>
                        ) : journeys.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-8">
                                Nenhuma jornada encontrada para esta operação
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {journeys.map((journey, idx) => (
                                    <button
                                        key={journey.id}
                                        onClick={() => toggleJourneySelection(journey.id)}
                                        className={`w-full text-left p-3 rounded-xl transition-all border ${
                                            selectedJourneyIds.includes(journey.id)
                                                ? INVESTIGATOR_COLORS[selectedJourneyIds.indexOf(journey.id) % INVESTIGATOR_COLORS.length]
                                                : 'bg-slate-800/50 border-transparent hover:border-slate-600'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            <span className="text-sm font-medium text-white truncate">
                                                {journey.investigator_name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                            <Footprints className="w-3 h-3" />
                                            <span>{journey.steps?.length || 0} passos</span>
                                            <span>•</span>
                                            <Clock className="w-3 h-3" />
                                            <span>{new Date(journey.created_at).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                        
                        {/* Quick Stats */}
                        {comparison && (
                            <div className="mt-4 p-3 bg-slate-800/50 rounded-xl">
                                <h4 className="text-xs font-semibold text-slate-400 mb-2">Resumo Geral</h4>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Investigadores</span>
                                        <span className="text-white">{comparison.totalInvestigators}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Entidades Visitadas</span>
                                        <span className="text-white">{comparison.totalEntitiesVisited}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Em Comum</span>
                                        <span className="text-emerald-400">{comparison.commonEntities}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Main Content - Comparison View */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        {selectedJourneys.length < 2 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <GitCompare className="w-16 h-16 text-slate-600 mb-4" />
                                <h3 className="text-lg font-medium text-white mb-2">
                                    Selecione pelo menos 2 jornadas
                                </h3>
                                <p className="text-slate-400 text-sm max-w-md">
                                    Clique nas jornadas à esquerda para selecioná-las e comparar 
                                    os caminhos investigativos de diferentes profissionais.
                                </p>
                            </div>
                        ) : detailedComparison ? (
                            <>
                                {/* Metrics */}
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                                        <div className="flex items-center gap-2 text-emerald-400 mb-2">
                                            <CheckCircle2 className="w-5 h-5" />
                                            <span className="text-sm">Em Comum</span>
                                        </div>
                                        <div className="text-2xl font-bold text-white">
                                            {detailedComparison.common.length}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1">
                                            entidades visitadas por todos
                                        </div>
                                    </div>
                                    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                                        <div className="flex items-center gap-2 text-amber-400 mb-2">
                                            <AlertCircle className="w-5 h-5" />
                                            <span className="text-sm">Achados Únicos</span>
                                        </div>
                                        <div className="text-2xl font-bold text-white">
                                            {Object.values(detailedComparison.unique).reduce((a, b) => a + b.length, 0)}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1">
                                            entidades exclusivas
                                        </div>
                                    </div>
                                    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                                        <div className="flex items-center gap-2 text-cyan-400 mb-2">
                                            <BarChart3 className="w-5 h-5" />
                                            <span className="text-sm">Total</span>
                                        </div>
                                        <div className="text-2xl font-bold text-white">
                                            {detailedComparison.total}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1">
                                            entidades combinadas
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Common Entities */}
                                {detailedComparison.common.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Entidades em Comum ({detailedComparison.common.length})
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {detailedComparison.common.map(entityId => {
                                                const entity = detailedComparison.entityDetails[entityId];
                                                return (
                                                    <div 
                                                        key={entityId}
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-sm"
                                                    >
                                                        {getIcon(entity?.type || 'default')}
                                                        <span className="text-emerald-300">{entity?.name || entityId}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Unique Finds by Investigator */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
                                        <Eye className="w-4 h-4" />
                                        Achados Exclusivos por Investigador
                                    </h3>
                                    
                                    {selectedJourneys.map((journey, idx) => {
                                        const uniqueEntities = detailedComparison.unique[journey.id] || [];
                                        const colorClass = INVESTIGATOR_COLORS[idx % INVESTIGATOR_COLORS.length];
                                        
                                        return (
                                            <div 
                                                key={journey.id}
                                                className={`p-4 rounded-xl border ${colorClass}`}
                                            >
                                                <div className="flex items-center gap-2 mb-3">
                                                    <User className="w-4 h-4" />
                                                    <span className="font-medium">{journey.investigator_name}</span>
                                                    <span className="text-xs opacity-60">
                                                        ({journey.steps?.length || 0} passos)
                                                    </span>
                                                </div>
                                                
                                                {uniqueEntities.length > 0 ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        {uniqueEntities.map(entityId => {
                                                            const entity = detailedComparison.entityDetails[entityId];
                                                            return (
                                                                <div 
                                                                    key={entityId}
                                                                    className="flex items-center gap-1.5 px-2 py-1 bg-slate-800/50 rounded text-xs"
                                                                >
                                                                    {getIcon(entity?.type || 'default')}
                                                                    <span className="text-slate-300">{entity?.name || entityId}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs opacity-60">
                                                        Nenhuma entidade exclusiva
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                {/* Insights */}
                                <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                                    <h3 className="text-sm font-semibold text-white mb-2">💡 Insights</h3>
                                    <ul className="space-y-1 text-sm text-slate-400">
                                        {detailedComparison.common.length === 0 && (
                                            <li>⚠️ Os investigadores não visitaram nenhuma entidade em comum - pode indicar abordagens muito diferentes.</li>
                                        )}
                                        {detailedComparison.common.length > 0 && detailedComparison.common.length < detailedComparison.total / 2 && (
                                            <li>📊 Apenas {Math.round((detailedComparison.common.length / detailedComparison.total) * 100)}% das entidades foram visitadas por ambos.</li>
                                        )}
                                        {Object.values(detailedComparison.unique).some(u => u.length > 3) && (
                                            <li>🔍 Há entidades exclusivas que podem conter informações importantes não exploradas por outros.</li>
                                        )}
                                        {selectedJourneys.every(j => (j.steps?.length || 0) < 5) && (
                                            <li>📈 Todas as jornadas são curtas - pode haver oportunidades de investigação mais profunda.</li>
                                        )}
                                    </ul>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default JourneyCompareModal;
