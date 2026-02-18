/**
 * INTELINK Report Templates - Arkham Style
 * 
 * Professional intelligence report templates inspired by Arkham Intelligence.
 * Clean, structured, data-driven analysis reports.
 * 
 * @version 1.0.0
 * @updated 2025-12-09
 */

// ============================================================================
// REPORT TYPES
// ============================================================================

export type ReportType = 
    | 'entity_profile'      // Perfil completo de uma entidade
    | 'network_analysis'    // Análise de rede/vínculos
    | 'timeline'            // Cronologia de eventos
    | 'risk_assessment'     // Avaliação de risco
    | 'executive_summary'   // Resumo executivo
    | 'full_investigation'; // Relatório completo

export interface ReportData {
    investigation: {
        id: string;
        title: string;
        description?: string;
        status?: string;
        created_at?: string;
    };
    entities?: Array<{
        id: string;
        name: string;
        type: string;
        metadata?: Record<string, any>;
        connectionCount?: number;
    }>;
    relationships?: Array<{
        source: string;
        target: string;
        type: string;
        description?: string;
    }>;
    rho?: {
        score: number;
        status: string;
        topContributor?: string;
        topContributorShare?: number;
    };
    aiAnalysis?: string;
    generatedAt: string;
    generatedBy?: string;
}

// ============================================================================
// HEADER TEMPLATE
// ============================================================================

export function generateReportHeader(data: ReportData, reportType: ReportType): string {
    const typeLabels: Record<ReportType, string> = {
        'entity_profile': 'PERFIL DE ENTIDADE',
        'network_analysis': 'ANÁLISE DE REDE',
        'timeline': 'LINHA DO TEMPO',
        'risk_assessment': 'AVALIAÇÃO DE RISCO',
        'executive_summary': 'SUMÁRIO EXECUTIVO',
        'full_investigation': 'RELATÓRIO DE INTELIGÊNCIA'
    };

    const date = new Date(data.generatedAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ██╗███╗   ██╗████████╗███████╗██╗     ██╗███╗   ██╗██╗  ██╗               ║
║   ██║████╗  ██║╚══██╔══╝██╔════╝██║     ██║████╗  ██║██║ ██╔╝               ║
║   ██║██╔██╗ ██║   ██║   █████╗  ██║     ██║██╔██╗ ██║█████╔╝                ║
║   ██║██║╚██╗██║   ██║   ██╔══╝  ██║     ██║██║╚██╗██║██╔═██╗                ║
║   ██║██║ ╚████║   ██║   ███████╗███████╗██║██║ ╚████║██║  ██╗               ║
║   ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚══════╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝               ║
║                                                                              ║
║   ${typeLabels[reportType].padEnd(70)}║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OPERAÇÃO: ${data.investigation.title.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 Data: ${date}
🔖 ID: ${data.investigation.id.substring(0, 8)}
📊 Status: ${data.investigation.status || 'Em andamento'}
${data.generatedBy ? `👤 Gerado por: ${data.generatedBy}` : ''}
`;
}

// ============================================================================
// ENTITY PROFILE TEMPLATE
// ============================================================================

export function generateEntityProfile(entity: NonNullable<ReportData['entities']>[0], relationships: ReportData['relationships']): string {
    const relatedEntities = relationships?.filter(r => 
        r.source === entity.name || r.target === entity.name
    ) || [];

    const metadata = entity.metadata || {};
    const metadataLines = Object.entries(metadata)
        .filter(([_, v]) => v)
        .map(([k, v]) => `   ${k.toUpperCase()}: ${v}`)
        .join('\n');

    return `
┌─────────────────────────────────────────────────────────────────────────────┐
│  PERFIL: ${entity.name.toUpperCase().padEnd(64)}│
├─────────────────────────────────────────────────────────────────────────────┤
│  Tipo: ${entity.type.padEnd(67)}│
│  Conexões: ${String(entity.connectionCount || relatedEntities.length).padEnd(63)}│
└─────────────────────────────────────────────────────────────────────────────┘

${metadataLines ? `METADADOS:\n${metadataLines}\n` : ''}
VÍNCULOS DIRETOS (${relatedEntities.length}):
${relatedEntities.length > 0 
    ? relatedEntities.slice(0, 10).map(r => {
        const other = r.source === entity.name ? r.target : r.source;
        return `   ├─ [${r.type}] → ${other}${r.description ? `: ${r.description}` : ''}`;
    }).join('\n')
    : '   (Nenhum vínculo registrado)'}
`;
}

// ============================================================================
// NETWORK ANALYSIS TEMPLATE
// ============================================================================

export function generateNetworkAnalysis(data: ReportData): string {
    const totalEntities = data.entities?.length || 0;
    const totalRelationships = data.relationships?.length || 0;
    const density = totalEntities > 1 
        ? ((2 * totalRelationships) / (totalEntities * (totalEntities - 1)) * 100).toFixed(1)
        : '0.0';

    // Find top connected entities
    const connectionCounts: Record<string, number> = {};
    data.relationships?.forEach(r => {
        connectionCounts[r.source] = (connectionCounts[r.source] || 0) + 1;
        connectionCounts[r.target] = (connectionCounts[r.target] || 0) + 1;
    });

    const topConnected = Object.entries(connectionCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

    // Group entities by type
    const byType: Record<string, number> = {};
    data.entities?.forEach(e => {
        byType[e.type] = (byType[e.type] || 0) + 1;
    });

    return `
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ANÁLISE DE REDE                                     │
└─────────────────────────────────────────────────────────────────────────────┘

MÉTRICAS GERAIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Total de Entidades: ${totalEntities}
   Total de Vínculos: ${totalRelationships}
   Densidade da Rede: ${density}%

DISTRIBUIÇÃO POR TIPO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${Object.entries(byType)
    .map(([type, count]) => {
        const bar = '█'.repeat(Math.min(20, Math.round(count / totalEntities * 20)));
        const pct = ((count / totalEntities) * 100).toFixed(0);
        return `   ${type.padEnd(15)} ${bar.padEnd(20)} ${count} (${pct}%)`;
    })
    .join('\n')}

ENTIDADES MAIS CONECTADAS (HUBS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${topConnected.length > 0
    ? topConnected.map(([name, count], i) => 
        `   ${i + 1}. ${name.padEnd(30)} ${count} conexões`
    ).join('\n')
    : '   (Dados insuficientes)'}

${data.rho ? `
ÍNDICE RHO (SAÚDE DA REDE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Score: ${(data.rho.score * 100).toFixed(1)}%
   Status: ${data.rho.status.toUpperCase()}
   ${data.rho.topContributor ? `Principal Contribuidor: ${data.rho.topContributor} (${((data.rho.topContributorShare || 0) * 100).toFixed(1)}%)` : ''}
` : ''}`;
}

// ============================================================================
// RISK ASSESSMENT TEMPLATE
// ============================================================================

export function generateRiskAssessment(data: ReportData): string {
    const rhoScore = data.rho?.score || 0;
    let riskLevel = 'BAIXO';
    let riskColor = '🟢';
    let riskDescription = 'Rede bem distribuída, baixo risco de viés investigativo.';

    if (rhoScore > 0.1) {
        riskLevel = 'EXTREMO';
        riskColor = '🔴';
        riskDescription = 'Risco crítico de centralização. Diversifique fontes imediatamente.';
    } else if (rhoScore > 0.06) {
        riskLevel = 'ALTO';
        riskColor = '🟠';
        riskDescription = 'Alta centralização detectada. Revise fontes e conexões.';
    } else if (rhoScore > 0.03) {
        riskLevel = 'MODERADO';
        riskColor = '🟡';
        riskDescription = 'Alguma centralização presente. Monitore evolução.';
    }

    return `
┌─────────────────────────────────────────────────────────────────────────────┐
│                       AVALIAÇÃO DE RISCO                                    │
└─────────────────────────────────────────────────────────────────────────────┘

${riskColor} NÍVEL DE RISCO: ${riskLevel}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${riskDescription}

INDICADORES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Índice Rho: ${(rhoScore * 100).toFixed(2)}%
   Entidades: ${data.entities?.length || 0}
   Vínculos: ${data.relationships?.length || 0}

RECOMENDAÇÕES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${rhoScore > 0.06 ? `   ⚠️  Investigar fontes alternativas de informação
   ⚠️  Verificar se há viés em relação a ${data.rho?.topContributor || 'entidade central'}
   ⚠️  Considerar hipóteses alternativas` : `   ✅  Manter monitoramento regular
   ✅  Continuar diversificação de fontes
   ✅  Revisar antes de conclusões finais`}
`;
}

// ============================================================================
// EXECUTIVE SUMMARY TEMPLATE
// ============================================================================

export function generateExecutiveSummary(data: ReportData): string {
    return `
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SUMÁRIO EXECUTIVO                                    │
└─────────────────────────────────────────────────────────────────────────────┘

VISÃO GERAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${data.investigation.description || 'Investigação em andamento.'}

NÚMEROS-CHAVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📊 Entidades Mapeadas: ${data.entities?.length || 0}
   🔗 Vínculos Identificados: ${data.relationships?.length || 0}
   🧬 Índice Rho: ${data.rho ? `${(data.rho.score * 100).toFixed(1)}% (${data.rho.status})` : 'N/A'}

${data.aiAnalysis ? `
ANÁLISE DE INTELIGÊNCIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${data.aiAnalysis}
` : ''}
`;
}

// ============================================================================
// FULL REPORT GENERATOR
// ============================================================================

export function generateFullReport(data: ReportData, reportType: ReportType = 'full_investigation'): string {
    let report = generateReportHeader(data, reportType);

    switch (reportType) {
        case 'entity_profile':
            if (data.entities && data.entities.length > 0) {
                report += generateEntityProfile(data.entities[0], data.relationships);
            }
            break;

        case 'network_analysis':
            report += generateNetworkAnalysis(data);
            break;

        case 'risk_assessment':
            report += generateRiskAssessment(data);
            break;

        case 'executive_summary':
            report += generateExecutiveSummary(data);
            break;

        case 'full_investigation':
        default:
            report += generateExecutiveSummary(data);
            report += generateNetworkAnalysis(data);
            report += generateRiskAssessment(data);
            
            // Add top 5 entity profiles
            if (data.entities && data.entities.length > 0) {
                report += `\n\n${'═'.repeat(78)}\n                    PERFIS DAS PRINCIPAIS ENTIDADES\n${'═'.repeat(78)}\n`;
                const topEntities = data.entities
                    .sort((a, b) => (b.connectionCount || 0) - (a.connectionCount || 0))
                    .slice(0, 5);
                
                for (const entity of topEntities) {
                    report += generateEntityProfile(entity, data.relationships);
                }
            }
            break;
    }

    // Footer
    report += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         FIM DO RELATÓRIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Gerado por INTELINK v4.0.0 | ${new Date().toISOString()}
Este documento é CONFIDENCIAL e de uso restrito.
`;

    return report;
}

export default {
    generateFullReport,
    generateReportHeader,
    generateEntityProfile,
    generateNetworkAnalysis,
    generateRiskAssessment,
    generateExecutiveSummary
};
