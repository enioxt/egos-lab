'use client';

import React from 'react';
import { 
    Clock, User, MapPin, Car, Building2, FileText, 
    AlertTriangle, CheckCircle, Target, Users, Calendar
} from 'lucide-react';

export interface TimelineEvent {
    id: string;
    type: 'entity_added' | 'relationship_created' | 'evidence_uploaded' | 'status_changed' | 'analysis_run' | 'custom';
    title: string;
    description?: string;
    timestamp: string;
    actor?: string;
    entityType?: string;
    metadata?: Record<string, any>;
}

interface InvestigationTimelineProps {
    events: TimelineEvent[];
    onEventClick?: (event: TimelineEvent) => void;
}

const EVENT_ICONS: Record<string, React.ElementType> = {
    entity_added: Users,
    relationship_created: Building2,
    evidence_uploaded: FileText,
    status_changed: CheckCircle,
    analysis_run: Target,
    custom: Clock,
    PERSON: User,
    LOCATION: MapPin,
    VEHICLE: Car,
    ORGANIZATION: Building2,
    WEAPON: Target,
};

const EVENT_COLORS: Record<string, string> = {
    entity_added: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    relationship_created: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    evidence_uploaded: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    status_changed: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    analysis_run: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    custom: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

export default function InvestigationTimeline({ events, onEventClick }: InvestigationTimelineProps) {
    // Group events by date
    const groupedEvents = events.reduce((groups: Record<string, TimelineEvent[]>, event) => {
        const date = new Date(event.timestamp).toLocaleDateString('pt-BR');
        if (!groups[date]) groups[date] = [];
        groups[date].push(event);
        return groups;
    }, {});

    const sortedDates = Object.keys(groupedEvents).sort((a, b) => {
        return new Date(b.split('/').reverse().join('-')).getTime() - 
               new Date(a.split('/').reverse().join('-')).getTime();
    });

    if (events.length === 0) {
        return (
            <div className="text-center py-8 text-slate-500">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum evento registrado</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {sortedDates.map(date => (
                <div key={date}>
                    {/* Date Header */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium text-white">{date}</span>
                        </div>
                        <div className="flex-1 h-px bg-slate-700/50" />
                    </div>

                    {/* Events for this date */}
                    <div className="relative pl-6 space-y-4">
                        {/* Vertical line */}
                        <div className="absolute left-[9px] top-0 bottom-0 w-0.5 bg-slate-700/50" />

                        {groupedEvents[date].map((event, idx) => {
                            const Icon = EVENT_ICONS[event.entityType || event.type] || Clock;
                            const colorClass = EVENT_COLORS[event.type] || EVENT_COLORS.custom;

                            return (
                                <div 
                                    key={event.id || idx}
                                    onClick={() => onEventClick?.(event)}
                                    className={`relative flex gap-4 ${onEventClick ? 'cursor-pointer' : ''}`}
                                >
                                    {/* Icon circle */}
                                    <div className={`
                                        absolute -left-[26px] w-6 h-6 rounded-full border-2 
                                        flex items-center justify-center z-10
                                        ${colorClass}
                                    `}>
                                        <Icon className="w-3 h-3" />
                                    </div>

                                    {/* Content */}
                                    <div className={`
                                        flex-1 p-4 rounded-xl border transition-all
                                        ${onEventClick ? 'hover:border-slate-500' : ''}
                                        bg-slate-800/30 border-slate-700/50
                                    `}>
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <h4 className="font-medium text-white">{event.title}</h4>
                                            <span className="text-xs text-slate-500 whitespace-nowrap">
                                                {new Date(event.timestamp).toLocaleTimeString('pt-BR', { 
                                                    hour: '2-digit', 
                                                    minute: '2-digit' 
                                                })}
                                            </span>
                                        </div>
                                        
                                        {event.description && (
                                            <p className="text-sm text-slate-400 mb-2">{event.description}</p>
                                        )}
                                        
                                        {event.actor && (
                                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                                <User className="w-3 h-3" />
                                                <span>{event.actor}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

// Mapeamento de tipos de entidade para português
const ENTITY_TYPE_LABELS: Record<string, string> = {
    'PERSON': 'Pessoa',
    'VEHICLE': 'Veículo',
    'LOCATION': 'Local',
    'ORGANIZATION': 'Organização',
    'PHONE': 'Telefone',
    'WEAPON': 'Arma',
    'FIREARM': 'Arma de Fogo',
    'COMPANY': 'Empresa',
};

// Usar helper centralizado de formatação
import { humanizeRelationType } from '@/lib/utils/formatters';

// Helper function to build timeline events from investigation data
export function buildTimelineEvents(data: {
    entities?: any[];
    relationships?: any[];
    evidence?: any[];
    investigation?: any;
}): TimelineEvent[] {
    const events: TimelineEvent[] = [];

    // Add entity events
    data.entities?.forEach(entity => {
        const typeLabel = ENTITY_TYPE_LABELS[entity.type] || entity.type;
        events.push({
            id: `entity-${entity.id}`,
            type: 'entity_added',
            title: `${entity.name} adicionado`,
            description: `Entidade do tipo ${typeLabel} foi adicionada à operação`,
            timestamp: entity.created_at,
            entityType: entity.type,
            metadata: { ...entity.metadata, id: entity.id, entityType: entity.type }
        });
    });

    // Add relationship events
    data.relationships?.forEach(rel => {
        const sourceName = rel.source?.name || 'Entidade';
        const targetName = rel.target?.name || 'Entidade';
        // Traduzir tipo de relacionamento para português
        const relTypeLabel = humanizeRelationType(rel.type);
        events.push({
            id: `rel-${rel.id}`,
            type: 'relationship_created',
            title: `Vínculo criado: ${relTypeLabel}`,
            description: rel.description || `${sourceName} → ${targetName}`,
            timestamp: rel.created_at,
            metadata: { sourceId: rel.source_id, targetId: rel.target_id, type: rel.type }
        });
    });

    // Add evidence events
    const evidenceTypeLabels: Record<string, string> = {
        'document': 'documento',
        'image': 'imagem',
        'audio': 'áudio',
        'video': 'vídeo',
        'pdf': 'PDF',
        'text': 'texto',
        'file': 'arquivo',
    };
    
    data.evidence?.forEach(ev => {
        const evTypeLabel = evidenceTypeLabels[ev.type?.toLowerCase()] || ev.type || 'arquivo';
        // Support both filename (from save API) and fileName (legacy)
        const fileName = ev.metadata?.filename || ev.metadata?.fileName || ev.description || 'Evidência anexada';
        events.push({
            id: `ev-${ev.id}`,
            type: 'evidence_uploaded',
            title: fileName,
            description: `Arquivo de ${evTypeLabel} foi adicionado`,
            timestamp: ev.created_at,
            metadata: { ...ev.metadata, id: ev.id }
        });
    });

    // Sort by timestamp (newest first)
    return events.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
}
