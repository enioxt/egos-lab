'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ArrowLeft, ZoomIn, ZoomOut, Maximize2, Loader2, Phone, FileText, Building2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import nextDynamic from 'next/dynamic';
import EntityDetailModal from '@/components/shared/EntityDetailModal';

const ForceGraph2D = nextDynamic(() => import('react-force-graph-2d'), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-cyan-500" /></div>
});

interface GraphNode {
    id: string;
    name: string;
    type: string;
    color: string;
    val: number;
    metadata?: any;
    investigation_id?: string;
    investigation_title?: string;
}

interface GraphLink {
    source: string;
    target: string;
    type: string;
    description?: string;
}

interface UnitInfo {
    id: string;
    code: string;
    name: string;
    full_name: string;
}

const TYPE_COLORS: Record<string, string> = {
    'PERSON': '#3b82f6',
    'VEHICLE': '#ec4899',
    'LOCATION': '#10b981',
    'ORGANIZATION': '#f59e0b',
    'PHONE': '#06b6d4',
    'DOCUMENT': '#8b5cf6',
    'WEAPON': '#ef4444',
    'FIREARM': '#ef4444',
    'default': '#94a3b8'
};

const TYPE_LABELS: Record<string, string> = {
    'PERSON': 'Pessoa',
    'VEHICLE': 'Veículo',
    'LOCATION': 'Local',
    'ORGANIZATION': 'Organização',
    'PHONE': 'Telefone',
    'DOCUMENT': 'Documento',
    'WEAPON': 'Arma',
    'FIREARM': 'Arma de Fogo',
};

export default function UnitGraphPage() {
    const params = useParams();
    const unitId = params.id as string;

    const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({ nodes: [], links: [] });
    const [loading, setLoading] = useState(true);
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
    const [unitInfo, setUnitInfo] = useState<UnitInfo | null>(null);
    const graphRef = useRef<any>(null);

    // Modal state (unified)
    const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
    const [selectedEntityInvId, setSelectedEntityInvId] = useState<string | null>(null);
    const [isEntityModalOpen, setIsEntityModalOpen] = useState(false);

    // Navigation history for timeline
    const [navigationHistory, setNavigationHistory] = useState<Array<{
        node: GraphNode;
        timestamp: Date;
    }>>([]);

    const handleNodeClick = useCallback((node: any) => {
        setSelectedNode(node);
        
        // Add to navigation history
        setNavigationHistory(prev => [...prev, { node, timestamp: new Date() }]);
        
        // Open EntityDetailModal for any entity type
        setSelectedEntityId(node.id);
        setSelectedEntityInvId(node.investigation_id || null);
        setIsEntityModalOpen(true);
    }, []);

    useEffect(() => {
        if (unitId) {
            loadData();
        }
    }, [unitId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/central/graph?unit=${unitId}`);
            if (!res.ok) {
                console.error('Failed to load graph data');
                setLoading(false);
                return;
            }

            const data = await res.json();
            
            // Set unit info
            if (data.units && data.units.length > 0) {
                const unit = data.units.find((u: any) => u.id === unitId);
                if (unit) {
                    setUnitInfo(unit);
                }
            }

            // Process nodes with colors
            const nodes = (data.nodes || []).map((n: any) => ({
                ...n,
                color: TYPE_COLORS[n.type] || TYPE_COLORS.default,
                val: n.type === 'PERSON' ? 3 : 2
            }));

            setGraphData({ nodes, links: data.links || [] });
        } catch (e) {
            console.error('Error loading graph:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleZoom = (delta: number) => {
        if (graphRef.current) {
            const currentZoom = graphRef.current.zoom();
            graphRef.current.zoom(currentZoom + delta, 300);
        }
    };

    const handleCenter = () => {
        if (graphRef.current) {
            graphRef.current.zoomToFit(400);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/central" className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                                <ArrowLeft className="w-5 h-5 text-slate-400" />
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold text-white">
                                    Grafo - {unitInfo?.code || 'Carregando...'}
                                </h1>
                                <p className="text-sm text-slate-400">
                                    {unitInfo?.full_name || unitInfo?.name || ''}
                                    {graphData.nodes.length > 0 && (
                                        <span className="ml-2">
                                            • {graphData.nodes.length} entidades • {graphData.links.length} vínculos
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Zoom controls */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleZoom(0.5)}
                                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <ZoomIn className="w-5 h-5 text-slate-300" />
                            </button>
                            <button
                                onClick={() => handleZoom(-0.5)}
                                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <ZoomOut className="w-5 h-5 text-slate-300" />
                            </button>
                            <button
                                onClick={handleCenter}
                                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <Maximize2 className="w-5 h-5 text-slate-300" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Graph Container */}
            <div className="relative" style={{ height: 'calc(100vh - 73px)' }}>
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <Loader2 className="w-12 h-12 animate-spin text-cyan-500 mx-auto mb-4" />
                            <p className="text-slate-400">Carregando grafo...</p>
                        </div>
                    </div>
                ) : graphData.nodes.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center text-slate-500">
                            <Building2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="text-lg">Nenhuma entidade encontrada</p>
                            <p className="text-sm mt-2">Esta delegacia ainda não possui operações com entidades.</p>
                        </div>
                    </div>
                ) : (
                    <ForceGraph2D
                        ref={graphRef}
                        graphData={graphData}
                        nodeLabel={(node: any) => `${node.name} (${TYPE_LABELS[node.type] || node.type})`}
                        nodeColor={(node: any) => node.color}
                        nodeRelSize={6}
                        linkColor={() => 'rgba(100, 116, 139, 0.4)'}
                        linkWidth={1.5}
                        onNodeClick={handleNodeClick}
                        backgroundColor="transparent"
                        nodeCanvasObject={(node: any, ctx, globalScale) => {
                            const label = node.name;
                            const fontSize = 12 / globalScale;
                            ctx.font = `${fontSize}px Inter, sans-serif`;
                            
                            // Draw node
                            ctx.beginPath();
                            ctx.arc(node.x, node.y, node.val * 2, 0, 2 * Math.PI);
                            ctx.fillStyle = node.color;
                            ctx.fill();
                            
                            // Draw label
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillStyle = 'white';
                            ctx.fillText(label, node.x, node.y + node.val * 2 + fontSize);
                        }}
                    />
                )}

                {/* Legend */}
                <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-white mb-3">Legenda por Tipo</h3>
                    <div className="space-y-2">
                        {Object.entries(TYPE_COLORS).filter(([k]) => k !== 'default').map(([type, color]) => (
                            <div key={type} className="flex items-center gap-2 text-sm">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                                <span className="text-slate-300">{TYPE_LABELS[type] || type}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Navigation History (Timeline) */}
                {navigationHistory.length > 0 && (
                    <div className="absolute bottom-4 left-4 right-4 max-w-md bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-white">Histórico de Navegação</h3>
                            <span className="text-xs text-slate-500">{navigationHistory.length} cliques</span>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {navigationHistory.slice(-10).map((item, i) => (
                                <div
                                    key={i}
                                    className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium"
                                    style={{ 
                                        backgroundColor: `${TYPE_COLORS[item.node.type] || TYPE_COLORS.default}20`,
                                        color: TYPE_COLORS[item.node.type] || TYPE_COLORS.default,
                                        border: `1px solid ${TYPE_COLORS[item.node.type] || TYPE_COLORS.default}40`
                                    }}
                                >
                                    {item.node.name.slice(0, 15)}{item.node.name.length > 15 ? '...' : ''}
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => setNavigationHistory([])}
                            className="mt-2 text-xs text-slate-500 hover:text-slate-400"
                        >
                            Limpar histórico
                        </button>
                    </div>
                )}
            </div>

            {/* Entity Detail Modal (unified) */}
            {selectedEntityId && (
                <EntityDetailModal
                    isOpen={isEntityModalOpen}
                    onClose={() => {
                        setIsEntityModalOpen(false);
                        setSelectedEntityId(null);
                        setSelectedEntityInvId(null);
                    }}
                    entityId={selectedEntityId}
                    investigationId={selectedEntityInvId || undefined}
                />
            )}
        </div>
    );
}
