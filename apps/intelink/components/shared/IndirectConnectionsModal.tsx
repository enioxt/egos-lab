'use client';

/**
 * IndirectConnectionsModal - Conexões de 2º Grau (Mycelium)
 * 
 * Mostra a "teia" expandida: conexões das conexões diretas.
 * Permite ver o caminho: Entidade → Via → Conexão Indireta
 * 
 * @version 1.0.0
 * @updated 2025-12-13
 */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
    X, Network, Users, Car, MapPin, Building2, Target,
    Loader2, ChevronRight, UserCircle, ArrowRight
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface IndirectConnection {
    id: string;
    name: string;
    type: string;
    via: {
        id: string;
        name: string;
        type: string;
        relationship: string;
    };
    relationship: string;
    depth: number;
}

interface IndirectConnectionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    entityId: string;
    entityName: string;
    onEntityClick: (entityId: string, name: string, type: string) => void;
}

// ============================================================================
// HELPERS
// ============================================================================

const ENTITY_ICONS: Record<string, typeof UserCircle> = {
    PERSON: UserCircle,
    LOCATION: MapPin,
    VEHICLE: Car,
    ORGANIZATION: Building2,
    COMPANY: Building2,
    WEAPON: Target,
    FIREARM: Target,
};

const ENTITY_COLORS: Record<string, string> = {
    PERSON: 'text-blue-400',
    LOCATION: 'text-emerald-400',
    VEHICLE: 'text-pink-400',
    ORGANIZATION: 'text-red-400',
    COMPANY: 'text-amber-400',
    WEAPON: 'text-rose-400',
    FIREARM: 'text-rose-400',
};

const RELATIONSHIP_LABELS: Record<string, string> = {
    MARRIED_TO: 'casado com',
    SPOUSE: 'cônjuge de',
    CHILD_OF: 'filho de',
    PARENT_OF: 'pai/mãe de',
    SIBLING: 'irmão de',
    PARTNER: 'sócio de',
    EMPLOYEE: 'funcionário de',
    EMPLOYER: 'empregador de',
    OWNS: 'proprietário de',
    OWNED_BY: 'pertence a',
    RESIDES_AT: 'reside em',
    WORKS_AT: 'trabalha em',
    ASSOCIATED: 'vinculado a',
    KNOWS: 'conhecido de',
    CONNECTED: 'conectado a',
    RELATIVE: 'parente de',
};

function getRelLabel(type: string): string {
    return RELATIONSHIP_LABELS[type?.toUpperCase()] || type?.toLowerCase() || 'vinculado a';
}

function groupByVia(connections: IndirectConnection[]) {
    const groups = new Map<string, IndirectConnection[]>();
    
    connections.forEach(conn => {
        const key = conn.via.id;
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key)!.push(conn);
    });
    
    return groups;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function IndirectConnectionsModal({
    isOpen,
    onClose,
    entityId,
    entityName,
    onEntityClick
}: IndirectConnectionsModalProps) {
    const [loading, setLoading] = useState(true);
    const [connections, setConnections] = useState<IndirectConnection[]>([]);
    const [directCount, setDirectCount] = useState(0);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen && entityId) {
            loadIndirectConnections();
        }
    }, [isOpen, entityId]);

    // ESC to close
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    const loadIndirectConnections = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/entity/${entityId}/indirect`);
            if (response.ok) {
                const data = await response.json();
                setConnections(data.indirect_connections || []);
                setDirectCount(data.direct_count || 0);
            }
        } catch (error) {
            console.error('Error loading indirect connections:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !mounted) return null;

    const grouped = groupByVia(connections);

    const modalContent = (
        <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-[10000] p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-slate-900 rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col border border-purple-500/30">
                {/* Header */}
                <div className="p-4 border-b border-slate-700 bg-gradient-to-r from-purple-900/50 to-slate-900">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/20 rounded-xl">
                                <Network className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">
                                    Conexões Indiretas (2º Grau)
                                </h2>
                                <p className="text-sm text-slate-400">
                                    Conexões das conexões de <span className="text-purple-400 font-medium">{entityName}</span>
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>
                    
                    {/* Stats */}
                    {!loading && (
                        <div className="flex gap-4 mt-3 text-xs">
                            <div className="px-3 py-1.5 bg-blue-500/20 rounded-full text-blue-400">
                                {directCount} conexões diretas
                            </div>
                            <div className="px-3 py-1.5 bg-purple-500/20 rounded-full text-purple-400">
                                {connections.length} conexões indiretas
                            </div>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                            <p className="text-sm text-slate-500">Mapeando a teia...</p>
                        </div>
                    ) : connections.length === 0 ? (
                        <div className="text-center py-12">
                            <Network className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                            <p className="text-slate-400">Nenhuma conexão de 2º grau encontrada</p>
                            <p className="text-xs text-slate-500 mt-1">
                                As conexões diretas não possuem outras conexões
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Group by "via" entity */}
                            {Array.from(grouped.entries()).map(([viaId, viaConnections]) => {
                                const via = viaConnections[0].via;
                                const ViaIcon = ENTITY_ICONS[via.type] || UserCircle;
                                const viaColor = ENTITY_COLORS[via.type] || 'text-slate-400';
                                
                                return (
                                    <div 
                                        key={viaId}
                                        className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden"
                                    >
                                        {/* Via header */}
                                        <button
                                            onClick={() => onEntityClick(via.id, via.name, via.type)}
                                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-700/50 transition-colors border-b border-slate-700/50"
                                        >
                                            <div className="flex items-center gap-2 text-slate-400 text-xs">
                                                <span>via</span>
                                                <ArrowRight className="w-3 h-3" />
                                            </div>
                                            <ViaIcon className={`w-5 h-5 ${viaColor}`} />
                                            <span className="font-medium text-white">{via.name}</span>
                                            <span className="text-xs text-slate-500">
                                                ({getRelLabel(via.relationship)})
                                            </span>
                                            <ChevronRight className="w-4 h-4 text-slate-600 ml-auto" />
                                        </button>
                                        
                                        {/* Connections through this entity */}
                                        <div className="divide-y divide-slate-700/30">
                                            {viaConnections.map(conn => {
                                                const ConnIcon = ENTITY_ICONS[conn.type] || UserCircle;
                                                const connColor = ENTITY_COLORS[conn.type] || 'text-slate-400';
                                                
                                                return (
                                                    <button
                                                        key={conn.id}
                                                        onClick={() => onEntityClick(conn.id, conn.name, conn.type)}
                                                        className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-700/30 transition-colors pl-12"
                                                    >
                                                        <ConnIcon className={`w-4 h-4 ${connColor}`} />
                                                        <span className="text-slate-200">{conn.name}</span>
                                                        <span className="text-xs text-slate-500">
                                                            {getRelLabel(conn.relationship)}
                                                        </span>
                                                        <ChevronRight className="w-3 h-3 text-slate-600 ml-auto" />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-slate-700 bg-slate-900/80">
                    <p className="text-xs text-slate-500 text-center">
                        💡 Clique em qualquer entidade para ver seus detalhes
                    </p>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
