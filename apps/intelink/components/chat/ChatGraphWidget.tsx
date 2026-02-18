'use client';

/**
 * ChatGraphWidget - Interactive mini-graph inside chat messages
 * 
 * Renders a small force-directed graph when the AI response contains
 * entity connections. Uses react-force-graph-2d for visualization.
 * 
 * Usage in AI response:
 * ```graph
 * {
 *   "nodes": [{"id": "1", "name": "João Silva", "type": "PERSON"}],
 *   "links": [{"source": "1", "target": "2", "type": "RELACIONADO"}]
 * }
 * ```
 */

import React, { useRef, useEffect, useMemo, useState } from 'react';
import nextDynamic from 'next/dynamic';
import { 
    Maximize2, 
    Minimize2, 
    Users, 
    Car, 
    MapPin, 
    Building2,
    Network
} from 'lucide-react';

// Dynamic import to avoid SSR issues
const ForceGraph2D = nextDynamic(() => import('react-force-graph-2d'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-48 flex items-center justify-center bg-slate-800 rounded-lg">
            <div className="animate-spin w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full" />
        </div>
    ),
});

interface GraphNode {
    id: string;
    name: string;
    type: string;
    val?: number;
    color?: string;
}

interface GraphLink {
    source: string;
    target: string;
    type: string;
}

interface ChatGraphWidgetProps {
    data: {
        nodes: GraphNode[];
        links: GraphLink[];
        title?: string;
    };
    onNodeClick?: (node: GraphNode) => void;
}

const TYPE_COLORS: Record<string, string> = {
    PERSON: '#3b82f6',
    VEHICLE: '#10b981',
    LOCATION: '#f59e0b',
    ORGANIZATION: '#8b5cf6',
    COMPANY: '#8b5cf6',
    OTHER: '#6b7280',
};

const TYPE_ICONS: Record<string, any> = {
    PERSON: Users,
    VEHICLE: Car,
    LOCATION: MapPin,
    ORGANIZATION: Building2,
    COMPANY: Building2,
};

export function ChatGraphWidget({ data, onNodeClick }: ChatGraphWidgetProps) {
    const graphRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [dimensions, setDimensions] = useState({ width: 300, height: 200 });
    
    // Process nodes with colors
    const processedData = useMemo(() => {
        const nodes = data.nodes.map(node => ({
            ...node,
            val: 10,
            color: TYPE_COLORS[node.type] || TYPE_COLORS.OTHER,
        }));
        
        return {
            nodes,
            links: data.links,
        };
    }, [data]);
    
    // Update dimensions on resize
    useEffect(() => {
        if (!containerRef.current) return;
        
        const updateDimensions = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setDimensions({
                    width: rect.width,
                    height: isExpanded ? 400 : 200,
                });
            }
        };
        
        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, [isExpanded]);
    
    // Fit graph on mount
    useEffect(() => {
        if (graphRef.current) {
            setTimeout(() => {
                graphRef.current?.zoomToFit(400, 20);
            }, 500);
        }
    }, [processedData]);
    
    const handleNodeClick = (node: any) => {
        if (onNodeClick) {
            onNodeClick(node as GraphNode);
        }
        
        // Zoom to node
        if (graphRef.current) {
            graphRef.current.centerAt(node.x, node.y, 500);
            graphRef.current.zoom(2, 500);
        }
    };
    
    return (
        <div 
            ref={containerRef}
            className={`rounded-xl border border-slate-600 overflow-hidden bg-slate-900 transition-all duration-300 ${
                isExpanded ? 'h-[450px]' : 'h-[250px]'
            }`}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-800 border-b border-slate-700">
                <div className="flex items-center gap-2">
                    <Network className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-medium text-slate-300">
                        {data.title || 'Grafo de Conexões'}
                    </span>
                    <span className="text-xs text-slate-500">
                        ({processedData.nodes.length} nós, {processedData.links.length} conexões)
                    </span>
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-1 hover:bg-slate-700 rounded transition-colors"
                >
                    {isExpanded ? (
                        <Minimize2 className="w-4 h-4 text-slate-400" />
                    ) : (
                        <Maximize2 className="w-4 h-4 text-slate-400" />
                    )}
                </button>
            </div>
            
            {/* Graph */}
            <div className="flex-1" style={{ height: isExpanded ? 400 : 200 }}>
                <ForceGraph2D
                    ref={graphRef}
                    width={dimensions.width}
                    height={isExpanded ? 400 : 200}
                    graphData={processedData}
                    nodeLabel={(node: any) => `${node.name} (${node.type})`}
                    nodeColor={(node: any) => node.color}
                    nodeVal={(node: any) => node.val}
                    linkLabel={(link: any) => link.type}
                    linkColor={() => 'rgba(148, 163, 184, 0.3)'}
                    linkWidth={1.5}
                    onNodeClick={handleNodeClick}
                    enableNodeDrag={true}
                    enableZoomInteraction={true}
                    enablePanInteraction={true}
                    backgroundColor="transparent"
                />
            </div>
            
            {/* Legend */}
            <div className="flex items-center gap-3 px-3 py-2 bg-slate-800 border-t border-slate-700">
                {Object.entries(TYPE_COLORS).slice(0, 4).map(([type, color]) => {
                    const Icon = TYPE_ICONS[type] || Users;
                    return (
                        <div key={type} className="flex items-center gap-1">
                            <Icon className="w-3 h-3" style={{ color }} />
                            <span className="text-xs text-slate-500">{type}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/**
 * Parse AI response content for graph data blocks
 * Format: ```graph\n{JSON}\n```
 */
export function parseGraphFromContent(content: string): {
    textBefore: string;
    graphData: ChatGraphWidgetProps['data'] | null;
    textAfter: string;
} {
    const graphRegex = /```graph\s*\n([\s\S]*?)\n```/;
    const match = content.match(graphRegex);
    
    if (!match) {
        return { textBefore: content, graphData: null, textAfter: '' };
    }
    
    const jsonString = match[1];
    const textBefore = content.slice(0, match.index).trim();
    const textAfter = content.slice((match.index || 0) + match[0].length).trim();
    
    try {
        const graphData = JSON.parse(jsonString);
        
        // Validate structure
        if (!Array.isArray(graphData.nodes) || !Array.isArray(graphData.links)) {
            return { textBefore: content, graphData: null, textAfter: '' };
        }
        
        return { textBefore, graphData, textAfter };
    } catch (e) {
        console.error('[ChatGraphWidget] Failed to parse graph JSON:', e);
        return { textBefore: content, graphData: null, textAfter: '' };
    }
}

export default ChatGraphWidget;
