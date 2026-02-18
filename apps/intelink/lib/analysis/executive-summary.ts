/**
 * INTELINK - Executive Summary Generator
 * 
 * Generates professional summaries for:
 * - Delegados
 * - Promotores
 * - Juízes
 * 
 * @version 1.0.0
 * @updated 2025-12-09
 */

// ============================================================================
// TYPES
// ============================================================================

export interface InvestigationData {
    id: string;
    title: string;
    reds_number?: string;
    created_at: string;
    updated_at: string;
    status: string;
    crime_type?: string;
    entities: {
        type: string;
        name: string;
        role?: string;
    }[];
    relationships: {
        from: string;
        to: string;
        type: string;
    }[];
    documents_count: number;
    findings_count: number;
    rho_score?: number;
    risk_level?: string;
}

export interface ExecutiveSummary {
    generated_at: Date;
    investigation_id: string;
    title: string;
    synopsis: string;
    key_findings: string[];
    entities_summary: {
        suspects: string[];
        victims: string[];
        witnesses: string[];
        locations: string[];
    };
    legal_framework: string[];
    recommended_actions: string[];
    risk_assessment: string;
    conclusion: string;
    metadata: {
        documents_analyzed: number;
        entities_mapped: number;
        relationships_found: number;
        network_health: string;
    };
}

// ============================================================================
// TEMPLATES
// ============================================================================

const SUMMARY_TEMPLATE = {
    delegado: {
        header: 'RELATÓRIO EXECUTIVO DE INVESTIGAÇÃO',
        style: 'formal',
        focus: ['fatos', 'diligências', 'tipificação']
    },
    promotor: {
        header: 'SÍNTESE PARA OFERECIMENTO DE DENÚNCIA',
        style: 'jurídico',
        focus: ['provas', 'autoria', 'materialidade']
    },
    juiz: {
        header: 'INFORMAÇÕES PARA DECISÃO JUDICIAL',
        style: 'técnico',
        focus: ['fundamentação', 'medidas', 'urgência']
    }
};

// ============================================================================
// MAIN GENERATOR
// ============================================================================

export function generateExecutiveSummary(
    data: InvestigationData,
    audience: 'delegado' | 'promotor' | 'juiz' = 'delegado'
): ExecutiveSummary {
    const template = SUMMARY_TEMPLATE[audience];
    
    // Categorize entities
    const suspects = data.entities
        .filter(e => e.role === 'AUTOR' || e.role === 'SUSPEITO')
        .map(e => e.name);
    
    const victims = data.entities
        .filter(e => e.role === 'VITIMA')
        .map(e => e.name);
    
    const witnesses = data.entities
        .filter(e => e.role === 'TESTEMUNHA')
        .map(e => e.name);
    
    const locations = data.entities
        .filter(e => e.type === 'LOCATION')
        .map(e => e.name);

    // Generate synopsis
    const synopsis = generateSynopsis(data, suspects, victims);
    
    // Generate findings
    const keyFindings = generateKeyFindings(data);
    
    // Legal framework
    const legalFramework = determineLegalFramework(data.crime_type);
    
    // Recommended actions
    const recommendedActions = generateRecommendations(data, audience);
    
    // Risk assessment
    const riskAssessment = assessRisk(data);
    
    // Conclusion
    const conclusion = generateConclusion(data, audience);

    return {
        generated_at: new Date(),
        investigation_id: data.id,
        title: `${template.header}\n${data.title}`,
        synopsis,
        key_findings: keyFindings,
        entities_summary: {
            suspects,
            victims,
            witnesses,
            locations
        },
        legal_framework: legalFramework,
        recommended_actions: recommendedActions,
        risk_assessment: riskAssessment,
        conclusion,
        metadata: {
            documents_analyzed: data.documents_count,
            entities_mapped: data.entities.length,
            relationships_found: data.relationships.length,
            network_health: getRhoStatus(data.rho_score)
        }
    };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateSynopsis(
    data: InvestigationData, 
    suspects: string[], 
    victims: string[]
): string {
    const crimeType = data.crime_type || 'crime em apuração';
    const victimText = victims.length > 0 
        ? `Vítima(s): ${victims.join(', ')}.` 
        : '';
    const suspectText = suspects.length > 0
        ? `Suspeito(s) identificado(s): ${suspects.join(', ')}.`
        : 'Autoria ainda em apuração.';
    
    return `Trata-se de investigação referente a ${crimeType.toLowerCase()}. ` +
        `${victimText} ${suspectText} ` +
        `Foram identificadas ${data.entities.length} entidades e ` +
        `${data.relationships.length} vínculos relevantes. ` +
        `${data.documents_count} documento(s) analisado(s).`;
}

function generateKeyFindings(data: InvestigationData): string[] {
    const findings: string[] = [];
    
    // Entity findings
    const personCount = data.entities.filter(e => e.type === 'PERSON').length;
    if (personCount > 0) {
        findings.push(`Identificadas ${personCount} pessoa(s) envolvidas no fato`);
    }
    
    // Relationship findings
    if (data.relationships.length > 0) {
        findings.push(`Mapeados ${data.relationships.length} vínculos entre entidades`);
        
        // Check for organized crime indicators
        const avgConnections = data.relationships.length / Math.max(data.entities.length, 1);
        if (avgConnections > 3) {
            findings.push('ALERTA: Alta densidade de conexões sugere atuação organizada');
        }
    }
    
    // Document findings
    if (data.documents_count > 0) {
        findings.push(`${data.documents_count} documento(s) processado(s) e indexado(s)`);
    }
    
    // Network health
    if (data.rho_score !== undefined) {
        const status = getRhoStatus(data.rho_score);
        if (status === 'RED' || status === 'ORANGE') {
            findings.push('ATENÇÃO: Rede de informações apresenta alta centralização');
        }
    }
    
    return findings;
}

function determineLegalFramework(crimeType?: string): string[] {
    const framework: string[] = [];
    
    if (!crimeType) {
        return ['Tipificação a ser determinada após conclusão das diligências'];
    }
    
    const type = crimeType.toUpperCase();
    
    if (type.includes('HOMICIDIO') || type.includes('HOMICÍDIO')) {
        framework.push('Art. 121 do Código Penal - Homicídio');
        framework.push('Art. 312 do CPP - Prisão preventiva (se aplicável)');
    }
    
    if (type.includes('ROUBO')) {
        framework.push('Art. 157 do Código Penal - Roubo');
        if (type.includes('QUALIFICADO') || type.includes('ARMA')) {
            framework.push('Art. 157, §2º do CP - Causas de aumento');
        }
    }
    
    if (type.includes('TRAFICO') || type.includes('TRÁFICO')) {
        framework.push('Art. 33 da Lei 11.343/2006 - Tráfico de drogas');
        framework.push('Art. 35 da Lei 11.343/2006 - Associação para o tráfico');
    }
    
    if (type.includes('VIOLENCIA') || type.includes('VIOLÊNCIA') || type.includes('DOMESTICA')) {
        framework.push('Lei 11.340/2006 - Lei Maria da Penha');
        framework.push('Art. 22 - Medidas protetivas de urgência');
    }
    
    if (framework.length === 0) {
        framework.push('Código Penal Brasileiro (Decreto-Lei 2.848/1940)');
        framework.push('Código de Processo Penal (Decreto-Lei 3.689/1941)');
    }
    
    return framework;
}

function generateRecommendations(
    data: InvestigationData, 
    audience: string
): string[] {
    const recommendations: string[] = [];
    
    // Common recommendations
    if (data.entities.filter(e => e.role === 'SUSPEITO').length > 0) {
        recommendations.push('Ouvir formalmente os suspeitos identificados');
    }
    
    if (data.documents_count < 3) {
        recommendations.push('Anexar documentação complementar (laudos, prints, extratos)');
    }
    
    // Audience-specific
    if (audience === 'delegado') {
        recommendations.push('Verificar antecedentes criminais via INFOSEG');
        recommendations.push('Requisitar informações cadastrais às operadoras');
    }
    
    if (audience === 'promotor') {
        recommendations.push('Analisar viabilidade de denúncia com base nas provas');
        recommendations.push('Verificar competência jurisdicional');
    }
    
    if (audience === 'juiz') {
        recommendations.push('Avaliar necessidade de medidas cautelares');
        recommendations.push('Verificar pressupostos para prisão preventiva');
    }
    
    return recommendations;
}

function assessRisk(data: InvestigationData): string {
    let riskLevel = 'MODERADO';
    const factors: string[] = [];
    
    // Check entities for risk factors
    const hasSuspects = data.entities.some(e => e.role === 'SUSPEITO' || e.role === 'AUTOR');
    const hasVictims = data.entities.some(e => e.role === 'VITIMA');
    
    if (!hasSuspects) {
        factors.push('autoria não identificada');
        riskLevel = 'ALTO';
    }
    
    if (data.crime_type?.toUpperCase().includes('HOMICIDIO')) {
        factors.push('crime contra a vida');
        riskLevel = 'ALTO';
    }
    
    if (data.rho_score && data.rho_score > 0.05) {
        factors.push('rede de informações centralizada');
    }
    
    if (factors.length === 0) {
        return 'Risco geral: BAIXO. Investigação com elementos suficientes para prosseguimento.';
    }
    
    return `Risco geral: ${riskLevel}. Fatores: ${factors.join(', ')}.`;
}

function generateConclusion(data: InvestigationData, audience: string): string {
    const hasSuspects = data.entities.some(e => e.role === 'SUSPEITO' || e.role === 'AUTOR');
    const hasEvidence = data.documents_count > 0;
    
    if (audience === 'delegado') {
        if (hasSuspects && hasEvidence) {
            return 'Diante do exposto, há elementos suficientes para a continuidade da investigação e eventual indiciamento dos suspeitos identificados.';
        } else {
            return 'Necessárias diligências complementares para melhor elucidação dos fatos.';
        }
    }
    
    if (audience === 'promotor') {
        if (hasSuspects && hasEvidence) {
            return 'Com base nos elementos colhidos, há indícios de autoria e materialidade delitiva, viabilizando análise para oferecimento de denúncia.';
        } else {
            return 'Elementos insuficientes para oferecimento de denúncia no momento. Sugere-se requisição de diligências complementares.';
        }
    }
    
    if (audience === 'juiz') {
        return 'Informações submetidas à apreciação de Vossa Excelência para as medidas que entender cabíveis.';
    }
    
    return 'Encaminha-se o presente para as providências cabíveis.';
}

function getRhoStatus(score?: number): string {
    if (score === undefined) return 'N/A';
    if (score <= 0.01) return 'GREEN';
    if (score <= 0.03) return 'YELLOW';
    if (score <= 0.05) return 'ORANGE';
    if (score <= 0.10) return 'RED';
    return 'BLACK';
}

// ============================================================================
// FORMAT FOR DISPLAY
// ============================================================================

export function formatExecutiveSummary(summary: ExecutiveSummary): string {
    let output = '';
    
    output += `${summary.title}\n`;
    output += '═'.repeat(60) + '\n\n';
    
    output += 'SÍNTESE DOS FATOS\n';
    output += '─'.repeat(40) + '\n';
    output += summary.synopsis + '\n\n';
    
    output += 'ACHADOS PRINCIPAIS\n';
    output += '─'.repeat(40) + '\n';
    summary.key_findings.forEach(finding => {
        output += `• ${finding}\n`;
    });
    output += '\n';
    
    output += 'ENTIDADES IDENTIFICADAS\n';
    output += '─'.repeat(40) + '\n';
    if (summary.entities_summary.suspects.length > 0) {
        output += `Suspeitos: ${summary.entities_summary.suspects.join(', ')}\n`;
    }
    if (summary.entities_summary.victims.length > 0) {
        output += `Vítimas: ${summary.entities_summary.victims.join(', ')}\n`;
    }
    if (summary.entities_summary.witnesses.length > 0) {
        output += `Testemunhas: ${summary.entities_summary.witnesses.join(', ')}\n`;
    }
    if (summary.entities_summary.locations.length > 0) {
        output += `Locais: ${summary.entities_summary.locations.join(', ')}\n`;
    }
    output += '\n';
    
    output += 'ENQUADRAMENTO LEGAL\n';
    output += '─'.repeat(40) + '\n';
    summary.legal_framework.forEach(law => {
        output += `• ${law}\n`;
    });
    output += '\n';
    
    output += 'RECOMENDAÇÕES\n';
    output += '─'.repeat(40) + '\n';
    summary.recommended_actions.forEach(action => {
        output += `• ${action}\n`;
    });
    output += '\n';
    
    output += 'AVALIAÇÃO DE RISCO\n';
    output += '─'.repeat(40) + '\n';
    output += summary.risk_assessment + '\n\n';
    
    output += 'CONCLUSÃO\n';
    output += '─'.repeat(40) + '\n';
    output += summary.conclusion + '\n\n';
    
    output += '═'.repeat(60) + '\n';
    output += `Gerado automaticamente em ${summary.generated_at.toLocaleString('pt-BR')}\n`;
    output += `Docs: ${summary.metadata.documents_analyzed} | `;
    output += `Entidades: ${summary.metadata.entities_mapped} | `;
    output += `Vínculos: ${summary.metadata.relationships_found} | `;
    output += `Rede: ${summary.metadata.network_health}\n`;
    
    return output;
}

export default {
    generateExecutiveSummary,
    formatExecutiveSummary
};
