import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, errorResponse, successResponse } from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';

async function handleGet(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(req.url);
        const filterUnit = searchParams.get('unit') || 'all';

        // Load units
        const { data: units } = await supabase
            .from('intelink_police_units')
            .select('id, code, name')
            .order('code');

        // Load investigations
        let invQuery = supabase
            .from('intelink_investigations')
            .select('id, title, unit_id');
        
        if (filterUnit !== 'all') {
            invQuery = invQuery.eq('unit_id', filterUnit);
        }

        const { data: investigations } = await invQuery;
        const invIds = investigations?.map(i => i.id) || [];

        if (invIds.length === 0) {
            return NextResponse.json({
                units: units || [],
                nodes: [],
                links: [],
                stats: { entities: 0, relationships: 0, investigations: 0 }
            });
        }

        // Load entities - exclude PHONE (phones are metadata, not entities)
        const { data: entities } = await supabase
            .from('intelink_entities')
            .select('id, name, type, investigation_id, metadata')
            .in('investigation_id', invIds)
            .not('type', 'eq', 'PHONE');

        // Load relationships
        const { data: relationships } = await supabase
            .from('intelink_relationships')
            .select('source_id, target_id, type, description, investigation_id')
            .in('investigation_id', invIds);

        // Build node colors based on type (no PHONE - phones are metadata)
        const TYPE_COLORS: Record<string, string> = {
            'PERSON': '#3b82f6',
            'VEHICLE': '#ec4899',
            'LOCATION': '#10b981',
            'ORGANIZATION': '#f59e0b',
            'FIREARM': '#ef4444',
            'WEAPON': '#ef4444',
            'DOCUMENT': '#8b5cf6',
            'default': '#94a3b8'
        };

        const unitMap = new Map((units || []).map(u => [u.id, u]));
        const invMap = new Map((investigations || []).map(i => [i.id, i]));

        const nodes = (entities || []).map(e => {
            const inv = invMap.get(e.investigation_id);
            const unit = inv?.unit_id ? unitMap.get(inv.unit_id) : null;
            return {
                id: e.id,
                name: e.name,
                type: e.type,
                metadata: e.metadata,
                investigation_id: e.investigation_id,
                investigation_title: inv?.title,
                unit_id: unit?.id,
                unit_code: unit?.code,
                color: TYPE_COLORS[e.type] || TYPE_COLORS.default,
                val: e.type === 'PERSON' ? 12 : 8
            };
        });

        const entityIds = new Set(nodes.map(n => n.id));
        const links = (relationships || [])
            .filter(r => entityIds.has(r.source_id) && entityIds.has(r.target_id))
            .map(r => ({
                source: r.source_id,
                target: r.target_id,
                type: r.type,
                description: r.description || ''
            }));

        return NextResponse.json({
            units: units || [],
            nodes,
            links,
            stats: {
                entities: nodes.length,
                relationships: links.length,
                investigations: investigations?.length || 0
            }
        });

    } catch (e) {
        console.error('[Central Graph API] Error:', e);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// Protected: Only member+ can access central graph
export const GET = withSecurity(handleGet, { requiredRole: 'member' });
