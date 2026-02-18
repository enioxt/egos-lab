import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, notFoundError, successResponse, errorResponse } from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';

async function handleGet(
    req: NextRequest, 
    auth: AuthContext
): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        // Extract ID from URL
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        const id = pathParts[pathParts.length - 2]; // /api/entity/[id]/related
        
        console.log('[Entity Related API] Request for entity:', id);

        // TENANT ISOLATION: Verify access to entity
        const { guardEntity } = await import('@/lib/tenant-guard');
        const accessDenied = await guardEntity(auth, id);
        if (accessDenied) {
            console.log('[Entity Related API] Access denied for entity:', id);
            return accessDenied;
        }

        // Get entity details
        const { data: entity, error: entityError } = await supabase
            .from('intelink_entities')
            .select('*')
            .eq('id', id)
            .single();
        
        if (entityError) {
            console.log('[Entity Related API] Entity fetch error:', entityError);
        }

        if (!entity) {
            return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
        }

        // Get relationships where this entity is source or target (simple query)
        const { data: relationships, error: relError } = await supabase
            .from('intelink_relationships')
            .select('id, type, description, source_id, target_id')
            .or(`source_id.eq.${id},target_id.eq.${id}`);
        
        console.log('[Entity Related API] Found relationships:', relationships?.length || 0, relError ? `Error: ${relError.message}` : '');

        // Collect related entity IDs
        const relatedIds = new Set<string>();
        relationships?.forEach(r => {
            if (r.source_id !== id) relatedIds.add(r.source_id);
            if (r.target_id !== id) relatedIds.add(r.target_id);
        });

        // Batch fetch related entities
        let entityMap = new Map<string, any>();
        if (relatedIds.size > 0) {
            const { data: relatedEntities } = await supabase
                .from('intelink_entities')
                .select('*')
                .in('id', Array.from(relatedIds));
            entityMap = new Map(relatedEntities?.map(e => [e.id, e]) || []);
        }

        const relatedPeople: any[] = [];
        const relatedLocations: any[] = [];
        const relatedVehicles: any[] = [];
        const relatedOrganizations: any[] = [];
        const relatedFirearms: any[] = [];

        relationships?.forEach(rel => {
            const otherId = rel.source_id === id ? rel.target_id : rel.source_id;
            const other = entityMap.get(otherId);
            if (!other) return;

            const enriched = {
                ...other,
                relationship_type: rel.type,
                relationship_id: rel.id,
                description: rel.description
            };

            switch (other.type) {
                case 'PERSON':
                    if (!relatedPeople.find(p => p.id === other.id)) {
                        relatedPeople.push(enriched);
                    }
                    break;
                case 'LOCATION':
                    if (!relatedLocations.find(l => l.id === other.id)) {
                        relatedLocations.push(enriched);
                    }
                    break;
                case 'VEHICLE':
                    if (!relatedVehicles.find(v => v.id === other.id)) {
                        relatedVehicles.push(enriched);
                    }
                    break;
                case 'ORGANIZATION':
                case 'COMPANY':
                    if (!relatedOrganizations.find(o => o.id === other.id)) {
                        relatedOrganizations.push(enriched);
                    }
                    break;
                case 'WEAPON':
                case 'FIREARM':
                    if (!relatedFirearms.find(f => f.id === other.id)) {
                        relatedFirearms.push(enriched);
                    }
                    break;
            }
        });

        // Find same entity in other investigations (by name match)
        // Deduplicate by investigation_id to avoid showing same investigation multiple times
        const { data: otherEntities } = await supabase
            .from('intelink_entities')
            .select('investigation_id, investigation:intelink_investigations(id, title)')
            .eq('name', entity.name)
            .neq('investigation_id', entity.investigation_id)
            .is('deleted_at', null);

        // Deduplicate by investigation ID
        const seenInvestigations = new Set<string>();
        const otherInvestigations = otherEntities
            ?.filter(e => {
                if (!e.investigation || seenInvestigations.has(e.investigation_id)) return false;
                seenInvestigations.add(e.investigation_id);
                return true;
            })
            .map(e => e.investigation)
            .filter(Boolean) || [];

        return NextResponse.json({
            entity,
            relatedPeople,
            relatedLocations,
            relatedVehicles,
            relatedOrganizations,
            relatedFirearms,
            otherInvestigations
        });

    } catch (e) {
        console.error('[Entity Related API] Error:', e);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// Protected: Only member+ can view related entities
export const GET = withSecurity(handleGet, { requiredRole: 'member' });
