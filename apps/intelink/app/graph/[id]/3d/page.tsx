'use client';

export const dynamicMode = 'force-dynamic';

/**
 * 3D Graph Visualization
 * 
 * Immersive 3D visualization of investigation relationships.
 * Uses react-force-graph-3d with Three.js.
 * 
 * @version 1.0.0
 */

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamicImport from 'next/dynamic';
import Link from 'next/link';
import { 
    ArrowLeft, RefreshCw, Loader2, Maximize2, 
    RotateCcw, ZoomIn, ZoomOut, Eye, Sparkles
} from 'lucide-react';
import { useRole, RoleLoading, AccessDenied } from '@/hooks/useRole';
import { createClient } from '@supabase/supabase-js';

// Dynamically import 3D graph (SSR incompatible)
const ForceGraph3D = dynamicImport(() => import('react-force-graph-3d'), { 
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-slate-950">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
    )
});

// Types
interface GraphNode {
    id: string;
    name: string;
    type: string;
    val: number;
    color: string;
}

interface GraphLink {
    source: string;
    target: string;
    type: string;
    color: string;
}

interface GraphData {
    nodes: GraphNode[];
    links: GraphLink[];
}

// Colors by entity type
const TYPE_COLORS: Record<string, string> = {
    PERSON: '#3B82F6',      // Blue
    VEHICLE: '#10B981',     // Emerald
    LOCATION: '#F59E0B',    // Amber
    PHONE: '#8B5CF6',       // Purple
    COMPANY: '#EC4899',     // Pink
    ORGANIZATION: '#EF4444', // Red
    FIREARM: '#6B7280',     // Gray
};

// Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Graph3DPage() {
    const params = useParams();
    const router = useRouter();
    const permissions = useRole();
    const graphRef = useRef<any>(null);
    
    const investigationId = params.id as string;
    
    const [loading, setLoading] = useState(true);
    const [investigation, setInvestigation] = useState<any>(null);
    const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
    const [highlightNodes, setHighlightNodes] = useState(new Set<string>());
    const [highlightLinks, setHighlightLinks] = useState(new Set<string>());
    
    // Load data
    useEffect(() => {
        if (permissions.isLoading || !permissions.canViewInvestigations) return;
        loadGraphData();
    }, [investigationId, permissions.isLoading, permissions.canViewInvestigations]);
    
    const loadGraphData = async () => {
        setLoading(true);
        try {
            // Load investigation
            const { data: inv } = await supabase
                .from('intelink_investigations')
                .select('*')
                .eq('id', investigationId)
                .single();
            
            setInvestigation(inv);
            
            // Load entities
            const { data: entities } = await supabase
                .from('intelink_entities')
                .select('id, name, type')
                .eq('investigation_id', investigationId);
            
            // Load relationships
            const { data: relationships } = await supabase
                .from('intelink_relationships')
                .select('id, source_entity_id, target_entity_id, type')
                .eq('investigation_id', investigationId);
            
            // Build graph data
            const nodes: GraphNode[] = (entities || []).map(e => ({
                id: e.id,
                name: e.name,
                type: e.type,
                val: e.type === 'PERSON' ? 20 : 15,
                color: TYPE_COLORS[e.type] || '#64748B',
            }));
            
            const links: GraphLink[] = (relationships || []).map(r => ({
                source: r.source_entity_id,
                target: r.target_entity_id,
                type: r.type,
                color: '#475569',
            }));
            
            setGraphData({ nodes, links });
        } catch (error) {
            console.error('Error loading graph:', error);
        } finally {
            setLoading(false);
        }
    };
    
    // Handle node click
    const handleNodeClick = useCallback((node: any) => {
        setSelectedNode(node as GraphNode);
        
        // Highlight connected nodes
        const connectedLinks = graphData.links.filter(
            l => l.source === node.id || l.target === node.id ||
                 (l.source as any)?.id === node.id || (l.target as any)?.id === node.id
        );
        
        const connectedNodeIds = new Set<string>();
        connectedLinks.forEach(l => {
            const sourceId = typeof l.source === 'string' ? l.source : (l.source as any)?.id;
            const targetId = typeof l.target === 'string' ? l.target : (l.target as any)?.id;
            if (sourceId) connectedNodeIds.add(sourceId);
            if (targetId) connectedNodeIds.add(targetId);
        });
        
        setHighlightNodes(connectedNodeIds);
        setHighlightLinks(new Set(connectedLinks.map((_, i) => String(i))));
        
        // Focus on node
        if (graphRef.current) {
            graphRef.current.centerAt((node as any).x, (node as any).y, 1000);
            graphRef.current.zoom(8, 1000);
        }
    }, [graphData.links]);
    
    // Zoom controls
    const handleZoomIn = () => graphRef.current?.zoom(graphRef.current.zoom() * 1.5, 500);
    const handleZoomOut = () => graphRef.current?.zoom(graphRef.current.zoom() / 1.5, 500);
    const handleReset = () => {
        graphRef.current?.zoomToFit(1000);
        setSelectedNode(null);
        setHighlightNodes(new Set());
        setHighlightLinks(new Set());
    };
    
    // RBAC
    if (permissions.isLoading) return <RoleLoading />;
    if (!permissions.canViewInvestigations) return <AccessDenied />;
    
    return (
        <div className="h-screen w-screen bg-slate-950 relative overflow-hidden">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-slate-950 via-slate-950/90 to-transparent p-4">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <div className="flex items-center gap-4">
                        <Link 
                            href={`/graph/${investigationId}`}
                            className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-lg font-bold text-white flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-purple-400" />
                                Grafo 3D Imersivo
                            </h1>
                            {investigation && (
                                <p className="text-sm text-slate-400">{investigation.title}</p>
                            )}
                        </div>
                    </div>
                    
                    {/* Controls */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleZoomIn}
                            className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors"
                            title="Zoom In"
                        >
                            <ZoomIn className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleZoomOut}
                            className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors"
                            title="Zoom Out"
                        >
                            <ZoomOut className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleReset}
                            className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors"
                            title="Reset View"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={loadGraphData}
                            disabled={loading}
                            className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                            title="Refresh"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>
            
            {/* 3D Graph */}
            {loading ? (
                <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                </div>
            ) : graphData.nodes.length === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                    <Eye className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-lg">Nenhuma entidade para visualizar</p>
                    <p className="text-sm mt-2">Adicione entidades e relacionamentos primeiro</p>
                </div>
            ) : (
                <ForceGraph3D
                    ref={graphRef}
                    graphData={graphData}
                    nodeLabel={(node: any) => `${node.name} (${node.type})`}
                    nodeColor={(node: any) => 
                        highlightNodes.size === 0 || highlightNodes.has(node.id)
                            ? node.color
                            : '#1E293B'
                    }
                    nodeVal={(node: any) => node.val}
                    linkColor={(link: any) => 
                        highlightNodes.size === 0 ? link.color : '#1E293B'
                    }
                    linkWidth={2}
                    linkOpacity={0.6}
                    backgroundColor="#020617"
                    onNodeClick={handleNodeClick}
                    enableNavigationControls={true}
                    showNavInfo={false}
                />
            )}
            
            {/* Selected Node Panel */}
            {selectedNode && (
                <div className="absolute bottom-4 left-4 z-10 bg-slate-900/95 border border-slate-700 rounded-xl p-4 max-w-xs">
                    <div className="flex items-center justify-between mb-2">
                        <span 
                            className="px-2 py-0.5 rounded text-xs font-medium"
                            style={{ backgroundColor: `${selectedNode.color}20`, color: selectedNode.color }}
                        >
                            {selectedNode.type}
                        </span>
                        <button
                            onClick={() => {
                                setSelectedNode(null);
                                setHighlightNodes(new Set());
                                setHighlightLinks(new Set());
                            }}
                            className="text-slate-400 hover:text-white"
                        >
                            ✕
                        </button>
                    </div>
                    <h3 className="font-semibold text-white">{selectedNode.name}</h3>
                    <p className="text-sm text-slate-400 mt-1">
                        {graphData.links.filter(l => 
                            l.source === selectedNode.id || l.target === selectedNode.id ||
                            (l.source as any)?.id === selectedNode.id || (l.target as any)?.id === selectedNode.id
                        ).length} conexões
                    </p>
                </div>
            )}
            
            {/* Legend */}
            <div className="absolute bottom-4 right-4 z-10 bg-slate-900/95 border border-slate-700 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-2">Legenda</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    {Object.entries(TYPE_COLORS).map(([type, color]) => (
                        <div key={type} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                            <span className="text-slate-300">{type}</span>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Stats */}
            <div className="absolute top-20 right-4 z-10 bg-slate-900/95 border border-slate-700 rounded-xl p-3">
                <p className="text-sm text-slate-400">
                    <span className="text-white font-medium">{graphData.nodes.length}</span> entidades
                </p>
                <p className="text-sm text-slate-400">
                    <span className="text-white font-medium">{graphData.links.length}</span> conexões
                </p>
            </div>
        </div>
    );
}
