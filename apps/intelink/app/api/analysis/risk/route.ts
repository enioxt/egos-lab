/**
 * Risk Assessment API
 * 
 * POST /api/analysis/risk
 * - Assess risk factors for an entity
 * 
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { assessRisk, formatRiskAssessment, RiskFactors } from '@/lib/analysis/risk-assessment';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { 
            entityName, 
            entityType = 'PERSON',
            entityId,
            factors = {},
            format = 'json'
        } = body;

        if (!entityName) {
            return NextResponse.json(
                { error: 'Campo "entityName" é obrigatório' },
                { status: 400 }
            );
        }

        // Validate factors
        const validatedFactors: Partial<RiskFactors> = {
            hasFixedResidence: factors.hasFixedResidence,
            hasStableEmployment: factors.hasStableEmployment,
            hasFamilyTies: factors.hasFamilyTies,
            hasPassport: factors.hasPassport,
            previousFlightAttempts: factors.previousFlightAttempts,
            priorConvictions: factors.priorConvictions,
            priorArrests: factors.priorArrests,
            ageAtFirstOffense: factors.ageAtFirstOffense,
            substanceAbuse: factors.substanceAbuse,
            gangAffiliation: factors.gangAffiliation,
            violentCrimeHistory: factors.violentCrimeHistory,
            weaponsInvolved: factors.weaponsInvolved,
            victimVulnerable: factors.victimVulnerable,
            organizedCrimeLink: factors.organizedCrimeLink,
            threatsToWitnesses: factors.threatsToWitnesses
        };

        const assessment = assessRisk(entityName, entityType, validatedFactors, entityId);

        console.log(`[Risk API] Assessed ${entityName}: ${assessment.overallRisk}`);

        if (format === 'text') {
            return NextResponse.json({
                success: true,
                formatted: formatRiskAssessment(assessment)
            });
        }

        return NextResponse.json({
            success: true,
            assessment
        });

    } catch (error: any) {
        console.error('[Risk API] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao avaliar risco' },
            { status: 500 }
        );
    }
}
