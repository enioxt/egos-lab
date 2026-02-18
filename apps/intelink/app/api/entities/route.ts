/**
 * API: /api/entities
 * 
 * GET - List all entities with investigation details
 * Bypasses RLS using admin client for the Central Entidades page.
 * 
 * Query params:
 * - type?: string - Filter by entity type (PERSON, VEHICLE, etc.)
 * - investigation_id?: string - Filter by investigation
 * - search?: string - Search by name
 * - limit?: number - Max results (default 200)
 * 
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, successResponse, errorResponse } from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';

async function handleGet(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(req.url);
        
        const type = searchParams.get('type');
        const investigationId = searchParams.get('investigation_id');
        const search = searchParams.get('search');
        const limit = parseInt(searchParams.get('limit') || '200');
        
        // Build query with admin client (bypasses RLS)
        let query = supabase
            .from('intelink_entities')
            .select(`
                id, type, name, metadata, created_at, investigation_id,
                intelink_investigations!inner(id, title)
            `)
            .order('created_at', { ascending: false })
            .limit(limit);
        
        // Apply filters
        if (type && type !== 'all') {
            query = query.eq('type', type);
        }
        
        if (investigationId) {
            query = query.eq('investigation_id', investigationId);
        }
        
        if (search && search.trim()) {
            query = query.ilike('name', `%${search.trim()}%`);
        }
        
        const { data: entities, error } = await query;
        
        if (error) {
            console.error('[Entities API] Query error:', error);
            return errorResponse('Erro ao buscar entidades', 500);
        }
        
        // Format response
        const formattedEntities = (entities || []).map((e: any) => ({
            id: e.id,
            type: e.type,
            name: e.name,
            metadata: e.metadata || {},
            created_at: e.created_at,
            investigation_id: e.investigation_id,
            investigation: {
                id: e.intelink_investigations?.id,
                title: e.intelink_investigations?.title
            }
        }));
        
        // Count by type for stats
        const typeCounts: Record<string, number> = {};
        formattedEntities.forEach(e => {
            typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
        });
        
        return successResponse({
            entities: formattedEntities,
            total: formattedEntities.length,
            typeCounts
        });
        
    } catch (err: any) {
        console.error('[Entities API] Error:', err);
        return errorResponse(err.message || 'Erro interno', 500);
    }
}

export const GET = withSecurity(handleGet, { allowPublic: false });
