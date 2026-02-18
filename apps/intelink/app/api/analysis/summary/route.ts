/**
 * Executive Summary API
 * 
 * POST /api/analysis/summary
 * - Generate executive summary for an investigation
 * 
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/api-utils';
import { 
    generateExecutiveSummary, 
    formatExecutiveSummary,
    InvestigationData 
} from '@/lib/analysis/executive-summary';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { 
            investigationId,
            audience = 'delegado',
            format = 'json'
        } = body;

        if (!investigationId) {
            return NextResponse.json(
                { error: 'Campo "investigationId" é obrigatório' },
                { status: 400 }
            );
        }

        const supabase = getSupabaseAdmin();

        // Fetch investigation data
        const { data: investigation, error: invError } = await supabase
            .from('intelink_investigations')
            .select('*')
            .eq('id', investigationId)
            .single();

        if (invError || !investigation) {
            return NextResponse.json(
                { error: 'Investigação não encontrada' },
                { status: 404 }
            );
        }

        // Fetch entities
        const { data: entities } = await supabase
            .from('intelink_entities')
            .select('type, name, metadata')
            .eq('investigation_id', investigationId);

        // Fetch relationships
        const { data: relationships } = await supabase
            .from('intelink_relationships')
            .select('source_entity_id, target_entity_id, relationship_type')
            .eq('investigation_id', investigationId);

        // Count documents
        const { count: docsCount } = await supabase
            .from('intelink_documents')
            .select('*', { count: 'exact', head: true })
            .eq('investigation_id', investigationId);

        // Count findings
        const { count: findingsCount } = await supabase
            .from('intelink_investigator_findings')
            .select('*', { count: 'exact', head: true })
            .eq('investigation_id', investigationId);

        // Build investigation data
        const invData: InvestigationData = {
            id: investigation.id,
            title: investigation.title || 'Investigação sem título',
            reds_number: investigation.reds_number,
            created_at: investigation.created_at,
            updated_at: investigation.updated_at,
            status: investigation.status || 'EM_ANDAMENTO',
            crime_type: investigation.crime_type || investigation.metadata?.crime_type,
            entities: (entities || []).map(e => ({
                type: e.type,
                name: e.name,
                role: e.metadata?.role || e.metadata?.tipo_envolvimento
            })),
            relationships: (relationships || []).map(r => ({
                from: r.source_entity_id,
                to: r.target_entity_id,
                type: r.relationship_type
            })),
            documents_count: docsCount || 0,
            findings_count: findingsCount || 0,
            rho_score: investigation.rho_score
        };

        // Generate summary
        const summary = generateExecutiveSummary(invData, audience);

        console.log(`[Summary API] Generated for ${investigationId}, audience: ${audience}`);

        if (format === 'text') {
            return NextResponse.json({
                success: true,
                formatted: formatExecutiveSummary(summary)
            });
        }

        return NextResponse.json({
            success: true,
            summary
        });

    } catch (error: any) {
        console.error('[Summary API] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao gerar resumo' },
            { status: 500 }
        );
    }
}
