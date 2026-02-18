/**
 * Link Prediction API
 * 
 * GET /api/investigation/[id]/predictions
 * 
 * Returns predicted links for an investigation based on graph analysis.
 * Uses Adamic-Adar, Jaccard, Common Neighbors, Preferential Attachment.
 * 
 * Integrates with:
 * - graph-algorithms.ts (predictLinksForNode, predictAllLinks, suggestConnections)
 * - cross-reference-service.ts (for entity matching confidence)
 * - entity-cache.ts (L1 cache)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, successResponse, errorResponse } from '@/lib/api-utils';
import { withSecurity, SecureContext } from '@/lib/security/middleware';
import { 
    predictLinksForNode, 
    predictAllLinks, 
    suggestConnections,
    Graph,
    PredictedLink
} from '@/lib/intelink/graph-algorithms';

interface Entity {
    id: string;
    name: string;
    type: string;
    metadata?: Record<string, unknown>;
}

interface Relationship {
    id: string;
    source_id: string;
    target_id: string;
    type: string;
    metadata?: Record<string, unknown>;
}

async function handleGet(
    req: NextRequest,
    context: SecureContext
): Promise<NextResponse> {
    // Extract ID from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 2]; // /api/investigation/[id]/predictions
    const { searchParams } = url;
    
    const entityId = searchParams.get('entityId'); // Optional: predictions for specific entity
    const limit = parseInt(searchParams.get('limit') || '10');
    
    try {
        const supabase = getSupabaseAdmin();
        
        // Fetch entities for this investigation
        const { data: entities, error: entitiesError } = await supabase
            .from('intelink_entities')
            .select('id, name, type, metadata')
            .eq('investigation_id', id);
        
        if (entitiesError) throw entitiesError;
        
        // Fetch relationships for this investigation
        const { data: relationships, error: relsError } = await supabase
            .from('intelink_relationships')
            .select('id, source_id, target_id, type')
            .eq('investigation_id', id);
        
        if (relsError) throw relsError;
        
        // Build graph structure (reusing existing types)
        const graph: Graph = {
            nodes: (entities || []).map(e => ({
                id: e.id,
                name: e.name,
                type: e.type,
                metadata: e.metadata,
            })),
            edges: (relationships || []).map(r => ({
                source: r.source_id,
                target: r.target_id,
                type: r.type,
                weight: 1,
            })),
        };
        
        let predictions: PredictedLink[];
        let suggestions: ReturnType<typeof suggestConnections> | null = null;
        
        if (entityId) {
            // Predictions for a specific entity
            predictions = predictLinksForNode(graph, entityId, limit);
            suggestions = suggestConnections(graph, entityId, limit);
        } else {
            // Predictions for entire investigation
            predictions = predictAllLinks(graph, limit);
        }
        
        // Enrich predictions with entity details
        const enrichedPredictions = predictions.map(pred => ({
            ...pred,
            sourceEntity: entities?.find(e => e.id === pred.source),
            targetEntity: entities?.find(e => e.id === pred.target),
            commonNeighborDetails: pred.commonNeighbors?.map(id => 
                entities?.find(e => e.id === id)
            ).filter(Boolean),
        }));
        
        return NextResponse.json({
            success: true,
            investigationId: id,
            entityId: entityId || null,
            predictions: enrichedPredictions,
            suggestions: suggestions || [],
            meta: {
                totalEntities: entities?.length || 0,
                totalRelationships: relationships?.length || 0,
                algorithm: 'adamic-adar + jaccard + common-neighbors + preferential-attachment',
            },
        });
        
    } catch (error) {
        console.error('[Predictions API] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to generate predictions' },
            { status: 500 }
        );
    }
}

export const GET = withSecurity(handleGet, {
    auth: false, // Widget panel - auth handled by page
    rateLimit: 'default',
});
