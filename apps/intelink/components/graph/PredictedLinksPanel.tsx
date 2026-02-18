'use client';

/**
 * Predicted Links Panel
 * 
 * Mostra links previstos pelos algoritmos de Link Prediction.
 * Integra com:
 * - graph-algorithms.ts (predictLinksForNode, suggestConnections)
 * - /api/investigation/[id]/predictions
 * 
 * Features:
 * - "Você pode conhecer" - sugestões estilo LinkedIn
 * - One-click confirm para criar vínculo real
 * - Score de confiança (0-100%)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
    Sparkles, Users, ChevronRight, Check, X, 
    RefreshCw, Eye, Link as LinkIcon, AlertCircle
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface PredictedLink {
    source: string;
    target: string;
    score: number;
    algorithm: string;
    commonNeighbors?: string[];
    sourceEntity?: {
        id: string;
        name: string;
        type: string;
    };
    targetEntity?: {
        id: string;
        name: string;
        type: string;
    };
    commonNeighborDetails?: Array<{
        id: string;
        name: string;
        type: string;
    }>;
}

interface Suggestion {
    entity: {
        id: string;
        name: string;
        type: string;
    };
    score: number;
    reason: string;
    mutualConnections: string[];
}

interface PredictedLinksPanelProps {
    investigationId: string;
    selectedEntityId?: string | null;
    onConfirmLink?: (sourceId: string, targetId: string) => void;
    onViewEntity?: (entityId: string) => void;
    className?: string;
    /** Hide internal header/container (use when inside CollapsibleWidget) */
    hideContainer?: boolean;
}

// ============================================================================
// TYPE COLORS (consistent with graph)
// ============================================================================

const TYPE_COLORS: Record<string, string> = {
    PERSON: '#3b82f6',
    VEHICLE: '#10b981',
    LOCATION: '#f59e0b',
    ORGANIZATION: '#8b5cf6',
    COMPANY: '#ec4899',
    PHONE: '#06b6d4',
    FIREARM: '#ef4444',
    OTHER: '#6b7280',
};

const TYPE_LABELS: Record<string, string> = {
    PERSON: 'Pessoa',
    VEHICLE: 'Veículo',
    LOCATION: 'Local',
    ORGANIZATION: 'Organização',
    COMPANY: 'Empresa',
    PHONE: 'Telefone',
    FIREARM: 'Arma',
    OTHER: 'Outro',
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function PredictedLinksPanel({
    investigationId,
    selectedEntityId,
    onConfirmLink,
    onViewEntity,
    className = '',
    hideContainer = false,
}: PredictedLinksPanelProps) {
    const [predictions, setPredictions] = useState<PredictedLink[]>([]);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [confirming, setConfirming] = useState<string | null>(null);
    const [accuracy, setAccuracy] = useState<{ total: number; confirmed: number; rejected: number; accuracy: number } | null>(null);

    // Fetch predictions
    const fetchPredictions = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const url = selectedEntityId
                ? `/api/investigation/${investigationId}/predictions?entityId=${selectedEntityId}&limit=5`
                : `/api/investigation/${investigationId}/predictions?limit=10`;

            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch predictions');

            const data = await response.json();
            setPredictions(data.predictions || []);
            setSuggestions(data.suggestions || []);

            // Fetch accuracy stats
            try {
                const statsRes = await fetch(`/api/predictions/feedback?investigation_id=${investigationId}`);
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setAccuracy(statsData.overall || null);
                }
            } catch {
                // Non-critical - continue without accuracy
            }
        } catch (err) {
            console.error('[PredictedLinksPanel] Error:', err);
            setError('Erro ao carregar predições');
        } finally {
            setLoading(false);
        }
    }, [investigationId, selectedEntityId]);

    useEffect(() => {
        fetchPredictions();
    }, [fetchPredictions]);

    // Confirm a predicted link (create real relationship)
    const handleConfirm = async (sourceId: string, targetId: string, algorithm = 'combined') => {
        setConfirming(`${sourceId}-${targetId}`);
        
        // Find the prediction to get its score
        const pred = predictions.find(p => p.source === sourceId && p.target === targetId);
        const sugg = suggestions.find(s => s.entity.id === targetId);
        const score = pred?.score || sugg?.score || 50;
        
        try {
            // Call parent handler if provided
            if (onConfirmLink) {
                onConfirmLink(sourceId, targetId);
            }

            // Create relationship via API
            const response = await fetch(`/api/investigation/${investigationId}/relationships`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source_id: sourceId,
                    target_id: targetId,
                    type: 'PREDICTED_LINK',
                    metadata: {
                        source: 'link_prediction',
                        confirmed_at: new Date().toISOString(),
                    },
                }),
            });

            if (response.ok) {
                // Record feedback for accuracy tracking
                await fetch('/api/predictions/feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        investigation_id: investigationId,
                        source_entity_id: sourceId,
                        target_entity_id: targetId,
                        algorithm: pred?.algorithm || algorithm,
                        score: score / 100, // Convert to 0-1 range
                        status: 'confirmed',
                        common_neighbors: pred?.commonNeighbors?.length || 0
                    })
                });

                // Remove from predictions
                setPredictions(prev => prev.filter(
                    p => !(p.source === sourceId && p.target === targetId)
                ));
                setSuggestions(prev => prev.filter(
                    s => s.entity.id !== targetId
                ));

                // Update accuracy count
                if (accuracy) {
                    setAccuracy({
                        ...accuracy,
                        total: accuracy.total + 1,
                        confirmed: accuracy.confirmed + 1,
                        accuracy: Math.round(((accuracy.confirmed + 1) / (accuracy.confirmed + accuracy.rejected + 1)) * 100)
                    });
                }
            }
        } catch (err) {
            console.error('[PredictedLinksPanel] Confirm error:', err);
        } finally {
            setConfirming(null);
        }
    };

    // Render score badge
    const renderScore = (score: number) => {
        const color = score >= 70 ? 'text-green-400' : score >= 40 ? 'text-yellow-400' : 'text-slate-400';
        return (
            <span className={`text-xs font-medium ${color}`}>
                {Math.round(score)}%
            </span>
        );
    };

    // Render entity badge (clickable with tooltip) - wider names
    const renderEntityBadge = (entity: { id?: string; name: string; type: string }, clickable = true, maxWidth = 'max-w-[140px]') => (
        <button
            onClick={() => clickable && entity.id && onViewEntity?.(entity.id)}
            className={`flex items-center gap-1.5 group ${clickable && entity.id ? 'hover:bg-slate-600/30 rounded px-1.5 -mx-1 cursor-pointer' : ''}`}
            title={`${TYPE_LABELS[entity.type] || 'Entidade'}: ${entity.name}\n${clickable ? 'Clique para ver detalhes' : ''}`}
        >
            <div 
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: TYPE_COLORS[entity.type] || TYPE_COLORS.OTHER }}
            />
            <span className={`text-sm font-medium truncate ${maxWidth} ${clickable && entity.id ? 'group-hover:text-blue-400 transition-colors' : ''}`}>
                {entity.name}
            </span>
        </button>
    );

    if (loading) {
        return (
            <div className={`bg-slate-800/50 rounded-xl p-4 ${className}`}>
                <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-slate-700 rounded w-3/4" />
                    <div className="h-12 bg-slate-700 rounded" />
                    <div className="h-12 bg-slate-700 rounded" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`bg-slate-800/50 rounded-xl p-4 ${className}`}>
                <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                </div>
            </div>
        );
    }

    const hasPredictions = predictions.length > 0 || suggestions.length > 0;

    // When hideContainer is true, render minimal version for use inside CollapsibleWidget
    if (hideContainer) {
        return (
            <div className={`flex flex-col h-full ${className}`}>
                {/* Content - flex-grow to fill available space */}
                <div className="flex-1 p-3 space-y-2 overflow-y-auto">
                    {!hasPredictions ? (
                        <div className="flex flex-col items-center justify-center h-full py-8">
                            <Sparkles className="w-10 h-10 text-slate-600 mb-3" />
                            <p className="text-sm text-slate-400 text-center">
                                Nenhuma predição disponível
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                Adicione mais entidades e vínculos
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Global predictions - improved layout */}
                            {predictions.map((pred) => (
                                <div 
                                    key={`${pred.source}-${pred.target}`}
                                    className="p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors group border border-slate-700/50"
                                >
                                    {/* Entity names - full width row */}
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            {pred.sourceEntity && renderEntityBadge({ ...pred.sourceEntity, id: pred.source }, true, 'max-w-[120px]')}
                                            <LinkIcon className="w-3 h-3 text-purple-400 flex-shrink-0" />
                                            {pred.targetEntity && renderEntityBadge({ ...pred.targetEntity, id: pred.target }, true, 'max-w-[120px]')}
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                            <span className={`text-sm font-semibold px-2 py-0.5 rounded ${
                                                pred.score >= 70 ? 'bg-green-500/20 text-green-400' : 
                                                pred.score >= 40 ? 'bg-yellow-500/20 text-yellow-400' : 
                                                'bg-slate-600/50 text-slate-400'
                                            }`}>
                                                {Math.round(pred.score)}%
                                            </span>
                                            <button
                                                onClick={() => handleConfirm(pred.source, pred.target)}
                                                disabled={confirming === `${pred.source}-${pred.target}`}
                                                className="p-1.5 bg-green-500/20 hover:bg-green-500/30 rounded transition-colors disabled:opacity-50"
                                                title="Confirmar vínculo"
                                            >
                                                <Check className="w-3.5 h-3.5 text-green-400" />
                                            </button>
                                        </div>
                                    </div>
                                    {/* Details row */}
                                    <div className="flex items-center gap-3 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            {pred.commonNeighbors?.length || 0} em comum
                                        </span>
                                        <span className="text-slate-600">•</span>
                                        <span className="text-slate-500">
                                            {pred.algorithm === 'adamic_adar' ? 'Adamic-Adar' : 
                                             pred.algorithm === 'jaccard' ? 'Jaccard' : pred.algorithm}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
                {/* Footer with stats */}
                {hasPredictions && (
                    <div className="px-3 py-2 border-t border-slate-700/30 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">
                            {predictions.length} predição(ões) • Adamic-Adar + Jaccard
                        </span>
                        {accuracy && accuracy.total > 0 && (
                            <span className={`text-[10px] font-medium ${
                                accuracy.accuracy >= 70 ? 'text-green-400' : 
                                accuracy.accuracy >= 50 ? 'text-yellow-400' : 'text-slate-400'
                            }`}>
                                Precisão: {accuracy.accuracy}%
                            </span>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={`bg-slate-800/50 rounded-xl overflow-hidden ${className}`}>
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-b border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium text-white">
                        {selectedEntityId ? 'Você pode conhecer' : 'Links Previstos'}
                    </span>
                </div>
                <button
                    onClick={fetchPredictions}
                    className="p-1 hover:bg-slate-700/50 rounded transition-colors"
                    title="Atualizar predições"
                >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                </button>
            </div>

            {/* Content */}
            <div className="p-3 space-y-2 max-h-[300px] overflow-y-auto">
                {!hasPredictions ? (
                    <p className="text-sm text-slate-400 text-center py-4">
                        Nenhuma predição disponível.<br />
                        <span className="text-xs">Adicione mais entidades e vínculos.</span>
                    </p>
                ) : (
                    <>
                        {/* Suggestions (when entity selected) */}
                        {suggestions.map((suggestion) => (
                            <div 
                                key={suggestion.entity.id}
                                className="p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        {renderEntityBadge(suggestion.entity)}
                                        <p className="text-xs text-slate-400 mt-1">
                                            {suggestion.reason}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {renderScore(suggestion.score)}
                                        <button
                                            onClick={() => onViewEntity?.(suggestion.entity.id)}
                                            className="p-1.5 hover:bg-slate-600 rounded transition-colors"
                                            title="Ver entidade"
                                        >
                                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                                        </button>
                                        <button
                                            onClick={() => handleConfirm(selectedEntityId!, suggestion.entity.id)}
                                            disabled={confirming === `${selectedEntityId}-${suggestion.entity.id}`}
                                            className="p-1.5 bg-green-500/20 hover:bg-green-500/30 rounded transition-colors disabled:opacity-50"
                                            title="Confirmar vínculo"
                                        >
                                            <Check className="w-3.5 h-3.5 text-green-400" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Global predictions (when no entity selected) */}
                        {!selectedEntityId && predictions.map((pred) => (
                            <div 
                                key={`${pred.source}-${pred.target}`}
                                className="p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors group"
                                title={`Conexão sugerida com ${Math.round(pred.score)}% de confiança\n${pred.commonNeighbors?.length || 0} conexão(ões) em comum`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    {pred.sourceEntity && renderEntityBadge({ ...pred.sourceEntity, id: pred.source })}
                                    <LinkIcon className="w-3 h-3 text-purple-400 group-hover:text-purple-300 transition-colors" />
                                    {pred.targetEntity && renderEntityBadge({ ...pred.targetEntity, id: pred.target })}
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <Users className="w-3 h-3 text-slate-500" />
                                        <p className="text-xs text-slate-400">
                                            {pred.commonNeighbors?.length || 0} em comum
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {renderScore(pred.score)}
                                        <button
                                            onClick={() => handleConfirm(pred.source, pred.target)}
                                            disabled={confirming === `${pred.source}-${pred.target}`}
                                            className="p-1.5 bg-green-500/20 hover:bg-green-500/30 rounded transition-colors disabled:opacity-50"
                                            title="✓ Confirmar este vínculo como real"
                                        >
                                            <Check className="w-3.5 h-3.5 text-green-400" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>

            {/* Footer with Accuracy */}
            {hasPredictions && (
                <div className="px-4 py-2 border-t border-slate-700/50 bg-slate-800/30">
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>Adamic-Adar + Jaccard</span>
                        {accuracy && accuracy.total > 0 && (
                            <span className={`font-medium ${accuracy.accuracy >= 70 ? 'text-green-400' : accuracy.accuracy >= 50 ? 'text-yellow-400' : 'text-slate-400'}`}>
                                Precisão: {accuracy.accuracy}% ({accuracy.confirmed}/{accuracy.confirmed + accuracy.rejected})
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
