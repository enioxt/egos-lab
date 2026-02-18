import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * API Route: /api/entity/[id]/indirect
 * 
 * Retorna conexões de 2º grau (conexões das conexões diretas)
 * Conceito "Mycelium" - a teia que se expande
 */

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface IndirectConnection {
    id: string;
    name: string;
    type: string;
    via: {
        id: string;
        name: string;
        type: string;
        relationship: string;
    };
    relationship: string;
    depth: number;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: entityId } = await params;

        if (!entityId) {
            return NextResponse.json({ error: 'Entity ID required' }, { status: 400 });
        }

        console.log('[IndirectAPI] Fetching 2nd degree connections for:', entityId);

        // 1. Get direct connections (1st degree)
        const { data: directRels } = await supabase
            .from('intelink_relationships')
            .select('id, type, source_id, target_id')
            .or(`source_id.eq.${entityId},target_id.eq.${entityId}`);

        if (!directRels || directRels.length === 0) {
            return NextResponse.json({
                entity_id: entityId,
                indirect_connections: [],
                direct_count: 0,
                indirect_count: 0
            });
        }

        // Get direct entity IDs
        const directIds = new Set<string>();
        directRels.forEach(rel => {
            if (rel.source_id !== entityId) directIds.add(rel.source_id);
            if (rel.target_id !== entityId) directIds.add(rel.target_id);
        });

        // 2. Get info about direct connections
        const { data: directEntities } = await supabase
            .from('intelink_entities')
            .select('id, name, type')
            .in('id', Array.from(directIds));

        const directEntityMap = new Map(directEntities?.map(e => [e.id, e]) || []);

        // Build map of direct relationship types
        const directRelMap = new Map<string, string>();
        directRels.forEach(rel => {
            const otherId = rel.source_id === entityId ? rel.target_id : rel.source_id;
            directRelMap.set(otherId, rel.type);
        });

        // 3. Get 2nd degree connections (connections of direct connections)
        const { data: indirectRels } = await supabase
            .from('intelink_relationships')
            .select('id, type, source_id, target_id')
            .or(
                Array.from(directIds)
                    .map(id => `source_id.eq.${id},target_id.eq.${id}`)
                    .join(',')
            );

        if (!indirectRels || indirectRels.length === 0) {
            return NextResponse.json({
                entity_id: entityId,
                indirect_connections: [],
                direct_count: directIds.size,
                indirect_count: 0
            });
        }

        // Get 2nd degree entity IDs (excluding original entity and direct connections)
        const indirectIds = new Set<string>();
        const indirectConnectionsRaw: Array<{
            entityId: string;
            viaId: string;
            relationship: string;
        }> = [];

        indirectRels.forEach(rel => {
            const sourceIsDirect = directIds.has(rel.source_id);
            const targetIsDirect = directIds.has(rel.target_id);

            // One end must be a direct connection, other end is indirect
            if (sourceIsDirect && !targetIsDirect && rel.target_id !== entityId) {
                indirectIds.add(rel.target_id);
                indirectConnectionsRaw.push({
                    entityId: rel.target_id,
                    viaId: rel.source_id,
                    relationship: rel.type
                });
            }
            if (targetIsDirect && !sourceIsDirect && rel.source_id !== entityId) {
                indirectIds.add(rel.source_id);
                indirectConnectionsRaw.push({
                    entityId: rel.source_id,
                    viaId: rel.target_id,
                    relationship: rel.type
                });
            }
        });

        // 4. Get info about indirect entities
        const { data: indirectEntities } = await supabase
            .from('intelink_entities')
            .select('id, name, type')
            .in('id', Array.from(indirectIds));

        const indirectEntityMap = new Map(indirectEntities?.map(e => [e.id, e]) || []);

        // 5. Build result
        const indirectConnections: IndirectConnection[] = [];
        const seen = new Set<string>();

        indirectConnectionsRaw.forEach(conn => {
            // Avoid duplicates (same entity via different paths)
            if (seen.has(conn.entityId)) return;
            seen.add(conn.entityId);

            const entity = indirectEntityMap.get(conn.entityId);
            const viaEntity = directEntityMap.get(conn.viaId);

            if (entity && viaEntity) {
                indirectConnections.push({
                    id: entity.id,
                    name: entity.name,
                    type: entity.type,
                    via: {
                        id: viaEntity.id,
                        name: viaEntity.name,
                        type: viaEntity.type,
                        relationship: directRelMap.get(viaEntity.id) || 'CONNECTED'
                    },
                    relationship: conn.relationship,
                    depth: 2
                });
            }
        });

        // Sort by type then name
        indirectConnections.sort((a, b) => {
            if (a.type !== b.type) return a.type.localeCompare(b.type);
            return a.name.localeCompare(b.name);
        });

        console.log('[IndirectAPI] Found:', {
            direct: directIds.size,
            indirect: indirectConnections.length
        });

        return NextResponse.json({
            entity_id: entityId,
            indirect_connections: indirectConnections,
            direct_count: directIds.size,
            indirect_count: indirectConnections.length
        });

    } catch (error) {
        console.error('[IndirectAPI] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch indirect connections' }, { status: 500 });
    }
}
