import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, successResponse, errorResponse } from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';

const TYPE_LABELS: Record<string, string> = {
    'PERSON': 'Pessoa',
    'VEHICLE': 'Veículo',
    'LOCATION': 'Local',
    'ORGANIZATION': 'Organização',
    'PHONE': 'Telefone',
    'DOCUMENT': 'Documento',
    'OTHER': 'Outro',
    'active': 'Ativo',
    'archived': 'Arquivado',
    'finished': 'Finalizado'
};

async function handleGet(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        
        // Fetch all data in parallel
        const [entitiesRes, investigationsRes, relationshipsRes, evidenceRes, unitsRes] = await Promise.all([
            supabase.from('intelink_entities').select('type'),
            supabase.from('intelink_investigations').select('status, created_at, unit_id').is('deleted_at', null),
            supabase.from('intelink_relationships').select('type'),
            supabase.from('intelink_evidence').select('type'),
            supabase.from('intelink_police_units').select('id, code, name')
        ]);

        const entities = entitiesRes.data || [];
        const investigations = investigationsRes.data || [];
        const relationships = relationshipsRes.data || [];
        const evidence = evidenceRes.data || [];
        const units = unitsRes.data || [];

        // Process Entity Types
        const entityTypes = entities.reduce((acc: Record<string, number>, curr: any) => {
            const label = TYPE_LABELS[curr.type] || curr.type;
            acc[label] = (acc[label] || 0) + 1;
            return acc;
        }, {});
        const entityData = Object.entries(entityTypes).map(([name, value]) => ({ name, value }));

        // Process Investigation Status
        const invStatus = investigations.reduce((acc: Record<string, number>, curr: any) => {
            const label = TYPE_LABELS[curr.status] || curr.status;
            acc[label] = (acc[label] || 0) + 1;
            return acc;
        }, {});
        const statusData = Object.entries(invStatus).map(([name, value]) => ({ name, value }));

        // Process Cases by Unit
        const unitMap = new Map(units.map((u: any) => [u.id, u.code]));
        const casesByUnit = investigations.reduce((acc: Record<string, number>, curr: any) => {
            const unitCode = unitMap.get(curr.unit_id) || 'Sem Unidade';
            acc[unitCode] = (acc[unitCode] || 0) + 1;
            return acc;
        }, {});
        const unitData = Object.entries(casesByUnit).map(([name, value]) => ({ name, value }));

        // Process Relationship Types
        const relTypes = relationships.reduce((acc: Record<string, number>, curr: any) => {
            const label = curr.type || 'Outro';
            acc[label] = (acc[label] || 0) + 1;
            return acc;
        }, {});
        const relationshipData = Object.entries(relTypes)
            .sort((a, b) => (b[1] as number) - (a[1] as number))
            .slice(0, 5)
            .map(([name, value]) => ({ name, value }));

        return successResponse({
            entityData,
            statusData,
            unitData,
            relationshipData,
            totals: {
                entities: entities.length,
                investigations: investigations.length,
                relationships: relationships.length,
                evidence: evidence.length,
                units: units.length
            }
        });

    } catch (e: any) {
        console.error('[Analytics API] Error:', e);
        return errorResponse(e.message || 'Erro ao buscar analytics');
    }
}

// Protected: Only member+ can view analytics
export const GET = withSecurity(handleGet, { requiredRole: 'member' });
