import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, validationError, successResponse, errorResponse } from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';
import { SupabaseClient } from '@supabase/supabase-js';
import { 
    shortestPath, 
    topByDegreeCentrality, 
    graphStats,
    neighborhood,
    allPaths,
    Graph,
    GraphNode,
    GraphEdge
} from '@/lib/intelink/graph-algorithms';

/**
 * Build graph from database
 */
async function buildGraph(supabase: SupabaseClient, investigationIds?: string[]): Promise<Graph> {
    // Fetch entities
    let entityQuery = supabase
        .from('intelink_entities')
        .select('id, name, type, metadata, investigation_id');
    
    if (investigationIds && investigationIds.length > 0) {
        entityQuery = entityQuery.in('investigation_id', investigationIds);
    }
    
    const { data: entities } = await entityQuery.limit(1000);
    
    // Fetch relationships
    let relQuery = supabase
        .from('intelink_relationships')
        .select('source_id, target_id, type');
    
    if (investigationIds && investigationIds.length > 0) {
        relQuery = relQuery.in('investigation_id', investigationIds);
    }
    
    const { data: relationships } = await relQuery.limit(5000);
    
    const nodes: GraphNode[] = (entities || []).map((e: any) => ({
        id: e.id,
        name: e.name,
        type: e.type,
        metadata: e.metadata
    }));
    
    // Create a Set of valid node IDs for fast lookup
    const nodeIds = new Set(nodes.map(n => n.id));
    
    // Filter edges to only include those with valid source AND target nodes
    const edges: GraphEdge[] = (relationships || [])
        .filter((r: any) => nodeIds.has(r.source_id) && nodeIds.has(r.target_id))
        .map((r: any) => ({
            source: r.source_id,
            target: r.target_id,
            type: r.type
        }));
    
    return { nodes, edges };
}

/**
 * POST /api/intelink/graph-analysis
 * 
 * Body:
 * - action: 'shortest-path' | 'centrality' | 'stats' | 'neighborhood' | 'all-paths'
 * - investigation_ids?: string[] (filter by investigations)
 * - params: action-specific parameters
 */
async function handlePost(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const body = await req.json();
        const { action, investigation_ids, params } = body;

        const graph = await buildGraph(supabase, investigation_ids);

        switch (action) {
            case 'shortest-path': {
                const { source_id, target_id } = params || {};
                if (!source_id || !target_id) {
                    return NextResponse.json({ error: 'source_id and target_id required' }, { status: 400 });
                }
                
                const result = shortestPath(graph, source_id, target_id);
                return NextResponse.json({ 
                    result,
                    found: result !== null
                });
            }

            case 'centrality': {
                const limit = params?.limit || 20;
                const topNodes = topByDegreeCentrality(graph, limit);
                return NextResponse.json({ 
                    topNodes,
                    totalNodes: graph.nodes.length
                });
            }

            case 'stats': {
                const stats = graphStats(graph);
                return NextResponse.json({ stats });
            }

            case 'neighborhood': {
                const { node_id, hops = 2 } = params || {};
                if (!node_id) {
                    return NextResponse.json({ error: 'node_id required' }, { status: 400 });
                }
                
                const result = neighborhood(graph, node_id, hops);
                return NextResponse.json({ 
                    ...result,
                    centerNode: graph.nodes.find(n => n.id === node_id)
                });
            }

            case 'all-paths': {
                const { source_id, target_id, max_depth = 4 } = params || {};
                if (!source_id || !target_id) {
                    return NextResponse.json({ error: 'source_id and target_id required' }, { status: 400 });
                }
                
                const paths = allPaths(graph, source_id, target_id, max_depth);
                const pathsWithDetails = paths.slice(0, 10).map(path => ({
                    ids: path,
                    nodes: path.map(id => graph.nodes.find(n => n.id === id)).filter(Boolean),
                    length: path.length - 1
                }));
                
                return NextResponse.json({ 
                    paths: pathsWithDetails,
                    totalPaths: paths.length
                });
            }

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

    } catch (error) {
        console.error('[Graph Analysis] Error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

/**
 * GET /api/intelink/graph-analysis
 * Returns graph stats for all data
 */
async function handleGet(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const graph = await buildGraph(supabase);
        const stats = graphStats(graph);
        const topNodes = topByDegreeCentrality(graph, 10);
        
        return successResponse({ 
            stats,
            topNodes,
            nodeTypes: [...new Set(graph.nodes.map(n => n.type))]
        });
    } catch (error: any) {
        console.error('[Graph Analysis GET] Error:', error);
        return errorResponse(error.message || 'Erro na análise de grafo');
    }
}

// Protected: Only member+ can access graph analysis
export const GET = withSecurity(handleGet, { requiredRole: 'member' });
export const POST = withSecurity(handlePost, { requiredRole: 'member' });
