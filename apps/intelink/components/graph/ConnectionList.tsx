'use client';

/**
 * ConnectionList - Lista de Vínculos para Mobile
 * 
 * Substitui o grafo visual em telas pequenas.
 * Mostra conexões em formato de lista scrollável.
 * Otimizado para uso com uma mão (dedão).
 * 
 * @version 1.0.0
 */

import { User, Car, MapPin, Building2, Target, Flame, Phone, ArrowRight, Users, Briefcase, Home } from 'lucide-react';
import { RELATIONSHIP_LABELS } from '@/lib/constants';

interface Entity {
    id: string;
    name: string;
    type: string;
    metadata?: Record<string, any>;
}

interface Relationship {
    id: string;
    source_id: string;
    target_id: string;
    type: string;
    metadata?: Record<string, any>;
}

interface ConnectionListProps {
    entities: Entity[];
    relationships: Relationship[];
    onEntityClick?: (entity: Entity) => void;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
    PERSON: User,
    VEHICLE: Car,
    LOCATION: MapPin,
    ORGANIZATION: Building2,
    COMPANY: Briefcase,
    FIREARM: Target,
    WEAPON: Target,
    PHONE: Phone,
};

const TYPE_COLORS: Record<string, string> = {
    PERSON: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    VEHICLE: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    LOCATION: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    ORGANIZATION: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    COMPANY: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    FIREARM: 'bg-red-500/20 text-red-400 border-red-500/30',
    WEAPON: 'bg-red-500/20 text-red-400 border-red-500/30',
    PHONE: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const RELATIONSHIP_COLORS: Record<string, string> = {
    FAMILIA: 'bg-pink-500/30 text-pink-300',
    SOCIO: 'bg-cyan-500/30 text-cyan-300',
    CONHECIDO: 'bg-blue-500/30 text-blue-300',
    SUSPEITO: 'bg-red-500/30 text-red-300',
    TESTEMUNHA: 'bg-amber-500/30 text-amber-300',
    POSSUI: 'bg-emerald-500/30 text-emerald-300',
    RESIDE: 'bg-purple-500/30 text-purple-300',
    TRABALHA: 'bg-indigo-500/30 text-indigo-300',
};

export default function ConnectionList({ entities, relationships, onEntityClick }: ConnectionListProps) {
    const entityMap = new Map(entities.map(e => [e.id, e]));

    if (relationships.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <Users className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm">Nenhum vínculo registrado</p>
                <p className="text-xs mt-1">Adicione relacionamentos entre entidades</p>
            </div>
        );
    }

    return (
        <div className="space-y-2 p-2">
            <div className="text-xs text-slate-500 px-2 mb-3">
                {relationships.length} vínculo{relationships.length !== 1 ? 's' : ''} encontrado{relationships.length !== 1 ? 's' : ''}
            </div>
            
            {relationships.map((rel) => {
                const source = entityMap.get(rel.source_id);
                const target = entityMap.get(rel.target_id);
                
                if (!source || !target) return null;
                
                const SourceIcon = TYPE_ICONS[source.type] || User;
                const TargetIcon = TYPE_ICONS[target.type] || User;
                const sourceColor = TYPE_COLORS[source.type] || TYPE_COLORS.PERSON;
                const targetColor = TYPE_COLORS[target.type] || TYPE_COLORS.PERSON;
                const relColor = RELATIONSHIP_COLORS[rel.type] || 'bg-slate-500/30 text-slate-300';
                const relLabel = RELATIONSHIP_LABELS[rel.type] || rel.type;
                
                return (
                    <div 
                        key={rel.id}
                        className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 hover:bg-slate-800 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            {/* Source Entity */}
                            <button
                                onClick={() => onEntityClick?.(source)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${sourceColor} min-w-0 flex-1 hover:opacity-80 transition-opacity`}
                            >
                                <SourceIcon className="w-4 h-4 flex-shrink-0" />
                                <span className="text-sm font-medium truncate">{source.name}</span>
                            </button>
                            
                            {/* Relationship Badge */}
                            <div className="flex flex-col items-center gap-1 px-2">
                                <ArrowRight className="w-4 h-4 text-slate-500" />
                                <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${relColor}`}>
                                    {relLabel}
                                </span>
                            </div>
                            
                            {/* Target Entity */}
                            <button
                                onClick={() => onEntityClick?.(target)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${targetColor} min-w-0 flex-1 hover:opacity-80 transition-opacity`}
                            >
                                <TargetIcon className="w-4 h-4 flex-shrink-0" />
                                <span className="text-sm font-medium truncate">{target.name}</span>
                            </button>
                        </div>
                        
                        {/* Optional: Relationship metadata */}
                        {rel.metadata?.description && (
                            <p className="text-xs text-slate-500 mt-2 pl-2 border-l-2 border-slate-600">
                                {rel.metadata.description}
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
