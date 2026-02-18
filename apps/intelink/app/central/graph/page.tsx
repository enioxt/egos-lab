'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ArrowLeft, ZoomIn, ZoomOut, Maximize2, Filter, Users, Car, MapPin, Building2, Loader2, FileText, Network } from 'lucide-react';
import Link from 'next/link';
import nextDynamic from 'next/dynamic';
import EntityDetailModal from '@/components/shared/EntityDetailModal';
import { useToast } from '@/components/intelink/Toast';

const ForceGraph2D = nextDynamic(() => import('react-force-graph-2d'), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-cyan-500" /></div>
});

interface GraphNode {
    id: string;
    name: string;
    type: string;
    unit_code?: string;
    investigation_title?: string;
    color: string;
    val: number;
    metadata?: any;
    investigation_id?: string;
}

interface GraphLink {
    source: string;
    target: string;
    type: string;
    description?: string;
}

const TYPE_COLORS: Record<string, string> = {
    'PERSON': '#3b82f6',
    'VEHICLE': '#ec4899',
    'LOCATION': '#10b981',
    'ORGANIZATION': '#f59e0b',
    'FIREARM': '#ef4444',
    'WEAPON': '#ef4444',
    'DOCUMENT': '#8b5cf6',
    'default': '#94a3b8'
};

export default function UnifiedGraphPage() {
    const { showToast } = useToast();
    const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({ nodes: [], links: [] });
    const [loading, setLoading] = useState(true);
    const [filterUnit, setFilterUnit] = useState<string>('all');
    const [units, setUnits] = useState<{ id: string; code: string; name: string }[]>([]);
    const graphRef = useRef<any>(null);
    const lastClickRef = useRef<{ nodeId: string; timestamp: number } | null>(null);

    // Modal state (unified)
    const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
    const [selectedEntityInvId, setSelectedEntityInvId] = useState<string | null>(null);
    const [isEntityModalOpen, setIsEntityModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    
    // Auto-hide header for immersive experience
    const [headerVisible, setHeaderVisible] = useState(true);
    const [lastInteraction, setLastInteraction] = useState(Date.now());
    const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    // Navigation history for timeline
    const [navigationHistory, setNavigationHistory] = useState<Array<{
        node: GraphNode;
        timestamp: Date;
    }>>([]);

    // Auto-hide header effect - only show when mouse near top
    useEffect(() => {
        const hideHeader = () => {
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
            }
            hideTimeoutRef.current = setTimeout(() => {
                setHeaderVisible(false);
            }, 1000); // Hide after 1 second
        };

        // Only show header when mouse is in the header zone (top 80px)
        const handleMouseMove = (e: MouseEvent) => {
            if (e.clientY <= 80) {
                // Mouse is in header zone - show header
                setHeaderVisible(true);
                if (hideTimeoutRef.current) {
                    clearTimeout(hideTimeoutRef.current);
                }
            } else if (headerVisible) {
                // Mouse left header zone - start hide timer
                hideHeader();
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        
        // Initial: hide after 1 second
        hideHeader();

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
            }
        };
    }, [headerVisible]);

    const handleNodeClick = useCallback((node: any) => {
        const now = Date.now();
        
        // Deduplicate rapid clicks on same node (within 500ms)
        if (lastClickRef.current && 
            lastClickRef.current.nodeId === node.id && 
            now - lastClickRef.current.timestamp < 500) {
            return; // Ignore duplicate click
        }
        lastClickRef.current = { nodeId: node.id, timestamp: now };
        
        // Add to navigation history (avoid consecutive duplicates)
        setNavigationHistory(prev => {
            const last = prev[prev.length - 1];
            if (last && last.node.id === node.id) {
                return prev; // Don't add duplicate consecutive clicks
            }
            return [...prev, { node, timestamp: new Date() }];
        });
        
        // Open the appropriate modal based on entity type
        const entityData = {
            id: node.id,
            name: node.name,
            type: node.type,
            metadata: node.metadata || {},
            investigation_id: node.investigation_id || ''
        };
        
        // Open EntityDetailModal for any entity type
        setSelectedEntityId(node.id);
        setSelectedEntityInvId(node.investigation_id || null);
        setIsEntityModalOpen(true);
    }, []);

    useEffect(() => {
        loadData();
    }, [filterUnit]);

    const loadData = async () => {
        setLoading(true);
        const startTime = performance.now();
        
        try {
            // Load via API (bypasses RLS)
            const res = await fetch(`/api/central/graph?unit=${filterUnit}`);
            if (!res.ok) {
                console.error('Failed to load graph data');
                setLoading(false);
                return;
            }

            const data = await res.json();
            
            setUnits(data.units || []);
            setGraphData({ 
                nodes: data.nodes || [], 
                links: data.links || [] 
            });

            // Track performance
            const duration = Math.round(performance.now() - startTime);
            // console.log(`[Telemetry] Central Graph Load: ${duration}ms (${data.nodes?.length || 0} nodes)`);
            
            // Send telemetry
            fetch('/api/telemetry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    events: [{
                        event_type: 'performance',
                        page: '/central/graph',
                        action: 'load_graph',
                        duration_ms: duration,
                        metadata: { 
                            nodes: data.nodes?.length || 0, 
                            links: data.links?.length || 0,
                            filter_unit: filterUnit
                        },
                        timestamp: new Date().toISOString()
                    }]
                })
            }).catch(() => {}); // Silent fail
            
        } catch (e) {
            console.error('Error loading graph data:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleZoom = (factor: number) => {
        if (graphRef.current) {
            const currentZoom = graphRef.current.zoom();
            graphRef.current.zoom(currentZoom * factor, 500);
        }
    };

    const handleCenter = () => {
        if (graphRef.current) {
            graphRef.current.zoomToFit(500);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400">Construindo grafo unificado...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-950 text-white overflow-hidden">
            {/* Header - Auto-hide after 5s */}
            <header 
                className={`absolute top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 px-6 py-4 transition-all duration-500 ${
                    headerVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
                }`}
                onMouseEnter={() => setHeaderVisible(true)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/central" className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-400" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold">Grafo Unificado de Inteligência</h1>
                            <p className="text-slate-400 text-xs">
                                {graphData.nodes.length} entidades • {graphData.links.length} vínculos
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Filter */}
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-slate-500" />
                            <select
                                value={filterUnit}
                                onChange={(e) => setFilterUnit(e.target.value)}
                                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-cyan-500"
                            >
                                <option value="all">Todas as Delegacias</option>
                                {units.map(u => (
                                    <option key={u.id} value={u.id}>{u.code} - {u.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Zoom Controls */}
                        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
                            <button onClick={() => handleZoom(1.5)} className="p-2 hover:bg-slate-700 rounded transition-colors">
                                <ZoomIn className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleZoom(0.7)} className="p-2 hover:bg-slate-700 rounded transition-colors">
                                <ZoomOut className="w-4 h-4" />
                            </button>
                            <button onClick={handleCenter} className="p-2 hover:bg-slate-700 rounded transition-colors">
                                <Maximize2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Legend */}
            <div className={`absolute left-6 z-40 bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 transition-all duration-500 ${
                headerVisible ? 'top-24' : 'top-6'
            }`}>
                <h3 className="text-sm font-semibold mb-3 text-slate-300">Legenda por Tipo</h3>
                <div className="space-y-2">
                    {Object.entries(TYPE_COLORS).filter(([k]) => k !== 'default').map(([type, color]) => (
                        <div key={type} className="flex items-center gap-2 text-xs">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color as string }}></div>
                            <span className="text-slate-400">{type}</span>
                        </div>
                    ))}
                </div>
                
                {/* Navigation Timeline */}
                {navigationHistory.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-700">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-semibold text-slate-400">Navegação</h4>
                            <span className="text-xs text-slate-500">{navigationHistory.length} cliques</span>
                        </div>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-thin">
                            {navigationHistory.slice(-8).map((item, i) => (
                                <div 
                                    key={i}
                                    className="flex items-center gap-2 text-xs"
                                >
                                    <div 
                                        className="w-2 h-2 rounded-full flex-shrink-0" 
                                        style={{ backgroundColor: TYPE_COLORS[item.node.type] || TYPE_COLORS.default }}
                                    />
                                    <span className="text-slate-300 truncate max-w-[120px]">
                                        {item.node.name}
                                    </span>
                                    <span className="text-slate-600 text-[10px] ml-auto">
                                        {item.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={() => setNavigationHistory([])}
                                className="flex-1 text-[10px] py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 transition-colors"
                            >
                                Limpar
                            </button>
                            <button
                                onClick={() => setIsReportModalOpen(true)}
                                className="flex-1 text-[10px] py-1.5 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition-colors"
                            >
                                Gerar Relatório
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Graph */}
            <div className="absolute inset-0 pt-20">
                <ForceGraph2D
                    ref={graphRef}
                    graphData={graphData}
                    nodeLabel={(node: any) => `${node.name} (${node.type})`}
                    nodeColor={(node: any) => node.color}
                    nodeVal={(node: any) => node.val}
                    linkColor={() => '#475569'}
                    linkWidth={2}
                    linkDirectionalArrowLength={6}
                    linkDirectionalArrowRelPos={1}
                    onNodeClick={handleNodeClick}
                    backgroundColor="#030712"
                    nodeCanvasObject={(node: any, ctx, globalScale) => {
                        const label = node.name;
                        const fontSize = 12 / globalScale;
                        const nodeSize = node.val || 8;
                        ctx.font = `${fontSize}px Sans-Serif`;
                        
                        // Draw node
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI);
                        ctx.fillStyle = node.color;
                        ctx.fill();
                        
                        // Draw label
                        if (globalScale > 0.5) {
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'top';
                            ctx.fillStyle = '#e2e8f0';
                            ctx.fillText(label, node.x, node.y + nodeSize + 2);
                        }
                    }}
                />
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

            {/* Report Modal */}
            {isReportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsReportModalOpen(false)} />
                    <div className="relative bg-slate-900 rounded-2xl border border-cyan-500/30 shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 px-6 py-4 border-b border-cyan-500/30">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <FileText className="w-5 h-5 text-cyan-400" />
                                Relatório de Navegação
                            </h2>
                            <p className="text-sm text-slate-400 mt-1">
                                {navigationHistory.length} entidades visitadas
                            </p>
                        </div>
                        
                        {/* Content */}
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            {navigationHistory.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <Network className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p>Nenhuma entidade visitada ainda.</p>
                                    <p className="text-xs mt-1">Clique nos nós do grafo para adicionar ao relatório.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Timeline */}
                                    <div className="relative">
                                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500 to-blue-500"/>
                                        {navigationHistory.map((item, idx) => {
                                            const typeColors: Record<string, string> = {
                                                'PERSON': 'bg-blue-500',
                                                'VEHICLE': 'bg-pink-500',
                                                'LOCATION': 'bg-emerald-500',
                                                'ORGANIZATION': 'bg-amber-500',
                                                'PHONE': 'bg-cyan-500',
                                            };
                                            const bgColor = typeColors[item.node.type] || 'bg-slate-500';
                                            
                                            return (
                                                <div key={idx} className="flex items-start gap-4 pl-8 pb-4 relative">
                                                    <div className={`absolute left-2.5 w-3 h-3 rounded-full ${bgColor} ring-4 ring-slate-900`}/>
                                                    <div className="flex-1 bg-slate-800/50 rounded-xl p-3">
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-medium text-white">{item.node.name}</span>
                                                            <span className="text-xs text-slate-500">
                                                                {item.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={`text-xs px-2 py-0.5 rounded-full ${bgColor}/20 text-slate-300`}>
                                                                {item.node.type}
                                                            </span>
                                                            {item.node.investigation_title && (
                                                                <span className="text-xs text-slate-500">
                                                                    {item.node.investigation_title}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    
                                    {/* Summary */}
                                    <div className="bg-slate-800/50 rounded-xl p-4 mt-6">
                                        <h3 className="text-sm font-semibold text-slate-300 mb-3">Resumo</h3>
                                        <div className="grid grid-cols-3 gap-4 text-center">
                                            <div>
                                                <p className="text-2xl font-bold text-cyan-400">
                                                    {navigationHistory.filter(h => h.node.type === 'PERSON').length}
                                                </p>
                                                <p className="text-xs text-slate-500">Pessoas</p>
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-pink-400">
                                                    {navigationHistory.filter(h => h.node.type === 'VEHICLE').length}
                                                </p>
                                                <p className="text-xs text-slate-500">Veículos</p>
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-emerald-400">
                                                    {navigationHistory.filter(h => h.node.type === 'LOCATION').length}
                                                </p>
                                                <p className="text-xs text-slate-500">Locais</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-slate-700/50 flex justify-between items-center">
                            <button
                                onClick={() => {
                                    // Copy to clipboard as text
                                    const text = navigationHistory.map((h, i) => 
                                        `${i + 1}. ${h.node.name} (${h.node.type}) - ${h.timestamp.toLocaleTimeString('pt-BR')}`
                                    ).join('\n');
                                    navigator.clipboard.writeText(text);
                                    showToast('success', 'Copiado!', 'Relatório copiado para área de transferência');
                                }}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                            >
                                📋 Copiar
                            </button>
                            <button
                                onClick={() => setIsReportModalOpen(false)}
                                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm font-medium transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
