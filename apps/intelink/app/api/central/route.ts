import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, errorResponse } from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';

async function handleGet(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        
        // Load all police units (excluding non-units like "Estágio")
        const { data: rawUnits, error: unitsError } = await supabase
            .from('intelink_police_units')
            .select('*')
            .order('code');

        if (unitsError) {
            console.error('[Central API] Units error:', unitsError);
            return NextResponse.json({ error: unitsError.message }, { status: 500 });
        }

        // Filter out non-units (Estágio is a role/function, not a unit)
        const EXCLUDED_CODES = ['ESTAGIO', 'ESTÁGIO', 'ESTAGIARIO', 'ESTAGIÁRIO'];
        const units = (rawUnits || []).filter(u => 
            !EXCLUDED_CODES.some(code => 
                u.code?.toUpperCase().includes(code) || 
                u.name?.toUpperCase().includes(code)
            )
        );

        // Load all investigations
        const { data: investigations } = await supabase
            .from('intelink_investigations')
            .select('*')
            .order('created_at', { ascending: false });

        // Load all members
        const { data: members } = await supabase
            .from('intelink_unit_members')
            .select('*')
            .order('is_chief', { ascending: false });

        // Load entity and relationship counts per investigation
        const { data: entities } = await supabase
            .from('intelink_entities')
            .select('id, investigation_id');

        const { data: relationships } = await supabase
            .from('intelink_relationships')
            .select('id, investigation_id');

        // Group members by unit
        const membersByUnit: Record<string, any[]> = {};
        (members || []).forEach(m => {
            if (!membersByUnit[m.unit_id]) membersByUnit[m.unit_id] = [];
            membersByUnit[m.unit_id].push(m);
        });

        // Group investigations by unit
        const investigationsByUnit: Record<string, any[]> = {};
        (investigations || []).forEach(inv => {
            if (!investigationsByUnit[inv.unit_id]) investigationsByUnit[inv.unit_id] = [];
            investigationsByUnit[inv.unit_id].push(inv);
        });

        // Count entities/relationships per investigation
        const entityCountByInv: Record<string, number> = {};
        const relCountByInv: Record<string, number> = {};
        
        (entities || []).forEach(e => {
            entityCountByInv[e.investigation_id] = (entityCountByInv[e.investigation_id] || 0) + 1;
        });
        (relationships || []).forEach(r => {
            relCountByInv[r.investigation_id] = (relCountByInv[r.investigation_id] || 0) + 1;
        });

        // Calculate stats per unit
        const statsByUnit: Record<string, { investigations: number; entities: number; relationships: number }> = {};
        
        (units || []).forEach(unit => {
            const unitInvs = investigationsByUnit[unit.id] || [];
            let entityCount = 0;
            let relCount = 0;
            
            unitInvs.forEach(inv => {
                entityCount += entityCountByInv[inv.id] || 0;
                relCount += relCountByInv[inv.id] || 0;
            });
            
            statsByUnit[unit.id] = {
                investigations: unitInvs.length,
                entities: entityCount,
                relationships: relCount
            };
        });

        // Calculate totals
        const totals = {
            units: (units || []).length,
            investigations: (investigations || []).length,
            entities: (entities || []).length,
            relationships: (relationships || []).length,
            members: (members || []).length
        };

        // Sort units by: investigations (desc), entities (desc), relationships (desc)
        const sortedUnits = [...units].sort((a, b) => {
            const statsA = statsByUnit[a.id] || { investigations: 0, entities: 0, relationships: 0 };
            const statsB = statsByUnit[b.id] || { investigations: 0, entities: 0, relationships: 0 };
            
            // First by investigations
            if (statsB.investigations !== statsA.investigations) {
                return statsB.investigations - statsA.investigations;
            }
            // Then by entities
            if (statsB.entities !== statsA.entities) {
                return statsB.entities - statsA.entities;
            }
            // Then by relationships
            return statsB.relationships - statsA.relationships;
        });

        return NextResponse.json({
            units: sortedUnits,
            membersByUnit,
            investigationsByUnit,
            statsByUnit,
            totals
        });

    } catch (e) {
        console.error('[Central API] Error:', e);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// Public during testing phase - all authenticated users can access
export const GET = withSecurity(handleGet, { allowPublic: true });
