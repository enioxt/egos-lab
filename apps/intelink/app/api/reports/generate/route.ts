/**
 * INTELINK Report Generation API
 * 
 * Generates professional intelligence reports in Arkham style.
 * 
 * @endpoint POST /api/reports/generate
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/api-utils';
import { withSecurity } from '@/lib/api-security';
import { generateFullReport, ReportType, ReportData } from '@/lib/reports/arkham-templates';

const supabase = getSupabaseAdmin();

interface GenerateReportRequest {
    investigationId?: string;
    investigation_id?: string; // Alias
    reportType?: ReportType;
    type?: string; // Alias
    entityId?: string;
    includeAiAnalysis?: boolean;
    include_drafts?: boolean;
}

async function handlePost(req: NextRequest): Promise<NextResponse> {
    try {
        const body: GenerateReportRequest = await req.json();
        const investigationId = body.investigationId || body.investigation_id;
        const reportType = (body.reportType || body.type || 'full_investigation') as ReportType;
        const entityId = body.entityId;
        const includeAiAnalysis = body.includeAiAnalysis || false;

        if (!investigationId) {
            return NextResponse.json(
                { error: 'investigationId é obrigatório' },
                { status: 400 }
            );
        }

        // Fetch investigation data
        const { data: investigation, error: invError } = await supabase
            .from('intelink_investigations')
            .select('id, title, description, status, created_at, rho_score, rho_status')
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
            .select('id, name, type, metadata')
            .eq('investigation_id', investigationId)
            .order('created_at', { ascending: false });

        // Fetch relationships
        const { data: relationships } = await supabase
            .from('intelink_relationships')
            .select(`
                type, description,
                source:source_entity_id(name),
                target:target_entity_id(name)
            `)
            .eq('investigation_id', investigationId);

        // Fetch Rho data
        const { data: rhoSnapshot } = await supabase
            .from('intelink_rho_snapshots')
            .select('rho_score, rho_status, top_contributor_share')
            .eq('investigation_id', investigationId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        // Get top contributor name if exists
        let topContributorName = null;
        if (rhoSnapshot) {
            const { data: topEntity } = await supabase
                .from('intelink_entities')
                .select('name')
                .eq('investigation_id', investigationId)
                .order('created_at', { ascending: true })
                .limit(1)
                .single();
            topContributorName = topEntity?.name;
        }

        // Calculate connection counts for entities
        const entityConnectionCounts: Record<string, number> = {};
        const formattedRelationships = relationships?.map(r => {
            const sourceName = (r.source as any)?.name || 'Desconhecido';
            const targetName = (r.target as any)?.name || 'Desconhecido';
            
            entityConnectionCounts[sourceName] = (entityConnectionCounts[sourceName] || 0) + 1;
            entityConnectionCounts[targetName] = (entityConnectionCounts[targetName] || 0) + 1;
            
            return {
                source: sourceName,
                target: targetName,
                type: r.type,
                description: r.description
            };
        }) || [];

        // Build report data
        const reportData: ReportData = {
            investigation: {
                id: investigation.id,
                title: investigation.title,
                description: investigation.description,
                status: investigation.status,
                created_at: investigation.created_at
            },
            entities: entities?.map(e => ({
                id: e.id,
                name: e.name,
                type: e.type,
                metadata: e.metadata,
                connectionCount: entityConnectionCounts[e.name] || 0
            })) || [],
            relationships: formattedRelationships,
            rho: rhoSnapshot ? {
                score: parseFloat(rhoSnapshot.rho_score) || 0,
                status: rhoSnapshot.rho_status || 'unknown',
                topContributor: topContributorName || undefined,
                topContributorShare: parseFloat(rhoSnapshot.top_contributor_share) || undefined
            } : undefined,
            generatedAt: new Date().toISOString()
        };

        // Filter to specific entity if requested
        if (reportType === 'entity_profile' && entityId) {
            reportData.entities = reportData.entities?.filter(e => e.id === entityId);
        }

        // Generate report
        const report = generateFullReport(reportData, reportType);

        // Save report to documents
        const reportId = crypto.randomUUID();
        const timestamp = new Date().toISOString().split('T')[0];
        const reportTitle = `Relatorio_${reportType}_${timestamp}`;

        await supabase.from('intelink_documents').insert({
            id: reportId,
            investigation_id: investigationId,
            document_type: 'RELATORIO_INTELIGENCIA',
            original_filename: `${reportTitle}.txt`,
            summary: `Relatório de ${reportType} gerado em ${timestamp}`,
            historico_completo: report,
            extraction_time_ms: 0
        });

        console.log(`[Reports API] Generated ${reportType} report for investigation ${investigationId}`);

        return NextResponse.json({
            success: true,
            reportId,
            reportType,
            report,
            metadata: {
                entityCount: reportData.entities?.length || 0,
                relationshipCount: reportData.relationships?.length || 0,
                generatedAt: reportData.generatedAt
            }
        });

    } catch (error: any) {
        console.error('[Reports API] Error:', error);
        return NextResponse.json(
            { error: 'Erro ao gerar relatório' },
            { status: 500 }
        );
    }
}

// Public during testing phase
export const POST = withSecurity(handlePost, { allowPublic: true });
