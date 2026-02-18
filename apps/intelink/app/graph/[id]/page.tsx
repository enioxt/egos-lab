'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import nextDynamic from 'next/dynamic';
import { ArrowLeft, ZoomIn, ZoomOut, Maximize2, Users, Car, MapPin, Monitor, Smartphone } from 'lucide-react';
import Link from 'next/link';
import EntityDetailModal from '@/components/shared/EntityDetailModal';
import PredictedLinksPanel from '@/components/graph/PredictedLinksPanel';
import { useJourneySafe } from '@/providers/JourneyContext';

// Dynamic import to avoid SSR issues with force-graph (use 2D-only to avoid AFRAME dependency)
const ForceGraph2D = nextDynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-[600px]">Carregando grafo...</div>
});

interface GraphNode {
  id: string;
  name: string;
  type: string;
  val: number;
  color: string;
  x?: number;
  y?: number;
  [key: string]: any;
}

interface GraphLink {
  source: string;
  target: string;
  type: string;
  description: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

const TYPE_COLORS: Record<string, string> = {
  PERSON: '#3b82f6',
  VEHICLE: '#10b981',
  LOCATION: '#f59e0b',
  ORGANIZATION: '#8b5cf6',
  OTHER: '#6b7280',
};

// Ghost node colors (semi-transparent versions)
const GHOST_COLORS: Record<string, string> = {
  PERSON: 'rgba(59, 130, 246, 0.4)',
  VEHICLE: 'rgba(16, 185, 129, 0.4)',
  LOCATION: 'rgba(245, 158, 11, 0.4)',
  ORGANIZATION: 'rgba(139, 92, 246, 0.4)',
  OTHER: 'rgba(107, 114, 128, 0.4)',
};

export default function GraphPage() {
  const params = useParams();
  const investigationId = params.id as string;
  
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [investigation, setInvestigation] = useState<{ title: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const graphRef = useRef<any>(null);

  // Modal state (unified)
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [isEntityModalOpen, setIsEntityModalOpen] = useState(false);
  
  // Mobile warning state
  const [showMobileWarning, setShowMobileWarning] = useState(false);
  const [dismissedWarning, setDismissedWarning] = useState(false);
  
  // Journey tracking (Investigation Diary)
  const { addStep, isRecording } = useJourneySafe();
  
  // Check if mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 768; // md breakpoint
      setShowMobileWarning(isMobile && !dismissedWarning);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [dismissedWarning]);

  useEffect(() => {
    async function loadGraph() {
      setLoading(true);
      
      try {
        // Load via API (bypasses RLS)
        const res = await fetch(`/api/investigation/${investigationId}`);
        if (!res.ok) {
          console.error('Failed to load investigation');
          setLoading(false);
          return;
        }

        const { investigation: inv, entities, relationships } = await res.json();
        
        setInvestigation(inv ? { title: inv.title } : null);

        if (entities && relationships) {
          const nodes: GraphNode[] = entities.map((e: any) => ({
            id: e.id,
            name: e.name,
            type: e.type,
            val: 10,
            color: TYPE_COLORS[e.type] || TYPE_COLORS.OTHER,
            isGhost: false,
            metadata: e.metadata,
          }));

          // Create a Set of valid node IDs for fast lookup
          const nodeIds = new Set(nodes.map(n => n.id));

          // Filter links to only include those with valid source AND target nodes
          const links: GraphLink[] = relationships
            .filter((r: any) => nodeIds.has(r.source_id) && nodeIds.has(r.target_id))
            .map((r: any) => ({
              source: r.source_id,
              target: r.target_id,
              type: r.type,
              description: r.description || '',
            }));

          // Fetch cross-case connections (Ghost Nodes)
          try {
            const crossRes = await fetch('/api/intelink/cross-case-analysis?limit=50');
            if (crossRes.ok) {
              const crossData = await crossRes.json();
              const entityNames = new Set(entities.map((e: any) => e.name.toUpperCase()));
              
              // Find entities from this investigation that appear elsewhere
              crossData.entities?.forEach((crossEntity: any) => {
                if (entityNames.has(crossEntity.name.toUpperCase())) {
                  // Add ghost nodes for other investigations
                  crossEntity.appearances?.forEach((app: any) => {
                    if (app.investigationId !== investigationId) {
                      // Add ghost node representing the other investigation
                      const ghostId = `ghost-${app.investigationId}-${crossEntity.name}`;
                      if (!nodes.find(n => n.id === ghostId)) {
                        nodes.push({
                          id: ghostId,
                          name: `📍 ${app.investigationTitle}`,
                          type: 'OTHER',
                          val: 6,
                          color: GHOST_COLORS[crossEntity.type] || GHOST_COLORS.OTHER,
                          isGhost: true,
                          ghostData: {
                            investigationId: app.investigationId,
                            investigationTitle: app.investigationTitle,
                            entityName: crossEntity.name,
                            entityType: crossEntity.type,
                          },
                        });
                        
                        // Add link from entity to ghost node
                        const sourceEntity = entities.find((e: any) => 
                          e.name.toUpperCase() === crossEntity.name.toUpperCase()
                        );
                        if (sourceEntity) {
                          links.push({
                            source: sourceEntity.id,
                            target: ghostId,
                            type: 'CROSS_CASE',
                            description: `Aparece em: ${app.investigationTitle}`,
                          });
                        }
                      }
                    }
                  });
                }
              });
            }
          } catch (crossError) {
            console.warn('Could not load cross-case data:', crossError);
          }

          setGraphData({ nodes, links });
        }
      } catch (error) {
        console.error('Error loading graph:', error);
      }
      
      setLoading(false);
    }

    if (investigationId) {
      loadGraph();
    }
  }, [investigationId]);

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node as GraphNode);
    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 1000);
      graphRef.current.zoom(2, 1000);
    }
    
    // Track in Investigation Journey
    if (isRecording) {
      // Get visible neighbors from graphData
      const visibleConnections = graphData.links
        .filter(link => link.source === node.id || link.target === node.id)
        .map(link => {
          const connectedId = link.source === node.id ? link.target : link.source;
          const connectedNode = graphData.nodes.find(n => n.id === connectedId);
          return connectedNode ? {
            id: connectedNode.id,
            name: connectedNode.name,
            type: connectedNode.type,
            relationship: link.type,
          } : null;
        })
        .filter(Boolean) as { id: string; name: string; type: string; relationship: string }[];
      
      addStep({
        entityId: node.id,
        entityName: node.name,
        entityType: node.type,
        source: 'graph_nav',
        previousEntityId: selectedNode?.id,
        visibleConnectionsSnapshot: visibleConnections,
      });
    }
    
    // Open EntityDetailModal for any entity type
    setSelectedEntityId(node.id);
    setIsEntityModalOpen(true);
  }, [investigationId, isRecording, graphData, selectedNode, addStep]);

  const handleZoomIn = () => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.zoom();
      graphRef.current.zoom(currentZoom * 1.5, 300);
    }
  };

  const handleZoomOut = () => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.zoom();
      graphRef.current.zoom(currentZoom / 1.5, 300);
    }
  };

  const handleFitView = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 50);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">Carregando operação...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Mobile Warning Banner */}
      {showMobileWarning && (
        <div className="fixed inset-0 z-50 bg-gray-950/95 flex items-center justify-center p-4 md:hidden">
          <div className="bg-gray-900 border border-amber-500/30 rounded-2xl p-6 max-w-sm text-center">
            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Monitor className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Experiência Desktop Recomendada</h2>
            <p className="text-gray-400 text-sm mb-4">
              O grafo de conexões funciona melhor em telas maiores. 
              Para uma análise completa, use um computador.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setDismissedWarning(true)}
                className="w-full px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg transition-colors"
              >
                Continuar mesmo assim
              </button>
              <Link 
                href={`/investigation/${investigationId}`}
                className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Voltar para detalhes
              </Link>
            </div>
            <p className="text-xs text-gray-500 mt-4 flex items-center justify-center gap-1">
              <Smartphone className="w-3 h-3" /> Toque e arraste para navegar
            </p>
          </div>
        </div>
      )}
      
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/investigation/${investigationId}`} className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">🕸️ Grafo de Conexões</h1>
              <p className="text-gray-400 text-sm">{investigation?.title || 'Operação'}</p>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-2">
            <button 
              onClick={handleZoomIn}
              className="p-2 bg-gray-800 rounded hover:bg-gray-700"
              title="Zoom In"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button 
              onClick={handleZoomOut}
              className="p-2 bg-gray-800 rounded hover:bg-gray-700"
              title="Zoom Out"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <button 
              onClick={handleFitView}
              className="p-2 bg-gray-800 rounded hover:bg-gray-700"
              title="Ajustar Visualização"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex">
        {/* Graph */}
        <div className="flex-1 h-[calc(100vh-80px)]">
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            nodeLabel={(node: any) => `${node.name} (${node.type})`}
            nodeColor={(node: any) => node.color}
            nodeVal={(node: any) => node.val}
            linkLabel={(link: any) => `${link.type}: ${link.description}`}
            linkColor={() => '#4b5563'}
            linkWidth={2}
            linkDirectionalArrowLength={6}
            linkDirectionalArrowRelPos={1}
            onNodeClick={handleNodeClick}
            backgroundColor="#030712"
            nodeCanvasObject={(node: any, ctx, globalScale) => {
              const label = node.name;
              const fontSize = 12 / globalScale;
              ctx.font = `${fontSize}px Sans-Serif`;
              
              // Node circle
              ctx.beginPath();
              ctx.arc(node.x, node.y, 8, 0, 2 * Math.PI);
              ctx.fillStyle = node.color;
              ctx.fill();
              
              // Label
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = '#fff';
              ctx.fillText(label, node.x, node.y + 15);
            }}
          />
        </div>

        {/* Sidebar - Node Details */}
        {selectedNode && (
          <div className="w-80 bg-gray-900 border-l border-gray-800 p-6">
            <h2 className="text-lg font-bold mb-4">Detalhes</h2>
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm">Nome</label>
                <p className="text-white font-medium">{selectedNode.name}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Tipo</label>
                <p className="flex items-center gap-2">
                  <span 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: selectedNode.color }}
                  />
                  {selectedNode.type}
                </p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Conexões</label>
                <p className="text-white">
                  {graphData.links.filter(l => 
                    l.source === selectedNode.id || l.target === selectedNode.id
                  ).length} conexões
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => setSelectedNode(null)}
              className="mt-6 w-full py-2 bg-gray-800 rounded hover:bg-gray-700"
            >
              Fechar
            </button>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="fixed bottom-4 left-4 bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-bold mb-2">Legenda</h3>
        <div className="space-y-1">
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              {type}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="fixed bottom-4 right-4 bg-gray-900 border border-gray-800 rounded-lg p-4">
        <div className="text-sm">
          <span className="text-gray-400">Entidades:</span> {graphData.nodes.length} | 
          <span className="text-gray-400 ml-2">Conexões:</span> {graphData.links.length}
        </div>
      </div>

      {/* Predicted Links Panel */}
      <div className="fixed top-20 right-4 w-72">
        <PredictedLinksPanel
          investigationId={investigationId}
          selectedEntityId={selectedNode?.id}
          onViewEntity={(entityId) => {
            const node = graphData.nodes.find(n => n.id === entityId);
            if (node) setSelectedNode(node);
          }}
          onConfirmLink={() => {
            // Refresh graph data after confirming a link
            // The fetch will happen automatically on next render
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
          }}
          entityId={selectedEntityId}
          investigationId={investigationId}
          investigationTitle={investigation?.title}
        />
      )}
    </div>
  );
}
