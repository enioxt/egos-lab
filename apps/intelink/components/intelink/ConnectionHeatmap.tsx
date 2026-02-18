'use client';

import React, { useMemo } from 'react';
import { Activity, Users, TrendingUp } from 'lucide-react';

interface Entity {
    id: string;
    name: string;
    type: string;
}

interface Relationship {
    source_id: string;
    target_id: string;
    type: string;
}

interface ConnectionHeatmapProps {
    entities: Entity[];
    relationships: Relationship[];
    onEntityClick?: (entityId: string) => void;
}

interface ConnectionStats {
    entityId: string;
    entityName: string;
    entityType: string;
    connectionCount: number;
    intensity: number; // 0-1 normalized
}

/**
 * ConnectionHeatmap - Visualização de densidade de conexões
 * Mostra quais entidades têm mais vínculos na operação
 */
export function ConnectionHeatmap({ entities, relationships, onEntityClick }: ConnectionHeatmapProps) {
    const stats = useMemo(() => {
        // Count connections per entity
        const connectionMap = new Map<string, number>();
        
        for (const rel of relationships) {
            connectionMap.set(rel.source_id, (connectionMap.get(rel.source_id) || 0) + 1);
            connectionMap.set(rel.target_id, (connectionMap.get(rel.target_id) || 0) + 1);
        }
        
        // Build stats array
        const result: ConnectionStats[] = entities.map(e => ({
            entityId: e.id,
            entityName: e.name,
            entityType: e.type,
            connectionCount: connectionMap.get(e.id) || 0,
            intensity: 0
        }));
        
        // Normalize intensity
        const maxConnections = Math.max(...result.map(s => s.connectionCount), 1);
        result.forEach(s => {
            s.intensity = s.connectionCount / maxConnections;
        });
        
        // Sort by connection count (descending)
        return result.sort((a, b) => b.connectionCount - a.connectionCount);
    }, [entities, relationships]);

    const getIntensityColor = (intensity: number): string => {
        if (intensity >= 0.8) return 'bg-red-500/80 border-red-400';
        if (intensity >= 0.6) return 'bg-orange-500/70 border-orange-400';
        if (intensity >= 0.4) return 'bg-yellow-500/60 border-yellow-400';
        if (intensity >= 0.2) return 'bg-blue-500/50 border-blue-400';
        return 'bg-slate-600/40 border-slate-500';
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'PERSON': return '👤';
            case 'VEHICLE': return '🚗';
            case 'LOCATION': return '📍';
            case 'ORGANIZATION': return '🏢';
            case 'COMPANY': return '🏛️';
            case 'PHONE': return '📱';
            case 'FIREARM': return '🔫';
            default: return '📎';
        }
    };

    const totalConnections = relationships.length;
    const avgConnections = entities.length > 0 
        ? (totalConnections * 2 / entities.length).toFixed(1) 
        : '0';
    const maxConnected = stats[0];

    if (entities.length === 0) {
        return (
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    Mapa de Conexões
                </h3>
                <p className="text-slate-400 text-sm">Nenhuma entidade para analisar.</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                Mapa de Conexões
            </h3>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                    <Users className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                    <p className="text-xl font-bold text-white">{entities.length}</p>
                    <p className="text-xs text-slate-400">Entidades</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                    <Activity className="w-5 h-5 text-green-400 mx-auto mb-1" />
                    <p className="text-xl font-bold text-white">{totalConnections}</p>
                    <p className="text-xs text-slate-400">Vínculos</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                    <TrendingUp className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                    <p className="text-xl font-bold text-white">{avgConnections}</p>
                    <p className="text-xs text-slate-400">Média/Entidade</p>
                </div>
            </div>

            {/* Most Connected Entity */}
            {maxConnected && maxConnected.connectionCount > 0 && (
                <div 
                    className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-lg p-4 mb-6 cursor-pointer hover:from-red-500/30 hover:to-orange-500/30 transition-colors"
                    onClick={() => onEntityClick?.(maxConnected.entityId)}
                >
                    <p className="text-xs text-red-300 uppercase tracking-wide mb-1">Mais Conectado</p>
                    <p className="text-lg font-bold text-white flex items-center gap-2">
                        <span>{getTypeIcon(maxConnected.entityType)}</span>
                        {maxConnected.entityName}
                    </p>
                    <p className="text-sm text-red-200">{maxConnected.connectionCount} conexões</p>
                </div>
            )}

            {/* Heatmap Grid */}
            <div className="space-y-2">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Densidade de Vínculos</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {stats.slice(0, 12).map((stat) => (
                        <div 
                            key={stat.entityId}
                            className={`rounded-lg p-3 border transition-all hover:scale-105 cursor-pointer ${getIntensityColor(stat.intensity)}`}
                            title={`${stat.entityName}: ${stat.connectionCount} conexões`}
                            onClick={() => onEntityClick?.(stat.entityId)}
                        >
                            <div className="flex items-center gap-1 mb-1">
                                <span className="text-sm">{getTypeIcon(stat.entityType)}</span>
                                <span className="text-xs font-medium text-white truncate">
                                    {stat.entityName.split(' ')[0]}
                                </span>
                            </div>
                            <p className="text-lg font-bold text-white">{stat.connectionCount}</p>
                        </div>
                    ))}
                </div>
                
                {stats.length > 12 && (
                    <p className="text-xs text-slate-500 text-center mt-2">
                        +{stats.length - 12} entidades não exibidas
                    </p>
                )}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-slate-700">
                <p className="text-xs text-slate-400 mb-2">Legenda de Intensidade:</p>
                <div className="flex gap-2 flex-wrap">
                    <span className="px-2 py-1 rounded text-xs bg-red-500/80 text-white">Alta (80%+)</span>
                    <span className="px-2 py-1 rounded text-xs bg-orange-500/70 text-white">Média-Alta</span>
                    <span className="px-2 py-1 rounded text-xs bg-yellow-500/60 text-white">Média</span>
                    <span className="px-2 py-1 rounded text-xs bg-blue-500/50 text-white">Baixa</span>
                    <span className="px-2 py-1 rounded text-xs bg-slate-600/40 text-white">Mínima</span>
                </div>
            </div>
        </div>
    );
}

export default ConnectionHeatmap;
