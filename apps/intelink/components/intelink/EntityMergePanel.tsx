'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
    GitMerge, 
    AlertTriangle, 
    Check, 
    X, 
    RotateCcw,
    ChevronDown,
    ChevronRight,
    User,
    Car,
    MapPin,
    Phone,
    Building,
    Loader2
} from 'lucide-react';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface Entity {
    id: string;
    name: string;
    type: string;
    metadata?: Record<string, any>;
}

interface MergeSuggestion {
    id: string;
    entity_a_id: string;
    entity_b_id: string;
    entity_a: Entity;
    entity_b: Entity;
    match_type: string;
    match_reason: string;
    similarity_score: number;
    diff_data: Record<string, { a: any; b: any }>;
    status: string;
}

interface EntityMergePanelProps {
    investigationId: string;
    onMergeComplete?: () => void;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ENTITY TYPE ICONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const entityIcons: Record<string, React.ReactNode> = {
    PERSON: <User className="w-4 h-4" />,
    VEHICLE: <Car className="w-4 h-4" />,
    LOCATION: <MapPin className="w-4 h-4" />,
    PHONE: <Phone className="w-4 h-4" />,
    ORGANIZATION: <Building className="w-4 h-4" />,
    COMPANY: <Building className="w-4 h-4" />,
};

const matchTypeLabels: Record<string, string> = {
    cpf: 'CPF Idêntico',
    plate: 'Placa Idêntica',
    name_similarity: 'Nomes Similares',
    phone: 'Telefone Idêntico',
};

const matchTypeColors: Record<string, string> = {
    cpf: 'bg-green-500/20 text-green-400 border-green-500/30',
    plate: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    name_similarity: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    phone: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DIFF COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function DiffView({ diff }: { diff: Record<string, { a: any; b: any }> }) {
    const entries = Object.entries(diff);
    
    if (entries.length === 0) {
        return (
            <div className="text-xs text-slate-500 italic">
                Sem diferenças significativas
            </div>
        );
    }
    
    return (
        <div className="space-y-1">
            {entries.map(([field, values]) => (
                <div key={field} className="flex items-start gap-2 text-xs">
                    <span className="text-slate-500 min-w-[100px]">
                        {field.replace('metadata.', '')}:
                    </span>
                    <div className="flex-1 flex gap-2">
                        <span className="bg-red-500/20 text-red-300 px-1 rounded line-through">
                            {values.a || '(vazio)'}
                        </span>
                        <span className="text-slate-500">→</span>
                        <span className="bg-green-500/20 text-green-300 px-1 rounded">
                            {values.b || '(vazio)'}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SUGGESTION CARD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function SuggestionCard({ 
    suggestion, 
    onMerge, 
    onReject,
    isProcessing 
}: { 
    suggestion: MergeSuggestion;
    onMerge: (sourceId: string, targetId: string) => void;
    onReject: () => void;
    isProcessing: boolean;
}) {
    const [expanded, setExpanded] = useState(false);
    const [selectedTarget, setSelectedTarget] = useState<'a' | 'b'>('b');
    
    const entityA = suggestion.entity_a;
    const entityB = suggestion.entity_b;
    
    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
            {/* Header */}
            <div 
                className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-700/30"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-3">
                    {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    
                    <div className="flex items-center gap-2">
                        {entityIcons[entityA?.type] || <User className="w-4 h-4" />}
                        <span className="font-medium">{entityA?.name}</span>
                    </div>
                    
                    <GitMerge className="w-4 h-4 text-slate-500" />
                    
                    <div className="flex items-center gap-2">
                        {entityIcons[entityB?.type] || <User className="w-4 h-4" />}
                        <span className="font-medium">{entityB?.name}</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs rounded border ${matchTypeColors[suggestion.match_type] || 'bg-slate-600'}`}>
                        {matchTypeLabels[suggestion.match_type] || suggestion.match_type}
                    </span>
                    <span className="text-xs text-slate-500">
                        {Math.round(suggestion.similarity_score * 100)}%
                    </span>
                </div>
            </div>
            
            {/* Expanded Content */}
            {expanded && (
                <div className="p-4 border-t border-slate-700 space-y-4">
                    {/* Match Reason */}
                    <div className="text-sm text-slate-400">
                        <AlertTriangle className="w-4 h-4 inline mr-2 text-yellow-500" />
                        {suggestion.match_reason}
                    </div>
                    
                    {/* Side by Side Comparison */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Entity A */}
                        <div 
                            className={`p-3 rounded border cursor-pointer transition-all ${
                                selectedTarget === 'a' 
                                    ? 'border-blue-500 bg-blue-500/10' 
                                    : 'border-slate-600 hover:border-slate-500'
                            }`}
                            onClick={() => setSelectedTarget('a')}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-slate-500">Entidade A</span>
                                {selectedTarget === 'a' && (
                                    <span className="text-xs text-blue-400">← Manter esta</span>
                                )}
                            </div>
                            <div className="font-medium mb-2">{entityA?.name}</div>
                            <div className="space-y-1 text-xs text-slate-400">
                                {entityA?.metadata?.cpf && <div>CPF: {entityA.metadata.cpf}</div>}
                                {entityA?.metadata?.telefone && <div>Tel: {entityA.metadata.telefone}</div>}
                                {entityA?.metadata?.placa && <div>Placa: {entityA.metadata.placa}</div>}
                            </div>
                        </div>
                        
                        {/* Entity B */}
                        <div 
                            className={`p-3 rounded border cursor-pointer transition-all ${
                                selectedTarget === 'b' 
                                    ? 'border-blue-500 bg-blue-500/10' 
                                    : 'border-slate-600 hover:border-slate-500'
                            }`}
                            onClick={() => setSelectedTarget('b')}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-slate-500">Entidade B</span>
                                {selectedTarget === 'b' && (
                                    <span className="text-xs text-blue-400">← Manter esta</span>
                                )}
                            </div>
                            <div className="font-medium mb-2">{entityB?.name}</div>
                            <div className="space-y-1 text-xs text-slate-400">
                                {entityB?.metadata?.cpf && <div>CPF: {entityB.metadata.cpf}</div>}
                                {entityB?.metadata?.telefone && <div>Tel: {entityB.metadata.telefone}</div>}
                                {entityB?.metadata?.placa && <div>Placa: {entityB.metadata.placa}</div>}
                            </div>
                        </div>
                    </div>
                    
                    {/* Diff */}
                    {Object.keys(suggestion.diff_data || {}).length > 0 && (
                        <div className="p-3 bg-slate-900/50 rounded">
                            <div className="text-xs text-slate-500 mb-2">Diferenças:</div>
                            <DiffView diff={suggestion.diff_data} />
                        </div>
                    )}
                    
                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
                        <button
                            onClick={onReject}
                            disabled={isProcessing}
                            className="px-3 py-1.5 text-sm rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-50 flex items-center gap-1"
                        >
                            <X className="w-4 h-4" />
                            Ignorar
                        </button>
                        <button
                            onClick={() => {
                                const sourceId = selectedTarget === 'a' ? entityB?.id : entityA?.id;
                                const targetId = selectedTarget === 'a' ? entityA?.id : entityB?.id;
                                onMerge(sourceId, targetId);
                            }}
                            disabled={isProcessing}
                            className="px-3 py-1.5 text-sm rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 flex items-center gap-1"
                        >
                            {isProcessing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <GitMerge className="w-4 h-4" />
                            )}
                            Mesclar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function EntityMergePanel({ investigationId, onMergeComplete }: EntityMergePanelProps) {
    const [suggestions, setSuggestions] = useState<MergeSuggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    // Detect duplicates
    const detectDuplicates = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const res = await fetch('/api/entities/merge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'detect',
                    investigation_id: investigationId
                })
            });
            
            if (!res.ok) throw new Error('Failed to detect duplicates');
            
            const data = await res.json();
            setSuggestions(data.suggestions || []);
        } catch (err) {
            setError('Erro ao detectar duplicatas');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [investigationId]);
    
    useEffect(() => {
        detectDuplicates();
    }, [detectDuplicates]);
    
    // Handle merge
    const handleMerge = async (suggestionId: string, sourceId: string, targetId: string) => {
        setProcessing(suggestionId);
        
        try {
            const res = await fetch('/api/entities/merge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'merge',
                    suggestion_id: suggestionId,
                    source_id: sourceId,
                    target_id: targetId
                })
            });
            
            if (!res.ok) throw new Error('Failed to merge');
            
            // Remove from list
            setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
            onMergeComplete?.();
        } catch (err) {
            setError('Erro ao mesclar entidades');
            console.error(err);
        } finally {
            setProcessing(null);
        }
    };
    
    // Handle reject
    const handleReject = async (suggestionId: string) => {
        setProcessing(suggestionId);
        
        try {
            const res = await fetch('/api/entities/merge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'reject',
                    suggestion_id: suggestionId
                })
            });
            
            if (!res.ok) throw new Error('Failed to reject');
            
            // Remove from list
            setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
        } catch (err) {
            setError('Erro ao rejeitar sugestão');
            console.error(err);
        } finally {
            setProcessing(null);
        }
    };
    
    // Loading state
    if (loading) {
        return (
            <div className="p-4 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                Analisando entidades...
            </div>
        );
    }
    
    // No suggestions
    if (suggestions.length === 0) {
        return (
            <div className="p-4 text-center text-slate-400">
                <Check className="w-8 h-8 mx-auto mb-2 text-green-500" />
                Nenhuma duplicata encontrada
            </div>
        );
    }
    
    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <GitMerge className="w-5 h-5 text-blue-400" />
                    <span className="font-medium">Sugestões de Merge</span>
                    <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded">
                        {suggestions.length}
                    </span>
                </div>
                <button
                    onClick={detectDuplicates}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                >
                    <RotateCcw className="w-3 h-3" />
                    Atualizar
                </button>
            </div>
            
            {/* Error */}
            {error && (
                <div className="p-2 bg-red-500/20 border border-red-500/30 rounded text-sm text-red-400">
                    {error}
                </div>
            )}
            
            {/* Suggestions */}
            <div className="space-y-2">
                {suggestions.map(suggestion => (
                    <SuggestionCard
                        key={suggestion.id}
                        suggestion={suggestion}
                        onMerge={(sourceId, targetId) => handleMerge(suggestion.id, sourceId, targetId)}
                        onReject={() => handleReject(suggestion.id)}
                        isProcessing={processing === suggestion.id}
                    />
                ))}
            </div>
        </div>
    );
}
