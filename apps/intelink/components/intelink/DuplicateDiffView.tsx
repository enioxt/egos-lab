'use client';

import React, { useState } from 'react';
import { 
    GitCompare, 
    Check, 
    X, 
    ChevronDown, 
    ChevronRight,
    AlertTriangle,
    User,
    Car,
    MapPin,
    Phone,
    Building
} from 'lucide-react';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface EntityDiff {
    field: string;
    existing: string | null;
    incoming: string | null;
    action: 'keep' | 'replace' | 'merge' | 'pending';
}

interface Entity {
    id?: string;
    name: string;
    type: string;
    metadata?: Record<string, any>;
    isNew?: boolean;
}

interface DuplicateDiffViewProps {
    existingEntities: Entity[];
    incomingEntities: Entity[];
    onResolve: (resolved: { 
        entity: Entity; 
        action: 'keep' | 'replace' | 'merge' | 'skip';
        mergedData?: Record<string, any>;
    }[]) => void;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ICONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const entityIcons: Record<string, React.ReactNode> = {
    PERSON: <User className="w-4 h-4" />,
    VEHICLE: <Car className="w-4 h-4" />,
    LOCATION: <MapPin className="w-4 h-4" />,
    PHONE: <Phone className="w-4 h-4" />,
    ORGANIZATION: <Building className="w-4 h-4" />,
    COMPANY: <Building className="w-4 h-4" />,
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DIFF LINE COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function DiffLine({ 
    field, 
    existing, 
    incoming, 
    selected,
    onSelect 
}: { 
    field: string;
    existing: string | null;
    incoming: string | null;
    selected: 'existing' | 'incoming' | null;
    onSelect: (choice: 'existing' | 'incoming') => void;
}) {
    const hasConflict = existing !== incoming && existing && incoming;
    const isNew = !existing && incoming;
    const isRemoved = existing && !incoming;
    
    return (
        <div className={`flex items-stretch border-b border-slate-700/50 ${hasConflict ? 'bg-amber-500/5' : ''}`}>
            {/* Field name */}
            <div className="w-32 px-3 py-2 bg-slate-800/50 border-r border-slate-700/50 text-xs text-slate-400 font-mono">
                {field}
            </div>
            
            {/* Existing value */}
            <div 
                className={`flex-1 px-3 py-2 border-r border-slate-700/50 cursor-pointer transition-all ${
                    selected === 'existing' 
                        ? 'bg-green-500/20 border-l-2 border-l-green-500' 
                        : 'hover:bg-slate-700/30'
                } ${isRemoved ? 'bg-red-500/10' : ''}`}
                onClick={() => existing && onSelect('existing')}
            >
                {existing ? (
                    <span className={`text-sm ${isRemoved ? 'text-red-400 line-through' : 'text-white'}`}>
                        {existing}
                    </span>
                ) : (
                    <span className="text-xs text-slate-500 italic">—</span>
                )}
            </div>
            
            {/* Incoming value */}
            <div 
                className={`flex-1 px-3 py-2 cursor-pointer transition-all ${
                    selected === 'incoming' 
                        ? 'bg-green-500/20 border-l-2 border-l-green-500' 
                        : 'hover:bg-slate-700/30'
                } ${isNew ? 'bg-green-500/10' : ''}`}
                onClick={() => incoming && onSelect('incoming')}
            >
                {incoming ? (
                    <span className={`text-sm ${isNew ? 'text-green-400' : 'text-white'}`}>
                        {incoming}
                    </span>
                ) : (
                    <span className="text-xs text-slate-500 italic">—</span>
                )}
            </div>
        </div>
    );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ENTITY DIFF CARD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function EntityDiffCard({
    existing,
    incoming,
    onResolve
}: {
    existing: Entity | null;
    incoming: Entity;
    onResolve: (action: 'keep' | 'replace' | 'merge' | 'skip', mergedData?: Record<string, any>) => void;
}) {
    const [expanded, setExpanded] = useState(true);
    const [selections, setSelections] = useState<Record<string, 'existing' | 'incoming'>>({});
    
    // Build diff fields
    const fields = new Set<string>();
    if (existing?.metadata) Object.keys(existing.metadata).forEach(k => fields.add(k));
    if (incoming?.metadata) Object.keys(incoming.metadata).forEach(k => fields.add(k));
    
    // Add name as a field
    fields.add('name');
    
    const isNewEntity = !existing;
    const hasConflicts = !isNewEntity && Array.from(fields).some(f => {
        const existVal = f === 'name' ? existing?.name : existing?.metadata?.[f];
        const incomVal = f === 'name' ? incoming?.name : incoming?.metadata?.[f];
        return existVal !== incomVal && existVal && incomVal;
    });
    
    const handleSelect = (field: string, choice: 'existing' | 'incoming') => {
        setSelections(prev => ({ ...prev, [field]: choice }));
    };
    
    const handleMerge = () => {
        const mergedData: Record<string, any> = {};
        
        Array.from(fields).forEach(field => {
            const choice = selections[field] || 'incoming'; // Default to incoming
            if (field === 'name') {
                mergedData.name = choice === 'existing' ? existing?.name : incoming.name;
            } else {
                const val = choice === 'existing' ? existing?.metadata?.[field] : incoming.metadata?.[field];
                if (val) mergedData[field] = val;
            }
        });
        
        onResolve('merge', mergedData);
    };
    
    return (
        <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-800/30">
            {/* Header */}
            <div 
                className="flex items-center justify-between p-3 bg-slate-800/50 cursor-pointer"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-3">
                    {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    {entityIcons[incoming.type] || <User className="w-4 h-4" />}
                    <span className="font-medium">{incoming.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                        {incoming.type}
                    </span>
                </div>
                
                <div className="flex items-center gap-2">
                    {isNewEntity ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                            NOVO
                        </span>
                    ) : hasConflicts ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            CONFLITO
                        </span>
                    ) : (
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
                            ATUALIZAÇÃO
                        </span>
                    )}
                </div>
            </div>
            
            {/* Expanded content */}
            {expanded && (
                <div>
                    {/* Column headers */}
                    <div className="flex border-b border-slate-700">
                        <div className="w-32 px-3 py-1.5 text-xs text-slate-500 font-medium">Campo</div>
                        <div className="flex-1 px-3 py-1.5 text-xs text-slate-500 font-medium border-x border-slate-700">
                            Existente
                        </div>
                        <div className="flex-1 px-3 py-1.5 text-xs text-slate-500 font-medium">
                            Novo
                        </div>
                    </div>
                    
                    {/* Diff lines */}
                    {Array.from(fields).map(field => {
                        const existVal = field === 'name' ? existing?.name : existing?.metadata?.[field];
                        const incomVal = field === 'name' ? incoming?.name : incoming?.metadata?.[field];
                        
                        // Skip if both are empty
                        if (!existVal && !incomVal) return null;
                        
                        return (
                            <DiffLine
                                key={field}
                                field={field}
                                existing={existVal?.toString() || null}
                                incoming={incomVal?.toString() || null}
                                selected={selections[field] || null}
                                onSelect={(choice) => handleSelect(field, choice)}
                            />
                        );
                    })}
                    
                    {/* Actions */}
                    <div className="flex justify-end gap-2 p-3 bg-slate-900/50">
                        {isNewEntity ? (
                            <>
                                <button
                                    onClick={() => onResolve('skip')}
                                    className="px-3 py-1.5 text-sm rounded bg-slate-700 hover:bg-slate-600 flex items-center gap-1"
                                >
                                    <X className="w-4 h-4" />
                                    Ignorar
                                </button>
                                <button
                                    onClick={() => onResolve('replace')}
                                    className="px-3 py-1.5 text-sm rounded bg-green-600 hover:bg-green-500 flex items-center gap-1"
                                >
                                    <Check className="w-4 h-4" />
                                    Adicionar
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => onResolve('keep')}
                                    className="px-3 py-1.5 text-sm rounded bg-slate-700 hover:bg-slate-600"
                                >
                                    Manter Existente
                                </button>
                                <button
                                    onClick={() => onResolve('replace')}
                                    className="px-3 py-1.5 text-sm rounded bg-amber-600 hover:bg-amber-500"
                                >
                                    Substituir
                                </button>
                                <button
                                    onClick={handleMerge}
                                    className="px-3 py-1.5 text-sm rounded bg-blue-600 hover:bg-blue-500 flex items-center gap-1"
                                >
                                    <GitCompare className="w-4 h-4" />
                                    Mesclar Selecionados
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function DuplicateDiffView({
    existingEntities,
    incomingEntities,
    onResolve
}: DuplicateDiffViewProps) {
    const [resolutions, setResolutions] = useState<Map<string, {
        action: 'keep' | 'replace' | 'merge' | 'skip';
        mergedData?: Record<string, any>;
    }>>(new Map());
    
    // Match incoming with existing by name/type
    const matchedPairs = incomingEntities.map(incoming => {
        const existing = existingEntities.find(
            e => e.type === incoming.type && (
                e.name.toLowerCase() === incoming.name.toLowerCase() ||
                (e.metadata?.cpf && e.metadata.cpf === incoming.metadata?.cpf) ||
                (e.metadata?.placa && e.metadata.placa === incoming.metadata?.placa)
            )
        );
        return { existing, incoming };
    });
    
    const handleEntityResolve = (
        incomingName: string, 
        action: 'keep' | 'replace' | 'merge' | 'skip',
        mergedData?: Record<string, any>
    ) => {
        setResolutions(prev => {
            const next = new Map(prev);
            next.set(incomingName, { action, mergedData });
            return next;
        });
    };
    
    const handleApplyAll = () => {
        const resolved = matchedPairs.map(({ existing, incoming }) => {
            const resolution = resolutions.get(incoming.name);
            return {
                entity: incoming,
                action: resolution?.action || (existing ? 'replace' : 'replace'),
                mergedData: resolution?.mergedData
            };
        });
        onResolve(resolved);
    };
    
    const allResolved = matchedPairs.every(({ incoming }) => resolutions.has(incoming.name));
    
    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <GitCompare className="w-5 h-5 text-blue-400" />
                    <span className="font-medium">Revisão de Diferenças</span>
                    <span className="text-xs px-2 py-0.5 bg-slate-700 rounded">
                        {matchedPairs.length} entidades
                    </span>
                </div>
                <div className="text-xs text-slate-400">
                    {resolutions.size}/{matchedPairs.length} resolvidos
                </div>
            </div>
            
            {/* Legend */}
            <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/30"></div>
                    <span className="text-slate-400">Novo</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/30"></div>
                    <span className="text-slate-400">Conflito</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500/30"></div>
                    <span className="text-slate-400">Removido</span>
                </div>
            </div>
            
            {/* Entity cards */}
            <div className="space-y-3">
                {matchedPairs.map(({ existing, incoming }) => (
                    <EntityDiffCard
                        key={incoming.name}
                        existing={existing || null}
                        incoming={incoming}
                        onResolve={(action, mergedData) => 
                            handleEntityResolve(incoming.name, action, mergedData)
                        }
                    />
                ))}
            </div>
            
            {/* Apply all button */}
            <div className="flex justify-end pt-4 border-t border-slate-700">
                <button
                    onClick={handleApplyAll}
                    disabled={!allResolved}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg font-medium flex items-center gap-2"
                >
                    <Check className="w-4 h-4" />
                    Aplicar Resoluções ({resolutions.size}/{matchedPairs.length})
                </button>
            </div>
        </div>
    );
}
