/**
 * Graph Algorithms for Link Analysis
 * 
 * Implements:
 * - Shortest Path (Dijkstra/BFS)
 * - Degree Centrality
 * - Betweenness Centrality (simplified)
 * - Connected Components
 */

export interface GraphNode {
    id: string;
    name: string;
    type: string;
    metadata?: Record<string, any>;
}

export interface GraphEdge {
    source: string;
    target: string;
    type: string;
    weight?: number;
}

export interface Graph {
    nodes: GraphNode[];
    edges: GraphEdge[];
}

/**
 * Build adjacency list from edges
 */
function buildAdjacencyList(graph: Graph): Map<string, Set<string>> {
    const adj = new Map<string, Set<string>>();
    
    // Initialize all nodes
    for (const node of graph.nodes) {
        adj.set(node.id, new Set());
    }
    
    // Add edges (bidirectional)
    for (const edge of graph.edges) {
        adj.get(edge.source)?.add(edge.target);
        adj.get(edge.target)?.add(edge.source);
    }
    
    return adj;
}

/**
 * Find shortest path between two nodes using BFS
 */
export function shortestPath(graph: Graph, startId: string, endId: string): {
    path: string[];
    distance: number;
    nodeDetails: GraphNode[];
} | null {
    if (startId === endId) {
        const node = graph.nodes.find(n => n.id === startId);
        return node ? { path: [startId], distance: 0, nodeDetails: [node] } : null;
    }
    
    const adj = buildAdjacencyList(graph);
    const visited = new Set<string>();
    const parent = new Map<string, string>();
    const queue: string[] = [startId];
    visited.add(startId);
    
    while (queue.length > 0) {
        const current = queue.shift()!;
        
        if (current === endId) {
            // Reconstruct path
            const path: string[] = [];
            let node: string | undefined = endId;
            while (node) {
                path.unshift(node);
                node = parent.get(node);
            }
            
            const nodeDetails = path.map(id => 
                graph.nodes.find(n => n.id === id)!
            ).filter(Boolean);
            
            return {
                path,
                distance: path.length - 1,
                nodeDetails
            };
        }
        
        const neighbors = adj.get(current) || new Set();
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                parent.set(neighbor, current);
                queue.push(neighbor);
            }
        }
    }
    
    return null; // No path found
}

/**
 * Calculate degree centrality for all nodes
 * Higher = more direct connections
 */
export function degreeCentrality(graph: Graph): Map<string, number> {
    const degrees = new Map<string, number>();
    const adj = buildAdjacencyList(graph);
    const maxPossible = graph.nodes.length - 1;
    
    for (const [nodeId, neighbors] of adj) {
        // Normalized degree centrality
        degrees.set(nodeId, maxPossible > 0 ? neighbors.size / maxPossible : 0);
    }
    
    return degrees;
}

/**
 * Get top N nodes by degree centrality
 */
export function topByDegreeCentrality(graph: Graph, n: number = 10): Array<{
    node: GraphNode;
    degree: number;
    connections: number;
}> {
    const degrees = degreeCentrality(graph);
    const adj = buildAdjacencyList(graph);
    
    const sorted = Array.from(degrees.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, n);
    
    return sorted.map(([nodeId, degree]) => ({
        node: graph.nodes.find(n => n.id === nodeId)!,
        degree,
        connections: adj.get(nodeId)?.size || 0
    })).filter(item => item.node);
}

/**
 * Find connected components
 */
export function connectedComponents(graph: Graph): string[][] {
    const adj = buildAdjacencyList(graph);
    const visited = new Set<string>();
    const components: string[][] = [];
    
    for (const node of graph.nodes) {
        if (!visited.has(node.id)) {
            const component: string[] = [];
            const stack = [node.id];
            
            while (stack.length > 0) {
                const current = stack.pop()!;
                if (visited.has(current)) continue;
                
                visited.add(current);
                component.push(current);
                
                const neighbors = adj.get(current) || new Set();
                for (const neighbor of neighbors) {
                    if (!visited.has(neighbor)) {
                        stack.push(neighbor);
                    }
                }
            }
            
            components.push(component);
        }
    }
    
    return components.sort((a, b) => b.length - a.length);
}

/**
 * Find all paths between two nodes (limited depth)
 */
export function allPaths(
    graph: Graph, 
    startId: string, 
    endId: string, 
    maxDepth: number = 5
): string[][] {
    const adj = buildAdjacencyList(graph);
    const paths: string[][] = [];
    
    function dfs(current: string, path: string[], visited: Set<string>) {
        if (path.length > maxDepth) return;
        
        if (current === endId) {
            paths.push([...path]);
            return;
        }
        
        const neighbors = adj.get(current) || new Set();
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                path.push(neighbor);
                dfs(neighbor, path, visited);
                path.pop();
                visited.delete(neighbor);
            }
        }
    }
    
    const visited = new Set<string>([startId]);
    dfs(startId, [startId], visited);
    
    return paths.sort((a, b) => a.length - b.length);
}

/**
 * Get neighborhood of a node (nodes within N hops)
 */
export function neighborhood(graph: Graph, nodeId: string, hops: number = 2): {
    nodes: GraphNode[];
    edges: GraphEdge[];
} {
    const adj = buildAdjacencyList(graph);
    const visited = new Set<string>();
    const distances = new Map<string, number>();
    const queue: [string, number][] = [[nodeId, 0]];
    
    visited.add(nodeId);
    distances.set(nodeId, 0);
    
    while (queue.length > 0) {
        const [current, dist] = queue.shift()!;
        
        if (dist >= hops) continue;
        
        const neighbors = adj.get(current) || new Set();
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                distances.set(neighbor, dist + 1);
                queue.push([neighbor, dist + 1]);
            }
        }
    }
    
    const nodeIds = Array.from(visited);
    const nodes = graph.nodes.filter(n => nodeIds.includes(n.id));
    const edges = graph.edges.filter(e => 
        nodeIds.includes(e.source) && nodeIds.includes(e.target)
    );
    
    return { nodes, edges };
}

/**
 * Calculate graph statistics
 */
export function graphStats(graph: Graph): {
    nodeCount: number;
    edgeCount: number;
    density: number;
    avgDegree: number;
    componentCount: number;
    largestComponent: number;
} {
    const n = graph.nodes.length;
    const e = graph.edges.length;
    const maxEdges = (n * (n - 1)) / 2;
    const components = connectedComponents(graph);
    
    const adj = buildAdjacencyList(graph);
    let totalDegree = 0;
    for (const neighbors of adj.values()) {
        totalDegree += neighbors.size;
    }
    
    return {
        nodeCount: n,
        edgeCount: e,
        density: maxEdges > 0 ? e / maxEdges : 0,
        avgDegree: n > 0 ? totalDegree / n : 0,
        componentCount: components.length,
        largestComponent: components[0]?.length || 0
    };
}

// ============================================================================
// 🔮 LINK PREDICTION ALGORITHMS
// "Graph First" Strategy - Sprint 24
// ============================================================================

export interface PredictedLink {
    source: string;
    target: string;
    score: number;
    algorithm: 'adamic-adar' | 'jaccard' | 'common-neighbors' | 'preferential-attachment';
    commonNeighbors?: string[];
    sourceNode?: GraphNode;
    targetNode?: GraphNode;
}

/**
 * Get common neighbors between two nodes
 * Reuses buildAdjacencyList() from existing code
 */
function getCommonNeighbors(adj: Map<string, Set<string>>, nodeA: string, nodeB: string): string[] {
    const neighborsA = adj.get(nodeA) || new Set();
    const neighborsB = adj.get(nodeB) || new Set();
    return Array.from(neighborsA).filter(n => neighborsB.has(n));
}

/**
 * Common Neighbors Score
 * Simple count of shared neighbors
 * Higher = more likely connected
 */
export function commonNeighborsScore(graph: Graph, nodeA: string, nodeB: string): number {
    const adj = buildAdjacencyList(graph);
    return getCommonNeighbors(adj, nodeA, nodeB).length;
}

/**
 * Jaccard Coefficient
 * |N(A) ∩ N(B)| / |N(A) ∪ N(B)|
 * Similarity between neighborhoods
 */
export function jaccardCoefficient(graph: Graph, nodeA: string, nodeB: string): number {
    const adj = buildAdjacencyList(graph);
    const neighborsA = adj.get(nodeA) || new Set();
    const neighborsB = adj.get(nodeB) || new Set();
    
    const intersection = getCommonNeighbors(adj, nodeA, nodeB).length;
    const union = new Set([...neighborsA, ...neighborsB]).size;
    
    return union > 0 ? intersection / union : 0;
}

/**
 * Adamic-Adar Index
 * Σ 1/log(|N(z)|) for z in common neighbors
 * Friends with few connections are more significant
 */
export function adamicAdarIndex(graph: Graph, nodeA: string, nodeB: string): number {
    const adj = buildAdjacencyList(graph);
    const commonNeighbors = getCommonNeighbors(adj, nodeA, nodeB);
    
    let score = 0;
    for (const neighbor of commonNeighbors) {
        const neighborDegree = adj.get(neighbor)?.size || 0;
        if (neighborDegree > 1) {
            score += 1 / Math.log(neighborDegree);
        }
    }
    
    return score;
}

/**
 * Preferential Attachment
 * |N(A)| * |N(B)|
 * Popular nodes attract more connections
 */
export function preferentialAttachment(graph: Graph, nodeA: string, nodeB: string): number {
    const adj = buildAdjacencyList(graph);
    const degreeA = adj.get(nodeA)?.size || 0;
    const degreeB = adj.get(nodeB)?.size || 0;
    
    return degreeA * degreeB;
}

/**
 * Predict links for a specific node
 * Uses all algorithms and returns combined scores
 */
export function predictLinksForNode(
    graph: Graph, 
    nodeId: string, 
    topN: number = 10
): PredictedLink[] {
    const adj = buildAdjacencyList(graph);
    const existingNeighbors = adj.get(nodeId) || new Set();
    const predictions: Map<string, PredictedLink> = new Map();
    
    // Get 2-hop neighbors (friends of friends) - reuses neighborhood()
    const { nodes: nearbyNodes } = neighborhood(graph, nodeId, 2);
    
    for (const candidate of nearbyNodes) {
        // Skip self and existing connections
        if (candidate.id === nodeId || existingNeighbors.has(candidate.id)) continue;
        
        const commonNeighbors = getCommonNeighbors(adj, nodeId, candidate.id);
        
        // Calculate all scores
        const cn = commonNeighbors.length;
        const jc = jaccardCoefficient(graph, nodeId, candidate.id);
        const aa = adamicAdarIndex(graph, nodeId, candidate.id);
        const pa = preferentialAttachment(graph, nodeId, candidate.id);
        
        // Normalize and combine scores (weighted average)
        // Adamic-Adar tends to perform best in social networks
        const combinedScore = (aa * 0.4) + (jc * 0.3) + (cn * 0.2 / Math.max(cn, 1)) + (pa * 0.1 / Math.max(pa, 1));
        
        if (combinedScore > 0) {
            predictions.set(candidate.id, {
                source: nodeId,
                target: candidate.id,
                score: Math.min(combinedScore * 100, 100), // Normalize to 0-100
                algorithm: 'adamic-adar', // Primary algorithm
                commonNeighbors,
                sourceNode: graph.nodes.find(n => n.id === nodeId),
                targetNode: candidate,
            });
        }
    }
    
    // Sort by score and return top N
    return Array.from(predictions.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, topN);
}

/**
 * Predict all potential links in the graph
 * Returns top N predictions globally
 */
export function predictAllLinks(graph: Graph, topN: number = 20): PredictedLink[] {
    const allPredictions: PredictedLink[] = [];
    const seen = new Set<string>();
    
    for (const node of graph.nodes) {
        const predictions = predictLinksForNode(graph, node.id, 5);
        
        for (const pred of predictions) {
            // Avoid duplicates (A->B and B->A)
            const key = [pred.source, pred.target].sort().join('-');
            if (!seen.has(key)) {
                seen.add(key);
                allPredictions.push(pred);
            }
        }
    }
    
    return allPredictions
        .sort((a, b) => b.score - a.score)
        .slice(0, topN);
}

/**
 * Get "Você pode conhecer" suggestions for an entity
 * LinkedIn-style recommendations
 */
export function suggestConnections(
    graph: Graph, 
    nodeId: string, 
    limit: number = 5
): Array<{
    entity: GraphNode;
    score: number;
    reason: string;
    mutualConnections: string[];
}> {
    const predictions = predictLinksForNode(graph, nodeId, limit);
    
    return predictions.map(pred => {
        const mutualCount = pred.commonNeighbors?.length || 0;
        let reason = '';
        
        if (mutualCount >= 3) {
            reason = `${mutualCount} conexões em comum`;
        } else if (mutualCount === 2) {
            reason = '2 conexões em comum';
        } else if (mutualCount === 1) {
            reason = '1 conexão em comum';
        } else {
            reason = 'Padrão de conexões similar';
        }
        
        return {
            entity: pred.targetNode!,
            score: pred.score,
            reason,
            mutualConnections: pred.commonNeighbors || [],
        };
    }).filter(s => s.entity);
}
