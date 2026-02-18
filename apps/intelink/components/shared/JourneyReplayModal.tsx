'use client';

/**
 * JourneyReplayModal - Visual replay of investigation journeys
 * 
 * Features:
 * - Load saved journeys from Supabase
 * - Timeline slider with play/pause/step controls
 * - Speed controls (0.5x, 1x, 2x)
 * - Visual breadcrumb trail
 * - Integration with graph for node highlighting
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    X, 
    Play, 
    Pause, 
    SkipBack, 
    SkipForward,
    ChevronLeft,
    ChevronRight,
    User,
    Car,
    MapPin,
    Building2,
    FileText,
    Clock,
    Footprints,
    Loader2,
    Share2,
} from 'lucide-react';
import { ShareJourneyDialog } from './ShareJourneyDialog';
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

interface JourneyReplayModalProps {
    isOpen: boolean;
    onClose: () => void;
    journeyId?: string; // If provided, loads specific journey
    onNodeFocus?: (entityId: string) => void; // Callback to focus node in graph
}

export function JourneyReplayModal({ 
    isOpen, 
    onClose, 
    journeyId,
    onNodeFocus 
}: JourneyReplayModalProps) {
    const supabase = getSupabase();
    
    // Journey data
    const [journeys, setJourneys] = useState<InvestigationJourney[]>([]);
    const [selectedJourney, setSelectedJourney] = useState<InvestigationJourney | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Replay state
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1); // 0.5, 1, 2
    const playIntervalRef = useRef<NodeJS.Timeout | null>(null);
    
    // Share dialog state
    const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
    
    // Load journeys on mount
    useEffect(() => {
        if (!isOpen) return;
        loadJourneys();
    }, [isOpen]);
    
    // Load specific journey if provided
    useEffect(() => {
        if (journeyId && journeys.length > 0) {
            const journey = journeys.find(j => j.id === journeyId);
            if (journey) {
                setSelectedJourney(journey);
                setCurrentStepIndex(0);
            }
        }
    }, [journeyId, journeys]);
    
    // Play/pause logic
    useEffect(() => {
        if (isPlaying && selectedJourney) {
            const steps = selectedJourney.steps;
            const intervalMs = (2000 / speed); // Base 2 seconds per step
            
            playIntervalRef.current = setInterval(() => {
                setCurrentStepIndex(prev => {
                    const next = prev + 1;
                    if (next >= steps.length) {
                        setIsPlaying(false);
                        return prev;
                    }
                    // Trigger node focus if callback provided
                    if (onNodeFocus && steps[next]) {
                        onNodeFocus(steps[next].entityId);
                    }
                    return next;
                });
            }, intervalMs);
        }
        
        return () => {
            if (playIntervalRef.current) {
                clearInterval(playIntervalRef.current);
            }
        };
    }, [isPlaying, speed, selectedJourney, onNodeFocus]);
    
    const loadJourneys = async () => {
        setLoading(true);
        try {
            const memberId = localStorage.getItem('intelink_member_id');
            if (!memberId || !supabase) {
                setJourneys([]);
                setLoading(false);
                return;
            }
            
            const { data, error } = await supabase
                .from('intelink_journeys')
                .select('*')
                .eq('user_id', memberId)
                .order('created_at', { ascending: false })
                .limit(20);
            
            if (error) {
                console.error('[JourneyReplay] Load error:', error);
                setJourneys([]);
            } else {
                // Transform snake_case to camelCase
                const transformed = (data || []).map((j: any) => ({
                    id: j.id,
                    userId: j.user_id,
                    investigationId: j.investigation_id,
                    title: j.title,
                    context: j.context,
                    steps: j.steps || [],
                    stepCount: (j.steps || []).length,
                    aiAnalysis: j.ai_analysis,
                    aiModel: j.ai_model,
                    aiAnalyzedAt: j.ai_analyzed_at ? new Date(j.ai_analyzed_at) : undefined,
                    status: j.status,
                    createdAt: new Date(j.created_at),
                    updatedAt: new Date(j.updated_at),
                }));
                setJourneys(transformed);
                
                // Auto-select first if none selected
                if (transformed.length > 0 && !selectedJourney) {
                    setSelectedJourney(transformed[0]);
                }
            }
        } catch (e) {
            console.error('[JourneyReplay] Error:', e);
            setJourneys([]);
        }
        setLoading(false);
    };
    
    const handlePlayPause = () => {
        if (!selectedJourney) return;
        
        if (isPlaying) {
            setIsPlaying(false);
        } else {
            // If at end, restart
            if (currentStepIndex >= selectedJourney.steps.length - 1) {
                setCurrentStepIndex(0);
            }
            setIsPlaying(true);
        }
    };
    
    const handleStepBack = () => {
        setIsPlaying(false);
        setCurrentStepIndex(prev => Math.max(0, prev - 1));
    };
    
    const handleStepForward = () => {
        if (!selectedJourney) return;
        setIsPlaying(false);
        setCurrentStepIndex(prev => Math.min(selectedJourney.steps.length - 1, prev + 1));
    };
    
    const handleReset = () => {
        setIsPlaying(false);
        setCurrentStepIndex(0);
    };
    
    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsPlaying(false);
        const value = parseInt(e.target.value);
        setCurrentStepIndex(value);
        
        // Focus node
        if (onNodeFocus && selectedJourney?.steps[value]) {
            onNodeFocus(selectedJourney.steps[value].entityId);
        }
    };
    
    const handleSpeedChange = () => {
        setSpeed(prev => {
            if (prev === 0.5) return 1;
            if (prev === 1) return 2;
            return 0.5;
        });
    };
    
    const handleSelectJourney = (journey: InvestigationJourney) => {
        setSelectedJourney(journey);
        setCurrentStepIndex(0);
        setIsPlaying(false);
    };
    
    const getIcon = (type: string) => {
        const Icon = ENTITY_ICONS[type] || ENTITY_ICONS.default;
        return <Icon className="w-4 h-4" />;
    };
    
    const getColor = (type: string) => {
        return ENTITY_COLORS[type] || ENTITY_COLORS.default;
    };
    
    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };
    
    if (!isOpen) return null;
    
    const currentStep = selectedJourney?.steps[currentStepIndex];
    const totalSteps = selectedJourney?.steps.length || 0;
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                            <Footprints className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Replay de Jornada</h2>
                            <p className="text-sm text-slate-400">
                                {selectedJourney?.title || 'Selecione uma jornada'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedJourney && (
                            <button 
                                onClick={() => setIsShareDialogOpen(true)}
                                className="flex items-center gap-2 px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg transition-colors"
                                title="Compartilhar jornada"
                            >
                                <Share2 className="w-4 h-4" />
                                <span className="text-sm font-medium">Compartilhar</span>
                            </button>
                        )}
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>
                </div>
                
                <div className="flex h-[calc(100%-80px)]">
                    {/* Sidebar - Journey List */}
                    <div className="w-64 border-r border-slate-700 p-4 overflow-y-auto">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase mb-3">
                            Jornadas Salvas
                        </h3>
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
                            </div>
                        ) : journeys.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-8">
                                Nenhuma jornada salva
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {journeys.map((journey) => (
                                    <button
                                        key={journey.id}
                                        onClick={() => handleSelectJourney(journey)}
                                        className={`w-full text-left p-3 rounded-xl transition-all ${
                                            selectedJourney?.id === journey.id
                                                ? 'bg-cyan-500/20 border border-cyan-500/40'
                                                : 'bg-slate-800/50 hover:bg-slate-800 border border-transparent'
                                        }`}
                                    >
                                        <div className="text-sm font-medium text-white truncate">
                                            {journey.title}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                            <Footprints className="w-3 h-3" />
                                            <span>{journey.steps.length} passos</span>
                                            <span>•</span>
                                            <Clock className="w-3 h-3" />
                                            <span>{journey.createdAt.toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {/* Main Content - Replay */}
                    <div className="flex-1 p-6 flex flex-col">
                        {selectedJourney && selectedJourney.steps.length > 0 ? (
                            <>
                                {/* Current Step Display */}
                                <div className="flex-1 flex items-center justify-center">
                                    {currentStep && (
                                        <div className="text-center">
                                            {/* Step Badge */}
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-400 mb-4">
                                                <span>Passo {currentStepIndex + 1} de {totalSteps}</span>
                                            </div>
                                            
                                            {/* Entity Card */}
                                            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 min-w-[300px]">
                                                <div className={`w-16 h-16 ${getColor(currentStep.entityType)} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                                                    {React.createElement(ENTITY_ICONS[currentStep.entityType] || ENTITY_ICONS.default, { className: 'w-8 h-8 text-white' })}
                                                </div>
                                                <h3 className="text-xl font-bold text-white mb-2">
                                                    {currentStep.entityName}
                                                </h3>
                                                <p className="text-slate-400 text-sm mb-4">
                                                    {currentStep.entityType}
                                                </p>
                                                
                                                {/* Navigation Source */}
                                                <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                                                    <span>via</span>
                                                    <span className="px-2 py-0.5 bg-slate-700 rounded-full">
                                                        {currentStep.source === 'search' && '🔍 Busca'}
                                                        {currentStep.source === 'click_relationship' && '🔗 Conexão'}
                                                        {currentStep.source === 'graph_nav' && '🕸️ Grafo'}
                                                        {currentStep.source === 'document' && '📄 Documento'}
                                                        {currentStep.source === 'direct_link' && '🔗 Link'}
                                                    </span>
                                                    <span>às {formatTime(currentStep.timestamp)}</span>
                                                </div>
                                                
                                                {/* Visible Connections */}
                                                {currentStep.visibleConnectionsSnapshot?.length > 0 && (
                                                    <div className="mt-4 pt-4 border-t border-slate-700">
                                                        <p className="text-xs text-slate-500 mb-2">
                                                            Conexões visíveis ({currentStep.visibleConnectionsSnapshot.length})
                                                        </p>
                                                        <div className="flex flex-wrap gap-1 justify-center">
                                                            {currentStep.visibleConnectionsSnapshot.slice(0, 5).map((conn, idx) => (
                                                                <span 
                                                                    key={idx}
                                                                    className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300"
                                                                >
                                                                    {conn.name}
                                                                </span>
                                                            ))}
                                                            {currentStep.visibleConnectionsSnapshot.length > 5 && (
                                                                <span className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-400">
                                                                    +{currentStep.visibleConnectionsSnapshot.length - 5}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Timeline */}
                                <div className="mt-6">
                                    {/* Step indicators */}
                                    <div className="flex items-center justify-between mb-2 px-2">
                                        {selectedJourney.steps.map((step, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    setCurrentStepIndex(idx);
                                                    setIsPlaying(false);
                                                    if (onNodeFocus) onNodeFocus(step.entityId);
                                                }}
                                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                                    idx === currentStepIndex
                                                        ? `${getColor(step.entityType)} scale-110 shadow-lg`
                                                        : idx < currentStepIndex
                                                        ? 'bg-slate-600'
                                                        : 'bg-slate-800'
                                                }`}
                                                title={step.entityName}
                                            >
                                                {getIcon(step.entityType)}
                                            </button>
                                        ))}
                                    </div>
                                    
                                    {/* Slider */}
                                    <input
                                        type="range"
                                        min={0}
                                        max={totalSteps - 1}
                                        value={currentStepIndex}
                                        onChange={handleSliderChange}
                                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                    />
                                </div>
                                
                                {/* Controls */}
                                <div className="flex items-center justify-center gap-4 mt-6">
                                    <button
                                        onClick={handleReset}
                                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                                        title="Reiniciar"
                                    >
                                        <SkipBack className="w-5 h-5 text-slate-300" />
                                    </button>
                                    
                                    <button
                                        onClick={handleStepBack}
                                        disabled={currentStepIndex === 0}
                                        className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                                        title="Passo anterior"
                                    >
                                        <ChevronLeft className="w-5 h-5 text-slate-300" />
                                    </button>
                                    
                                    <button
                                        onClick={handlePlayPause}
                                        className="w-14 h-14 bg-cyan-600 hover:bg-cyan-700 rounded-full flex items-center justify-center transition-colors shadow-lg"
                                    >
                                        {isPlaying ? (
                                            <Pause className="w-6 h-6 text-white" />
                                        ) : (
                                            <Play className="w-6 h-6 text-white ml-1" />
                                        )}
                                    </button>
                                    
                                    <button
                                        onClick={handleStepForward}
                                        disabled={currentStepIndex >= totalSteps - 1}
                                        className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                                        title="Próximo passo"
                                    >
                                        <ChevronRight className="w-5 h-5 text-slate-300" />
                                    </button>
                                    
                                    <button
                                        onClick={() => setCurrentStepIndex(totalSteps - 1)}
                                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                                        title="Ir para o fim"
                                    >
                                        <SkipForward className="w-5 h-5 text-slate-300" />
                                    </button>
                                    
                                    {/* Speed Control */}
                                    <button
                                        onClick={handleSpeedChange}
                                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-sm font-mono text-slate-300"
                                        title="Velocidade"
                                    >
                                        {speed}x
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center text-slate-500">
                                    <Footprints className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>Selecione uma jornada para reproduzir</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Share Dialog */}
            {selectedJourney && (
                <ShareJourneyDialog
                    isOpen={isShareDialogOpen}
                    onClose={() => setIsShareDialogOpen(false)}
                    journeyId={selectedJourney.id}
                    journeyTitle={selectedJourney.title || 'Jornada sem título'}
                />
            )}
        </div>
    );
}

export default JourneyReplayModal;
