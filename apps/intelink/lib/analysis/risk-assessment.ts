/**
 * INTELINK - Risk Assessment System
 * 
 * Analyzes investigation data to assess risk factors:
 * - Flight risk (risco de fuga)
 * - Recidivism risk (risco de reincidência)
 * - Dangerousness (periculosidade)
 * 
 * @version 1.0.0
 * @updated 2025-12-09
 */

// ============================================================================
// TYPES
// ============================================================================

export interface RiskFactors {
    // Flight Risk Factors
    hasFixedResidence: boolean;
    hasStableEmployment: boolean;
    hasFamilyTies: boolean;
    hasPassport: boolean;
    previousFlightAttempts: number;
    
    // Recidivism Risk Factors
    priorConvictions: number;
    priorArrests: number;
    ageAtFirstOffense: number | null;
    substanceAbuse: boolean;
    gangAffiliation: boolean;
    
    // Dangerousness Factors
    violentCrimeHistory: boolean;
    weaponsInvolved: boolean;
    victimVulnerable: boolean;
    organizedCrimeLink: boolean;
    threatsToWitnesses: boolean;
}

export interface RiskScore {
    category: 'FLIGHT' | 'RECIDIVISM' | 'DANGEROUSNESS';
    score: number; // 0-100
    level: 'BAIXO' | 'MODERADO' | 'ALTO' | 'MUITO_ALTO';
    factors: string[];
    recommendations: string[];
}

export interface RiskAssessment {
    entityId?: string;
    entityName: string;
    entityType: string;
    assessedAt: Date;
    overallRisk: 'BAIXO' | 'MODERADO' | 'ALTO' | 'MUITO_ALTO';
    scores: RiskScore[];
    summary: string;
    legalBasis: string[];
}

// ============================================================================
// RISK CALCULATION WEIGHTS
// ============================================================================

const FLIGHT_WEIGHTS = {
    noFixedResidence: 25,
    noEmployment: 15,
    noFamilyTies: 15,
    hasPassport: 10,
    previousFlightAttempts: 35 // per attempt
};

const RECIDIVISM_WEIGHTS = {
    priorConviction: 20, // per conviction
    priorArrest: 10, // per arrest
    youngFirstOffense: 15, // if < 21
    substanceAbuse: 20,
    gangAffiliation: 25
};

const DANGER_WEIGHTS = {
    violentHistory: 25,
    weaponsInvolved: 25,
    vulnerableVictim: 20,
    organizedCrime: 20,
    witnessThreats: 30
};

// ============================================================================
// RISK ASSESSMENT FUNCTIONS
// ============================================================================

function calculateFlightRisk(factors: RiskFactors): RiskScore {
    let score = 0;
    const riskFactors: string[] = [];
    const recommendations: string[] = [];

    if (!factors.hasFixedResidence) {
        score += FLIGHT_WEIGHTS.noFixedResidence;
        riskFactors.push('Sem residência fixa');
        recommendations.push('Verificar endereços alternativos');
    }

    if (!factors.hasStableEmployment) {
        score += FLIGHT_WEIGHTS.noEmployment;
        riskFactors.push('Sem emprego estável');
    }

    if (!factors.hasFamilyTies) {
        score += FLIGHT_WEIGHTS.noFamilyTies;
        riskFactors.push('Sem vínculos familiares na região');
        recommendations.push('Mapear familiares em outras localidades');
    }

    if (factors.hasPassport) {
        score += FLIGHT_WEIGHTS.hasPassport;
        riskFactors.push('Possui passaporte');
        recommendations.push('Solicitar retenção do passaporte');
    }

    if (factors.previousFlightAttempts > 0) {
        score += FLIGHT_WEIGHTS.previousFlightAttempts * factors.previousFlightAttempts;
        riskFactors.push(`${factors.previousFlightAttempts} tentativa(s) anterior(es) de fuga`);
        recommendations.push('Considerar prisão preventiva');
    }

    score = Math.min(score, 100);

    return {
        category: 'FLIGHT',
        score,
        level: getLevel(score),
        factors: riskFactors,
        recommendations
    };
}

function calculateRecidivismRisk(factors: RiskFactors): RiskScore {
    let score = 0;
    const riskFactors: string[] = [];
    const recommendations: string[] = [];

    if (factors.priorConvictions > 0) {
        score += RECIDIVISM_WEIGHTS.priorConviction * Math.min(factors.priorConvictions, 3);
        riskFactors.push(`${factors.priorConvictions} condenação(ões) anterior(es)`);
        recommendations.push('Verificar FAC completa');
    }

    if (factors.priorArrests > factors.priorConvictions) {
        const extraArrests = factors.priorArrests - factors.priorConvictions;
        score += RECIDIVISM_WEIGHTS.priorArrest * Math.min(extraArrests, 3);
        riskFactors.push(`${factors.priorArrests} prisão(ões) anterior(es)`);
    }

    if (factors.ageAtFirstOffense && factors.ageAtFirstOffense < 21) {
        score += RECIDIVISM_WEIGHTS.youngFirstOffense;
        riskFactors.push(`Primeiro delito aos ${factors.ageAtFirstOffense} anos`);
    }

    if (factors.substanceAbuse) {
        score += RECIDIVISM_WEIGHTS.substanceAbuse;
        riskFactors.push('Histórico de uso de substâncias');
        recommendations.push('Avaliar tratamento para dependência');
    }

    if (factors.gangAffiliation) {
        score += RECIDIVISM_WEIGHTS.gangAffiliation;
        riskFactors.push('Vínculo com organização criminosa');
        recommendations.push('Monitorar contatos com outros membros');
    }

    score = Math.min(score, 100);

    return {
        category: 'RECIDIVISM',
        score,
        level: getLevel(score),
        factors: riskFactors,
        recommendations
    };
}

function calculateDangerousnessRisk(factors: RiskFactors): RiskScore {
    let score = 0;
    const riskFactors: string[] = [];
    const recommendations: string[] = [];

    if (factors.violentCrimeHistory) {
        score += DANGER_WEIGHTS.violentHistory;
        riskFactors.push('Histórico de crimes violentos');
        recommendations.push('Priorizar medidas cautelares');
    }

    if (factors.weaponsInvolved) {
        score += DANGER_WEIGHTS.weaponsInvolved;
        riskFactors.push('Uso de armas no crime');
        recommendations.push('Busca e apreensão de armamentos');
    }

    if (factors.victimVulnerable) {
        score += DANGER_WEIGHTS.vulnerableVictim;
        riskFactors.push('Vítima vulnerável (criança, idoso, mulher)');
        recommendations.push('Medidas protetivas para vítima');
    }

    if (factors.organizedCrimeLink) {
        score += DANGER_WEIGHTS.organizedCrime;
        riskFactors.push('Vínculo com crime organizado');
        recommendations.push('Investigar estrutura da organização');
    }

    if (factors.threatsToWitnesses) {
        score += DANGER_WEIGHTS.witnessThreats;
        riskFactors.push('Ameaças a testemunhas');
        recommendations.push('Proteção às testemunhas - Programa PROVITA');
    }

    score = Math.min(score, 100);

    return {
        category: 'DANGEROUSNESS',
        score,
        level: getLevel(score),
        factors: riskFactors,
        recommendations
    };
}

function getLevel(score: number): 'BAIXO' | 'MODERADO' | 'ALTO' | 'MUITO_ALTO' {
    if (score < 25) return 'BAIXO';
    if (score < 50) return 'MODERADO';
    if (score < 75) return 'ALTO';
    return 'MUITO_ALTO';
}

// ============================================================================
// MAIN ASSESSMENT FUNCTION
// ============================================================================

export function assessRisk(
    entityName: string,
    entityType: string,
    factors: Partial<RiskFactors>,
    entityId?: string
): RiskAssessment {
    // Default values for missing factors
    const fullFactors: RiskFactors = {
        hasFixedResidence: factors.hasFixedResidence ?? true,
        hasStableEmployment: factors.hasStableEmployment ?? true,
        hasFamilyTies: factors.hasFamilyTies ?? true,
        hasPassport: factors.hasPassport ?? false,
        previousFlightAttempts: factors.previousFlightAttempts ?? 0,
        priorConvictions: factors.priorConvictions ?? 0,
        priorArrests: factors.priorArrests ?? 0,
        ageAtFirstOffense: factors.ageAtFirstOffense ?? null,
        substanceAbuse: factors.substanceAbuse ?? false,
        gangAffiliation: factors.gangAffiliation ?? false,
        violentCrimeHistory: factors.violentCrimeHistory ?? false,
        weaponsInvolved: factors.weaponsInvolved ?? false,
        victimVulnerable: factors.victimVulnerable ?? false,
        organizedCrimeLink: factors.organizedCrimeLink ?? false,
        threatsToWitnesses: factors.threatsToWitnesses ?? false
    };

    const flightRisk = calculateFlightRisk(fullFactors);
    const recidivismRisk = calculateRecidivismRisk(fullFactors);
    const dangerRisk = calculateDangerousnessRisk(fullFactors);

    const scores = [flightRisk, recidivismRisk, dangerRisk];
    const avgScore = (flightRisk.score + recidivismRisk.score + dangerRisk.score) / 3;
    const overallRisk = getLevel(avgScore);

    // Generate summary
    const highRisks = scores.filter(s => s.level === 'ALTO' || s.level === 'MUITO_ALTO');
    let summary = '';

    if (highRisks.length === 0) {
        summary = `${entityName} apresenta risco geral ${overallRisk.toLowerCase()}. Não foram identificados fatores de risco significativos.`;
    } else {
        const riskTypes = highRisks.map(r => {
            switch (r.category) {
                case 'FLIGHT': return 'fuga';
                case 'RECIDIVISM': return 'reincidência';
                case 'DANGEROUSNESS': return 'periculosidade';
            }
        });
        summary = `${entityName} apresenta risco ELEVADO de ${riskTypes.join(' e ')}. ` +
            `Fatores principais: ${highRisks.flatMap(r => r.factors).slice(0, 3).join('; ')}.`;
    }

    // Legal basis
    const legalBasis: string[] = [
        'Art. 312 CPP - Prisão preventiva (garantia da ordem pública, conveniência da instrução criminal)',
        'Art. 313 CPP - Hipóteses de prisão preventiva'
    ];

    if (fullFactors.organizedCrimeLink) {
        legalBasis.push('Art. 2º Lei 12.850/2013 - Organização criminosa');
    }

    if (fullFactors.victimVulnerable) {
        legalBasis.push('Art. 22 Lei 11.340/2006 - Medidas protetivas de urgência');
    }

    return {
        entityId,
        entityName,
        entityType,
        assessedAt: new Date(),
        overallRisk,
        scores,
        summary,
        legalBasis
    };
}

// ============================================================================
// FORMAT FOR DISPLAY
// ============================================================================

export function formatRiskAssessment(assessment: RiskAssessment): string {
    let output = 'ANÁLISE DE RISCO\n';
    output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

    output += `INVESTIGADO: ${assessment.entityName}\n`;
    output += `RISCO GERAL: ${assessment.overallRisk}\n`;
    output += `DATA: ${assessment.assessedAt.toLocaleDateString('pt-BR')}\n\n`;

    for (const score of assessment.scores) {
        const categoryName = {
            'FLIGHT': 'RISCO DE FUGA',
            'RECIDIVISM': 'RISCO DE REINCIDÊNCIA',
            'DANGEROUSNESS': 'PERICULOSIDADE'
        }[score.category];

        output += `${categoryName}\n`;
        output += '━━━━━━━━━━━━━━━━\n';
        output += `- Nível: ${score.level} (${score.score}/100)\n`;
        
        if (score.factors.length > 0) {
            output += `- Fatores: ${score.factors.join(', ')}\n`;
        }
        
        if (score.recommendations.length > 0) {
            output += `- Recomendações: ${score.recommendations.join('; ')}\n`;
        }
        
        output += '\n';
    }

    output += 'SÍNTESE\n';
    output += '━━━━━━━━━━━━━━━━\n';
    output += `${assessment.summary}\n\n`;

    output += 'FUNDAMENTAÇÃO LEGAL\n';
    output += '━━━━━━━━━━━━━━━━\n';
    for (const basis of assessment.legalBasis) {
        output += `- ${basis}\n`;
    }

    return output;
}

export default {
    assessRisk,
    formatRiskAssessment
};
