/**
 * Diligence Suggestions API
 * 
 * POST /api/analysis/diligences
 * - Suggest investigative actions based on crime type and evidence status
 * 
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { suggestDiligences, formatDiligenceSuggestions, InvestigationContext } from '@/lib/analysis/diligence-suggestions';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { 
            crimeType,
            context = {},
            format = 'json'
        } = body;

        if (!crimeType) {
            return NextResponse.json(
                { error: 'Campo "crimeType" é obrigatório' },
                { status: 400 }
            );
        }

        // Build investigation context
        const investigationContext: InvestigationContext = {
            crimeType,
            hasVictimStatement: context.hasVictimStatement ?? false,
            hasSuspectStatement: context.hasSuspectStatement ?? false,
            hasWitnesses: context.hasWitnesses ?? false,
            hasDocumentaryEvidence: context.hasDocumentaryEvidence ?? false,
            hasTechnicalEvidence: context.hasTechnicalEvidence ?? false,
            hasPhoneData: context.hasPhoneData ?? false,
            hasBankData: context.hasBankData ?? false,
            hasVideoEvidence: context.hasVideoEvidence ?? false,
            hasForensicEvidence: context.hasForensicEvidence ?? false,
            suspectsIdentified: context.suspectsIdentified ?? false,
            vehicleInvolved: context.vehicleInvolved ?? false,
            weaponInvolved: context.weaponInvolved ?? false,
            drugInvolved: context.drugInvolved ?? false
        };

        const suggestions = suggestDiligences(investigationContext);

        console.log(`[Diligence API] Suggested ${suggestions.length} actions for ${crimeType}`);

        if (format === 'text') {
            return NextResponse.json({
                success: true,
                count: suggestions.length,
                formatted: formatDiligenceSuggestions(suggestions)
            });
        }

        return NextResponse.json({
            success: true,
            crimeType,
            count: suggestions.length,
            suggestions
        });

    } catch (error: any) {
        console.error('[Diligence API] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao sugerir diligências' },
            { status: 500 }
        );
    }
}
