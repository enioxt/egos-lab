'use client';

/**
 * GroupedEntityList - Entities grouped by investigative role
 * 
 * Groups entities into:
 * - 🔴 Suspeitos (red)
 * - 🔵 Vítimas (blue) 
 * - 🟡 Testemunhas (yellow)
 * - 🟢 Locais (green)
 * - 🟣 Veículos (purple)
 * - ⚫ Outros (gray)
 * 
 * @version 1.0.0
 * @updated 2025-12-10
 */

import React, { useState, useMemo } from 'react';
import { 
    Users, Car, MapPin, Building2, Target, Activity,
    ChevronDown, ChevronRight, ChevronUp, Search, X, ExternalLink,
    AlertTriangle, Shield, Eye, MoreHorizontal
} from 'lucide-react';

// Maximum entities shown per group initially
const ENTITIES_LIMIT = 10;
import { getConfidenceLevel, PRAMANA_STYLES } from '@/lib/pramana/confidence-system';
import { useIntelinkFocusOptional } from '@/contexts/IntelinkFocusContext';

// ============================================================================
// TYPES
// ============================================================================

interface Entity {
    id: string;
    name: string;
    type: string;
    metadata?: Record<string, any>;
}

interface GroupedEntityListProps {
    entities: Entity[];
    onEntityClick: (entity: Entity) => void;
    searchTerm?: string;
    onSearchChange?: (term: string) => void;
    /** Hide internal header (use when inside CollapsibleWidget) */
    hideHeader?: boolean;
}

interface EntityGroup {
    key: string;
    label: string;
    labelPlural: string;
    icon: React.ReactNode;
    bgColor: string;
    textColor: string;
    borderColor: string;
    entities: Entity[];
    priority: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TYPE_LABELS: Record<string, string> = {
    'PERSON': 'Pessoa',
    'VEHICLE': 'Veículo',
    'LOCATION': 'Local',
    'ORGANIZATION': 'Organização',
    'COMPANY': 'Empresa',
    'WEAPON': 'Arma',
    'FIREARM': 'Arma de Fogo',
    'PHONE': 'Telefone',
};

const ROLE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    'suspect': { label: 'Suspeito', icon: <AlertTriangle className="w-3 h-3" />, color: 'text-red-400' },
    'SUSPECT': { label: 'Suspeito', icon: <AlertTriangle className="w-3 h-3" />, color: 'text-red-400' },
    'victim': { label: 'Vítima', icon: <Shield className="w-3 h-3" />, color: 'text-blue-400' },
    'VICTIM': { label: 'Vítima', icon: <Shield className="w-3 h-3" />, color: 'text-blue-400' },
    'witness': { label: 'Testemunha', icon: <Eye className="w-3 h-3" />, color: 'text-amber-400' },
    'WITNESS': { label: 'Testemunha', icon: <Eye className="w-3 h-3" />, color: 'text-amber-400' },
    'informant': { label: 'Informante', icon: <Eye className="w-3 h-3" />, color: 'text-cyan-400' },
    'INFORMANT': { label: 'Informante', icon: <Eye className="w-3 h-3" />, color: 'text-cyan-400' },
};

// ============================================================================
// HELPERS
// ============================================================================

function getEntityRole(entity: Entity): string | null {
    const role = entity.metadata?.role || entity.metadata?.papel;
    return role ? String(role).toUpperCase() : null;
}

function getRoleBadge(entity: Entity): React.ReactNode {
    const role = entity.metadata?.role || entity.metadata?.papel;
    if (!role) return null;
    
    const config = ROLE_CONFIG[role] || ROLE_CONFIG[String(role).toUpperCase()];
    if (!config) return null;
    
    return (
        <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${config.color} bg-current/10`}>
            {config.icon}
            {config.label}
        </span>
    );
}

function matchesSearch(text: string, term: string): boolean {
    const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return normalize(text).includes(normalize(term));
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function GroupedEntityList({
    entities,
    onEntityClick,
    searchTerm = '',
    onSearchChange,
    hideHeader = false
}: GroupedEntityListProps) {
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['persons', 'suspects', 'weapons']));
    const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
    const [expandedLimits, setExpandedLimits] = useState<Set<string>>(new Set()); // Groups showing all entities
    
    // Context Bridge: Sync selections with Chat AI
    const focusContext = useIntelinkFocusOptional();
    
    const effectiveSearchTerm = onSearchChange ? searchTerm : localSearchTerm;
    const handleSearchChange = onSearchChange || setLocalSearchTerm;

    // Group entities by investigative role/type
    // ORDEM POLICIAL: Pessoas primeiro (Autoria), depois Armas (Materialidade), Veículos, Locais
    const groups = useMemo(() => {
        const result: EntityGroup[] = [
            {
                key: 'persons',
                label: 'Pessoa',
                labelPlural: 'Pessoas',
                icon: <Users className="w-4 h-4" />,
                bgColor: 'bg-blue-500/10',
                textColor: 'text-blue-400',
                borderColor: 'border-blue-500/30',
                entities: [],
                priority: 1 // PRIMEIRO: Autoria é o mais importante
            },
            {
                key: 'suspects',
                label: 'Suspeito',
                labelPlural: 'Suspeitos',
                icon: <AlertTriangle className="w-4 h-4" />,
                bgColor: 'bg-red-500/10',
                textColor: 'text-red-400',
                borderColor: 'border-red-500/30',
                entities: [],
                priority: 2
            },
            {
                key: 'victims',
                label: 'Vítima',
                labelPlural: 'Vítimas',
                icon: <Shield className="w-4 h-4" />,
                bgColor: 'bg-sky-500/10',
                textColor: 'text-sky-400',
                borderColor: 'border-sky-500/30',
                entities: [],
                priority: 3
            },
            {
                key: 'witnesses',
                label: 'Testemunha',
                labelPlural: 'Testemunhas',
                icon: <Eye className="w-4 h-4" />,
                bgColor: 'bg-amber-500/10',
                textColor: 'text-amber-400',
                borderColor: 'border-amber-500/30',
                entities: [],
                priority: 4
            },
            {
                key: 'weapons',
                label: 'Arma',
                labelPlural: 'Armas',
                icon: <Target className="w-4 h-4" />,
                bgColor: 'bg-rose-500/10',
                textColor: 'text-rose-400',
                borderColor: 'border-rose-500/30',
                entities: [],
                priority: 5 // SEGUNDO: Materialidade
            },
            {
                key: 'vehicles',
                label: 'Veículo',
                labelPlural: 'Veículos',
                icon: <Car className="w-4 h-4" />,
                bgColor: 'bg-violet-500/10',
                textColor: 'text-violet-400',
                borderColor: 'border-violet-500/30',
                entities: [],
                priority: 6
            },
            {
                key: 'locations',
                label: 'Local',
                labelPlural: 'Locais',
                icon: <MapPin className="w-4 h-4" />,
                bgColor: 'bg-emerald-500/10',
                textColor: 'text-emerald-400',
                borderColor: 'border-emerald-500/30',
                entities: [],
                priority: 7
            },
            {
                key: 'organizations',
                label: 'Organização',
                labelPlural: 'Organizações',
                icon: <Building2 className="w-4 h-4" />,
                bgColor: 'bg-orange-500/10',
                textColor: 'text-orange-400',
                borderColor: 'border-orange-500/30',
                entities: [],
                priority: 8
            }
        ];

        // Categorize each entity
        entities.forEach(entity => {
            const role = getEntityRole(entity);
            
            if (role === 'SUSPECT') {
                result.find(g => g.key === 'suspects')?.entities.push(entity);
            } else if (role === 'VICTIM') {
                result.find(g => g.key === 'victims')?.entities.push(entity);
            } else if (role === 'WITNESS' || role === 'INFORMANT') {
                result.find(g => g.key === 'witnesses')?.entities.push(entity);
            } else if (entity.type === 'LOCATION') {
                result.find(g => g.key === 'locations')?.entities.push(entity);
            } else if (entity.type === 'VEHICLE') {
                result.find(g => g.key === 'vehicles')?.entities.push(entity);
            } else if (entity.type === 'WEAPON' || entity.type === 'FIREARM') {
                result.find(g => g.key === 'weapons')?.entities.push(entity);
            } else if (entity.type === 'ORGANIZATION' || entity.type === 'COMPANY') {
                result.find(g => g.key === 'organizations')?.entities.push(entity);
            } else if (entity.type === 'PERSON') {
                // Pessoa sem role específico vai para "Pessoas"
                result.find(g => g.key === 'persons')?.entities.push(entity);
            }
            // Outros tipos são ignorados (não há mais categoria "Outros")
        });

        // Filter by search term
        if (effectiveSearchTerm.trim()) {
            result.forEach(group => {
                group.entities = group.entities.filter(ent => {
                    const nameMatch = matchesSearch(ent.name, effectiveSearchTerm);
                    const typeMatch = matchesSearch(TYPE_LABELS[ent.type] || ent.type, effectiveSearchTerm);
                    const metaMatch = Object.values(ent.metadata || {}).some(
                        v => matchesSearch(String(v), effectiveSearchTerm)
                    );
                    return nameMatch || typeMatch || metaMatch;
                });
            });
        }

        // Sort by priority and filter empty groups
        return result.filter(g => g.entities.length > 0).sort((a, b) => a.priority - b.priority);
    }, [entities, effectiveSearchTerm]);

    const toggleGroup = (key: string) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(key)) {
            newExpanded.delete(key);
        } else {
            newExpanded.add(key);
        }
        setExpandedGroups(newExpanded);
    };

    const totalFiltered = groups.reduce((sum, g) => sum + g.entities.length, 0);

    return (
        <div className="flex flex-col h-full">
            {/* Header with Search - hidden when inside CollapsibleWidget */}
            {!hideHeader && (
                <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-base flex items-center gap-2 whitespace-nowrap">
                        <Users className="w-5 h-5 text-purple-400" />
                        Envolvidos
                        <span className="text-xs font-normal text-slate-500">({totalFiltered})</span>
                    </h3>
                    <div className="relative flex-1 max-w-[200px]">
                        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input 
                            type="text" 
                            placeholder="Buscar..." 
                            value={effectiveSearchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-8 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                        {effectiveSearchTerm && (
                            <button 
                                onClick={() => handleSearchChange('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-700 rounded"
                            >
                                <X className="w-3 h-3 text-slate-500" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Grouped List */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                {groups.length === 0 ? (
                    <div className="p-8 text-center">
                        <Search className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">
                            {effectiveSearchTerm 
                                ? `Nenhum resultado para "${effectiveSearchTerm}"` 
                                : 'Nenhuma entidade cadastrada'}
                        </p>
                        {effectiveSearchTerm && (
                            <button 
                                onClick={() => handleSearchChange('')}
                                className="mt-3 text-blue-400 hover:text-blue-300 text-xs"
                            >
                                Limpar busca
                            </button>
                        )}
                    </div>
                ) : (
                    groups.map(group => (
                        <div key={group.key} className="border-b border-slate-800/50 last:border-b-0">
                            {/* Group Header */}
                            <button
                                onClick={() => toggleGroup(group.key)}
                                className={`w-full px-4 py-2.5 flex items-center justify-between hover:bg-slate-800/30 transition-colors ${group.bgColor}`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className={group.textColor}>{group.icon}</span>
                                    {/* Pessoas (Autoria) tem destaque branco para hierarquia visual */}
                                    <span className={`font-medium ${group.key === 'persons' ? 'text-white' : group.textColor}`}>
                                        {group.entities.length} {group.entities.length === 1 ? group.label : group.labelPlural}
                                    </span>
                                </div>
                                {expandedGroups.has(group.key) ? (
                                    <ChevronDown className="w-4 h-4 text-slate-500" />
                                ) : (
                                    <ChevronRight className="w-4 h-4 text-slate-500" />
                                )}
                            </button>

                            {/* Group Entities */}
                            {expandedGroups.has(group.key) && (
                                <div className="divide-y divide-slate-800/30">
                                    {(expandedLimits.has(group.key) ? group.entities : group.entities.slice(0, ENTITIES_LIMIT)).map(entity => (
                                        <button
                                            key={entity.id}
                                            onClick={() => {
                                                onEntityClick(entity);
                                                // Context Bridge: Tell Chat AI what user is looking at
                                                focusContext?.selectEntity({
                                                    id: entity.id,
                                                    name: entity.name,
                                                    type: entity.type,
                                                });
                                            }}
                                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-800/20 transition-colors text-left group"
                                        >
                                            <div className={`p-2 rounded-lg ${group.bgColor} ${group.textColor}`}>
                                                {entity.type === 'PERSON' ? <Users className="w-4 h-4" /> :
                                                 entity.type === 'VEHICLE' ? <Car className="w-4 h-4" /> :
                                                 entity.type === 'LOCATION' ? <MapPin className="w-4 h-4" /> :
                                                 (entity.type === 'ORGANIZATION' || entity.type === 'COMPANY') ? <Building2 className="w-4 h-4" /> :
                                                 (entity.type === 'FIREARM' || entity.type === 'WEAPON') ? <Target className="w-4 h-4" /> :
                                                 <Activity className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    {/* Pramana Confidence Indicator */}
                                                    {(() => {
                                                        const level = getConfidenceLevel({
                                                            source: entity.metadata?.source,
                                                            verified: entity.metadata?.verified,
                                                            ai_generated: entity.metadata?.ai_generated || entity.metadata?.source?.includes('nlp'),
                                                        });
                                                        const style = PRAMANA_STYLES[level];
                                                        return (
                                                            <span 
                                                                className={`w-2 h-2 rounded-full flex-shrink-0 ${style.badge.split(' ')[0]}`}
                                                                title={style.label}
                                                            />
                                                        );
                                                    })()}
                                                    <span className="font-medium text-white truncate group-hover:text-blue-400 transition-colors">
                                                        {entity.name}
                                                    </span>
                                                    <ExternalLink className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                                {/* Show key metadata */}
                                                {entity.metadata && (
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        {entity.metadata.vulgo && (
                                                            <span className="text-xs text-slate-500">"{entity.metadata.vulgo}"</span>
                                                        )}
                                                        {entity.metadata.cpf && (
                                                            <span className="text-xs text-slate-500">CPF: ***{entity.metadata.cpf.slice(-4)}</span>
                                                        )}
                                                        {entity.metadata.placa && (
                                                            <span className="text-xs text-slate-500">{entity.metadata.placa}</span>
                                                        )}
                                                        {entity.metadata.address && (
                                                            <span className="text-xs text-slate-500 truncate max-w-[150px]">{entity.metadata.address}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                    {/* Show "Ver mais" button if more entities */}
                                    {group.entities.length > ENTITIES_LIMIT && !expandedLimits.has(group.key) && (
                                        <button
                                            onClick={() => setExpandedLimits(prev => new Set([...prev, group.key]))}
                                            className="w-full px-4 py-2 flex items-center justify-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 hover:bg-slate-800/30 transition-colors"
                                        >
                                            <MoreHorizontal className="w-4 h-4" />
                                            Ver mais {group.entities.length - ENTITIES_LIMIT} {group.labelPlural.toLowerCase()}
                                        </button>
                                    )}
                                    {/* Show "Ver menos" if expanded */}
                                    {expandedLimits.has(group.key) && group.entities.length > ENTITIES_LIMIT && (
                                        <button
                                            onClick={() => setExpandedLimits(prev => {
                                                const next = new Set(prev);
                                                next.delete(group.key);
                                                return next;
                                            })}
                                            className="w-full px-4 py-2 flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800/30 transition-colors"
                                        >
                                            <ChevronUp className="w-4 h-4" />
                                            Ver menos
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
