'use client';

/**
 * EntitiesTab - Entity management with collapsible cards
 * ~180 lines - uses existing entity-forms components
 */

import { useState } from 'react';
import { User, Car, MapPin, Building2, Target, Phone, X, ChevronDown, ChevronUp, FileText, Info } from 'lucide-react';
import { EntityInput, EntityType } from './types';
import { 
    PersonForm, 
    VehicleForm, 
    LocationForm, 
    OrganizationForm, 
    FirearmForm, 
    PhoneForm 
} from '../entity-forms';

interface EntitiesTabProps {
    entities: EntityInput[];
    addEntity: (type: EntityType) => void;
    updateEntity: (id: string, updates: Partial<EntityInput>) => void;
    removeEntity: (id: string) => void;
}

const ENTITY_TYPES = [
    { type: 'PERSON' as EntityType, label: 'Pessoa', icon: User, color: 'bg-blue-600 hover:bg-blue-500' },
    { type: 'VEHICLE' as EntityType, label: 'Veículo', icon: Car, color: 'bg-pink-600 hover:bg-pink-500' },
    { type: 'LOCATION' as EntityType, label: 'Local', icon: MapPin, color: 'bg-emerald-600 hover:bg-emerald-500' },
    { type: 'ORGANIZATION' as EntityType, label: 'Organização', icon: Building2, color: 'bg-amber-600 hover:bg-amber-500' },
    { type: 'FIREARM' as EntityType, label: 'Arma', icon: Target, color: 'bg-red-600 hover:bg-red-500' },
    { type: 'PHONE' as EntityType, label: 'Telefone', icon: Phone, color: 'bg-cyan-600 hover:bg-cyan-500' },
];

const ENTITY_ICONS: Record<EntityType, typeof User> = {
    PERSON: User,
    VEHICLE: Car,
    LOCATION: MapPin,
    ORGANIZATION: Building2,
    FIREARM: Target,
    PHONE: Phone,
};

const ENTITY_COLORS: Record<EntityType, string> = {
    PERSON: 'text-blue-400',
    VEHICLE: 'text-pink-400',
    LOCATION: 'text-emerald-400',
    ORGANIZATION: 'text-amber-400',
    FIREARM: 'text-red-400',
    PHONE: 'text-cyan-400',
};

const ENTITY_LABELS: Record<EntityType, string> = {
    PERSON: 'Pessoa',
    VEHICLE: 'Veículo',
    LOCATION: 'Local',
    ORGANIZATION: 'Organização',
    FIREARM: 'Arma',
    PHONE: 'Telefone',
};

export function EntitiesTab({ entities, addEntity, updateEntity, removeEntity }: EntitiesTabProps) {
    // State para controlar quais entidades estão expandidas
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const renderEntityForm = (entity: EntityInput) => {
        const formProps = { entity, onUpdate: updateEntity };

        switch (entity.type) {
            case 'PERSON':
                return <PersonForm {...formProps} />;
            case 'VEHICLE':
                return <VehicleForm {...formProps} />;
            case 'LOCATION':
                return <LocationForm {...formProps} />;
            case 'ORGANIZATION':
                return <OrganizationForm {...formProps} />;
            case 'FIREARM':
                return <FirearmForm {...formProps} />;
            case 'PHONE':
                return <PhoneForm {...formProps} />;
            default:
                return null;
        }
    };

    // Agrupar entidades por tipo
    const groupedEntities = entities.reduce((acc, entity) => {
        if (!acc[entity.type]) acc[entity.type] = [];
        acc[entity.type].push(entity);
        return acc;
    }, {} as Record<EntityType, EntityInput[]>);

    const entityTypes = Object.keys(groupedEntities) as EntityType[];

    return (
        <div className="space-y-6">
            {/* Dica para iniciar pela ocorrência */}
            {entities.length === 0 && (
                <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                    <Info className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <div className="text-sm text-amber-300">
                        <strong>Dica:</strong> Vá na aba <strong>Anexos</strong> e faça upload de uma Ocorrência (REDS).
                        Entidades serão extraídas automaticamente!
                    </div>
                </div>
            )}

            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Entidades Envolvidas</h2>
                    <div className="flex gap-2 flex-wrap">
                        {ENTITY_TYPES.map(({ type, label, icon: Icon, color }) => (
                            <button
                                key={type}
                                onClick={() => {
                                    addEntity(type);
                                    // Auto-expandir a nova entidade
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 ${color} rounded-lg text-sm transition-colors`}
                            >
                                <Icon className="w-4 h-4" /> {label}
                            </button>
                        ))}
                    </div>
                </div>

                {entities.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-600 rounded-xl">
                        <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="font-medium">Nenhuma entidade adicionada.</p>
                        <p className="text-sm mt-1">Use os botões acima ou extraia de um documento.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Agrupado por tipo */}
                        {entityTypes.map(type => {
                            const typeEntities = groupedEntities[type];
                            const Icon = ENTITY_ICONS[type];
                            const color = ENTITY_COLORS[type];
                            
                            return (
                                <div key={type} className="space-y-2">
                                    {/* Header do grupo */}
                                    <div className="flex items-center gap-2 px-2">
                                        <Icon className={`w-4 h-4 ${color}`} />
                                        <span className="text-sm font-medium text-slate-300">
                                            {ENTITY_LABELS[type]} ({typeEntities.length})
                                        </span>
                                    </div>
                                    
                                    {/* Cards das entidades */}
                                    <div className="space-y-2">
                                        {typeEntities.map(entity => {
                                            const isExpanded = expandedIds.has(entity.id);
                                            
                                            return (
                                                <div key={entity.id} className="bg-slate-700/30 rounded-xl border border-slate-600/30 overflow-hidden">
                                                    {/* Header colapsável */}
                                                    <div 
                                                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-700/50 transition-colors"
                                                        onClick={() => toggleExpand(entity.id)}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <Icon className={`w-5 h-5 ${color}`} />
                                                            <span className="font-medium text-white">
                                                                {entity.name || `${ENTITY_LABELS[entity.type]} (novo)`}
                                                            </span>
                                                            {entity.role && (
                                                                <span className="text-xs px-2 py-0.5 bg-slate-600 rounded text-slate-300">
                                                                    {entity.role}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); removeEntity(entity.id); }} 
                                                                className="p-1.5 hover:bg-red-500/20 rounded"
                                                            >
                                                                <X className="w-4 h-4 text-red-400" />
                                                            </button>
                                                            {isExpanded ? (
                                                                <ChevronUp className="w-4 h-4 text-slate-400" />
                                                            ) : (
                                                                <ChevronDown className="w-4 h-4 text-slate-400" />
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Formulário expandido */}
                                                    {isExpanded && (
                                                        <div className="p-4 border-t border-slate-600/30 bg-slate-800/30">
                                                            {renderEntityForm(entity)}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Contador */}
                {entities.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-700 text-sm text-slate-400">
                        Total: {entities.length} entidade{entities.length !== 1 ? 's' : ''}
                    </div>
                )}
            </div>
        </div>
    );
}
