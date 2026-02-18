/**
 * Entity Resolution API
 * POST /api/entity-resolution
 * 
 * Finds similar/duplicate entities across investigations.
 * 
 * Body:
 * - investigation_ids?: string[] - Filter by investigations (default: all)
 * - types?: EntityType[] - Filter by entity types
 * - minScore?: number - Minimum similarity score (0-1, default: 0.7)
 * - sameInvestigation?: boolean - Include same-investigation matches
 * 
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, successResponse, errorResponse, validationError } from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';
import { findMatches, Entity, generateOptimalQuestions } from '@/lib/entity-resolution/matcher';

async function handlePost(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const body = await req.json();
        
        const {
            investigation_ids,
            types,
            minScore = 0.7,
            sameInvestigation = false,
            limit = 100,
        } = body;
        
        // Validate minScore
        if (minScore < 0 || minScore > 1) {
            return validationError('minScore deve estar entre 0 e 1');
        }
        
        // Build query
        let query = supabase
            .from('intelink_entities')
            .select(`
                id, name, type, metadata, investigation_id,
                intelink_investigations!inner(id, title)
            `)
            .order('created_at', { ascending: false })
            .limit(500); // Safety limit
        
        // Filter by investigations
        if (investigation_ids && investigation_ids.length > 0) {
            query = query.in('investigation_id', investigation_ids);
        }
        
        // Filter by types
        if (types && types.length > 0) {
            query = query.in('type', types);
        }
        
        const { data: entities, error } = await query;
        
        if (error) {
            console.error('[Entity Resolution] Query error:', error);
            return errorResponse('Erro ao buscar entidades', 500);
        }
        
        if (!entities || entities.length === 0) {
            return successResponse({
                candidates: [],
                stats: {
                    totalEntities: 0,
                    totalMatches: 0,
                    highConfidence: 0,
                    mediumConfidence: 0,
                    lowConfidence: 0,
                },
            });
        }
        
        // Transform to Entity format
        const formattedEntities: Entity[] = entities.map((e: any) => ({
            id: e.id,
            name: e.name,
            type: e.type,
            investigation_id: e.investigation_id,
            investigation_title: e.intelink_investigations?.title,
            metadata: e.metadata,
        }));
        
        // Find matches
        const result = findMatches(formattedEntities, {
            sameInvestigation,
            minScore,
            types,
        });
        
        // Limit results
        const limitedCandidates = result.candidates.slice(0, limit);
        
        // Add optimal questions to each candidate
        const enrichedCandidates = limitedCandidates.map(candidate => ({
            ...candidate,
            optimalQuestions: generateOptimalQuestions(candidate),
        }));
        
        return successResponse({
            candidates: enrichedCandidates,
            stats: result.stats,
        });
        
    } catch (e: any) {
        console.error('[Entity Resolution] Error:', e);
        return errorResponse(e.message || 'Erro interno', 500);
    }
}

// GET: Quick check for a single entity
async function handleGet(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(req.url);
        
        const entityId = searchParams.get('entity_id');
        const name = searchParams.get('name');
        const type = searchParams.get('type');
        
        if (!entityId && !name) {
            return validationError('Forneça entity_id ou name');
        }
        
        // Get the source entity
        let sourceEntity: Entity | null = null;
        
        if (entityId) {
            const { data } = await supabase
                .from('intelink_entities')
                .select('id, name, type, metadata, investigation_id')
                .eq('id', entityId)
                .single();
            
            if (data) {
                sourceEntity = {
                    id: data.id,
                    name: data.name,
                    type: data.type,
                    investigation_id: data.investigation_id,
                    metadata: data.metadata,
                };
            }
        } else if (name && type) {
            sourceEntity = {
                id: 'temp',
                name,
                type: type as Entity['type'],
                investigation_id: '',
            };
        }
        
        if (!sourceEntity) {
            return validationError('Entidade não encontrada');
        }
        
        // Find candidates
        const { data: candidates } = await supabase
            .from('intelink_entities')
            .select(`
                id, name, type, metadata, investigation_id,
                intelink_investigations!inner(id, title)
            `)
            .eq('type', sourceEntity.type)
            .neq('id', sourceEntity.id)
            .limit(200);
        
        if (!candidates || candidates.length === 0) {
            return successResponse({ matches: [], entity: sourceEntity });
        }
        
        const formattedCandidates: Entity[] = candidates.map((e: any) => ({
            id: e.id,
            name: e.name,
            type: e.type,
            investigation_id: e.investigation_id,
            investigation_title: e.intelink_investigations?.title,
            metadata: e.metadata,
        }));
        
        // Import and use findMatchesForEntity
        const { findMatchesForEntity } = await import('@/lib/entity-resolution/matcher');
        const matches = findMatchesForEntity(sourceEntity, formattedCandidates);
        
        return successResponse({
            entity: sourceEntity,
            matches: matches.slice(0, 20),
            totalCandidates: candidates.length,
        });
        
    } catch (e: any) {
        console.error('[Entity Resolution GET] Error:', e);
        return errorResponse(e.message || 'Erro interno', 500);
    }
}

// Protected: Only members can use entity resolution
export const POST = withSecurity(handlePost, { requiredRole: 'member' });
export const GET = withSecurity(handleGet, { requiredRole: 'member' });
