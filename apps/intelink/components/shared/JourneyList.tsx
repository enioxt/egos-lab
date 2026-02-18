'use client';

/**
 * JourneyList - Component to display saved Investigation Journeys
 */

import React, { useEffect, useState } from 'react';
import { 
    GitBranch, 
    Calendar, 
    Sparkles, 
    ChevronRight, 
    User, 
    Car, 
    MapPin, 
    Building2,
    FileText,
    Loader2
} from 'lucide-react';
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

interface JourneyListProps {
    investigationId?: string;
    userId?: string;
    onSelect?: (journey: InvestigationJourney) => void;
    limit?: number;
}

export function JourneyList({ investigationId, userId, onSelect, limit = 10 }: JourneyListProps) {
    const [journeys, setJourneys] = useState<InvestigationJourney[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        loadJourneys();
    }, [investigationId, userId]);
    
    const loadJourneys = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (investigationId) params.set('investigation_id', investigationId);
            if (userId) params.set('user_id', userId);
            params.set('limit', limit.toString());
            
            const response = await fetch(`/api/journeys?${params}`);
            if (response.ok) {
                const data = await response.json();
                setJourneys(data.journeys || []);
            }
        } catch (error) {
            console.error('[JourneyList] Error:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const getIcon = (type: string) => {
        const Icon = ENTITY_ICONS[type] || ENTITY_ICONS.default;
        return <Icon className="w-3 h-3" />;
    };
    
    const formatDate = (date: string | Date) => {
        return new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };
    
    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
            </div>
        );
    }
    
    if (journeys.length === 0) {
        return (
            <div className="text-center py-8 text-slate-500">
                <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhuma jornada de investigação salva</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-3">
            {journeys.map((journey) => (
                <div
                    key={journey.id}
                    onClick={() => onSelect?.(journey)}
                    className={`
                        p-4 bg-slate-800/50 border border-slate-700 rounded-lg
                        ${onSelect ? 'cursor-pointer hover:border-cyan-500/50 transition-colors' : ''}
                    `}
                >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <GitBranch className="w-4 h-4 text-cyan-400" />
                            <span className="font-medium text-white">
                                {journey.title || 'Jornada sem título'}
                            </span>
                            {journey.aiAnalysis && (
                                <span title="Analisado por IA">
                                    <Sparkles className="w-4 h-4 text-amber-400" />
                                </span>
                            )}
                        </div>
                        <span className={`
                            px-2 py-0.5 rounded text-xs font-medium
                            ${journey.status === 'active' ? 'bg-green-500/20 text-green-400' : ''}
                            ${journey.status === 'completed' ? 'bg-blue-500/20 text-blue-400' : ''}
                            ${journey.status === 'archived' ? 'bg-slate-500/20 text-slate-400' : ''}
                        `}>
                            {journey.status === 'active' ? 'Ativa' : ''}
                            {journey.status === 'completed' ? 'Concluída' : ''}
                            {journey.status === 'archived' ? 'Arquivada' : ''}
                        </span>
                    </div>
                    
                    {/* Context */}
                    {journey.context && (
                        <p className="text-sm text-slate-400 mb-2 line-clamp-1">
                            {journey.context}
                        </p>
                    )}
                    
                    {/* Steps preview */}
                    <div className="flex items-center gap-1 mb-2 overflow-hidden">
                        {(journey.steps as JourneyStep[]).slice(0, 5).map((step, i) => (
                            <React.Fragment key={i}>
                                <div 
                                    className="flex items-center gap-1 px-2 py-1 bg-slate-900/50 rounded text-xs"
                                    title={step.entityName}
                                >
                                    {getIcon(step.entityType)}
                                    <span className="text-slate-300 truncate max-w-[60px]">
                                        {step.entityName}
                                    </span>
                                </div>
                                {i < Math.min((journey.steps as JourneyStep[]).length, 5) - 1 && (
                                    <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                                )}
                            </React.Fragment>
                        ))}
                        {(journey.steps as JourneyStep[]).length > 5 && (
                            <span className="text-xs text-slate-500">
                                +{(journey.steps as JourneyStep[]).length - 5}
                            </span>
                        )}
                    </div>
                    
                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(journey.createdAt)}
                        </div>
                        <span>{journey.stepCount || (journey.steps as JourneyStep[]).length} passos</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default JourneyList;
